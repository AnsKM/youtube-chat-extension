#!/bin/bash

# AI Job Hunter - Web App Launcher
echo "🚀 Starting AI Job Hunter Web Dashboard..."
echo "============================================"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies if needed
if ! python -c "import flask" 2>/dev/null; then
    echo "📥 Installing dependencies..."
    pip install flask
fi

# Run the application
echo "🌐 Starting web server..."
echo "📍 Access the dashboard at: http://localhost:8080"
echo "⚠️  Press Ctrl+C to stop the server"
echo "============================================"
echo ""

python app.py