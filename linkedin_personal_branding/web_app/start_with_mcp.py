#!/usr/bin/env python3
"""
Start LinkedIn Web App with MCP enabled
"""
import os
import sys

# Enable MCP mode
os.environ['USE_MCP_APIFY'] = 'true'
print("🚀 Starting LinkedIn Personal Branding App")
print("✅ MCP Mode: ENABLED")
print("📍 Port: 5003")
print("🔗 URL: http://localhost:5003")
print("-" * 50)

# Import and run the app
from app import app

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5003)