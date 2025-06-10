"""
Apify YouTube Data Client - Core integration with Apify actors
"""

import os
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import asyncio
from apify_client import ApifyClient
from dotenv import load_dotenv

load_dotenv()


class ApifyYouTubeClient:
    """Client for interacting with Apify YouTube scrapers"""
    
    def __init__(self):
        self.client = ApifyClient(os.getenv('APIFY_TOKEN'))
        self.youtube_scraper = "streamers/youtube-scraper"
        self.channel_scraper = "streamers/youtube-channel-scraper"
        
    async def get_channel_videos(self, channel_urls: List[str], max_videos: int = 50) -> List[Dict]:
        """
        Get recent videos from YouTube channels using Apify
        
        Args:
            channel_urls: List of YouTube channel URLs
            max_videos: Maximum videos to fetch per channel
            
        Returns:
            List of video data dictionaries
        """
        # Prepare the input for the actor
        actor_input = {
            "startUrls": [{"url": url} for url in channel_urls],
            "maxResults": max_videos,
            "searchSection": "videos",
            "sortBy": "newest",
            "useCheerio": True
        }
        
        # Run the actor
        run = self.client.actor(self.youtube_scraper).call(run_input=actor_input)
        
        # Fetch results from the dataset
        videos = []
        for item in self.client.dataset(run["defaultDatasetId"]).iterate_items():
            # Parse duration safely
            duration_str = item.get('duration', '')
            duration_seconds = self._parse_duration(duration_str) if duration_str else 0
            
            # Filter out shorts if configured
            if os.getenv('FILTER_SHORTS', 'true').lower() == 'true':
                if duration_seconds > 0 and duration_seconds < int(os.getenv('MIN_VIDEO_DURATION_SECONDS', '60')):
                    continue
            
            # Clean and parse view count
            view_count = item.get('viewCount', '0')
            if isinstance(view_count, str):
                # Remove commas and convert to int
                view_count = int(view_count.replace(',', '').replace(' views', '')) if view_count else 0
            
            # Clean likes and comments 
            likes = item.get('likes', 0)
            if isinstance(likes, str):
                likes = int(likes.replace(',', '')) if likes else 0
                
            comments = item.get('commentsCount', 0)
            if isinstance(comments, str):
                comments = int(comments.replace(',', '')) if comments else 0
            
            videos.append({
                'id': item.get('id'),
                'video_id': item.get('id'),
                'channelId': item.get('channelId'),
                'channel_id': item.get('channelId'),
                'channelName': item.get('channelName'),
                'title': item.get('title'),
                'description': item.get('text', '')[:500],  # Use 'text' field for description
                'publishedTimeText': item.get('date'),
                'published_at': item.get('date'),
                'duration': duration_str,
                'lengthSeconds': duration_seconds,
                'viewCount': view_count,
                'views': view_count,
                'likeCount': likes,
                'likes': likes,
                'commentCount': comments,
                'comments': comments,
                'thumbnail': {'url': item.get('thumbnailUrl', '')},
                'thumbnailUrl': item.get('thumbnailUrl', ''),
                'url': item.get('url')
            })
            
        return videos
    
    def _parse_duration(self, duration_str: str) -> int:
        """Parse YouTube duration string to seconds"""
        if not duration_str:
            return 0
            
        try:
            # Handle formats like "10:30", "1:05:30", "PT10M30S"
            if duration_str.startswith('PT'):
                # ISO 8601 duration format
                import re
                hours = re.search(r'(\d+)H', duration_str)
                minutes = re.search(r'(\d+)M', duration_str)
                seconds = re.search(r'(\d+)S', duration_str)
                
                total_seconds = 0
                if hours:
                    total_seconds += int(hours.group(1)) * 3600
                if minutes:
                    total_seconds += int(minutes.group(1)) * 60
                if seconds:
                    total_seconds += int(seconds.group(1))
                
                return total_seconds
            else:
                # Format like "10:30" or "1:05:30"
                parts = duration_str.split(':')
                if len(parts) == 2:
                    return int(parts[0]) * 60 + int(parts[1])
                elif len(parts) == 3:
                    return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
                    
        except Exception:
            pass
            
        return 0
    
    async def get_channel_info(self, channel_urls: List[str]) -> List[Dict]:
        """
        Get channel information using Fast YouTube Channel Scraper
        
        Args:
            channel_urls: List of YouTube channel URLs
            
        Returns:
            List of channel information dictionaries
        """
        actor_input = {
            "channelUrls": channel_urls,
            "maxVideos": 0  # We just want channel info
        }
        
        run = self.client.actor(self.channel_scraper).call(run_input=actor_input)
        
        channels = []
        for item in self.client.dataset(run["defaultDatasetId"]).iterate_items():
            channels.append({
                'channel_id': item.get('channelId'),
                'name': item.get('channelName'),
                'subscribers': int(item.get('subscriberCount', 0)),
                'video_count': int(item.get('videoCount', 0)),
                'description': item.get('channelDescription'),
                'thumbnail': item.get('channelThumbnail')
            })
            
        return channels
    
    async def get_trending_videos(self, 
                                 channel_urls: List[str], 
                                 lookback_days: int = 7,
                                 min_views: int = 1000) -> List[Dict]:
        """
        Get potentially trending videos from channels
        
        Args:
            channel_urls: List of channel URLs to monitor
            lookback_days: How many days back to look for videos
            min_views: Minimum views to consider
            
        Returns:
            List of video data with trend metrics
        """
        # Get recent videos
        videos = await self.get_channel_videos(channel_urls, max_videos=100)
        
        # Filter by date and minimum views
        cutoff_date = datetime.now() - timedelta(days=lookback_days)
        recent_videos = []
        
        for video in videos:
            try:
                published = datetime.fromisoformat(video['published_at'].replace('Z', '+00:00'))
                if published >= cutoff_date and video['views'] >= min_views:
                    recent_videos.append(video)
            except:
                continue
        
        # Group by channel and calculate metrics
        channel_videos = {}
        for video in recent_videos:
            channel = video['channel_id']
            if channel not in channel_videos:
                channel_videos[channel] = []
            channel_videos[channel].append(video)
        
        # Calculate averages and multiples
        trending_videos = []
        for channel, videos in channel_videos.items():
            if len(videos) < 3:  # Need at least 3 videos for meaningful average
                continue
                
            # Calculate average views for the channel
            avg_views = sum(v['views'] for v in videos) / len(videos)
            
            # Add trend metrics to each video
            for video in videos:
                video['avg_channel_views'] = avg_views
                video['view_multiple'] = video['views'] / avg_views if avg_views > 0 else 0
                video['is_trending'] = video['view_multiple'] >= float(os.getenv('TREND_THRESHOLD', '2.0'))
                trending_videos.append(video)
        
        # Sort by view multiple
        trending_videos.sort(key=lambda x: x['view_multiple'], reverse=True)
        
        return trending_videos
    
    def _parse_duration(self, duration_str: str) -> int:
        """
        Parse YouTube duration string (e.g., 'PT4M33S') to seconds
        
        Args:
            duration_str: YouTube duration format string
            
        Returns:
            Duration in seconds
        """
        if not duration_str:
            return 0
            
        # Remove PT prefix
        duration_str = duration_str.replace('PT', '')
        
        total_seconds = 0
        
        # Parse hours
        if 'H' in duration_str:
            hours, duration_str = duration_str.split('H')
            total_seconds += int(hours) * 3600
            
        # Parse minutes
        if 'M' in duration_str:
            minutes, duration_str = duration_str.split('M')
            total_seconds += int(minutes) * 60
            
        # Parse seconds
        if 'S' in duration_str:
            seconds = duration_str.replace('S', '')
            total_seconds += int(seconds)
            
        return total_seconds


# Example usage
if __name__ == "__main__":
    async def test():
        client = ApifyYouTubeClient()
        
        # Test channels
        channels = [
            "https://www.youtube.com/@MrBeast",
            "https://www.youtube.com/@mkbhd"
        ]
        
        # Get trending videos
        trending = await client.get_trending_videos(channels)
        
        print(f"Found {len(trending)} videos")
        for video in trending[:5]:  # Show top 5
            if video['is_trending']:
                print(f"\n🔥 TRENDING: {video['title']}")
                print(f"   Views: {video['views']:,} ({video['view_multiple']:.1f}x average)")
                print(f"   Channel: {video['channel_name']}")
                print(f"   URL: {video['url']}")
    
    asyncio.run(test())