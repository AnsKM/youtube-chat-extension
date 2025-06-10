#!/bin/bash

# Meta Ad Intelligence Dashboard Launcher
# Quick start script for the interactive dashboard

echo "🚀 Meta Ad Intelligence Dashboard Launcher"
echo "=========================================="

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3 and try again."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "dashboard_server.py" ]; then
    echo "❌ dashboard_server.py not found."
    echo "Please run this script from the meta_ad_scraper directory."
    exit 1
fi

echo "✅ Python 3 found"
echo "✅ Dashboard files located"
echo ""

# Start the dashboard
echo "🌐 Starting Meta Ad Intelligence Dashboard..."
echo "📊 URL: http://localhost:8080"
echo "🔍 Features: German E-commerce, Billy Gene AI, Comparative Analysis"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=========================================="

python3 dashboard_server.py

echo ""
echo "👋 Dashboard stopped. Thanks for using Meta Ad Intelligence!"