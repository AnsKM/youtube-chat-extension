#!/usr/bin/env python3
"""
Test what data the web interface is getting
"""

import asyncio
import json
from database_adapters import create_database_adapter
from simple_trend_detector import SimpleTrendDetector

async def test_web_data():
    print("🔍 Testing Web Interface Data")
    print("=" * 50)
    
    # Create detector
    db = create_database_adapter('json', data_dir='trend_data')
    detector = SimpleTrendDetector(db)
    
    # Get channels
    channels = await detector.get_channels()
    print(f"📺 Channels: {len(channels)}")
    
    # Get trending report (same as web app)
    report = await detector.get_trending_report(24)
    
    print(f"\n📊 Report Data:")
    print(f"   Total Videos: {report['total_videos']}")
    print(f"   Trending Count: {report['trending_count']}")
    
    print(f"\n🎬 Top 3 Trending Videos:")
    for i, video in enumerate(report['top_trending'][:3], 1):
        print(f"\n{i}. Video Details:")
        print(f"   Title: {video.get('title', 'NOT FOUND')}")
        print(f"   Video ID: {video.get('video_id')}")
        print(f"   Views: {video.get('views', 0):,}")
        print(f"   Performance: {video.get('relative_performance', 'N/A')}")
        print(f"   URL: {video.get('video_url', 'N/A')}")
        
        # Check if video exists in database
        video_details = await db.get_video_by_id(video['video_id'])
        if video_details:
            print(f"   ✅ Video found in DB: {video_details.get('title', 'N/A')[:50]}")
        else:
            print(f"   ❌ Video NOT found in database!")

if __name__ == "__main__":
    asyncio.run(test_web_data())