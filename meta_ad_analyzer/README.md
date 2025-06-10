# Meta Ad Library Scraper

A powerful tool to scrape and analyze ads from Meta's (Facebook) Ad Library using Apify actors.

## 🚀 Features

- **Ad Extraction**: Scrape ads from any Facebook page or search query
- **Comprehensive Data**: Get ad text, images, CTAs, impressions, dates, and more
- **Multiple Formats**: Export to JSON, CSV, or Excel
- **Web Interface**: View and analyze scraped ads through a clean dashboard
- **Competitor Analysis**: Track competitor ad strategies
- **Filtering**: Filter by date, engagement, keywords
- **Cost Tracking**: Monitor your Apify usage costs

## 📦 Setup

### 1. Get Apify Token

1. Sign up at [Apify.com](https://apify.com)
2. Go to Settings → Integrations → API tokens
3. Create a new token

### 2. Install Dependencies

```bash
cd meta_ad_scraper
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your Apify token
```

### 4. Run the Scraper

```bash
# Scrape ads from a Facebook page
python scraper.py scrape --page "https://www.facebook.com/Nike"

# Search ads by keyword
python scraper.py search --query "AI tools" --country "US" --limit 100

# Start web interface
python app.py
```

## 💰 Pricing

- **Cost**: $5.00 per 1,000 ads ($0.005/ad)
- **Free Tier**: 1,000 ads/month with Apify free plan
- **Recommended**: $49/month Starter plan for 9,800 ads

## 🎯 Use Cases

1. **Competitor Analysis**: Monitor competitor advertising strategies
2. **Market Research**: Identify trending ad themes and formats
3. **Creative Inspiration**: Collect successful ad examples
4. **Campaign Planning**: Analyze what works in your industry
5. **Compliance Monitoring**: Track political/regulated advertising

## 📊 Data Collected

- Ad ID and status
- Ad text and creative elements
- Images and video thumbnails
- Call-to-action buttons
- Start/end dates
- Impressions (where available)
- Page information
- Publisher platforms (FB, Instagram, etc.)
- Demographics (if available)

## 🔧 Advanced Usage

### API Integration

```python
from meta_ad_scraper import MetaAdScraper

scraper = MetaAdScraper()

# Scrape by page
ads = scraper.scrape_page("https://facebook.com/Nike", max_ads=100)

# Search ads
ads = scraper.search_ads(
    query="fitness apps",
    country="US",
    max_ads=500
)

# Analyze results
scraper.analyze_trends(ads)
```

### Scheduling

Use cron or Windows Task Scheduler:

```bash
# Daily scraping at 9 AM
0 9 * * * cd /path/to/meta_ad_scraper && python scraper.py daily-update
```

## 📈 Analysis Features

- **Trend Detection**: Identify trending ad themes
- **Performance Metrics**: Estimate ad effectiveness
- **Creative Analysis**: Most common CTAs, ad formats
- **Temporal Patterns**: When ads are launched
- **Competitor Comparison**: Side-by-side analysis

## ⚖️ Legal & Ethical Considerations

- Only scrapes publicly available data
- Respects Meta's rate limits
- Complies with Terms of Service
- No private user data collection
- Use responsibly for legitimate business purposes

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📝 License

MIT License - Use freely for commercial projects