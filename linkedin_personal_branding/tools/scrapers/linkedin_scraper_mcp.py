#!/usr/bin/env python3
"""
LinkedIn Profile Scraper - MCP Version
Uses MCP server instead of direct Apify API calls
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from core.scrapers.apify_adapter import ApifyClientProxy


class LinkedInScraperMCP:
    """LinkedIn scraper using MCP-based Apify integration"""
    
    def __init__(self):
        # Use the adapter with MCP enabled
        os.environ['USE_MCP_APIFY'] = 'true'
        self.client = ApifyClientProxy()
        self.actor_id = "dev_fusion/Linkedin-Profile-Scraper"
    
    async def scrape_profile(self, profile_url: str, save_data: bool = True) -> Dict:
        """
        Scrape a LinkedIn profile using MCP
        
        Args:
            profile_url: LinkedIn profile URL
            save_data: Whether to save scraped data to files
            
        Returns:
            Scraped profile data
        """
        print(f"🔗 Scraping LinkedIn profile (MCP mode)")
        print(f"📍 URL: {profile_url}")
        
        # Prepare input for the actor
        actor_input = {
            "urls": [profile_url],
            "maxDelay": 5,
            "minDelay": 2,
            "proxy": {
                "useApifyProxy": True,
                "apifyProxyGroups": ["RESIDENTIAL"]
            }
        }
        
        try:
            # Run actor through MCP
            print("🚀 Starting MCP actor run...")
            actor = self.client.actor(self.actor_id)
            
            # This will use MCP under the hood
            result = await actor.call_async(actor_input)
            
            # Process results
            if result and 'data' in result:
                profile_data = result['data']
                print("✅ Profile scraped successfully via MCP")
                
                if save_data:
                    self._save_profile_data(profile_data, profile_url)
                
                return profile_data
            else:
                raise Exception("No data returned from MCP")
                
        except Exception as e:
            print(f"❌ MCP scraping failed: {str(e)}")
            raise
    
    def scrape_profile_sync(self, profile_url: str, save_data: bool = True) -> Dict:
        """Synchronous wrapper for profile scraping"""
        import asyncio
        return asyncio.run(self.scrape_profile(profile_url, save_data))
    
    def _save_profile_data(self, profile_data: Dict, profile_url: str):
        """Save scraped data to files"""
        data_dir = Path(__file__).parent / "data"
        data_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        username = profile_url.split('/')[-2] if profile_url.endswith('/') else profile_url.split('/')[-1]
        
        # Save raw data
        raw_file = data_dir / f"{username}_mcp_{timestamp}.json"
        with open(raw_file, 'w', encoding='utf-8') as f:
            json.dump(profile_data, f, indent=2, ensure_ascii=False)
        
        print(f"💾 Data saved to: {raw_file}")
        
        # Generate insights
        insights = self._generate_insights(profile_data)
        insights_file = data_dir / f"{username}_insights_mcp_{timestamp}.md"
        
        with open(insights_file, 'w', encoding='utf-8') as f:
            f.write(insights)
        
        print(f"💡 Insights saved to: {insights_file}")
    
    def _generate_insights(self, profile: Dict) -> str:
        """Generate insights from profile data"""
        insights = f"""# LinkedIn Profile Insights (MCP Version)

## Profile Overview
- **Name**: {profile.get('name', 'N/A')}
- **Headline**: {profile.get('headline', 'N/A')}
- **Location**: {profile.get('location', 'N/A')}
- **Connections**: {profile.get('connections', 'N/A')}

## Scraped via MCP
- **Method**: MCP Server Integration
- **Actor**: {self.actor_id}
- **Timestamp**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Benefits of MCP Integration
✅ No token management required
✅ Automatic retries and error handling
✅ Cleaner, more maintainable code
✅ Built-in rate limiting

## Profile Completeness
"""
        # Add completeness checks
        completeness_checks = {
            'Profile Photo': bool(profile.get('profilePicture')),
            'Background Banner': bool(profile.get('backgroundImage')),
            'About Section': bool(profile.get('about')),
            'Experience': len(profile.get('experience', [])) > 0,
            'Education': len(profile.get('education', [])) > 0,
            'Skills': len(profile.get('skills', [])) > 0
        }
        
        for check, status in completeness_checks.items():
            insights += f"- {check}: {'✅' if status else '❌'}\n"
        
        return insights


# Comparison with old implementation
def compare_implementations():
    """Show the difference between old and new implementations"""
    
    print("\n📊 Implementation Comparison")
    print("=" * 50)
    
    print("\n🔴 OLD Implementation (Direct API):")
    print("- 300+ lines of code")
    print("- Manual token management")
    print("- Manual HTTP requests")
    print("- Manual status polling")
    print("- Manual error handling")
    
    print("\n🟢 NEW Implementation (MCP):")
    print("- ~150 lines of code (50% reduction)")
    print("- No token management")
    print("- Simple actor.call()")
    print("- Automatic status handling")
    print("- Built-in error handling")
    
    print("\n💡 Migration Benefits:")
    print("- Cleaner, more readable code")
    print("- Less maintenance overhead")
    print("- Better reliability")
    print("- Easier testing")


# Example usage
if __name__ == "__main__":
    import asyncio
    
    # Show comparison
    compare_implementations()
    
    print("\n🚀 LinkedIn MCP Scraper Example")
    print("=" * 50)
    
    # Example profile URL
    profile_url = "https://www.linkedin.com/in/anskhalid/"
    
    # Create scraper
    scraper = LinkedInScraperMCP()
    
    print("\n📝 To use this scraper:")
    print("1. Ensure MCP server is running")
    print("2. Set USE_MCP_APIFY=true")
    print("3. Run: await scraper.scrape_profile(profile_url)")
    
    # Uncomment to run actual scraping
    # result = asyncio.run(scraper.scrape_profile(profile_url))
    # print(f"\n✅ Scraping complete!")