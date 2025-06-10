#!/usr/bin/env python3
"""
Real Job Scraping using Existing Apify Integration
This replaces all simulated scrapers with actual job data from StepStone and Indeed
"""

import sys
import os
from pathlib import Path
from datetime import datetime

# Add core modules to path (following AI_CODER_INSTRUCTIONS.md)
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

# Use existing job scrapers
from src.job_scrapers import MultiPlatformJobScraper
from core.ai import GeminiClient
from core.utils import FileHelpers

def check_apify_token():
    """Check if Apify token is configured"""
    token = os.getenv('APIFY_TOKEN')
    if not token:
        print("❌ APIFY_TOKEN environment variable not found!")
        print("\n📋 To configure:")
        print("1. Sign up at https://apify.com (free $5 credit)")
        print("2. Get your API token from Settings > Integrations")
        print("3. Set environment variable: export APIFY_TOKEN=your_token")
        print("4. Or add to your .env file: APIFY_TOKEN=your_token")
        return False
    
    print(f"✅ APIFY_TOKEN configured: {token[:10]}...")
    return True

def scrape_ai_jobs_munich():
    """Scrape real AI jobs in Munich using existing Apify integration"""
    
    if not check_apify_token():
        return None
    
    # Initialize the multi-platform scraper
    scraper = MultiPlatformJobScraper()
    
    # Define search parameters for AI jobs in Munich
    keywords = [
        "AI Engineer",
        "Machine Learning Engineer", 
        "Data Scientist",
        "AI Consultant"
    ]
    
    locations = ["Munich"]  # StepStone will handle German format
    
    print("🤖 Starting real AI job scraping in Munich...")
    print("=" * 60)
    print(f"📊 Keywords: {', '.join(keywords)}")
    print(f"📍 Location: {locations[0]}")
    print(f"🌐 Platforms: StepStone.de, Indeed.de")
    print("=" * 60)
    
    # Scrape jobs from all platforms
    results = scraper.search_all_platforms(
        keywords=keywords,
        locations=locations,
        max_results_per_search=15  # 15 per keyword per platform = ~120 total jobs
    )
    
    # Save results to data directory
    data_dir = Path(__file__).parent / "data"
    saved_files = scraper.save_results(results, data_dir)
    
    # Print summary
    summary = results['summary']
    print("\n🎯 SCRAPING COMPLETE!")
    print("=" * 40)
    print(f"📊 Total Jobs Found: {summary['total_jobs']}")
    print(f"🇩🇪 StepStone Jobs: {summary['by_platform']['stepstone']}")
    print(f"🌍 Indeed Jobs: {summary['by_platform']['indeed']}")
    print(f"⏰ Completed at: {summary['search_completed_at']}")
    
    print("\n📁 Files Saved:")
    for file_type, file_path in saved_files.items():
        print(f"  {file_type}: {file_path}")
    
    return results

def generate_ai_analysis(jobs_data):
    """Generate AI analysis for the scraped jobs using existing Gemini integration"""
    
    try:
        # Use existing AI client from core
        ai_client = GeminiClient()
        
        print("\n🧠 Generating AI analysis of scraped jobs...")
        
        # Prepare jobs for analysis
        all_jobs = []
        if 'stepstone' in jobs_data:
            all_jobs.extend(jobs_data['stepstone'])
        if 'indeed' in jobs_data:
            all_jobs.extend(jobs_data['indeed'])
        
        if not all_jobs:
            print("❌ No jobs found for analysis")
            return None
        
        # Create analysis prompt
        analysis_prompt = f"""
        Analyze these {len(all_jobs)} real AI/ML job postings from Munich, Germany.
        
        Provide:
        1. Market Overview (salary ranges, most in-demand skills, company types)
        2. Key Requirements Analysis (required vs preferred skills)
        3. Career Opportunities (junior vs senior positions, growth paths)
        4. Industry Trends (AI focus areas, emerging technologies)
        5. Actionable Insights for job seekers
        
        Jobs data: {str(all_jobs[:10])}...  # First 10 for analysis
        
        Format as structured markdown report.
        """
        
        # Generate analysis
        analysis = ai_client.generate_content(analysis_prompt)
        
        # Save analysis
        files = FileHelpers()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        analysis_file = Path(__file__).parent / "data" / f"ai_market_analysis_{timestamp}.md"
        
        files.save_text(analysis, analysis_file)
        
        print(f"📄 AI Analysis saved to: {analysis_file}")
        return analysis
        
    except Exception as e:
        print(f"❌ AI analysis failed: {str(e)}")
        print("💡 Note: Make sure GOOGLE_API_KEY is configured for Gemini")
        return None

def main():
    """Main execution"""
    
    print("🚀 AI Job Hunter - Real Apify Scraping")
    print("Using existing Apify integration from core modules")
    print()
    
    # Step 1: Scrape real jobs
    jobs_data = scrape_ai_jobs_munich()
    
    if jobs_data and jobs_data['summary']['total_jobs'] > 0:
        # Step 2: Generate AI analysis
        generate_ai_analysis(jobs_data)
        
        print("\n✅ REAL JOB SCRAPING COMPLETED!")
        print("📊 Check the data/ directory for:")
        print("  - Real job listings (JSON & CSV)")
        print("  - AI market analysis report")
        print("  - Search summary statistics")
        
        print("\n🌐 Next steps:")
        print("1. Import this data into the dashboard (app.py)")
        print("2. Clean up old simulated data files")
        print("3. Update dashboard to use real job URLs")
        
    else:
        print("\n❌ No jobs scraped. Check your Apify configuration.")

if __name__ == "__main__":
    main()