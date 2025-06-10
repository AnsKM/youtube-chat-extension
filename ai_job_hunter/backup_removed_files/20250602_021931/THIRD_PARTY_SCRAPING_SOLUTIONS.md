# 🔧 Third-Party Job Scraping Solutions & APIs

## 1. **Apify** (Most Popular for Job Scraping)
**Website**: https://apify.com

### Available Job Scrapers:
- **LinkedIn Jobs Scraper**: ~$5-10/1000 jobs
- **Indeed Scraper**: ~$3-5/1000 jobs
- **Glassdoor Scraper**: ~$5/1000 jobs
- **StepStone Scraper**: Custom actor available

### Pricing:
- Free tier: $5 credit/month (~500-1000 jobs)
- Personal: $49/month
- Team: $149/month

### Example Usage:
```python
from apify_client import ApifyClient

client = ApifyClient("YOUR_API_TOKEN")
run = client.actor("pocesar/indeed-scraper").call(
    run_input={
        "queries": "AI Engineer",
        "locations": ["Munich, Germany"],
        "maxItems": 50
    }
)

jobs = client.dataset(run["defaultDatasetId"]).list_items().items
```

## 2. **ScrapingBee** (Web Scraping API)
**Website**: https://www.scrapingbee.com

### Features:
- Handles JavaScript rendering
- Rotates proxies automatically
- Works with any job site

### Pricing:
- Free: 1000 API credits
- Freelance: $49/month (150k credits)
- Business: $149/month (1M credits)

### Example:
```python
from scrapingbee import ScrapingBeeClient

client = ScrapingBeeClient(api_key='YOUR_API_KEY')
response = client.get(
    'https://www.stepstone.de/jobs/ai-engineer/in-muenchen',
    params={
        'wait_for': '.job-element',  # Wait for jobs to load
        'extract_rules': {
            'jobs': {
                'selector': '.job-element',
                'type': 'list',
                'output': {
                    'title': '.job-element__body__title',
                    'company': '.job-element__body__company',
                    'location': '.job-element__body__location',
                    'url': {'selector': 'a', 'output': '@href'}
                }
            }
        }
    }
)
```

## 3. **Bright Data (formerly Luminati)**
**Website**: https://brightdata.com

### Features:
- Pre-collected job datasets
- Real-time job scraping
- Ready-made job site collectors

### Pricing:
- Dataset: $500+ for job datasets
- Pay as you go: Starting $500/month
- Enterprise solutions available

## 4. **SerpApi** (Search Engine Results)
**Website**: https://serpapi.com

### Features:
- Google Jobs API
- Indeed integration
- Real-time results

### Pricing:
- Free: 100 searches/month
- Business: $50/month (5000 searches)

### Example:
```python
from serpapi import GoogleSearch

params = {
    "api_key": "YOUR_API_KEY",
    "engine": "google_jobs",
    "q": "AI Engineer Munich",
    "hl": "en",
    "gl": "de"
}

search = GoogleSearch(params)
results = search.get_dict()
jobs = results["jobs_results"]
```

## 5. **Scrapy Cloud** (by Scrapinghub)
**Website**: https://www.zyte.com/scrapy-cloud/

### Features:
- Deploy custom Scrapy spiders
- Scheduled scraping
- Data export APIs

### Pricing:
- Free: 1 concurrent crawl
- Professional: $9/month
- Enterprise: Custom pricing

## 6. **Phantombuster**
**Website**: https://phantombuster.com

### Features:
- LinkedIn Jobs Scraper
- Indeed Scraper
- No coding required
- Chrome extension

### Pricing:
- Free: 10 minutes execution/day
- Starter: $56/month
- Pro: $128/month

### Example Setup:
1. Install Phantombuster
2. Choose "LinkedIn Jobs Scraper"
3. Enter search URL
4. Set parameters
5. Export to JSON/CSV

## 7. **Octoparse** (Visual Scraper)
**Website**: https://www.octoparse.com

### Features:
- Point-and-click interface
- Pre-built job templates
- Cloud extraction

### Pricing:
- Free: Limited features
- Standard: $89/month
- Professional: $249/month

## 8. **Import.io**
**Website**: https://www.import.io

### Features:
- Enterprise-focused
- Custom job extractors
- API access

### Pricing:
- Custom quotes only
- Starting ~$500/month

## 9. **RapidAPI Job APIs**
**Website**: https://rapidapi.com/category/jobs

### Available APIs:
- **JSearch**: Real-time job search
- **Jobicy**: Remote jobs API
- **RemoteOK**: Remote job listings
- **Adzuna**: Job search API

### Example - JSearch:
```python
import requests

url = "https://jsearch.p.rapidapi.com/search"
headers = {
    "X-RapidAPI-Key": "YOUR_KEY",
    "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
}
params = {
    "query": "AI Engineer in Munich",
    "num_pages": "3"
}

response = requests.get(url, headers=headers, params=params)
jobs = response.json()
```

## 10. **Direct Job Site APIs**

### Sites with Official APIs:
- **Adzuna**: Free API with good coverage
- **The Muse**: Free job API
- **Remotive**: Remote jobs API
- **GitHub Jobs**: Tech jobs API (discontinued)
- **Stack Overflow Jobs**: Developer jobs

### Adzuna Example:
```python
import requests

app_id = "YOUR_APP_ID"
app_key = "YOUR_APP_KEY"

url = f"https://api.adzuna.com/v1/api/jobs/de/search/1"
params = {
    "app_id": app_id,
    "app_key": app_key,
    "what": "AI Engineer",
    "where": "Munich",
    "results_per_page": 50
}

response = requests.get(url, params=params)
jobs = response.json()["results"]
```

## 🎯 Recommended Solutions for Your Use Case

### For StepStone & Indeed:
1. **Apify** - Has ready-made scrapers for both
2. **ScrapingBee** - Can handle JavaScript-heavy sites
3. **Bright Data** - Most reliable but expensive

### For Quick Setup:
1. **Phantombuster** - No coding, visual interface
2. **Octoparse** - Point and click scraping
3. **Apify** - Ready-made actors

### For Budget-Conscious:
1. **SerpApi** - Good free tier
2. **Adzuna API** - Completely free
3. **ScrapingBee** - Decent free credits

### For Scale:
1. **Bright Data** - Most reliable
2. **Scrapy Cloud** - For custom solutions
3. **Import.io** - Enterprise grade

## 💡 Implementation Tips

1. **Start with Free Tiers**: Most services offer free credits
2. **Use Multiple Sources**: Combine 2-3 APIs for better coverage
3. **Cache Results**: Save API calls by storing data locally
4. **Respect Rate Limits**: Don't overwhelm the APIs
5. **Monitor Costs**: Set up usage alerts

## 🚀 Quick Start Recommendation

For immediate results with minimal setup:

1. Sign up for **Apify** (free $5 credit)
2. Use their Indeed or StepStone scraper
3. Export to JSON
4. Import to your dashboard

This will give you 500-1000 real jobs to start with!