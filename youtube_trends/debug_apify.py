#!/usr/bin/env python3
"""
Debug Apify YouTube client
"""

import asyncio
import os
from dotenv import load_dotenv
from apify_client import ApifyClient

load_dotenv()

async def debug_apify():
    """Debug Apify actors and test different approaches"""
    print("🔍 Debugging Apify YouTube Integration")
    print("=" * 50)
    
    client = ApifyClient(os.getenv('APIFY_TOKEN'))
    
    # Test 1: Check available actors
    print("📋 Testing available YouTube actors...")
    
    # Test with a popular YouTube scraper
    actors_to_test = [
        "streamers/youtube-scraper",
        "apify/youtube-scraper", 
        "dtrungtin/youtube-scraper",
        "natanielsales/youtube-videos-scraper"
    ]
    
    for actor_name in actors_to_test:
        try:
            print(f"\n🧪 Testing actor: {actor_name}")
            
            # Simple test input
            test_input = {
                "startUrls": [{"url": "https://www.youtube.com/@TwoMinutePapers"}],
                "maxResults": 3,
                "searchSection": "videos"
            }
            
            print(f"📝 Input: {test_input}")
            
            # Try to run the actor
            run = client.actor(actor_name).call(run_input=test_input)
            print(f"✅ Actor {actor_name} started successfully!")
            print(f"📊 Run ID: {run['id']}")
            
            # Get results
            items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
            print(f"📹 Found {len(items)} items")
            
            if items:
                item = items[0]
                print(f"📝 Sample item keys: {list(item.keys())}")
                if 'title' in item:
                    print(f"📹 Sample title: {item.get('title', 'N/A')[:50]}")
                break
                
        except Exception as e:
            print(f"❌ Actor {actor_name} failed: {e}")
            continue
    
    print("\n" + "=" * 50)
    print("🏁 Apify debug completed")

if __name__ == "__main__":
    asyncio.run(debug_apify())