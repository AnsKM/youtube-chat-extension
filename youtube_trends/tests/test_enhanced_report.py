#!/usr/bin/env python3
"""
Test the enhanced trending report with titles
"""

import asyncio
from database_adapters import create_database_adapter
from simple_trend_detector import SimpleTrendDetector

async def test_enhanced_report():
    """Test the enhanced report functionality"""
    print("🧪 Testing Enhanced Trending Report")
    print("=" * 50)
    
    # Create detector
    db = create_database_adapter('json', data_dir='trend_data')
    detector = SimpleTrendDetector(db)
    
    # Get trending report
    report = await detector.get_trending_report(24)
    
    print(f"📊 Report Stats:")
    print(f"   Total Videos: {report['total_videos']}")
    print(f"   Trending Videos: {report['trending_count']}")
    print(f"   Trending Rate: {report['trending_rate']}%")
    
    print(f"\n🏆 Top Trending Videos:")
    for i, video in enumerate(report['top_trending'][:5], 1):
        print(f"{i}. {video.get('title', 'Unknown Title')[:60]}")
        print(f"   Channel: {video.get('channel_id', 'Unknown')}")
        print(f"   Views: {video.get('views', 0):,}")
        print(f"   Performance: {video.get('relative_performance', 'N/A')}")
        print(f"   URL: {video.get('video_url', 'N/A')}")
        print()

if __name__ == "__main__":
    asyncio.run(test_enhanced_report())