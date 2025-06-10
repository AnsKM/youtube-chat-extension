#!/usr/bin/env python3
"""
Debug trending issues - incorrect video IDs and high view counts
"""

import asyncio
import json
from database_adapters import create_database_adapter

async def debug_trending_issues():
    print("🔍 Debugging Trending Issues")
    print("=" * 50)
    
    # Load database
    db = create_database_adapter('json', data_dir='trend_data')
    
    # Get trending videos
    trending_videos = await db.get_trending_videos(hours=24)
    
    print(f"\n📊 Trending Videos Count: {len(trending_videos)}")
    print("\nFirst 5 trending videos (raw metrics):")
    for i, video in enumerate(trending_videos[:5]):
        print(f"\n{i+1}. Video ID: {video.get('video_id')}")
        print(f"   Views: {video.get('views'):,}")
        print(f"   View Multiple: {video.get('view_multiple')}")
        print(f"   Trending Score: {video.get('trending_score')}")
    
    # Load actual video data
    with open('trend_data/videos.json', 'r') as f:
        all_videos = json.load(f)
    
    print(f"\n📹 Total Videos in Database: {len(all_videos)}")
    
    # Check if trending video IDs match actual videos
    print("\n🔍 Checking if trending video IDs match actual videos:")
    for video_metric in trending_videos[:5]:
        video_id = video_metric.get('video_id')
        matching_video = next((v for v in all_videos if v['video_id'] == video_id), None)
        
        if matching_video:
            print(f"\n✅ Found match for {video_id}:")
            print(f"   Title: {matching_video.get('title', 'N/A')[:60]}")
            print(f"   Channel: {matching_video.get('channel_id')}")
            print(f"   Real Views: {matching_video.get('views', 0):,}")
        else:
            print(f"\n❌ No match found for video ID: {video_id}")
    
    # Check view distribution
    print("\n📊 View Count Distribution:")
    view_ranges = {
        "0-1K": 0,
        "1K-10K": 0,
        "10K-100K": 0,
        "100K-1M": 0,
        "1M-10M": 0,
        "10M-100M": 0,
        "100M+": 0
    }
    
    for video in all_videos:
        views = video.get('views', 0)
        if views < 1000:
            view_ranges["0-1K"] += 1
        elif views < 10000:
            view_ranges["1K-10K"] += 1
        elif views < 100000:
            view_ranges["10K-100K"] += 1
        elif views < 1000000:
            view_ranges["100K-1M"] += 1
        elif views < 10000000:
            view_ranges["1M-10M"] += 1
        elif views < 100000000:
            view_ranges["10M-100M"] += 1
        else:
            view_ranges["100M+"] += 1
    
    for range_name, count in view_ranges.items():
        print(f"   {range_name}: {count} videos")

if __name__ == "__main__":
    asyncio.run(debug_trending_issues())