# YouTube Trend Detector with Apify

A powerful YouTube trend detection system that uses Apify actors to scrape YouTube data without API limits, identify viral content based on view multiples, and send notifications.

## 🚀 Features

- **No YouTube API Limits**: Uses Apify actors instead of YouTube API
- **Automatic Trend Detection**: Identifies videos performing above channel average
- **Multiple Notification Channels**: Email (SendGrid), Slack, Webhooks
- **Database Storage**: Tracks historical data for better analysis
- **Customizable Thresholds**: Define what "trending" means for your use case
- **Shorts Filtering**: Automatically filters out YouTube Shorts

## 📦 Setup

### 1. Get Apify Token

1. Sign up at [Apify.com](https://apify.com)
2. Go to Settings → Integrations → API tokens
3. Create a new token with appropriate permissions

### 2. Install Dependencies

```bash
cd youtube_trend_detector
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials:
# - APIFY_TOKEN
# - Database URL
# - SendGrid API key (optional)
# - Slack webhook (optional)
```

### 4. Initialize Database

```bash
# PostgreSQL (recommended)
createdb youtube_trends

# Or use SQLite (default)
# Database will be created automatically
```

## 🎯 Usage

### Add Channels to Monitor

```bash
# Add a channel
python trend_detector.py add_channel https://www.youtube.com/@MrBeast
python trend_detector.py add_channel https://www.youtube.com/@mkbhd
python trend_detector.py add_channel https://www.youtube.com/@LinusTechTips
```

### Update Video Data

```bash
# Fetch latest videos and detect trends
python trend_detector.py update
```

### Generate Report

```bash
# Get trending videos from last 24 hours
python trend_detector.py report
```

### Automated Scheduling

Use cron (Linux/Mac) or Task Scheduler (Windows):

```bash
# Run every 6 hours
0 */6 * * * /path/to/python /path/to/trend_detector.py update
```

## 🔧 Advanced Usage

### FastAPI Web Interface

```bash
# Coming soon - web dashboard
uvicorn app:app --reload
```

### Custom Integration

```python
from apify_youtube_client import ApifyYouTubeClient
import asyncio

async def main():
    client = ApifyYouTubeClient()
    
    # Get trending videos
    channels = ["https://www.youtube.com/@YourChannel"]
    trending = await client.get_trending_videos(channels)
    
    for video in trending:
        if video['is_trending']:
            print(f"🔥 {video['title']} - {video['view_multiple']}x average")

asyncio.run(main())
```

## 💰 Cost Estimation

Apify pricing (as of 2024):
- YouTube Scraper: ~$0.50 per 1,000 videos
- Monthly cost for 10 channels (daily updates): ~$15-30

## 🛠️ Customization Options

### Modify Trend Threshold

In `.env`:
```
TREND_THRESHOLD=2.0  # Videos with 2x average views
TREND_THRESHOLD=1.5  # Lower threshold for more results
```

### Add Custom Scoring

Edit `apify_youtube_client.py`:
```python
# Custom scoring based on likes + views
score = video['views'] + (video['likes'] * 10)
```

### Different Time Windows

```python
# Check videos from last 3 days only
trending = await client.get_trending_videos(channels, lookback_days=3)
```

## 📊 Database Schema

The system stores:
- **channels**: Monitored YouTube channels
- **videos**: Video metadata
- **video_metrics**: Historical view/like/comment data

## 🔄 Comparison with n8n Approach

| Feature | This Solution | n8n Solution |
|---------|--------------|--------------|
| Setup Time | 30 minutes | 2-3 hours |
| Coding Required | Some Python | No |
| Customization | Unlimited | Limited |
| Cost | ~$15-30/mo | Free (self-hosted) |
| Scalability | Excellent | Good |
| API Limits | None | YouTube quotas |

## 🚦 Next Steps

1. **Web Dashboard**: Build React/Vue interface
2. **Machine Learning**: Predict viral content
3. **Multi-Platform**: Add TikTok, Instagram
4. **SaaS Product**: Package and sell ($99-299/mo)

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📝 License

MIT License - feel free to use commercially!