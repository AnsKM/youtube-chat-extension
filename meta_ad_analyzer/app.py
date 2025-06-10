#!/usr/bin/env python3
"""
Meta Ad Library Web Interface
FastAPI app for viewing and analyzing scraped ads
"""

import sys
import os
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, Request, Query
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import asyncio

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from meta_ad_client import MetaAdLibraryClient
from data_processor import MetaAdDataProcessor

# Initialize FastAPI
app = FastAPI(title="Meta Ad Library Viewer", description="View and analyze scraped Meta ads")

# Templates
templates = Jinja2Templates(directory="templates")

# Initialize components
ad_client = MetaAdLibraryClient()
processor = MetaAdDataProcessor()


# Pydantic models
class ScrapeRequest(BaseModel):
    url: str
    max_ads: int = 100

class SearchRequest(BaseModel):
    query: str
    country: str = "US"
    max_ads: int = 100


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Home page with dashboard"""
    # Get analytics
    analysis = processor.analyze_ads()
    
    # Get recent ads
    recent_ads = processor.get_ads(limit=10)
    
    return templates.TemplateResponse("dashboard.html", {
        "request": request,
        "analysis": analysis,
        "recent_ads": recent_ads,
        "last_update": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })


@app.get("/ads", response_class=HTMLResponse)
async def view_ads(
    request: Request,
    page: Optional[str] = None,
    active_only: bool = False,
    search: Optional[str] = None,
    limit: int = 50
):
    """View ads with filtering"""
    filters = {}
    
    if page:
        filters['page_name'] = page
    if active_only:
        filters['is_active'] = True
    
    ads = processor.get_ads(filters=filters, limit=limit)
    
    # Apply text search if provided
    if search:
        search_lower = search.lower()
        ads = [
            ad for ad in ads 
            if search_lower in ad.get('ad_text', '').lower() or
               search_lower in ad.get('page_name', '').lower()
        ]
    
    # Get list of pages for filter dropdown
    all_ads = processor.get_ads()
    pages = sorted(set(ad.get('page_name', 'Unknown') for ad in all_ads))
    
    return templates.TemplateResponse("ads.html", {
        "request": request,
        "ads": ads,
        "pages": pages,
        "current_page": page,
        "active_only": active_only,
        "search": search,
        "total_ads": len(ads)
    })


@app.get("/ad/{ad_id}", response_class=HTMLResponse)
async def view_ad_detail(request: Request, ad_id: str):
    """View single ad details"""
    ads = processor.get_ads(filters={'ad_id': ad_id})
    
    if not ads:
        return templates.TemplateResponse("404.html", {"request": request})
    
    ad = ads[0]
    
    return templates.TemplateResponse("ad_detail.html", {
        "request": request,
        "ad": ad
    })


@app.get("/analytics", response_class=HTMLResponse)
async def analytics(request: Request):
    """Analytics page"""
    analysis = processor.analyze_ads()
    
    # Prepare chart data
    charts = {
        'cta_chart': prepare_cta_chart(analysis),
        'platform_chart': prepare_platform_chart(analysis),
        'keyword_chart': prepare_keyword_chart(analysis),
        'temporal_chart': prepare_temporal_chart(analysis)
    }
    
    return templates.TemplateResponse("analytics.html", {
        "request": request,
        "analysis": analysis,
        "charts": charts
    })


@app.post("/api/scrape")
async def api_scrape(request: ScrapeRequest):
    """API endpoint to scrape ads"""
    try:
        ads = await ad_client.scrape_page_ads(request.url, request.max_ads)
        result = processor.save_ads(ads, source=request.url)
        
        return {
            "success": True,
            "message": f"Scraped {len(ads)} ads",
            "result": result
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.post("/api/search")
async def api_search(request: SearchRequest):
    """API endpoint to search ads"""
    try:
        ads = await ad_client.search_ads(
            request.query, 
            request.country, 
            request.max_ads
        )
        result = processor.save_ads(ads, source=f"search:{request.query}")
        
        return {
            "success": True,
            "message": f"Found {len(ads)} ads",
            "result": result
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/api/ads")
async def api_get_ads(
    page_name: Optional[str] = None,
    is_active: Optional[bool] = None,
    limit: int = Query(default=100, le=1000)
):
    """API endpoint to get ads"""
    filters = {}
    if page_name:
        filters['page_name'] = page_name
    if is_active is not None:
        filters['is_active'] = is_active
    
    ads = processor.get_ads(filters=filters, limit=limit)
    
    return {
        "success": True,
        "count": len(ads),
        "ads": ads
    }


@app.get("/api/analytics")
async def api_analytics():
    """API endpoint for analytics"""
    analysis = processor.analyze_ads()
    return {
        "success": True,
        "analysis": analysis
    }


@app.get("/api/export/csv")
async def export_csv():
    """Export ads to CSV"""
    filename = processor.export_to_csv()
    return {
        "success": True,
        "filename": filename
    }


def prepare_cta_chart(analysis: dict) -> dict:
    """Prepare CTA distribution chart data"""
    cta_dist = analysis.get('cta_distribution', {})
    return {
        'labels': list(cta_dist.keys())[:10],
        'values': list(cta_dist.values())[:10]
    }


def prepare_platform_chart(analysis: dict) -> dict:
    """Prepare platform distribution chart data"""
    platform_dist = analysis.get('platform_distribution', {})
    return {
        'labels': list(platform_dist.keys()),
        'values': list(platform_dist.values())
    }


def prepare_keyword_chart(analysis: dict) -> dict:
    """Prepare keyword chart data"""
    keywords = analysis.get('keyword_analysis', {}).get('top_keywords', {})
    return {
        'labels': list(keywords.keys())[:15],
        'values': list(keywords.values())[:15]
    }


def prepare_temporal_chart(analysis: dict) -> dict:
    """Prepare temporal chart data"""
    temporal = analysis.get('temporal_patterns', {}).get('ads_by_month', {})
    return {
        'labels': list(temporal.keys()),
        'values': list(temporal.values())
    }


if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Meta Ad Library Viewer...")
    print("📍 Visit: http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)