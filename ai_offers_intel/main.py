#!/usr/bin/env python3
"""
AI Offers Intelligence - Main Entry Point
Analyze AI offers from CSV or Google Sheets using the new modular architecture
"""

import sys
import os
from pathlib import Path

# Add core modules to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from core.ai import GeminiClient
from core.utils import FileHelpers, WebHelpers, DataHelpers
from src.google_sheets_scraper import AIOfferScraperGoogleSheets
from src.offer_scraper_legacy import AIOfferScraper
import asyncio

def main():
    """Main execution"""
    print("🎯 AI Offers Intelligence - Modular Architecture")
    print("=" * 50)
    
    # Check for API key
    if not os.getenv('GOOGLE_API_KEY'):
        print("❌ GOOGLE_API_KEY environment variable not set")
        print("Please set it with: export GOOGLE_API_KEY='your-api-key'")
        return
    
    # Option 1: Process from CSV
    csv_path = Path(__file__).parent / "data" / "ai_offers_data.csv"
    if csv_path.exists():
        print(f"📊 Found CSV data: {csv_path}")
        print("   Run: python -c \"import asyncio; from src.offer_scraper_legacy import AIOfferScraper; asyncio.run(AIOfferScraper().process_all_offers('data/ai_offers_data.csv', limit=3))\"")
    
    # Option 2: Process from Google Sheets
    print("\n📋 Google Sheets Integration Available")
    print("   Use: src.google_sheets_scraper.AIOfferScraperGoogleSheets")
    
    # Option 3: Use new core modules
    print("\n🚀 Core Modules Available:")
    print("   - core.ai.GeminiClient for AI processing")
    print("   - core.utils.WebHelpers for web scraping")
    print("   - core.utils.DataHelpers for data analysis")
    
    print("\n✅ Project ready for use with new modular architecture!")

if __name__ == "__main__":
    main()