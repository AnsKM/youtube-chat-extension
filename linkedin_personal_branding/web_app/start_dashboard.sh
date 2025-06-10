#!/bin/bash
# LinkedIn Personal Branding Dashboard Startup Script

echo "🚀 Starting LinkedIn Personal Branding Dashboard..."
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed"
    echo "Please install Python 3.8+ and try again"
    exit 1
fi

# Check Python version
python_version=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo "✅ Python $python_version detected"

# Navigate to web app directory
cd "$(dirname "$0")"
echo "📁 Working directory: $(pwd)"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install requirements if they don't exist
if [ -f "requirements.txt" ]; then
    echo "📋 Installing requirements..."
    pip install -r requirements.txt --quiet
else
    echo "📋 Installing core dependencies..."
    pip install flask requests pathlib --quiet
fi

# Check if app.py exists
if [ ! -f "app.py" ]; then
    echo "❌ Error: app.py not found"
    echo "Please ensure you're in the correct directory"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo

# Display startup information
echo "🌐 LinkedIn Personal Branding Dashboard"
echo "========================================"
echo
echo "📊 Features:"
echo "  • Real-time progress tracking"
echo "  • AI-powered content generation"
echo "  • Automated profile analysis"
echo "  • Interactive goal monitoring"
echo
echo "🎯 Transformation Goal:"
echo "  From: Cybersecurity Analyst (366 connections)"
echo "  To: AI Expert & LinkedIn Influencer (5,500+ connections)"
echo
echo "📅 Timeline: June - December 2025"
echo

# Start the application
echo "🚀 Starting dashboard server..."
echo "📡 Server will be available at: http://localhost:5001"
echo "🔄 Press Ctrl+C to stop the server"
echo

# Add some spacing
echo
echo "⚡ Starting in 3 seconds..."
sleep 1
echo "⚡ Starting in 2 seconds..."
sleep 1
echo "⚡ Starting in 1 second..."
sleep 1
echo

# Start Flask app
python3 app.py