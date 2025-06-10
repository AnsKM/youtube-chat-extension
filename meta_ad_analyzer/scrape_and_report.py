#!/usr/bin/env python3
"""
Scrape ads from a Facebook page and generate a comprehensive report using Gemini AI.
"""

import os
import sys
import json
import asyncio
from datetime import datetime
from typing import Dict, List, Any
import google.generativeai as genai

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from meta_ad_client import MetaAdLibraryClient
from data_processor import DataProcessor

class AdReportGenerator:
    """Generate comprehensive reports from scraped Facebook ads using Gemini AI."""
    
    def __init__(self):
        """Initialize the report generator with Gemini AI."""
        # Load environment variables
        from dotenv import load_dotenv
        load_dotenv()
        
        # Initialize Gemini
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            raise ValueError("GOOGLE_API_KEY not found in environment variables")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Initialize processors
        self.apify_client = MetaAdLibraryClient()
        self.data_processor = DataProcessor()
    
    async def scrape_page_ads(self, facebook_url: str, max_ads: int = 50) -> Dict[str, Any]:
        """
        Scrape ads from a Facebook page.
        
        Args:
            facebook_url: URL of the Facebook page
            max_ads: Maximum number of ads to scrape
            
        Returns:
            Dictionary with scraping results
        """
        print(f"🔍 Scraping up to {max_ads} ads from: {facebook_url}")
        
        # Extract page ID or name from URL
        page_identifier = self._extract_page_identifier(facebook_url)
        
        try:
            result = await self.apify_client.scrape_page_ads(
                page_url=facebook_url,
                max_ads=max_ads,
                country='DE'  # Set to Germany as per the URL
            )
            
            if result['success']:
                # Save ads to data processor
                ads = result['data']
                saved_ads = []
                
                for ad in ads:
                    saved_ad = self.data_processor.save_ad(ad)
                    if saved_ad:
                        saved_ads.append(saved_ad)
                
                print(f"✅ Successfully scraped {len(saved_ads)} ads")
                return {
                    'success': True,
                    'ads': saved_ads,
                    'page_identifier': page_identifier,
                    'total_scraped': len(saved_ads)
                }
            else:
                print(f"❌ Scraping failed: {result.get('error', 'Unknown error')}")
                return {'success': False, 'error': result.get('error', 'Unknown error')}
                
        except Exception as e:
            print(f"❌ Error during scraping: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _extract_page_identifier(self, url: str) -> str:
        """Extract page identifier from Facebook URL."""
        # Extract from various Facebook URL formats
        if 'view_all_page_id=' in url:
            start = url.find('view_all_page_id=') + len('view_all_page_id=')
            end = url.find('&', start)
            if end == -1:
                end = len(url)
            return url[start:end]
        elif 'facebook.com/' in url:
            parts = url.split('facebook.com/')[-1].split('/')
            return parts[0] if parts else 'unknown'
        else:
            return 'unknown'
    
    def generate_comprehensive_report(self, ads: List[Dict], page_identifier: str) -> str:
        """
        Generate a comprehensive report about the scraped ads using Gemini AI.
        
        Args:
            ads: List of ad dictionaries
            page_identifier: Identifier of the Facebook page
            
        Returns:
            Formatted markdown report
        """
        print("📊 Generating comprehensive report with Gemini AI...")
        
        # Prepare data summary for Gemini
        ads_summary = self._prepare_ads_summary(ads)
        
        prompt = f"""
You are a digital marketing analyst. Analyze the following Facebook ads data and create a comprehensive report.

PAGE IDENTIFIER: {page_identifier}
TOTAL ADS ANALYZED: {len(ads)}
ANALYSIS DATE: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

ADS DATA SUMMARY:
{ads_summary}

Create a comprehensive marketing analysis report with the following structure:

# Facebook Ads Analysis Report

## Executive Summary
- Brief overview of the advertising strategy
- Key findings (2-3 main insights)
- Overall assessment of the campaign approach

## Page Overview
- Page information and industry analysis
- Brand positioning insights

## Ad Content Analysis
### Message Themes
- Common themes and messaging patterns
- Emotional appeals used
- Value propositions identified

### Creative Analysis
- Visual content patterns (images vs videos)
- Design trends observed
- Creative formats used

### Call-to-Action Strategy
- Most common CTAs
- CTA effectiveness assessment
- User journey implications

## Targeting & Demographics
- Geographic targeting insights
- Platform distribution analysis
- Audience targeting patterns

## Campaign Timing & Duration
- Ad scheduling patterns
- Campaign duration insights
- Seasonal or time-based trends

## Competitive Intelligence
- Unique selling propositions
- Competitive advantages highlighted
- Market positioning insights

## Performance Indicators
- Activity levels (active vs inactive ads)
- Engagement patterns (if data available)
- Campaign freshness and updates

## Strategic Recommendations
1. **Creative Optimization**: Specific suggestions for improving ad creatives
2. **Targeting Recommendations**: Audience and platform optimization ideas
3. **Message Optimization**: Content and positioning improvements
4. **Campaign Structure**: Organizational and timing recommendations

## Key Takeaways
- Top 5 actionable insights
- Opportunities for improvement
- Strategic advantages to leverage

## Appendix
- Methodology notes
- Data limitations
- Additional observations

Format the entire report in clean markdown with proper headers, bullet points, and emphasis where appropriate.
Make the analysis actionable and insightful for marketing professionals.
"""

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error generating report: {str(e)}"
    
    def _prepare_ads_summary(self, ads: List[Dict]) -> str:
        """Prepare a structured summary of ads data for Gemini analysis."""
        summary_parts = []
        
        # Basic stats
        active_ads = len([ad for ad in ads if ad.get('is_active', False)])
        summary_parts.append(f"Active Ads: {active_ads}/{len(ads)}")
        
        # Content analysis
        ad_texts = [ad.get('ad_text', '') for ad in ads if ad.get('ad_text')]
        if ad_texts:
            avg_text_length = sum(len(text) for text in ad_texts) / len(ad_texts)
            summary_parts.append(f"Average Ad Text Length: {avg_text_length:.0f} characters")
        
        # CTA analysis
        ctas = [ad.get('cta_text') for ad in ads if ad.get('cta_text')]
        cta_counts = {}
        for cta in ctas:
            cta_counts[cta] = cta_counts.get(cta, 0) + 1
        if cta_counts:
            top_ctas = sorted(cta_counts.items(), key=lambda x: x[1], reverse=True)[:5]
            summary_parts.append("Top CTAs: " + ", ".join([f"{cta} ({count})" for cta, count in top_ctas]))
        
        # Platform analysis
        platforms = []
        for ad in ads:
            if ad.get('platforms'):
                platforms.extend(ad['platforms'])
        platform_counts = {}
        for platform in platforms:
            platform_counts[platform] = platform_counts.get(platform, 0) + 1
        if platform_counts:
            summary_parts.append("Platforms: " + ", ".join([f"{platform} ({count})" for platform, count in platform_counts.items()]))
        
        # Media analysis
        video_ads = len([ad for ad in ads if ad.get('video_url')])
        image_ads = len([ad for ad in ads if ad.get('images')])
        summary_parts.append(f"Media: {video_ads} video ads, {image_ads} image ads")
        
        # Page analysis
        pages = list(set([ad.get('page_name', 'Unknown') for ad in ads]))
        summary_parts.append(f"Pages: {', '.join(pages[:3])}" + (f" and {len(pages)-3} more" if len(pages) > 3 else ""))
        
        # Sample ads for context
        summary_parts.append("\nSAMPLE ADS (first 3):")
        for i, ad in enumerate(ads[:3]):
            summary_parts.append(f"\nAd {i+1}:")
            summary_parts.append(f"- Page: {ad.get('page_name', 'Unknown')}")
            summary_parts.append(f"- Text: {(ad.get('ad_text', '')[:200] + '...') if len(ad.get('ad_text', '')) > 200 else ad.get('ad_text', 'No text')}")
            summary_parts.append(f"- CTA: {ad.get('cta_text', 'No CTA')}")
            summary_parts.append(f"- Platforms: {', '.join(ad.get('platforms', []))}")
            summary_parts.append(f"- Active: {ad.get('is_active', False)}")
            summary_parts.append(f"- Start Date: {ad.get('start_date', 'Unknown')}")
        
        return "\n".join(summary_parts)
    
    def save_report(self, report: str, page_identifier: str) -> str:
        """Save the report to a file."""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"facebook_ads_report_{page_identifier}_{timestamp}.md"
        filepath = os.path.join('data', 'reports', filename)
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(report)
        
        return filepath

async def main():
    """Main function to run the scraping and report generation."""
    # Facebook page URL from the user
    facebook_url = "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=DE&id=1028517679463156&is_targeted_country=false&media_type=all&search_type=page&view_all_page_id=100142840161003"
    
    print("🚀 Meta Ad Library Scraper & Report Generator")
    print("=" * 50)
    
    # Initialize generator
    generator = AdReportGenerator()
    
    # Step 1: Scrape ads
    scrape_result = await generator.scrape_page_ads(facebook_url, max_ads=50)
    
    if not scrape_result['success']:
        print(f"❌ Failed to scrape ads: {scrape_result.get('error')}")
        return
    
    ads = scrape_result['ads']
    page_identifier = scrape_result['page_identifier']
    
    if not ads:
        print("⚠️  No ads found to analyze")
        return
    
    # Step 2: Generate report
    report = generator.generate_comprehensive_report(ads, page_identifier)
    
    # Step 3: Save report
    report_path = generator.save_report(report, page_identifier)
    
    print(f"\n✅ Report generated successfully!")
    print(f"📄 Report saved to: {report_path}")
    print(f"📊 Analyzed {len(ads)} ads from page {page_identifier}")
    
    # Display brief summary
    print("\n" + "=" * 50)
    print("QUICK SUMMARY:")
    print("=" * 50)
    
    active_ads = len([ad for ad in ads if ad.get('is_active', False)])
    print(f"• Total Ads: {len(ads)}")
    print(f"• Active Ads: {active_ads}")
    print(f"• Page ID: {page_identifier}")
    
    # Show top CTAs
    ctas = [ad.get('cta_text') for ad in ads if ad.get('cta_text')]
    if ctas:
        cta_counts = {}
        for cta in ctas:
            cta_counts[cta] = cta_counts.get(cta, 0) + 1
        top_cta = max(cta_counts.items(), key=lambda x: x[1])
        print(f"• Most Common CTA: '{top_cta[0]}' ({top_cta[1]} times)")
    
    print(f"\n📖 Full report available at: {report_path}")

if __name__ == "__main__":
    # Install required packages
    import subprocess
    try:
        import dotenv
        import google.generativeai
    except ImportError:
        print("Installing required packages...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "python-dotenv", "google-generativeai"])
        import dotenv
        import google.generativeai
    
    asyncio.run(main())