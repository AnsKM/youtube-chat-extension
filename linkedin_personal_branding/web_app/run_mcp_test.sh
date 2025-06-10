#!/bin/bash

echo "🚀 LinkedIn Personal Branding App - MCP Test"
echo "============================================"
echo ""
echo "✅ Enabling MCP Mode..."
export USE_MCP_APIFY=true
echo "   USE_MCP_APIFY=$USE_MCP_APIFY"
echo ""
echo "📍 Starting server on port 5003..."
echo "🔗 URL: http://localhost:5003"
echo ""
echo "💡 To test MCP:"
echo "   1. Navigate to Settings"
echo "   2. Configure Apify token (if needed)"
echo "   3. Click 'Scrape Profile'"
echo "   4. Watch console for MCP messages"
echo ""
echo "Press Ctrl+C to stop"
echo "============================================"
echo ""

cd "$(dirname "$0")"
source venv/bin/activate
python app.py