# AI Offers Intelligence

## Overview
Comprehensive analysis tool for AI-related business offers. Scrapes landing pages from CSV files or Google Sheets and generates detailed marketing analysis using Google Gemini AI.

## Features
- **CSV Data Processing**: Import offers from CSV files
- **Google Sheets Integration**: Read offers directly from Google Sheets
- **Landing Page Scraping**: Extract content from offer landing pages
- **AI-Powered Analysis**: Generate detailed marketing insights using Gemini
- **Interactive Dashboard**: Visualize offer data and analysis results
- **Batch Processing**: Handle multiple offers efficiently

## Project Structure
```
ai_offers_intel/
├── main.py                    # Main entry point
├── src/
│   ├── offer_scraper_legacy.py    # Legacy CSV-based scraper
│   ├── google_sheets_scraper.py   # Google Sheets integration
│   └── __init__.py
├── data/
│   └── ai_offers_data.csv      # Offer data
├── dashboard/                  # Web dashboard files
└── README.md
```

## Usage

### Prerequisites
```bash
# Set your Google API key
export GOOGLE_API_KEY="your-gemini-api-key"
```

### Basic Usage
```bash
# Run main interface
python main.py

# Process CSV data directly
python -c "import asyncio; from src.offer_scraper_legacy import AIOfferScraper; asyncio.run(AIOfferScraper().process_all_offers('data/ai_offers_data.csv', limit=3))"

# Use Google Sheets integration
python -c "from src.google_sheets_scraper import AIOfferScraperGoogleSheets; scraper = AIOfferScraperGoogleSheets(); print('Ready for Google Sheets processing')"
```

### Using Core Modules
```python
from core.ai import GeminiClient
from core.utils import WebHelpers, DataHelpers

# Initialize AI client
client = GeminiClient()

# Use web helpers for scraping
web = WebHelpers()

# Process data
data = DataHelpers()
```

## Data Sources
- **CSV**: Local file with offer data including company names, landing pages, pricing
- **Google Sheets**: Public sheets with the same data structure
- **Web Scraping**: Live content extraction from landing pages

## Output
- **Scraped Content**: Markdown files with extracted landing page content
- **Marketing Analysis**: Detailed AI-generated marketing insights
- **Dashboard Data**: JSON files for web visualization
- **Summary Reports**: Processing results and statistics

## Configuration
The project uses the core configuration system. API keys and settings are managed through environment variables and the global config system.
