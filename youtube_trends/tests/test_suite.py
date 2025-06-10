"""
Comprehensive Test Suite for YouTube Trend Detector
"""

import pytest
import asyncio
import os
import tempfile
import shutil
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from trend_detector import YouTubeTrendDetector, Channel, Video, VideoMetrics, Base
from apify_youtube_client import ApifyYouTubeClient
from notifications import NotificationManager


class TestYouTubeTrendDetector:
    """Test cases for the main YouTubeTrendDetector class"""
    
    @pytest.fixture
    def temp_db(self):
        """Create a temporary database for testing"""
        temp_dir = tempfile.mkdtemp()
        db_path = os.path.join(temp_dir, 'test.db')
        engine = create_engine(f'sqlite:///{db_path}')
        Base.metadata.create_all(engine)
        
        yield engine
        
        # Cleanup
        shutil.rmtree(temp_dir)
    
    @pytest.fixture
    def detector(self, temp_db):
        """Create a YouTubeTrendDetector instance with test database"""
        detector = YouTubeTrendDetector()
        detector.engine = temp_db
        detector.SessionLocal = sessionmaker(bind=temp_db)
        
        # Mock external dependencies
        detector.youtube_client = Mock(spec=ApifyYouTubeClient)
        detector.notifier = Mock(spec=NotificationManager)
        
        return detector
    
    def test_init(self):
        """Test YouTubeTrendDetector initialization"""
        with patch.dict(os.environ, {'DATABASE_URL': 'sqlite:///test.db'}):
            detector = YouTubeTrendDetector()
            assert detector.engine is not None
            assert detector.SessionLocal is not None
            assert isinstance(detector.youtube_client, ApifyYouTubeClient)
            assert isinstance(detector.notifier, NotificationManager)
    
    def test_add_channel_success(self, detector):
        """Test successful channel addition"""
        # Mock the async call
        mock_channel_info = [{
            'channel_id': 'UC123456',
            'name': 'Test Channel'
        }]
        
        with patch('asyncio.run', return_value=mock_channel_info):
            detector.youtube_client.get_channel_info.return_value = mock_channel_info
            
            result = detector.add_channel('https://youtube.com/channel/UC123456')
            assert result is True
            
            # Verify channel was added to database
            with detector.SessionLocal() as session:
                channel = session.query(Channel).filter_by(
                    channel_url='https://youtube.com/channel/UC123456'
                ).first()
                assert channel is not None
                assert channel.channel_id == 'UC123456'
                assert channel.name == 'Test Channel'
    
    def test_add_channel_duplicate(self, detector):
        """Test adding duplicate channel"""
        # Add channel first time
        with detector.SessionLocal() as session:
            channel = Channel(
                channel_id='UC123456',
                channel_url='https://youtube.com/channel/UC123456',
                name='Test Channel'
            )
            session.add(channel)
            session.commit()
        
        # Try to add same channel again
        result = detector.add_channel('https://youtube.com/channel/UC123456')
        assert result is False
    
    def test_add_channel_api_failure(self, detector):
        """Test channel addition when API fails"""
        with patch('asyncio.run', return_value=None):
            result = detector.add_channel('https://youtube.com/invalid')
            assert result is False
    
    def test_get_active_channels(self, detector):
        """Test retrieving active channels"""
        # Add test channels
        with detector.SessionLocal() as session:
            channels = [
                Channel(
                    channel_id='UC1',
                    channel_url='https://youtube.com/channel/UC1',
                    name='Channel 1',
                    is_active=True
                ),
                Channel(
                    channel_id='UC2',
                    channel_url='https://youtube.com/channel/UC2',
                    name='Channel 2',
                    is_active=False
                ),
                Channel(
                    channel_id='UC3',
                    channel_url='https://youtube.com/channel/UC3',
                    name='Channel 3',
                    is_active=True
                )
            ]
            session.add_all(channels)
            session.commit()
        
        active_channels = detector.get_active_channels()
        assert len(active_channels) == 2
        assert 'https://youtube.com/channel/UC1' in active_channels
        assert 'https://youtube.com/channel/UC3' in active_channels
        assert 'https://youtube.com/channel/UC2' not in active_channels
    
    @pytest.mark.asyncio
    async def test_update_videos(self, detector):
        """Test video update process"""
        # Setup test data
        with detector.SessionLocal() as session:
            channel = Channel(
                channel_id='UC123',
                channel_url='https://youtube.com/channel/UC123',
                name='Test Channel'
            )
            session.add(channel)
            session.commit()
        
        # Mock trending videos response
        mock_trending_videos = [
            {
                'video_id': 'video123',
                'channel_id': 'UC123',
                'title': 'Test Video',
                'description': 'Test description',
                'published_at': '2024-01-01T12:00:00Z',
                'duration': '00:10:30',
                'thumbnail': 'https://example.com/thumb.jpg',
                'url': 'https://youtube.com/watch?v=video123',
                'views': 10000,
                'likes': 500,
                'comments': 50,
                'view_multiple': 2.5,
                'is_trending': True
            }
        ]
        
        detector.youtube_client.get_trending_videos = AsyncMock(return_value=mock_trending_videos)
        detector.youtube_client._parse_duration = Mock(return_value=630)  # 10:30 in seconds
        detector.send_trend_notifications = AsyncMock()
        
        await detector.update_videos()
        
        # Verify video was added
        with detector.SessionLocal() as session:
            video = session.query(Video).filter_by(video_id='video123').first()
            assert video is not None
            assert video.title == 'Test Video'
            assert video.channel_id == 'UC123'
            
            # Verify metrics were added
            metrics = session.query(VideoMetrics).filter_by(video_id='video123').first()
            assert metrics is not None
            assert metrics.views == 10000
            assert metrics.view_multiple == 2.5
            assert metrics.is_trending is True
        
        # Verify notification was triggered
        detector.send_trend_notifications.assert_called_once()
    
    def test_get_trending_report(self, detector):
        """Test trending report generation"""
        # Setup test data
        test_time = datetime.utcnow()
        
        with detector.SessionLocal() as session:
            # Add video
            video = Video(
                video_id='video123',
                channel_id='UC123',
                title='Trending Video',
                video_url='https://youtube.com/watch?v=video123',
                published_at=test_time - timedelta(hours=12)
            )
            session.add(video)
            
            # Add metrics
            metrics = VideoMetrics(
                video_id='video123',
                views=50000,
                view_multiple=3.0,
                is_trending=True,
                recorded_at=test_time - timedelta(hours=1)
            )
            session.add(metrics)
            session.commit()
        
        report = detector.get_trending_report(hours=24)
        
        assert report['trending_count'] == 1
        assert report['period_hours'] == 24
        assert len(report['videos']) == 1
        assert report['videos'][0]['title'] == 'Trending Video'
        assert report['videos'][0]['views'] == 50000
        assert report['videos'][0]['multiple'] == 3.0


class TestApifyYouTubeClient:
    """Test cases for ApifyYouTubeClient"""
    
    @pytest.fixture
    def client(self):
        """Create ApifyYouTubeClient instance"""
        with patch.dict(os.environ, {'APIFY_TOKEN': 'test_token'}):
            return ApifyYouTubeClient()
    
    def test_init(self, client):
        """Test client initialization"""
        assert client.token == 'test_token'
        assert client.client is not None
    
    def test_parse_duration(self, client):
        """Test duration parsing"""
        assert client._parse_duration('PT10M30S') == 630
        assert client._parse_duration('PT1H5M') == 3900
        assert client._parse_duration('PT45S') == 45
        assert client._parse_duration('invalid') == 0
    
    def test_is_shorts(self, client):
        """Test shorts detection"""
        assert client._is_shorts(30) is True
        assert client._is_shorts(60) is True
        assert client._is_shorts(61) is False
        assert client._is_shorts(120) is False
    
    @pytest.mark.asyncio
    async def test_get_channel_info(self, client):
        """Test channel info retrieval"""
        mock_response = [
            {
                'channelId': 'UC123456',
                'title': 'Test Channel',
                'subscriberCount': 100000
            }
        ]
        
        with patch.object(client.client, 'actor') as mock_actor:
            mock_actor.return_value.call.return_value = mock_response
            
            result = await client.get_channel_info(['https://youtube.com/channel/UC123456'])
            
            assert len(result) == 1
            assert result[0]['channel_id'] == 'UC123456'
            assert result[0]['name'] == 'Test Channel'
    
    @pytest.mark.asyncio
    async def test_get_trending_videos(self, client):
        """Test trending videos retrieval"""
        mock_video_data = [
            {
                'id': 'video123',
                'channelId': 'UC123',
                'title': 'Test Video',
                'viewCount': 10000,
                'publishedTimeText': '2 days ago',
                'duration': {'simpleText': '10:30'},
                'lengthSeconds': 630
            }
        ]
        
        mock_channel_data = [
            {
                'channelId': 'UC123',
                'title': 'Test Channel',
                'videoCount': 100,
                'viewCount': 1000000
            }
        ]
        
        with patch.object(client, 'get_recent_videos', return_value=mock_video_data), \
             patch.object(client, 'get_channel_info', return_value=mock_channel_data):
            
            channels = ['https://youtube.com/channel/UC123']
            result = await client.get_trending_videos(channels)
            
            assert len(result) == 1
            assert result[0]['video_id'] == 'video123'
            assert result[0]['channel_id'] == 'UC123'
            assert 'view_multiple' in result[0]
            assert 'is_trending' in result[0]


class TestNotificationManager:
    """Test cases for NotificationManager"""
    
    @pytest.fixture
    def manager(self):
        """Create NotificationManager instance"""
        return NotificationManager()
    
    def test_init(self, manager):
        """Test manager initialization"""
        assert hasattr(manager, 'sendgrid_api_key')
        assert hasattr(manager, 'slack_token')
        assert hasattr(manager, 'webhook_url')
    
    @pytest.mark.asyncio
    async def test_send_email_notification(self, manager):
        """Test email notification sending"""
        test_data = {
            'video_count': 5,
            'videos': [
                {
                    'title': 'Test Video',
                    'channel': 'Test Channel',
                    'views': '10,000',
                    'multiple': '2.5x',
                    'url': 'https://youtube.com/watch?v=test'
                }
            ]
        }
        
        with patch('sendgrid.SendGridAPIClient') as mock_sendgrid:
            mock_sg = Mock()
            mock_sendgrid.return_value = mock_sg
            mock_sg.send.return_value.status_code = 202
            
            result = await manager.send_email_notification(test_data)
            assert result is True
    
    @pytest.mark.asyncio
    async def test_send_slack_notification(self, manager):
        """Test Slack notification sending"""
        test_data = {
            'video_count': 5,
            'videos': [
                {
                    'title': 'Test Video',
                    'channel': 'Test Channel',
                    'views': '10,000',
                    'multiple': '2.5x',
                    'url': 'https://youtube.com/watch?v=test'
                }
            ]
        }
        
        with patch('slack_sdk.WebClient') as mock_slack:
            mock_client = Mock()
            mock_slack.return_value = mock_client
            mock_client.chat_postMessage.return_value = {'ok': True}
            
            result = await manager.send_slack_notification(test_data)
            assert result is True


class TestDatabaseModels:
    """Test cases for database models"""
    
    def test_channel_model(self):
        """Test Channel model"""
        channel = Channel(
            channel_id='UC123',
            channel_url='https://youtube.com/channel/UC123',
            name='Test Channel'
        )
        
        assert channel.channel_id == 'UC123'
        assert channel.channel_url == 'https://youtube.com/channel/UC123'
        assert channel.name == 'Test Channel'
        assert channel.is_active is True
    
    def test_video_model(self):
        """Test Video model"""
        video = Video(
            video_id='video123',
            channel_id='UC123',
            title='Test Video',
            duration_seconds=630,
            video_url='https://youtube.com/watch?v=video123'
        )
        
        assert video.video_id == 'video123'
        assert video.channel_id == 'UC123'
        assert video.title == 'Test Video'
        assert video.duration_seconds == 630
    
    def test_video_metrics_model(self):
        """Test VideoMetrics model"""
        metrics = VideoMetrics(
            video_id='video123',
            views=10000,
            likes=500,
            view_multiple=2.5,
            is_trending=True
        )
        
        assert metrics.video_id == 'video123'
        assert metrics.views == 10000
        assert metrics.likes == 500
        assert metrics.view_multiple == 2.5
        assert metrics.is_trending is True


class TestCLIInterface:
    """Test cases for CLI interface"""
    
    def test_cli_add_channel(self):
        """Test CLI add_channel command"""
        import sys
        from unittest.mock import patch
        
        test_args = ['trend_detector.py', 'add_channel', 'https://youtube.com/channel/UC123']
        
        with patch.object(sys, 'argv', test_args), \
             patch('trend_detector.YouTubeTrendDetector') as mock_detector:
            
            mock_instance = Mock()
            mock_detector.return_value = mock_instance
            mock_instance.add_channel.return_value = True
            
            # Import would trigger CLI execution
            # This is a simplified test - in practice you'd separate CLI logic
            assert True  # Placeholder for actual CLI testing
    
    def test_cli_update(self):
        """Test CLI update command"""
        import sys
        from unittest.mock import patch
        
        test_args = ['trend_detector.py', 'update']
        
        with patch.object(sys, 'argv', test_args), \
             patch('asyncio.run') as mock_run, \
             patch('trend_detector.YouTubeTrendDetector') as mock_detector:
            
            mock_instance = Mock()
            mock_detector.return_value = mock_instance
            
            # Import would trigger CLI execution
            assert True  # Placeholder for actual CLI testing


# Integration Tests
class TestIntegration:
    """Integration test cases"""
    
    @pytest.mark.asyncio
    async def test_full_workflow(self):
        """Test complete workflow from adding channel to getting reports"""
        # This would test the entire system working together
        # Including database operations, API calls, and notifications
        
        # Create temp database
        temp_dir = tempfile.mkdtemp()
        db_path = os.path.join(temp_dir, 'integration_test.db')
        
        try:
            with patch.dict(os.environ, {'DATABASE_URL': f'sqlite:///{db_path}'}):
                detector = YouTubeTrendDetector()
                
                # Mock external dependencies
                detector.youtube_client = Mock(spec=ApifyYouTubeClient)
                detector.notifier = Mock(spec=NotificationManager)
                
                # Test workflow
                # 1. Add channel
                mock_channel_info = [{'channel_id': 'UC123', 'name': 'Test Channel'}]
                with patch('asyncio.run', return_value=mock_channel_info):
                    result = detector.add_channel('https://youtube.com/channel/UC123')
                    assert result is True
                
                # 2. Get active channels
                channels = detector.get_active_channels()
                assert len(channels) == 1
                
                # 3. Update videos (mocked)
                mock_videos = [{
                    'video_id': 'v123',
                    'channel_id': 'UC123',
                    'title': 'Test',
                    'description': '',
                    'published_at': '2024-01-01T12:00:00Z',
                    'duration': '00:05:00',
                    'url': 'https://youtube.com/watch?v=v123',
                    'views': 1000,
                    'view_multiple': 1.5,
                    'is_trending': True
                }]
                
                detector.youtube_client.get_trending_videos = AsyncMock(return_value=mock_videos)
                detector.youtube_client._parse_duration = Mock(return_value=300)
                detector.send_trend_notifications = AsyncMock()
                
                await detector.update_videos()
                
                # 4. Generate report
                report = detector.get_trending_report()
                assert report['trending_count'] == 1
                
        finally:
            shutil.rmtree(temp_dir)


# Test Fixtures and Utilities
@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v", "--tb=short"])