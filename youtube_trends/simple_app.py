"""
Simple FastAPI Web App for YouTube Trend Detector
Uses flexible database backends (JSON, Google Sheets, Airtable)
"""

import asyncio
import os
from datetime import datetime
from typing import Dict, List
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from simple_trend_detector import SimpleTrendDetector
from database_adapters import create_database_adapter

# Initialize FastAPI app
app = FastAPI(title="Simple YouTube Trend Detector", description="Monitor YouTube trends easily")

# Templates
templates = Jinja2Templates(directory="templates")

# Initialize database and detector
db_type = os.getenv('DATABASE_TYPE', 'json').lower()
print(f"🗄️ Using {db_type.upper()} database")

if db_type == 'json':
    db = create_database_adapter('json', data_dir='trend_data')
elif db_type == 'googlesheets':
    spreadsheet_id = os.getenv('GOOGLE_SPREADSHEET_ID', 'your-spreadsheet-id')
    db = create_database_adapter('googlesheets', spreadsheet_id=spreadsheet_id)
elif db_type == 'airtable':
    base_id = os.getenv('AIRTABLE_BASE_ID', 'your-base-id')
    db = create_database_adapter('airtable', base_id=base_id)
else:
    db = create_database_adapter('json', data_dir='trend_data')

detector = SimpleTrendDetector(db)

# Pydantic models
class ChannelAdd(BaseModel):
    url: str
    name: str = None

class UpdateResponse(BaseModel):
    success: bool
    message: str
    data: Dict = None


@app.get("/", response_class=HTMLResponse)
async def dashboard(request: Request):
    """Simple dashboard page"""
    try:
        # Get basic stats
        channels = await detector.get_channels()
        report = await detector.get_trending_report(24)
        
        dashboard_data = {
            'total_channels': len(channels),
            'total_videos': report['total_videos'],
            'trending_videos': report['trending_count'],
            'trending_rate': report['trending_rate'],
            'last_update': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'database_type': db_type.upper(),
            'top_trending': report['top_trending'][:5] if report.get('top_trending') else []
        }
        
        return templates.TemplateResponse("simple_dashboard.html", {
            "request": request,
            "data": dashboard_data
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/channels", response_class=HTMLResponse)
async def channels_page(request: Request):
    """Channels management page"""
    try:
        channels = await detector.get_channels()
        
        return templates.TemplateResponse("simple_channels.html", {
            "request": request,
            "channels": channels,
            "database_type": db_type.upper()
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/channels", response_model=UpdateResponse)
async def add_channel(channel: ChannelAdd):
    """Add a new channel"""
    try:
        success = await detector.add_channel(channel.url, channel.name)
        
        if success:
            return UpdateResponse(
                success=True,
                message="Channel added successfully",
                data={"url": channel.url, "name": channel.name}
            )
        else:
            return UpdateResponse(
                success=False,
                message="Failed to add channel (may already exist)"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/trending", response_class=HTMLResponse)
async def trending_page(request: Request, hours: int = 24):
    """Trending videos page"""
    try:
        report = await detector.get_trending_report(hours)
        
        return templates.TemplateResponse("simple_trending.html", {
            "request": request,
            "report": report,
            "hours": hours,
            "database_type": db_type.upper()
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/update", response_model=UpdateResponse)
async def update_videos(background_tasks: BackgroundTasks):
    """Trigger video data update"""
    try:
        # Run update in background
        result = await detector.update_videos()
        
        return UpdateResponse(
            success=True,
            message=result['message'],
            data=result
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics")
async def get_analytics(hours: int = 168):
    """Get analytics data"""
    try:
        analytics = await detector.get_analytics_data(hours)
        return analytics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/report")
async def get_report(hours: int = 24):
    """Get trending report"""
    try:
        report = await detector.get_trending_report(hours)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/setup", response_class=HTMLResponse)
async def setup_page(request: Request):
    """Setup and configuration page"""
    config_info = {
        'current_database': db_type.upper(),
        'data_location': 'trend_data/' if db_type == 'json' else 'External Service',
        'environment_vars': {
            'DATABASE_TYPE': db_type,
            'GOOGLE_SPREADSHEET_ID': os.getenv('GOOGLE_SPREADSHEET_ID', 'Not set'),
            'AIRTABLE_BASE_ID': os.getenv('AIRTABLE_BASE_ID', 'Not set'),
            'AIRTABLE_API_KEY': '***' if os.getenv('AIRTABLE_API_KEY') else 'Not set'
        },
        'supported_databases': [
            {
                'name': 'JSON Files',
                'type': 'json',
                'description': 'Simple local file storage (default)',
                'setup': 'No additional setup required'
            },
            {
                'name': 'Google Sheets',
                'type': 'googlesheets', 
                'description': 'Store data in Google Sheets via MCP',
                'setup': 'Set GOOGLE_SPREADSHEET_ID environment variable'
            },
            {
                'name': 'Airtable',
                'type': 'airtable',
                'description': 'Store data in Airtable database',
                'setup': 'Set AIRTABLE_BASE_ID and AIRTABLE_API_KEY environment variables'
            }
        ]
    }
    
    return templates.TemplateResponse("setup.html", {
        "request": request,
        "config": config_info
    })


# Startup event
@app.on_event("startup")
async def startup_event():
    print(f"🚀 Simple YouTube Trend Detector started!")
    print(f"📊 Database: {db_type.upper()}")
    print(f"🌐 Access at: http://localhost:8000")


if __name__ == "__main__":
    import uvicorn
    
    print("🎬 Starting Simple YouTube Trend Detector...")
    print(f"🗄️ Database: {db_type.upper()}")
    
    uvicorn.run(
        "simple_app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )