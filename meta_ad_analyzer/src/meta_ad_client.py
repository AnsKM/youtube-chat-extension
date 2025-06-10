"""
Apify Meta Ad Library Client
Handles communication with Apify's Facebook Ads Scraper actor
"""

import os
import asyncio
from typing import List, Dict, Optional
from datetime import datetime
import json
from apify_client import ApifyClient
from dotenv import load_dotenv

load_dotenv()


class MetaAdLibraryClient:
    """Client for interacting with Apify's Facebook Ads Scraper"""
    
    def __init__(self):
        self.token = os.getenv('APIFY_TOKEN')
        if not self.token:
            raise ValueError("APIFY_TOKEN not found in environment variables")
            
        self.client = ApifyClient(self.token)
        # Official Apify Facebook Ads Scraper
        self.actor_id = "apify/facebook-ads-scraper"
        self.default_max_ads = int(os.getenv('DEFAULT_MAX_ADS', 100))
        self.default_country = os.getenv('DEFAULT_COUNTRY', 'US')
        
    async def scrape_page_ads(self, page_url: str, max_ads: int = None) -> List[Dict]:
        """
        Scrape ads from a specific Facebook page
        
        Args:
            page_url: Facebook page URL
            max_ads: Maximum number of ads to scrape
            
        Returns:
            List of ad dictionaries
        """
        max_ads = max_ads or self.default_max_ads
        
        # Prepare input for the actor
        run_input = {
            "startUrls": [{"url": page_url}],
            "maxItems": max_ads,
            "proxy": {
                "useApifyProxy": True,
                "apifyProxyGroups": ["RESIDENTIAL"]
            }
        }
        
        print(f"🔍 Scraping ads from: {page_url}")
        print(f"⏳ This may take a few minutes...")
        
        try:
            # Run the actor
            run = self.client.actor(self.actor_id).call(run_input=run_input)
            
            # Fetch results
            ads = []
            for item in self.client.dataset(run["defaultDatasetId"]).iterate_items():
                ads.append(self._format_ad_data(item))
            
            print(f"✅ Successfully scraped {len(ads)} ads")
            return ads
            
        except Exception as e:
            print(f"❌ Error scraping ads: {e}")
            raise
    
    async def search_ads(self, 
                        query: str, 
                        country: str = None,
                        max_ads: int = None,
                        active_only: bool = True) -> List[Dict]:
        """
        Search ads by keyword in Meta Ad Library
        
        Args:
            query: Search keyword
            country: Country code (e.g., 'US', 'UK')
            max_ads: Maximum number of ads
            active_only: Only get currently active ads
            
        Returns:
            List of ad dictionaries
        """
        max_ads = max_ads or self.default_max_ads
        country = country or self.default_country
        
        # Build search URL for Meta Ad Library
        search_url = f"https://www.facebook.com/ads/library/?q={query}"
        if country:
            search_url += f"&country={country}"
        if active_only:
            search_url += "&active_status=active"
        
        run_input = {
            "startUrls": [{"url": search_url}],
            "maxItems": max_ads,
            "resultsType": "ads",
            "proxy": {
                "useApifyProxy": True,
                "apifyProxyGroups": ["RESIDENTIAL"]
            }
        }
        
        print(f"🔍 Searching ads for: '{query}' in {country}")
        print(f"⏳ Fetching up to {max_ads} ads...")
        
        try:
            # Run the actor
            run = self.client.actor(self.actor_id).call(run_input=run_input)
            
            # Fetch results
            ads = []
            for item in self.client.dataset(run["defaultDatasetId"]).iterate_items():
                ads.append(self._format_ad_data(item))
            
            print(f"✅ Found {len(ads)} ads matching '{query}'")
            return ads
            
        except Exception as e:
            print(f"❌ Error searching ads: {e}")
            raise
    
    def _format_ad_data(self, raw_ad: Dict) -> Dict:
        """Format raw ad data into consistent structure"""
        
        # Extract key fields with safe defaults
        formatted_ad = {
            # Basic Info
            'ad_id': raw_ad.get('id', ''),
            'page_id': raw_ad.get('pageID', ''),
            'page_name': raw_ad.get('pageName', ''),
            
            # Ad Content
            'ad_text': raw_ad.get('adText', ''),
            'ad_creative_body': raw_ad.get('adCreativeBody', ''),
            'cta_text': raw_ad.get('ctaText', ''),
            'cta_type': raw_ad.get('ctaType', ''),
            
            # Media
            'images': raw_ad.get('images', []),
            'video_url': raw_ad.get('videoUrl', ''),
            'card_image': raw_ad.get('cardImage', ''),
            
            # Dates
            'start_date': raw_ad.get('startDate', ''),
            'end_date': raw_ad.get('endDate', ''),
            'is_active': raw_ad.get('isActive', False),
            
            # Metrics
            'impressions': raw_ad.get('impressions', ''),
            'reach': raw_ad.get('reach', ''),
            'spend': raw_ad.get('spend', ''),
            
            # Targeting
            'demographics': raw_ad.get('demographicDistribution', {}),
            'regions': raw_ad.get('regions', []),
            'platforms': raw_ad.get('publisherPlatforms', []),
            
            # Links
            'ad_library_url': raw_ad.get('adLibraryUrl', ''),
            'website_url': raw_ad.get('websiteUrl', ''),
            
            # Metadata
            'scraped_at': datetime.now().isoformat(),
            'raw_data': raw_ad  # Keep original for reference
        }
        
        return formatted_ad
    
    def estimate_cost(self, num_ads: int) -> Dict[str, float]:
        """
        Estimate the cost of scraping ads
        
        Args:
            num_ads: Number of ads to scrape
            
        Returns:
            Cost breakdown dictionary
        """
        cost_per_1000 = 5.00  # $5 per 1,000 ads
        cost_per_ad = cost_per_1000 / 1000
        
        total_cost = num_ads * cost_per_ad
        
        return {
            'num_ads': num_ads,
            'cost_per_ad': cost_per_ad,
            'total_cost': round(total_cost, 2),
            'cost_per_1000': cost_per_1000,
            'free_tier_remaining': max(0, 1000 - num_ads)  # Monthly free tier
        }
    
    async def get_actor_info(self) -> Dict:
        """Get information about the Facebook Ads Scraper actor"""
        try:
            actor = self.client.actor(self.actor_id).get()
            return {
                'name': actor.get('name', ''),
                'description': actor.get('description', ''),
                'latest_version': actor.get('versions', [{}])[0].get('versionNumber', ''),
                'stats': actor.get('stats', {}),
                'pricing': '$5.00 per 1,000 ads'
            }
        except Exception as e:
            print(f"❌ Error getting actor info: {e}")
            return {}


# Example usage
if __name__ == "__main__":
    async def test_client():
        client = MetaAdLibraryClient()
        
        # Test cost estimation
        cost = client.estimate_cost(500)
        print(f"💰 Cost to scrape 500 ads: ${cost['total_cost']}")
        
        # Test actor info
        info = await client.get_actor_info()
        print(f"📊 Actor: {info.get('name', 'Unknown')}")
        
        # Example: Scrape Nike ads
        # ads = await client.scrape_page_ads("https://www.facebook.com/nike", max_ads=10)
        # print(f"Found {len(ads)} Nike ads")
        
        # Example: Search for AI tool ads
        # ads = await client.search_ads("AI tools", country="US", max_ads=20)
        # print(f"Found {len(ads)} AI tool ads")
    
    asyncio.run(test_client())