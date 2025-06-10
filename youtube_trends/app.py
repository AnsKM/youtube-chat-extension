"""
FastAPI Web Dashboard for YouTube Trend Detector
"""

import asyncio
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from fastapi import FastAPI, HTTPException, Request, Form, BackgroundTasks
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel
import plotly.graph_objects as go
import plotly.utils
from trend_detector import YouTubeTrendDetector, Channel, Video, VideoMetrics
from sqlalchemy.orm import Session

app = FastAPI(title="YouTube Trend Detector", description="Monitor and analyze YouTube trends")

# Templates and static files
templates = Jinja2Templates(directory="templates")

# Initialize trend detector
detector = YouTubeTrendDetector()

# Pydantic models for API
class ChannelAdd(BaseModel):
    url: str

class TrendReport(BaseModel):
    hours: int = 24

class DashboardData(BaseModel):
    total_channels: int
    total_videos: int
    trending_videos: int
    last_update: str


@app.get("/", response_class=HTMLResponse)
async def dashboard(request: Request):
    """Main dashboard page"""
    try:
        with detector.SessionLocal() as session:
            # Get basic stats
            total_channels = session.query(Channel).filter_by(is_active=True).count()
            total_videos = session.query(Video).count()
            
            # Get recent trending videos
            cutoff = datetime.utcnow() - timedelta(hours=24)
            trending_count = session.query(VideoMetrics).filter(
                VideoMetrics.recorded_at >= cutoff,
                VideoMetrics.is_trending == True
            ).count()
            
            # Get recent videos for chart
            recent_videos = session.query(VideoMetrics).filter(
                VideoMetrics.recorded_at >= cutoff
            ).order_by(VideoMetrics.recorded_at.desc()).limit(100).all()
            
            # Create trend chart
            chart_data = create_trend_chart(recent_videos)
            
            dashboard_data = {
                'total_channels': total_channels,
                'total_videos': total_videos,
                'trending_videos': trending_count,
                'last_update': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'chart_data': chart_data
            }
            
        return templates.TemplateResponse("dashboard.html", {
            "request": request,
            "data": dashboard_data
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/dashboard", response_model=DashboardData)
async def get_dashboard_data():
    """API endpoint for dashboard data"""
    try:
        with detector.SessionLocal() as session:
            total_channels = session.query(Channel).filter_by(is_active=True).count()
            total_videos = session.query(Video).count()
            
            cutoff = datetime.utcnow() - timedelta(hours=24)
            trending_count = session.query(VideoMetrics).filter(
                VideoMetrics.recorded_at >= cutoff,
                VideoMetrics.is_trending == True
            ).count()
            
            return DashboardData(
                total_channels=total_channels,
                total_videos=total_videos,
                trending_videos=trending_count,
                last_update=datetime.now().isoformat()
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/channels", response_class=HTMLResponse)
async def channels_page(request: Request):
    """Channels management page"""
    try:
        channels = detector.get_active_channels()
        
        # Get channel details
        channel_data = []
        with detector.SessionLocal() as session:
            for url in channels:
                channel = session.query(Channel).filter_by(channel_url=url).first()
                if channel:
                    # Get video count for this channel
                    video_count = session.query(Video).filter_by(channel_id=channel.channel_id).count()
                    
                    # Get trending count for last 24h
                    cutoff = datetime.utcnow() - timedelta(hours=24)
                    trending_count = session.query(VideoMetrics).join(Video).filter(
                        Video.channel_id == channel.channel_id,
                        VideoMetrics.recorded_at >= cutoff,
                        VideoMetrics.is_trending == True
                    ).count()
                    
                    channel_data.append({
                        'name': channel.name,
                        'url': channel.channel_url,
                        'video_count': video_count,
                        'trending_count': trending_count,
                        'created_at': channel.created_at.strftime('%Y-%m-%d')
                    })
        
        return templates.TemplateResponse("channels.html", {
            "request": request,
            "channels": channel_data
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/channels")
async def add_channel(channel: ChannelAdd, background_tasks: BackgroundTasks):
    """Add a new channel to monitor"""
    try:
        success = detector.add_channel(channel.url)
        if success:
            # Trigger initial video update in background
            background_tasks.add_task(detector.update_videos)
            return {"success": True, "message": "Channel added successfully"}
        else:
            return {"success": False, "message": "Failed to add channel or already exists"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/trending", response_class=HTMLResponse)
async def trending_page(request: Request, hours: int = 24):
    """Trending videos page"""
    try:
        report = detector.get_trending_report(hours)
        
        return templates.TemplateResponse("trending.html", {
            "request": request,
            "report": report,
            "hours": hours
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/trending")
async def get_trending_report(hours: int = 24):
    """API endpoint for trending report"""
    try:
        report = detector.get_trending_report(hours)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/update")
async def trigger_update(background_tasks: BackgroundTasks):
    """Trigger video data update"""
    try:
        background_tasks.add_task(detector.update_videos)
        return {"success": True, "message": "Update triggered successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics", response_class=HTMLResponse)
async def analytics_page(request: Request):
    """Analytics dashboard page"""
    return templates.TemplateResponse("analytics.html", {"request": request})


@app.get("/api/analytics")
async def get_analytics(hours: int = 168):  # Default 7 days
    """Get analytics data for charts"""
    try:
        with detector.SessionLocal() as session:
            cutoff = datetime.utcnow() - timedelta(hours=hours)
            
            # Get metrics over time
            metrics = session.query(VideoMetrics).filter(
                VideoMetrics.recorded_at >= cutoff
            ).order_by(VideoMetrics.recorded_at).all()
            
            # Group by hour
            hourly_data = {}
            for metric in metrics:
                hour_key = metric.recorded_at.replace(minute=0, second=0, microsecond=0)
                if hour_key not in hourly_data:
                    hourly_data[hour_key] = {
                        'total_videos': 0,
                        'trending_videos': 0,
                        'total_views': 0,
                        'avg_multiple': 0
                    }
                
                hourly_data[hour_key]['total_videos'] += 1
                if metric.is_trending:
                    hourly_data[hour_key]['trending_videos'] += 1
                hourly_data[hour_key]['total_views'] += metric.views or 0
                hourly_data[hour_key]['avg_multiple'] += metric.view_multiple or 0
            
            # Calculate averages
            for hour_data in hourly_data.values():
                if hour_data['total_videos'] > 0:
                    hour_data['avg_multiple'] /= hour_data['total_videos']
            
            return {
                'hourly_data': [
                    {
                        'timestamp': hour.isoformat(),
                        **data
                    } for hour, data in sorted(hourly_data.items())
                ]
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def create_trend_chart(metrics: List[VideoMetrics]) -> str:
    """Create a Plotly chart for trending data"""
    try:
        timestamps = [m.recorded_at for m in metrics]
        view_multiples = [m.view_multiple for m in metrics]
        trending = [1 if m.is_trending else 0 for m in metrics]
        
        fig = go.Figure()
        
        # Add scatter plot for all videos
        fig.add_trace(go.Scatter(
            x=timestamps,
            y=view_multiples,
            mode='markers',
            name='All Videos',
            marker=dict(size=6, opacity=0.6)
        ))
        
        # Add line for trending threshold
        if view_multiples:
            fig.add_hline(y=1.5, line_dash="dash", line_color="red", 
                         annotation_text="Trending Threshold")
        
        fig.update_layout(
            title="Video Performance Over Time",
            xaxis_title="Time",
            yaxis_title="View Multiple",
            height=400,
            showlegend=True
        )
        
        return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
    except Exception:
        return "{}"


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)