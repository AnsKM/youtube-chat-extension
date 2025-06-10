#!/usr/bin/env python3
"""
Debug video data to see what we're actually storing
"""

import asyncio
import json
from database_adapters import create_database_adapter

async def debug_video_data():
    """Check what video data we're actually storing"""
    print("🔍 Debugging Video Data")
    print("=" * 50)
    
    # Create database adapter
    db = create_database_adapter('json', data_dir='trend_data')
    
    # Get some recent videos
    videos = await db.get_trending_videos(hours=24)
    
    print(f"📹 Found {len(videos)} videos")
    
    # Show first few videos with all their data
    for i, video in enumerate(videos[:3]):
        print(f"\n📹 Video {i+1}:")
        print("Raw data:")
        print(json.dumps(video, indent=2))
        print("-" * 30)

if __name__ == "__main__":
    asyncio.run(debug_video_data())