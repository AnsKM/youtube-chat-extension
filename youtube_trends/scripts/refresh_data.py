#!/usr/bin/env python3
"""
Refresh data from all channels with real Apify data
"""

import asyncio
from simple_trend_detector import SimpleTrendDetector
from database_adapters import create_database_adapter

async def refresh_all_data():
    print("🔄 Refreshing data from all channels...")
    print("=" * 50)
    
    # Create detector
    db = create_database_adapter('json', data_dir='trend_data')
    detector = SimpleTrendDetector(db)
    
    # Update videos
    result = await detector.update_videos()
    
    print(f"\n✅ Update complete!")
    print(f"   {result['message']}")
    
    # Show trending report
    report = await detector.get_trending_report(hours=24)
    
    print(f"\n📊 Current Trending Stats:")
    print(f"   Total Videos: {report['total_videos']}")
    print(f"   Trending: {report['trending_count']} ({report['trending_rate']}%)")
    
    print(f"\n🏆 Top 3 Trending:")
    for i, video in enumerate(report['top_trending'][:3], 1):
        print(f"\n{i}. {video.get('title', 'Unknown')[:60]}...")
        print(f"   Views: {video.get('views', 0):,}")
        print(f"   {video.get('relative_performance', 'N/A')}")

if __name__ == "__main__":
    asyncio.run(refresh_all_data())