#!/usr/bin/env python3
"""
Startup script for YouTube Trend Detector Web Dashboard
"""

import os
import sys
import uvicorn
from pathlib import Path

def main():
    """Start the web dashboard"""
    
    # Ensure we're in the right directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # Check if .env file exists
    env_file = script_dir / '.env'
    if not env_file.exists():
        print("⚠️  Warning: .env file not found!")
        print("📝 Please copy .env.example to .env and configure your settings")
        print("")
        
        # Show .env.example if it exists
        env_example = script_dir / '.env.example'
        if env_example.exists():
            print("📋 .env.example contents:")
            print("=" * 50)
            with open(env_example, 'r') as f:
                print(f.read())
            print("=" * 50)
        
        # Ask if user wants to continue anyway
        response = input("\n🤔 Continue without .env file? (y/N): ").strip().lower()
        if response not in ['y', 'yes']:
            print("👋 Exiting. Please configure .env file first.")
            sys.exit(1)
    
    # Set default environment variables if not set
    default_env = {
        'DATABASE_URL': 'sqlite:///youtube_trends.db',
        'ENVIRONMENT': 'development'
    }
    
    for key, value in default_env.items():
        if key not in os.environ:
            os.environ[key] = value
    
    # Show startup info
    print("🚀 Starting YouTube Trend Detector Web Dashboard")
    print(f"📊 Database: {os.getenv('DATABASE_URL', 'Not configured')}")
    print(f"🌐 Environment: {os.getenv('ENVIRONMENT', 'Not set')}")
    print("=" * 60)
    
    # Configuration
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 8000))
    reload = os.getenv('ENVIRONMENT', 'production').lower() == 'development'
    
    print(f"🌍 Server will start at: http://{host}:{port}")
    print(f"🔧 Auto-reload: {'Enabled' if reload else 'Disabled'}")
    print("")
    print("📖 Available endpoints:")
    print("  • http://localhost:8000/          - Main Dashboard")
    print("  • http://localhost:8000/channels  - Channel Management") 
    print("  • http://localhost:8000/trending  - Trending Videos")
    print("  • http://localhost:8000/docs      - API Documentation")
    print("")
    print("🛑 Press Ctrl+C to stop the server")
    print("=" * 60)
    
    try:
        # Start the server
        uvicorn.run(
            "app:app",
            host=host,
            port=port,
            reload=reload,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Shutting down gracefully...")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()