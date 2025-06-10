#!/usr/bin/env python3
"""
Simple HTTP server to serve the Meta Ad Intelligence Dashboard
"""

import http.server
import socketserver
import os
import webbrowser
import json
from datetime import datetime

class DashboardHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler for the dashboard with API endpoints."""
    
    def do_GET(self):
        """Handle GET requests."""
        if self.path == '/':
            self.path = '/static/index.html'
        elif self.path.startswith('/api/'):
            self.handle_api_request()
            return
        
        # Serve static files
        try:
            super().do_GET()
        except Exception as e:
            self.send_error(404, f"File not found: {e}")
    
    def handle_api_request(self):
        """Handle API requests for data."""
        if self.path == '/api/german-ads':
            self.send_german_ads_data()
        elif self.path == '/api/billy-gene-ads':
            self.send_billy_gene_data()
        elif self.path == '/api/stats':
            self.send_stats_data()
        else:
            self.send_error(404, "API endpoint not found")
    
    def send_german_ads_data(self):
        """Send German e-commerce ads data."""
        # Load actual data if available
        try:
            with open('data/scraped_ads_50_100142840161003_20250601_162433.json', 'r') as f:
                ads_data = json.load(f)
        except FileNotFoundError:
            # Fallback to sample data
            ads_data = self.get_sample_german_ads()
        
        self.send_json_response(ads_data)
    
    def send_billy_gene_data(self):
        """Send Billy Gene ads data."""
        try:
            with open('data/billy_gene_ads_data_20250601_165437.json', 'r') as f:
                ads_data = json.load(f)
        except FileNotFoundError:
            ads_data = self.get_sample_billy_gene_ads()
        
        self.send_json_response(ads_data)
    
    def send_stats_data(self):
        """Send overall statistics."""
        stats = {
            "total_ads": 65,
            "active_campaigns": 52,
            "brands_analyzed": 5,
            "total_revenue": "$2.3M",
            "last_updated": datetime.now().isoformat()
        }
        self.send_json_response(stats)
    
    def send_json_response(self, data):
        """Send JSON response."""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode())
    
    def get_sample_german_ads(self):
        """Return sample German ads data."""
        return [
            {
                "ad_id": "sample_1",
                "page_name": "OTTO Online Shop",
                "ad_text": "🛍️ Bis zu 70% Rabatt auf Fashion & Lifestyle! Entdecke die neuesten Trends und spare richtig. Kostenloser Versand ab 20€.",
                "cta_text": "Jetzt kaufen",
                "is_active": True,
                "platforms": ["Facebook", "Instagram"]
            },
            {
                "ad_id": "sample_2", 
                "page_name": "Zalando Deutschland",
                "ad_text": "⚡ Flash Sale! Nur heute: Extra 30% auf bereits reduzierte Artikel. Von Elektronik bis Mode - alles muss raus!",
                "cta_text": "Mehr erfahren",
                "is_active": True,
                "platforms": ["Facebook"]
            }
        ]
    
    def get_sample_billy_gene_ads(self):
        """Return sample Billy Gene ads data."""
        return [
            {
                "ad_id": "billy_1",
                "page_name": "Billy Gene Is A.I. & XR Marketing",
                "ad_text": "🚀 STOP Wasting Money on Ads That Don't Convert! My AI-Powered Marketing System Just Generated $2.3M in 90 Days.",
                "cta_text": "Learn More",
                "is_active": True,
                "platforms": ["Facebook", "Instagram"]
            }
        ]

def start_dashboard_server(port=8080):
    """Start the dashboard server."""
    # Change to the directory containing the dashboard
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    try:
        with socketserver.TCPServer(("", port), DashboardHandler) as httpd:
            print("🚀 Meta Ad Intelligence Dashboard")
            print("=" * 50)
            print(f"🌐 Server running at: http://localhost:{port}")
            print(f"📊 Dashboard URL: http://localhost:{port}")
            print("=" * 50)
            print("📈 Features Available:")
            print("  • Overview analytics")
            print("  • German E-commerce campaign analysis")
            print("  • Billy Gene AI marketing insights") 
            print("  • Comparative analysis")
            print("  • Interactive charts and filters")
            print("=" * 50)
            print("Press Ctrl+C to stop the server")
            
            # Auto-open browser
            try:
                webbrowser.open(f'http://localhost:{port}')
                print("🌍 Opening dashboard in your default browser...")
            except Exception as e:
                print(f"⚠️  Could not auto-open browser: {e}")
                print(f"📱 Please manually open: http://localhost:{port}")
            
            print("\n✅ Dashboard is ready!")
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n\n👋 Shutting down dashboard server...")
        print("Thanks for using Meta Ad Intelligence Dashboard!")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        print(f"💡 Try a different port: python dashboard_server.py --port 8081")

if __name__ == "__main__":
    import sys
    
    port = 8080
    if len(sys.argv) > 1 and sys.argv[1] == '--port' and len(sys.argv) > 2:
        try:
            port = int(sys.argv[2])
        except ValueError:
            print("❌ Invalid port number. Using default port 8080.")
    
    start_dashboard_server(port)