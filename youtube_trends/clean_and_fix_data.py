#!/usr/bin/env python3
"""
Clean mock data and fix trending algorithm
"""

import asyncio
import json
import os
from datetime import datetime, timedelta
from database_adapters import create_database_adapter
from simple_trend_detector import SimpleTrendDetector

async def clean_and_fix_data():
    print("🧹 Cleaning Mock Data and Fixing Trending Algorithm")
    print("=" * 50)
    
    # Backup current data
    print("📦 Backing up current data...")
    os.makedirs('trend_data_backup', exist_ok=True)
    for file in ['videos.json', 'metrics.json', 'channels.json']:
        if os.path.exists(f'trend_data/{file}'):
            with open(f'trend_data/{file}', 'r') as f:
                data = json.load(f)
            with open(f'trend_data_backup/{file}', 'w') as f:
                json.dump(data, f, indent=2)
    
    # Load current data
    with open('trend_data/videos.json', 'r') as f:
        videos = json.load(f)
    
    with open('trend_data/metrics.json', 'r') as f:
        metrics = json.load(f)
    
    # Remove mock data
    print("🗑️ Removing mock data...")
    real_videos = [v for v in videos if v.get('video_id') and not v['video_id'].startswith('vid_@')]
    mock_count = len(videos) - len(real_videos)
    print(f"   Removed {mock_count} mock videos")
    
    # Save cleaned videos
    with open('trend_data/videos.json', 'w') as f:
        json.dump(real_videos, f, indent=2)
    
    # Remove metrics for mock videos
    real_metrics = [m for m in metrics if m.get('video_id') and not m['video_id'].startswith('vid_@')]
    mock_metrics_count = len(metrics) - len(real_metrics)
    print(f"   Removed {mock_metrics_count} mock metrics")
    
    # Save cleaned metrics  
    with open('trend_data/metrics.json', 'w') as f:
        json.dump(real_metrics, f, indent=2)
    
    print(f"\n✅ Cleaned data: {len(real_videos)} real videos remaining")
    
    # Show view distribution of real videos
    print("\n📊 Real Video View Distribution:")
    view_ranges = {
        "0-1K": [],
        "1K-10K": [],
        "10K-100K": [],
        "100K-1M": [],
        "1M-10M": [],
        "10M+": []
    }
    
    for video in real_videos:
        views = video.get('views', 0)
        if views < 1000:
            view_ranges["0-1K"].append(video)
        elif views < 10000:
            view_ranges["1K-10K"].append(video)
        elif views < 100000:
            view_ranges["10K-100K"].append(video)
        elif views < 1000000:
            view_ranges["100K-1M"].append(video)
        elif views < 10000000:
            view_ranges["1M-10M"].append(video)
        else:
            view_ranges["10M+"].append(video)
    
    for range_name, videos_in_range in view_ranges.items():
        print(f"   {range_name}: {len(videos_in_range)} videos")
        if videos_in_range and len(videos_in_range) > 0:
            # Show example
            example = videos_in_range[0]
            print(f"      Example: {example.get('title', 'N/A')[:50]}... ({example.get('views', 0):,} views)")
    
    print("\n🔄 Recalculating trending with improved algorithm...")
    
    # Create detector and recalculate
    db = create_database_adapter('json', data_dir='trend_data')
    detector = SimpleTrendDetector(db)
    
    # Clear existing metrics and recalculate
    with open('trend_data/metrics.json', 'w') as f:
        json.dump([], f)
    
    # Recalculate metrics for all videos with new algorithm
    for video in real_videos:
        # Calculate channel average from recent videos
        channel_videos = [v for v in real_videos if v['channel_id'] == video['channel_id']]
        
        if len(channel_videos) >= 3:
            # Get median views for channel (more robust than average)
            channel_views = sorted([v['views'] for v in channel_videos])
            median_views = channel_views[len(channel_views)//2]
            
            # Calculate view velocity (approximate based on age)
            try:
                published = datetime.fromisoformat(video['published_at'].replace('Z', '+00:00'))
                age_hours = (datetime.now(published.tzinfo) - published).total_seconds() / 3600
                if age_hours > 0:
                    views_per_hour = video['views'] / age_hours
                else:
                    views_per_hour = 0
            except:
                age_hours = 24  # Default if parse fails
                views_per_hour = video['views'] / 24
            
            # Calculate trending score with multiple factors
            view_multiple = video['views'] / max(median_views, 1)
            
            # Boost score for newer videos (within 7 days)
            recency_boost = 1.0
            if age_hours < 168:  # 7 days
                recency_boost = 1.5 - (age_hours / 336)  # 1.5x at 0 hours, 1.0x at 7 days
            
            # Combined trending score
            trending_score = view_multiple * recency_boost
            
            # More inclusive trending threshold
            is_trending = (
                (view_multiple >= 1.5 and video['views'] >= 1000) or  # 1.5x channel average
                (views_per_hour >= 100 and age_hours < 48) or  # 100+ views/hour for new videos
                (video['views'] >= 100000 and view_multiple >= 1.2)  # High absolute views
            )
            
            metric = {
                'video_id': video['video_id'],
                'channel_id': video['channel_id'],
                'views': video['views'],
                'likes': video.get('likes', 0),
                'comments': video.get('comments', 0),
                'view_multiple': round(view_multiple, 2),
                'views_per_hour': round(views_per_hour, 1),
                'age_hours': round(age_hours, 1),
                'is_trending': is_trending,
                'trending_score': round(trending_score * 10, 1),
                'recorded_at': datetime.now().isoformat()
            }
            
            await db.add_video_metrics(metric)
    
    print("✅ Recalculated trending metrics with improved algorithm")
    
    # Generate new report
    report = await detector.get_trending_report(hours=24*7)  # 7 days for better coverage
    
    print(f"\n📈 New Trending Report:")
    print(f"   Total Videos: {report['total_videos']}")
    print(f"   Trending Videos: {report['trending_count']}")
    print(f"   Trending Rate: {report['trending_rate']}%")

if __name__ == "__main__":
    asyncio.run(clean_and_fix_data())