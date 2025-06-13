#!/usr/bin/env python3
"""
Simple HTTP server for the YouTube Chat Extension landing page
"""

import http.server
import socketserver
import os
import webbrowser
from datetime import datetime

# Configuration
PORT = 8888
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Add headers for better development experience
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()
    
    def log_message(self, format, *args):
        # Custom logging with timestamp
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{timestamp}] {format % args}")

def main():
    # Change to the script directory
    os.chdir(DIRECTORY)
    
    print("=" * 60)
    print("YouTube Chat Extension - Landing Page Server")
    print("=" * 60)
    print(f"Serving directory: {DIRECTORY}")
    print(f"Starting server on port {PORT}...")
    print("=" * 60)
    
    # Create server
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"✅ Server running at http://localhost:{PORT}")
        print("📋 Press Ctrl+C to stop the server")
        print("=" * 60)
        
        # Open browser automatically
        webbrowser.open(f'http://localhost:{PORT}')
        
        try:
            # Start serving
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped by user")
            print("=" * 60)

if __name__ == "__main__":
    main()