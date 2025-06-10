#!/usr/bin/env python3
"""
Meta Ad Library Scraper CLI
Main command-line interface for scraping Meta ads
"""

import asyncio
import sys
import os
from datetime import datetime
import argparse
from dotenv import load_dotenv

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from meta_ad_client import MetaAdLibraryClient
from data_processor import MetaAdDataProcessor

load_dotenv()


class MetaAdScraper:
    """Main scraper class combining client and processor"""
    
    def __init__(self):
        self.client = MetaAdLibraryClient()
        self.processor = MetaAdDataProcessor()
    
    async def scrape_page(self, page_url: str, max_ads: int = None):
        """Scrape ads from a Facebook page"""
        print(f"\n🎯 Scraping ads from: {page_url}")
        
        # Estimate cost
        max_ads = max_ads or self.client.default_max_ads
        cost = self.client.estimate_cost(max_ads)
        print(f"💰 Estimated cost: ${cost['total_cost']} for up to {max_ads} ads")
        
        # Scrape ads
        ads = await self.client.scrape_page_ads(page_url, max_ads)
        
        if ads:
            # Save ads
            result = self.processor.save_ads(ads, source=page_url)
            print(f"\n✅ Scraping complete!")
            print(f"   New ads: {result['new_ads']}")
            print(f"   Updated ads: {result['updated_ads']}")
            print(f"   Total stored: {result['total_ads_stored']}")
            
            # Quick analysis
            self._print_quick_analysis(ads)
        else:
            print("❌ No ads found")
        
        return ads
    
    async def search_ads(self, query: str, country: str = None, max_ads: int = None):
        """Search ads by keyword"""
        print(f"\n🔍 Searching for ads: '{query}'")
        
        # Estimate cost
        max_ads = max_ads or self.client.default_max_ads
        cost = self.client.estimate_cost(max_ads)
        print(f"💰 Estimated cost: ${cost['total_cost']} for up to {max_ads} ads")
        
        # Search ads
        ads = await self.client.search_ads(query, country, max_ads)
        
        if ads:
            # Save ads
            result = self.processor.save_ads(ads, source=f"search:{query}")
            print(f"\n✅ Search complete!")
            print(f"   New ads: {result['new_ads']}")
            print(f"   Updated ads: {result['updated_ads']}")
            print(f"   Total stored: {result['total_ads_stored']}")
            
            # Quick analysis
            self._print_quick_analysis(ads)
        else:
            print("❌ No ads found")
        
        return ads
    
    def analyze_trends(self, ads: list = None):
        """Analyze ad trends"""
        print("\n📊 Analyzing ad trends...")
        
        analysis = self.processor.analyze_ads(ads)
        
        print(f"\n📈 Analysis Results:")
        print(f"   Total ads: {analysis.get('total_ads', 0)}")
        print(f"   Active ads: {analysis.get('active_ads', 0)}")
        print(f"   Unique pages: {analysis.get('unique_pages', 0)}")
        
        # Top pages
        print(f"\n🏆 Top Pages:")
        for i, page in enumerate(analysis.get('top_pages', [])[:5], 1):
            print(f"   {i}. {page['page_name']}: {page['ad_count']} ads")
        
        # Top CTAs
        print(f"\n🔘 Top CTAs:")
        cta_dist = analysis.get('cta_distribution', {})
        for i, (cta, count) in enumerate(list(cta_dist.items())[:5], 1):
            print(f"   {i}. {cta}: {count} ads")
        
        # Top keywords
        print(f"\n🔤 Top Keywords:")
        keywords = analysis.get('keyword_analysis', {}).get('top_keywords', {})
        for i, (keyword, count) in enumerate(list(keywords.items())[:10], 1):
            print(f"   {i}. {keyword}: {count} occurrences")
        
        # Media analysis
        media = analysis.get('media_analysis', {})
        print(f"\n📸 Media Usage:")
        print(f"   Video ads: {media.get('video_ads', 0)} ({media.get('video_percentage', 0)}%)")
        print(f"   Image ads: {media.get('image_ads', 0)} ({media.get('image_percentage', 0)}%)")
        print(f"   Avg images per ad: {media.get('avg_images_per_ad', 0)}")
        
        return analysis
    
    def export_data(self, format: str = 'csv'):
        """Export stored ads"""
        if format == 'csv':
            filename = self.processor.export_to_csv()
            print(f"✅ Exported to: {filename}")
        else:
            print(f"❌ Unsupported format: {format}")
    
    def _print_quick_analysis(self, ads: list):
        """Print quick analysis of scraped ads"""
        print(f"\n📊 Quick Analysis:")
        print(f"   Total ads: {len(ads)}")
        print(f"   Active ads: {sum(1 for ad in ads if ad.get('is_active'))}")
        
        # Unique pages
        pages = set(ad.get('page_name', 'Unknown') for ad in ads)
        print(f"   Pages: {', '.join(list(pages)[:3])}{' ...' if len(pages) > 3 else ''}")
        
        # CTAs
        ctas = set(ad.get('cta_text', '') for ad in ads if ad.get('cta_text'))
        if ctas:
            print(f"   CTAs: {', '.join(list(ctas)[:3])}{' ...' if len(ctas) > 3 else ''}")


async def main():
    parser = argparse.ArgumentParser(description='Meta Ad Library Scraper')
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # Scrape command
    scrape_parser = subparsers.add_parser('scrape', help='Scrape ads from a page')
    scrape_parser.add_argument('--page', required=True, help='Facebook page URL')
    scrape_parser.add_argument('--limit', type=int, help='Maximum ads to scrape')
    
    # Search command
    search_parser = subparsers.add_parser('search', help='Search ads by keyword')
    search_parser.add_argument('--query', required=True, help='Search query')
    search_parser.add_argument('--country', default='US', help='Country code')
    search_parser.add_argument('--limit', type=int, help='Maximum ads to scrape')
    
    # Analyze command
    analyze_parser = subparsers.add_parser('analyze', help='Analyze stored ads')
    
    # Export command
    export_parser = subparsers.add_parser('export', help='Export ads to file')
    export_parser.add_argument('--format', default='csv', help='Export format (csv)')
    
    # Daily update command
    daily_parser = subparsers.add_parser('daily-update', help='Daily update of tracked pages')
    
    args = parser.parse_args()
    
    # Check for API token
    if not os.getenv('APIFY_TOKEN'):
        print("❌ Error: APIFY_TOKEN not found in environment")
        print("   1. Copy .env.example to .env")
        print("   2. Add your Apify token")
        sys.exit(1)
    
    scraper = MetaAdScraper()
    
    if args.command == 'scrape':
        await scraper.scrape_page(args.page, args.limit)
    
    elif args.command == 'search':
        await scraper.search_ads(args.query, args.country, args.limit)
    
    elif args.command == 'analyze':
        scraper.analyze_trends()
    
    elif args.command == 'export':
        scraper.export_data(args.format)
    
    elif args.command == 'daily-update':
        # Update tracked pages
        processor = MetaAdDataProcessor()
        pages = processor._load_json(processor.pages_file)
        
        print(f"📅 Daily update - {datetime.now().strftime('%Y-%m-%d')}")
        print(f"📺 Updating {len(pages)} pages...")
        
        for page in pages[:5]:  # Limit to 5 pages for demo
            if page.get('page_id'):
                # Construct page URL
                page_url = f"https://facebook.com/{page['page_id']}"
                await scraper.scrape_page(page_url, max_ads=50)
                await asyncio.sleep(2)  # Be nice to servers
    
    else:
        parser.print_help()


if __name__ == "__main__":
    if len(sys.argv) == 1:
        print("🎯 Meta Ad Library Scraper")
        print("=" * 40)
        print("\nUsage examples:")
        print("  python scraper.py scrape --page https://facebook.com/Nike --limit 100")
        print("  python scraper.py search --query 'AI tools' --country US --limit 50")
        print("  python scraper.py analyze")
        print("  python scraper.py export --format csv")
        print("\nFor help: python scraper.py --help")
    else:
        asyncio.run(main())