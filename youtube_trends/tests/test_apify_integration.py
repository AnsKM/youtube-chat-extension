#!/usr/bin/env python3
"""
Test Apify integration with real YouTube data
"""

import asyncio
import os
from dotenv import load_dotenv
from apify_youtube_client import ApifyYouTubeClient

load_dotenv()

async def test_apify_integration():
    """Test fetching real data from one channel"""
    print("🧪 Testing Apify YouTube Integration")
    print("=" * 50)
    
    client = ApifyYouTubeClient()
    
    # Test with just one channel
    test_channels = ["https://youtube.com/@TwoMinutePapers"]
    
    try:
        print(f"🔍 Fetching videos from: {test_channels[0]}")
        print("⏳ This may take 30-60 seconds...")
        
        videos = await client.get_channel_videos(test_channels, max_videos=5)
        
        print(f"✅ Successfully fetched {len(videos)} videos!")
        
        # Display first few videos
        for i, video in enumerate(videos[:3]):
            print(f"\n📹 Video {i+1}:")
            print(f"  Title: {video.get('title', 'N/A')[:60]}...")
            print(f"  Views: {video.get('viewCount', 'N/A'):,}")
            print(f"  Published: {video.get('publishedTimeText', 'N/A')}")
            print(f"  Duration: {video.get('lengthSeconds', 'N/A')} seconds")
            
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_apify_integration())
    if success:
        print("\n🎉 Apify integration test passed!")
    else:
        print("\n❌ Apify integration test failed!")