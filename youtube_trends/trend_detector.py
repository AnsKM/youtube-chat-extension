"""
Main YouTube Trend Detector Application
"""

import os
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import json
from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from apify_youtube_client import ApifyYouTubeClient
from notifications import NotificationManager
from dotenv import load_dotenv

load_dotenv()

Base = declarative_base()


class Channel(Base):
    __tablename__ = 'channels'
    
    id = Column(Integer, primary_key=True)
    channel_id = Column(String, unique=True, nullable=False)
    channel_url = Column(String, nullable=False)
    name = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Video(Base):
    __tablename__ = 'videos'
    
    id = Column(Integer, primary_key=True)
    video_id = Column(String, unique=True, nullable=False)
    channel_id = Column(String, nullable=False)
    title = Column(String)
    description = Column(String)
    published_at = Column(DateTime)
    duration_seconds = Column(Integer)
    thumbnail_url = Column(String)
    video_url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class VideoMetrics(Base):
    __tablename__ = 'video_metrics'
    
    id = Column(Integer, primary_key=True)
    video_id = Column(String, nullable=False)
    views = Column(Integer)
    likes = Column(Integer)
    comments = Column(Integer)
    view_multiple = Column(Float)
    is_trending = Column(Boolean, default=False)
    recorded_at = Column(DateTime, default=datetime.utcnow)


class YouTubeTrendDetector:
    """Main application class for YouTube trend detection"""
    
    def __init__(self):
        # Initialize database
        self.engine = create_engine(os.getenv('DATABASE_URL', 'sqlite:///youtube_trends.db'))
        Base.metadata.create_all(self.engine)
        self.SessionLocal = sessionmaker(bind=self.engine)
        
        # Initialize clients
        self.youtube_client = ApifyYouTubeClient()
        self.notifier = NotificationManager()
        
    def add_channel(self, channel_url: str) -> bool:
        """Add a channel to monitor"""
        with self.SessionLocal() as session:
            # Check if already exists
            existing = session.query(Channel).filter_by(channel_url=channel_url).first()
            if existing:
                return False
            
            # Get channel info from Apify
            channel_info = asyncio.run(self.youtube_client.get_channel_info([channel_url]))
            if not channel_info:
                return False
            
            info = channel_info[0]
            channel = Channel(
                channel_id=info['channel_id'],
                channel_url=channel_url,
                name=info['name']
            )
            session.add(channel)
            session.commit()
            return True
    
    def get_active_channels(self) -> List[str]:
        """Get list of active channel URLs"""
        with self.SessionLocal() as session:
            channels = session.query(Channel).filter_by(is_active=True).all()
            return [ch.channel_url for ch in channels]
    
    async def update_videos(self):
        """Fetch and update video data from all active channels"""
        channels = self.get_active_channels()
        if not channels:
            print("No active channels to monitor")
            return
        
        print(f"Updating videos from {len(channels)} channels...")
        
        # Get trending videos
        trending_videos = await self.youtube_client.get_trending_videos(channels)
        
        with self.SessionLocal() as session:
            for video_data in trending_videos:
                # Update or create video record
                video = session.query(Video).filter_by(video_id=video_data['video_id']).first()
                
                if not video:
                    video = Video(
                        video_id=video_data['video_id'],
                        channel_id=video_data['channel_id'],
                        title=video_data['title'],
                        description=video_data.get('description', ''),
                        published_at=datetime.fromisoformat(video_data['published_at'].replace('Z', '+00:00')),
                        duration_seconds=self.youtube_client._parse_duration(video_data.get('duration', '')),
                        thumbnail_url=video_data.get('thumbnail'),
                        video_url=video_data['url']
                    )
                    session.add(video)
                
                # Add metrics record
                metrics = VideoMetrics(
                    video_id=video_data['video_id'],
                    views=video_data['views'],
                    likes=video_data.get('likes', 0),
                    comments=video_data.get('comments', 0),
                    view_multiple=video_data['view_multiple'],
                    is_trending=video_data['is_trending']
                )
                session.add(metrics)
            
            session.commit()
        
        print(f"Updated {len(trending_videos)} videos")
        
        # Send notifications for trending videos
        truly_trending = [v for v in trending_videos if v['is_trending']]
        if truly_trending:
            await self.send_trend_notifications(truly_trending)
    
    async def send_trend_notifications(self, trending_videos: List[Dict]):
        """Send notifications about trending videos"""
        print(f"Sending notifications for {len(trending_videos)} trending videos...")
        
        # Prepare notification data
        notification_data = {
            'timestamp': datetime.now().isoformat(),
            'video_count': len(trending_videos),
            'videos': []
        }
        
        for video in trending_videos[:10]:  # Top 10 only
            notification_data['videos'].append({
                'title': video['title'],
                'channel': video['channel_name'],
                'views': f"{video['views']:,}",
                'multiple': f"{video['view_multiple']:.1f}x",
                'url': video['url'],
                'thumbnail': video.get('thumbnail')
            })
        
        # Send notifications
        await self.notifier.send_all(notification_data)
    
    def get_trending_report(self, hours: int = 24) -> Dict:
        """Get a report of trending videos from the last N hours"""
        with self.SessionLocal() as session:
            cutoff_time = datetime.utcnow() - timedelta(hours=hours)
            
            # Query trending videos
            trending_metrics = session.query(VideoMetrics).filter(
                VideoMetrics.recorded_at >= cutoff_time,
                VideoMetrics.is_trending == True
            ).order_by(VideoMetrics.view_multiple.desc()).limit(50).all()
            
            report = {
                'generated_at': datetime.now().isoformat(),
                'period_hours': hours,
                'trending_count': len(trending_metrics),
                'videos': []
            }
            
            for metric in trending_metrics:
                video = session.query(Video).filter_by(video_id=metric.video_id).first()
                if video:
                    report['videos'].append({
                        'title': video.title,
                        'video_id': video.video_id,
                        'channel_id': video.channel_id,
                        'views': metric.views,
                        'multiple': metric.view_multiple,
                        'url': video.video_url,
                        'published': video.published_at.isoformat()
                    })
            
            return report


# CLI Interface
if __name__ == "__main__":
    import sys
    
    detector = YouTubeTrendDetector()
    
    if len(sys.argv) < 2:
        print("Usage: python trend_detector.py [command] [args]")
        print("Commands:")
        print("  add_channel [url] - Add a channel to monitor")
        print("  update - Update video data and check for trends")
        print("  report - Generate trending report")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "add_channel" and len(sys.argv) > 2:
        url = sys.argv[2]
        if detector.add_channel(url):
            print(f"Successfully added channel: {url}")
        else:
            print(f"Failed to add channel or already exists: {url}")
    
    elif command == "update":
        asyncio.run(detector.update_videos())
    
    elif command == "report":
        report = detector.get_trending_report()
        print(json.dumps(report, indent=2))
    
    else:
        print(f"Unknown command: {command}")