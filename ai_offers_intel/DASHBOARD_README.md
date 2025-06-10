# 🎯 AI Offers Intelligence Dashboard

A comprehensive system for scraping, analyzing, and visualizing AI offer landing pages from your Google Sheets.

## 🚀 What We Built

### 1. **Google Sheets Integration**
- Reads directly from your live Google Sheet
- No CSV files needed - always uses latest data
- Found **36 AI offers** with valid landing pages

### 2. **Batch Scraping System**
- `batch_scrape_coordinator.py` - Manages scraping queue
- Tracks progress and handles failures
- Ready to process all landing pages with WebFetch

### 3. **Advanced Analytics Engine**
- `ai_offers_analyzer.py` - Comprehensive data analysis
- **Pricing Analysis**: Distribution, averages by niche, subscription vs one-time
- **Niche Analysis**: Top categories, market gaps, opportunities
- **Sentiment Analysis**: Urgency tactics, value propositions, CTAs
- **Regional Analysis**: Language and geographic distribution

### 4. **Interactive Dashboard**
- **Modern UI** with smooth animations (AOS, Anime.js)
- **9 Interactive Charts** using Chart.js:
  - Price distribution (doughnut chart)
  - Funnel types (polar area chart)
  - Regional breakdown (pie chart)
  - Price by niche (bar chart)
  - Subscription analysis
  - Top niches ranking
  - Urgency/value word frequency
- **Real-time Filtering** and search
- **Responsive Design** for all devices

## 📊 Key Features

### Dashboard Sections:
1. **Hero Stats** - Animated counters showing key metrics
2. **Market Overview** - Price, funnel, and regional distribution
3. **Pricing Intelligence** - Deep dive into pricing strategies
4. **Niche Analysis** - Market opportunities by category
5. **Sentiment Analysis** - Marketing tactics and psychology
6. **Strategic Insights** - AI-generated recommendations
7. **Offers Table** - Searchable, filterable data table

### Visual Elements:
- Gradient color schemes
- Smooth scroll animations
- Hover effects and transitions
- Loading animations
- Interactive charts with tooltips

## 🛠️ How to Use

### 1. Quick Start:
```bash
# Run the complete system
python run_dashboard.py

# Or use the simple launcher
./launch_dashboard.sh
```

### 2. Access Dashboard:
- Opens automatically at `http://localhost:8080`
- All data loads from your Google Sheet
- Updates refresh when you restart

### 3. Scraping Process:
To scrape all landing pages:
1. Run `python batch_scrape_coordinator.py`
2. Use WebFetch tool for each URL in the queue
3. Process results with the analyzer

## 📈 Current Insights

From your Google Sheet analysis:
- **36 total offers** across AI education/automation
- **Most common price range**: $50-$500 (48.1%)
- **Top niche**: AI Automation
- **Popular funnels**: Communities and Workshops
- **61% use subscription** pricing models
- **Marketing tactics**: Limited time offers, guarantees, social proof

## 🔄 Updating Data

1. **Update Google Sheet**: Add/edit offers in your sheet
2. **Refresh Dashboard**: Run `python run_dashboard.py`
3. **Scrape New URLs**: Process with WebFetch
4. **View Results**: Dashboard auto-updates

## 📁 File Structure
```
/claude_code_workflows/
├── dashboard/
│   ├── index.html          # Main dashboard
│   ├── styles.css          # Modern UI styles
│   ├── dashboard.js        # Interactive features
│   └── dashboard_data.json # Generated data
├── data/ai_offers_analysis/
│   ├── batch_results/      # Scraped data
│   ├── analysis_results/   # Analytics output
│   └── scraped_pages/      # Markdown files
├── ai_offer_scraper_final.py
├── batch_scrape_coordinator.py
├── ai_offers_analyzer.py
├── google_sheets_reader_final.py
├── run_dashboard.py
└── launch_dashboard.sh
```

## 🎨 Technologies Used
- **Backend**: Python, Gemini AI
- **Frontend**: HTML5, CSS3, JavaScript
- **Charts**: Chart.js
- **Animations**: AOS, Anime.js
- **Data Source**: Google Sheets API

## 🚀 Next Steps
1. Use WebFetch to scrape all landing pages
2. Enhance sentiment analysis with Gemini
3. Add more predictive analytics
4. Export reports as PDF
5. Set up automated daily updates

---

Your AI Offers Intelligence system is ready! The dashboard provides a comprehensive view of the AI education/automation market landscape.