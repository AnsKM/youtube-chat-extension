"""
Simplified YouTube Trend Detector with Multiple Database Backends
Works with JSON files, Google Sheets (via MCP), or Airtable
"""

import asyncio
import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from database_adapters import create_database_adapter, DatabaseAdapter
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class SimpleTrendDetector:
    """Simplified trend detector with flexible database backends"""
    
    def __init__(self, db_adapter: DatabaseAdapter):
        self.db = db_adapter
        
        # Check if we should use real Apify data
        self.apify_token = os.getenv('APIFY_TOKEN')
        self.use_real_data = bool(self.apify_token and self.apify_token != 'your_apify_token_here')
        
        if self.use_real_data:
            try:
                from apify_youtube_client import ApifyYouTubeClient
                self.youtube_client = ApifyYouTubeClient()
                print("🚀 Using real Apify data")
            except Exception as e:
                print(f"⚠️ Failed to initialize Apify client: {e}")
                self.use_real_data = False
                print("📝 Falling back to mock data")
        else:
            print("📝 Using mock data (set APIFY_TOKEN for real data)")
    
    async def add_channel(self, channel_url: str, channel_name: str = None) -> bool:
        """Add a channel to monitor"""
        # Extract channel ID from URL (simplified)
        channel_id = channel_url.split('/')[-1]
        
        channel_data = {
            'channel_id': channel_id,
            'channel_url': channel_url,
            'name': channel_name or f"Channel {channel_id}",
            'is_active': True
        }
        
        return await self.db.add_channel(channel_data)
    
    async def get_channels(self) -> List[Dict]:
        """Get all active channels"""
        return await self.db.get_channels()
    
    async def get_real_video_data(self, channel_urls: List[str]) -> List[Dict]:
        """Get real video data from Apify"""
        try:
            if not self.use_real_data:
                return []
            
            print(f"🔍 Fetching real data from {len(channel_urls)} channels...")
            videos = await self.youtube_client.get_channel_videos(channel_urls, max_videos=10)
            
            # Convert Apify format to our internal format
            formatted_videos = []
            for video in videos:
                formatted_video = {
                    'video_id': video.get('id', f'unknown_{len(formatted_videos)}'),
                    'channel_id': video.get('channelId', 'unknown'),
                    'title': video.get('title', 'Unknown Title'),
                    'description': video.get('description', '')[:500],  # Limit description
                    'published_at': video.get('publishedTimeText', datetime.now().isoformat()),
                    'duration_seconds': video.get('lengthSeconds', 0),
                    'thumbnail_url': video.get('thumbnail', {}).get('url', ''),
                    'views': video.get('viewCount', 0),
                    'likes': video.get('likeCount', 0),
                    'comments': video.get('commentCount', 0),
                    'video_url': f"https://youtube.com/watch?v={video.get('id', '')}"
                }
                formatted_videos.append(formatted_video)
            
            print(f"✅ Fetched {len(formatted_videos)} real videos")
            return formatted_videos
            
        except Exception as e:
            print(f"❌ Error fetching real data: {e}")
            print("📝 Falling back to mock data")
            return []
    
    async def simulate_video_update(self, channel_id: str) -> List[Dict]:
        """Simulate getting videos from YouTube API"""
        # This would normally call YouTube API or Apify
        mock_videos = [
            {
                'video_id': f'vid_{channel_id}_{i}',
                'channel_id': channel_id,
                'title': f'Mock Video {i} - {"VIRAL CONTENT!" if i % 3 == 0 else "Regular Video"}',
                'description': f'This is a mock video {i} description',
                'published_at': (datetime.now() - timedelta(hours=i)).isoformat(),
                'duration_seconds': 300 + (i * 30),
                'thumbnail_url': f'https://example.com/thumb_{i}.jpg',
                'views': 1000 + (i * 5000),
                'likes': 50 + (i * 100),
                'comments': 10 + (i * 20),
                'video_url': f'https://youtube.com/watch?v=vid_{channel_id}_{i}'
            }
            for i in range(1, 6)  # 5 mock videos per channel
        ]
        
        return mock_videos
    
    async def calculate_channel_average_views(self, channel_id: str) -> int:
        """Calculate average views for a specific channel"""
        # Get all videos for this channel
        all_videos = await self.db.get_video_metrics(hours=24*30)  # Last 30 days
        
        channel_views = []
        for video in all_videos:
            # Get video details to check channel
            video_details = await self.db.get_video_by_id(video['video_id'])
            if video_details and video_details.get('channel_id') == channel_id:
                channel_views.append(video.get('views', 0))
        
        if len(channel_views) < 3:  # Need at least 3 videos
            return 10000  # Default baseline
        
        # Remove outliers (top 10% and bottom 10%) for better average
        sorted_views = sorted(channel_views)
        start_idx = max(0, len(sorted_views) // 10)
        end_idx = min(len(sorted_views), len(sorted_views) - len(sorted_views) // 10)
        trimmed_views = sorted_views[start_idx:end_idx]
        
        return sum(trimmed_views) // len(trimmed_views) if trimmed_views else 10000

    async def calculate_trend_metrics(self, video_data: Dict) -> Dict:
        """Calculate if video is trending based on channel's own performance"""
        views = video_data.get('views', 0)
        channel_id = video_data.get('channel_id', '')
        
        # Get channel-specific average
        channel_avg_views = await self.calculate_channel_average_views(channel_id)
        
        view_multiple = views / max(channel_avg_views, 1)
        is_trending = view_multiple >= 2.0  # 2x channel average = trending
        
        return {
            'video_id': video_data['video_id'],
            'channel_id': channel_id,
            'views': views,
            'likes': video_data.get('likes', 0),
            'comments': video_data.get('comments', 0),
            'view_multiple': round(view_multiple, 2),
            'is_trending': is_trending,
            'trending_score': round(view_multiple * 10, 1),  # 0-100 score
            'channel_avg_views': channel_avg_views
        }
    
    async def update_videos(self) -> Dict:
        """Update video data from all channels"""
        channels = await self.get_channels()
        
        if not channels:
            return {'message': 'No channels to update', 'updated_videos': 0}
        
        total_updated = 0
        trending_count = 0
        
        if self.use_real_data:
            # Use real Apify data
            print("🚀 Fetching real YouTube data via Apify...")
            channel_urls = [channel['channel_url'] for channel in channels]
            
            try:
                real_videos = await self.get_real_video_data(channel_urls)
                
                for video_data in real_videos:
                    # Add video to database
                    await self.db.add_video(video_data)
                    
                    # Calculate and store metrics  
                    metrics = await self.calculate_trend_metrics(video_data)
                    await self.db.add_video_metrics(metrics)
                    
                    total_updated += 1
                    if metrics['is_trending']:
                        trending_count += 1
                
                if not real_videos:
                    print("⚠️ No real data received, falling back to mock data")
                    # Fall back to mock data if real data fails
                    for channel in channels:
                        channel_id = channel['channel_id']
                        videos = await self.simulate_video_update(channel_id)
                        
                        for video_data in videos:
                            await self.db.add_video(video_data)
                            metrics = await self.calculate_trend_metrics(video_data)
                            await self.db.add_video_metrics(metrics)
                            total_updated += 1
                            if metrics['is_trending']:
                                trending_count += 1
                                
            except Exception as e:
                print(f"❌ Error with real data: {e}")
                print("📝 Using mock data instead")
                # Fall back to mock data
                for channel in channels:
                    channel_id = channel['channel_id']
                    videos = await self.simulate_video_update(channel_id)
                    
                    for video_data in videos:
                        await self.db.add_video(video_data)
                        metrics = await self.calculate_trend_metrics(video_data)
                        await self.db.add_video_metrics(metrics)
                        total_updated += 1
                        if metrics['is_trending']:
                            trending_count += 1
        else:
            # Use mock data
            print("📝 Using mock data (add APIFY_TOKEN for real data)")
            for channel in channels:
                channel_id = channel['channel_id']
                
                # Get videos (simulated)
                videos = await self.simulate_video_update(channel_id)
                
                for video_data in videos:
                    # Add video to database
                    await self.db.add_video(video_data)
                    
                    # Calculate and store metrics
                    metrics = await self.calculate_trend_metrics(video_data)
                    await self.db.add_video_metrics(metrics)
                
                total_updated += 1
                if metrics['is_trending']:
                    trending_count += 1
        
        return {
            'message': f'Updated {total_updated} videos from {len(channels)} channels',
            'updated_videos': total_updated,
            'trending_videos': trending_count,
            'channels_processed': len(channels)
        }
    
    async def get_trending_report(self, hours: int = 24) -> Dict:
        """Get enhanced trending videos report with titles and channel-relative performance"""
        trending_videos = await self.db.get_trending_videos(hours)
        all_metrics = await self.db.get_video_metrics(hours)
        
        # Get video details with titles
        enhanced_trending = []
        for video_metric in trending_videos:
            video_id = video_metric['video_id']
            
            # Get video details from videos.json
            video_details = await self.db.get_video_by_id(video_id)
            
            if video_details:
                enhanced_video = {
                    'video_id': video_id,
                    'title': video_details.get('title', 'Unknown Title'),
                    'channel_id': video_details.get('channel_id', 'Unknown'),
                    'views': video_metric.get('views', 0),
                    'view_multiple': video_metric.get('view_multiple', 0),
                    'trending_score': video_metric.get('trending_score', 0),
                    'is_trending': video_metric.get('is_trending', False),
                    'published_at': video_details.get('published_at', ''),
                    'video_url': video_details.get('video_url', ''),
                    'thumbnail_url': video_details.get('thumbnail_url', ''),
                    'relative_performance': self._calculate_relative_performance(video_metric)
                }
                enhanced_trending.append(enhanced_video)
        
        # Sort by relative performance (view_multiple) instead of absolute views
        enhanced_trending.sort(key=lambda x: x.get('view_multiple', 0), reverse=True)
        
        # Filter out mega-viral outliers - focus on 2x-10x performance range
        filtered_trending = [
            v for v in enhanced_trending 
            if 2.0 <= v.get('view_multiple', 0) <= 50.0  # 2x to 50x channel average
        ]
        
        # Calculate stats
        total_videos = len(all_metrics)
        trending_count = len(filtered_trending)
        trending_rate = (trending_count / max(total_videos, 1)) * 100
        
        avg_views = sum(v.get('views', 0) for v in all_metrics) / max(total_videos, 1)
        avg_trending_views = sum(v.get('views', 0) for v in filtered_trending) / max(trending_count, 1)
        
        return {
            'generated_at': datetime.now().isoformat(),
            'period_hours': hours,
            'total_videos': total_videos,
            'trending_count': trending_count,
            'trending_rate': round(trending_rate, 1),
            'avg_views': round(avg_views),
            'avg_trending_views': round(avg_trending_views),
            'top_trending': filtered_trending[:10]  # Top 10 relative performers
        }
    
    def _calculate_relative_performance(self, video_metric: Dict) -> str:
        """Calculate human-readable relative performance"""
        multiple = video_metric.get('view_multiple', 0)
        
        if multiple >= 10:
            return f"{multiple:.1f}x average (🔥 Mega Viral)"
        elif multiple >= 5:
            return f"{multiple:.1f}x average (🚀 Super Viral)"
        elif multiple >= 3:
            return f"{multiple:.1f}x average (📈 Very Viral)"
        elif multiple >= 2:
            return f"{multiple:.1f}x average (⭐ Viral)"
        else:
            return f"{multiple:.1f}x average (📊 Above Average)"
    
    async def get_analytics_data(self, hours: int = 168) -> Dict:
        """Get analytics data for charts"""
        metrics = await self.db.get_video_metrics(hours)
        
        # Group by hour for time series
        hourly_data = {}
        for metric in metrics:
            try:
                recorded_at = datetime.fromisoformat(metric['recorded_at'])
                hour_key = recorded_at.replace(minute=0, second=0, microsecond=0)
                
                if hour_key not in hourly_data:
                    hourly_data[hour_key] = {
                        'timestamp': hour_key.isoformat(),
                        'total_videos': 0,
                        'trending_videos': 0,
                        'total_views': 0,
                        'avg_trending_score': 0
                    }
                
                hourly_data[hour_key]['total_videos'] += 1
                hourly_data[hour_key]['total_views'] += metric.get('views', 0)
                
                if metric.get('is_trending'):
                    hourly_data[hour_key]['trending_videos'] += 1
                
                hourly_data[hour_key]['avg_trending_score'] += metric.get('trending_score', 0)
            except (ValueError, KeyError):
                continue
        
        # Calculate averages
        for data in hourly_data.values():
            if data['total_videos'] > 0:
                data['avg_trending_score'] /= data['total_videos']
                data['avg_trending_score'] = round(data['avg_trending_score'], 1)
        
        return {
            'hourly_data': sorted(hourly_data.values(), key=lambda x: x['timestamp']),
            'summary': {
                'total_hours': len(hourly_data),
                'peak_hour': max(hourly_data.values(), key=lambda x: x['trending_videos'])['timestamp'] if hourly_data else None,
                'avg_videos_per_hour': sum(d['total_videos'] for d in hourly_data.values()) / max(len(hourly_data), 1)
            }
        }


# CLI Interface
async def main():
    """Main CLI interface"""
    import sys
    
    # Choose database adapter based on environment
    db_type = os.getenv('DATABASE_TYPE', 'json').lower()
    
    if db_type == 'json':
        db = create_database_adapter('json', data_dir='trend_data')
        print("📁 Using JSON file database")
    
    elif db_type == 'googlesheets':
        spreadsheet_id = os.getenv('GOOGLE_SPREADSHEET_ID')
        if not spreadsheet_id:
            print("❌ GOOGLE_SPREADSHEET_ID not set")
            return
        db = create_database_adapter('googlesheets', spreadsheet_id=spreadsheet_id)
        print("📊 Using Google Sheets database")
    
    elif db_type == 'airtable':
        base_id = os.getenv('AIRTABLE_BASE_ID')
        if not base_id:
            print("❌ AIRTABLE_BASE_ID not set")
            return
        db = create_database_adapter('airtable', base_id=base_id)
        print("🗃️ Using Airtable database")
    
    else:
        print(f"❌ Unknown database type: {db_type}")
        return
    
    detector = SimpleTrendDetector(db)
    
    if len(sys.argv) < 2:
        print("\n🎬 YouTube Trend Detector")
        print("========================")
        print("Commands:")
        print("  add_channel <url> [name] - Add a channel to monitor")
        print("  list_channels           - List all active channels")
        print("  update                  - Update video data")
        print("  report [hours]          - Generate trending report")
        print("  analytics [hours]       - Get analytics data")
        print("")
        print("Database Configuration:")
        print(f"  Current: {db_type.upper()}")
        print("  Set DATABASE_TYPE env var to: json, googlesheets, or airtable")
        return
    
    command = sys.argv[1].lower()
    
    if command == 'add_channel':
        if len(sys.argv) < 3:
            print("❌ Usage: add_channel <url> [name]")
            return
        
        url = sys.argv[2]
        name = sys.argv[3] if len(sys.argv) > 3 else None
        
        success = await detector.add_channel(url, name)
        if success:
            print(f"✅ Added channel: {url}")
        else:
            print(f"❌ Failed to add channel (may already exist): {url}")
    
    elif command == 'list_channels':
        channels = await detector.get_channels()
        print(f"\n📺 Active Channels ({len(channels)}):")
        print("=" * 50)
        for i, channel in enumerate(channels, 1):
            print(f"{i}. {channel['name']}")
            print(f"   URL: {channel['channel_url']}")
            print(f"   Added: {channel.get('created_at', 'Unknown')}")
            print()
    
    elif command == 'update':
        print("🔄 Updating video data...")
        result = await detector.update_videos()
        print(f"✅ {result['message']}")
        print(f"📊 Videos: {result['updated_videos']}, Trending: {result['trending_videos']}")
    
    elif command == 'report':
        hours = int(sys.argv[2]) if len(sys.argv) > 2 else 24
        print(f"📈 Generating trending report for last {hours} hours...")
        
        report = await detector.get_trending_report(hours)
        
        print(f"\n🔥 Trending Report")
        print("=" * 50)
        print(f"Period: {report['period_hours']} hours")
        print(f"Total Videos: {report['total_videos']}")
        print(f"Trending Videos: {report['trending_count']}")
        print(f"Trending Rate: {report['trending_rate']}%")
        print(f"Avg Views: {report['avg_views']:,}")
        print(f"Avg Trending Views: {report['avg_trending_views']:,}")
        
        print(f"\n🏆 Top Trending Videos:")
        for i, video in enumerate(report['top_trending'][:5], 1):
            title = video.get('title', 'Unknown Title')
            views = video.get('views', 0)
            performance = video.get('relative_performance', 'N/A')
            channel = video.get('channel_id', 'Unknown')
            url = video.get('video_url', '')
            
            print(f"{i}. {title[:70]}")
            if len(title) > 70:
                print("   " + "...")
            print(f"   Channel: {channel}")
            print(f"   Views: {views:,}")
            print(f"   Performance: {performance}")
            if url:
                print(f"   URL: {url}")
            print()
    
    elif command == 'analytics':
        hours = int(sys.argv[2]) if len(sys.argv) > 2 else 168
        print(f"📊 Generating analytics for last {hours} hours...")
        
        analytics = await detector.get_analytics_data(hours)
        
        print(f"\n📈 Analytics Summary")
        print("=" * 50)
        print(f"Data Points: {len(analytics['hourly_data'])}")
        print(f"Average Videos/Hour: {analytics['summary']['avg_videos_per_hour']:.1f}")
        if analytics['summary']['peak_hour']:
            print(f"Peak Activity: {analytics['summary']['peak_hour']}")
        
        # Show recent trend
        recent_data = analytics['hourly_data'][-5:]  # Last 5 hours
        print(f"\n⏰ Recent Activity (Last 5 Hours):")
        for data in recent_data:
            hour = datetime.fromisoformat(data['timestamp']).strftime('%H:%M')
            print(f"  {hour}: {data['total_videos']} videos, {data['trending_videos']} trending")
    
    else:
        print(f"❌ Unknown command: {command}")


if __name__ == "__main__":
    asyncio.run(main())