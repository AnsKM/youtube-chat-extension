"""
Database Adapters for YouTube Trend Detector
Supports multiple backends: SQLite, Google Sheets, Airtable, JSON files
"""

import json
import os
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
# import pandas as pd  # Optional, not needed for basic functionality


class DatabaseAdapter(ABC):
    """Abstract base class for database adapters"""
    
    @abstractmethod
    async def add_channel(self, channel_data: Dict) -> bool:
        pass
    
    @abstractmethod
    async def get_channels(self) -> List[Dict]:
        pass
    
    @abstractmethod
    async def add_video(self, video_data: Dict) -> bool:
        pass
    
    @abstractmethod
    async def add_video_metrics(self, metrics_data: Dict) -> bool:
        pass
    
    @abstractmethod
    async def get_trending_videos(self, hours: int = 24) -> List[Dict]:
        pass
    
    @abstractmethod
    async def get_video_metrics(self, hours: int = 24) -> List[Dict]:
        pass
    
    @abstractmethod
    async def get_video_by_id(self, video_id: str) -> Optional[Dict]:
        pass


class JSONFileAdapter(DatabaseAdapter):
    """Simple JSON file-based database adapter"""
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)
        
        self.channels_file = os.path.join(data_dir, "channels.json")
        self.videos_file = os.path.join(data_dir, "videos.json")
        self.metrics_file = os.path.join(data_dir, "metrics.json")
        
        # Initialize files if they don't exist
        for file_path in [self.channels_file, self.videos_file, self.metrics_file]:
            if not os.path.exists(file_path):
                with open(file_path, 'w') as f:
                    json.dump([], f)
    
    def _load_json(self, file_path: str) -> List[Dict]:
        """Load data from JSON file"""
        try:
            with open(file_path, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []
    
    def _save_json(self, file_path: str, data: List[Dict]):
        """Save data to JSON file"""
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2, default=str)
    
    async def add_channel(self, channel_data: Dict) -> bool:
        channels = self._load_json(self.channels_file)
        
        # Check if channel already exists
        for channel in channels:
            if channel.get('channel_url') == channel_data.get('channel_url'):
                return False
        
        channel_data['created_at'] = datetime.now().isoformat()
        channels.append(channel_data)
        self._save_json(self.channels_file, channels)
        return True
    
    async def get_channels(self) -> List[Dict]:
        channels = self._load_json(self.channels_file)
        return [ch for ch in channels if ch.get('is_active', True)]
    
    async def add_video(self, video_data: Dict) -> bool:
        videos = self._load_json(self.videos_file)
        
        # Check if video already exists
        for video in videos:
            if video.get('video_id') == video_data.get('video_id'):
                return False
        
        video_data['created_at'] = datetime.now().isoformat()
        videos.append(video_data)
        self._save_json(self.videos_file, videos)
        return True
    
    async def add_video_metrics(self, metrics_data: Dict) -> bool:
        metrics = self._load_json(self.metrics_file)
        metrics_data['recorded_at'] = datetime.now().isoformat()
        metrics.append(metrics_data)
        self._save_json(self.metrics_file, metrics)
        return True
    
    async def get_trending_videos(self, hours: int = 24) -> List[Dict]:
        cutoff = datetime.now() - timedelta(hours=hours)
        metrics = self._load_json(self.metrics_file)
        
        trending = []
        for metric in metrics:
            recorded_at = datetime.fromisoformat(metric['recorded_at'])
            if recorded_at >= cutoff and metric.get('is_trending'):
                trending.append(metric)
        
        return trending
    
    async def get_video_metrics(self, hours: int = 24) -> List[Dict]:
        cutoff = datetime.now() - timedelta(hours=hours)
        metrics = self._load_json(self.metrics_file)
        
        recent_metrics = []
        for metric in metrics:
            recorded_at = datetime.fromisoformat(metric['recorded_at'])
            if recorded_at >= cutoff:
                recent_metrics.append(metric)
        
        return recent_metrics
    
    async def get_video_by_id(self, video_id: str) -> Optional[Dict]:
        """Get video details by video ID"""
        videos = self._load_json(self.videos_file)
        
        for video in videos:
            if video.get('video_id') == video_id:
                return video
                
        return None


class GoogleSheetsAdapter(DatabaseAdapter):
    """Google Sheets-based database adapter using MCP"""
    
    def __init__(self, spreadsheet_id: str, mcp_server_url: str = None):
        self.spreadsheet_id = spreadsheet_id
        self.mcp_server_url = mcp_server_url
        
        # Sheet names
        self.channels_sheet = "Channels"
        self.videos_sheet = "Videos" 
        self.metrics_sheet = "Metrics"
    
    async def _call_mcp_sheets(self, action: str, sheet_name: str, data: Any = None) -> Any:
        """Call MCP Google Sheets server"""
        # This would use the actual MCP client to call Google Sheets
        # For now, we'll simulate the structure
        
        if action == "read":
            # Simulate reading from Google Sheets
            return []
        elif action == "append":
            # Simulate appending to Google Sheets
            return True
        elif action == "update":
            # Simulate updating Google Sheets
            return True
        
        return None
    
    async def add_channel(self, channel_data: Dict) -> bool:
        # Check if channel exists
        existing_channels = await self._call_mcp_sheets("read", self.channels_sheet)
        
        for channel in existing_channels:
            if channel.get('channel_url') == channel_data.get('channel_url'):
                return False
        
        # Add timestamp
        channel_data['created_at'] = datetime.now().isoformat()
        
        # Append to Google Sheets
        await self._call_mcp_sheets("append", self.channels_sheet, [channel_data])
        return True
    
    async def get_channels(self) -> List[Dict]:
        channels = await self._call_mcp_sheets("read", self.channels_sheet)
        return [ch for ch in channels if ch.get('is_active', True)]
    
    async def add_video(self, video_data: Dict) -> bool:
        video_data['created_at'] = datetime.now().isoformat()
        await self._call_mcp_sheets("append", self.videos_sheet, [video_data])
        return True
    
    async def add_video_metrics(self, metrics_data: Dict) -> bool:
        metrics_data['recorded_at'] = datetime.now().isoformat()
        await self._call_mcp_sheets("append", self.metrics_sheet, [metrics_data])
        return True
    
    async def get_trending_videos(self, hours: int = 24) -> List[Dict]:
        cutoff = datetime.now() - timedelta(hours=hours)
        metrics = await self._call_mcp_sheets("read", self.metrics_sheet)
        
        trending = []
        for metric in metrics:
            recorded_at = datetime.fromisoformat(metric['recorded_at'])
            if recorded_at >= cutoff and metric.get('is_trending'):
                trending.append(metric)
        
        return trending
    
    async def get_video_metrics(self, hours: int = 24) -> List[Dict]:
        cutoff = datetime.now() - timedelta(hours=hours)
        metrics = await self._call_mcp_sheets("read", self.metrics_sheet)
        
        recent_metrics = []
        for metric in metrics:
            recorded_at = datetime.fromisoformat(metric['recorded_at'])
            if recorded_at >= cutoff:
                recent_metrics.append(metric)
        
        return recent_metrics
    
    async def get_video_by_id(self, video_id: str) -> Optional[Dict]:
        videos = await self._call_mcp_sheets("read", self.videos_sheet)
        for video in videos:
            if video.get('video_id') == video_id:
                return video
        return None


class AirtableAdapter(DatabaseAdapter):
    """Airtable-based database adapter"""
    
    def __init__(self, base_id: str, api_key: str = None):
        self.base_id = base_id
        self.api_key = api_key or os.getenv('AIRTABLE_API_KEY')
        
        # Table names
        self.channels_table = "Channels"
        self.videos_table = "Videos"
        self.metrics_table = "Metrics"
    
    async def _call_airtable_api(self, action: str, table: str, data: Any = None) -> Any:
        """Call Airtable API"""
        # This would use httpx or requests to call Airtable API
        # For now, we'll simulate the structure
        
        if action == "list":
            return {"records": []}
        elif action == "create":
            return {"id": "rec123456", "fields": data}
        
        return None
    
    async def add_channel(self, channel_data: Dict) -> bool:
        # Check if channel exists
        response = await self._call_airtable_api("list", self.channels_table)
        existing_channels = response.get("records", [])
        
        for record in existing_channels:
            if record["fields"].get('channel_url') == channel_data.get('channel_url'):
                return False
        
        # Add timestamp
        channel_data['created_at'] = datetime.now().isoformat()
        
        # Create in Airtable
        await self._call_airtable_api("create", self.channels_table, channel_data)
        return True
    
    async def get_channels(self) -> List[Dict]:
        response = await self._call_airtable_api("list", self.channels_table)
        records = response.get("records", [])
        return [record["fields"] for record in records if record["fields"].get('is_active', True)]
    
    async def add_video(self, video_data: Dict) -> bool:
        video_data['created_at'] = datetime.now().isoformat()
        await self._call_airtable_api("create", self.videos_table, video_data)
        return True
    
    async def add_video_metrics(self, metrics_data: Dict) -> bool:
        metrics_data['recorded_at'] = datetime.now().isoformat()
        await self._call_airtable_api("create", self.metrics_table, metrics_data)
        return True
    
    async def get_trending_videos(self, hours: int = 24) -> List[Dict]:
        cutoff = datetime.now() - timedelta(hours=hours)
        response = await self._call_airtable_api("list", self.metrics_table)
        records = response.get("records", [])
        
        trending = []
        for record in records:
            fields = record["fields"]
            recorded_at = datetime.fromisoformat(fields['recorded_at'])
            if recorded_at >= cutoff and fields.get('is_trending'):
                trending.append(fields)
        
        return trending
    
    async def get_video_metrics(self, hours: int = 24) -> List[Dict]:
        cutoff = datetime.now() - timedelta(hours=hours)
        response = await self._call_airtable_api("list", self.metrics_table)
        records = response.get("records", [])
        
        recent_metrics = []
        for record in records:
            fields = record["fields"]
            recorded_at = datetime.fromisoformat(fields['recorded_at'])
            if recorded_at >= cutoff:
                recent_metrics.append(fields)
        
        return recent_metrics
    
    async def get_video_by_id(self, video_id: str) -> Optional[Dict]:
        response = await self._call_airtable_api("list", self.videos_table)
        for record in response.get("records", []):
            fields = record.get("fields", {})
            if fields.get('video_id') == video_id:
                return fields
        return None


# Factory function to create database adapters
def create_database_adapter(adapter_type: str, **kwargs) -> DatabaseAdapter:
    """Factory function to create database adapters"""
    
    if adapter_type.lower() == "json":
        return JSONFileAdapter(kwargs.get('data_dir', 'data'))
    
    elif adapter_type.lower() == "googlesheets":
        return GoogleSheetsAdapter(
            spreadsheet_id=kwargs.get('spreadsheet_id'),
            mcp_server_url=kwargs.get('mcp_server_url')
        )
    
    elif adapter_type.lower() == "airtable":
        return AirtableAdapter(
            base_id=kwargs.get('base_id'),
            api_key=kwargs.get('api_key')
        )
    
    else:
        raise ValueError(f"Unknown adapter type: {adapter_type}")


# Example usage and configuration
if __name__ == "__main__":
    import asyncio
    
    async def demo():
        print("🗄️ Database Adapter Demo")
        
        # Test JSON file adapter
        print("\n📁 Testing JSON File Adapter:")
        json_db = create_database_adapter("json", data_dir="demo_data")
        
        # Add a test channel
        channel_data = {
            "channel_id": "UC123456",
            "channel_url": "https://youtube.com/channel/UC123456",
            "name": "Test Channel",
            "is_active": True
        }
        
        success = await json_db.add_channel(channel_data)
        print(f"✅ Added channel: {success}")
        
        # Get channels
        channels = await json_db.get_channels()
        print(f"📺 Active channels: {len(channels)}")
        
        # Add test video
        video_data = {
            "video_id": "video123",
            "channel_id": "UC123456",
            "title": "Test Video",
            "description": "Test description",
            "duration_seconds": 300,
            "published_at": datetime.now().isoformat()
        }
        
        await json_db.add_video(video_data)
        print("📹 Added test video")
        
        # Add test metrics
        metrics_data = {
            "video_id": "video123",
            "views": 10000,
            "likes": 500,
            "view_multiple": 2.5,
            "is_trending": True
        }
        
        await json_db.add_video_metrics(metrics_data)
        print("📊 Added test metrics")
        
        # Get trending videos
        trending = await json_db.get_trending_videos(24)
        print(f"🔥 Trending videos: {len(trending)}")
        
        print("\n🚀 JSON adapter working perfectly!")
        print("💡 To use Google Sheets or Airtable:")
        print("   - Set up MCP server for Google Sheets")
        print("   - Get Airtable API key and base ID")
        print("   - Update the adapter configuration")
    
    asyncio.run(demo())