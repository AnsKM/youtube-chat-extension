#!/usr/bin/env python3
"""
StepStone Real Scraping - Alternative Approaches
Since StepStone uses heavy JavaScript rendering, we need alternative methods
"""

import json
from datetime import datetime
from pathlib import Path

def save_webfetch_response(response_text, timestamp):
    """Save the WebFetch response for analysis"""
    output_dir = Path(__file__).parent / "data" / f"stepstone_scrape_{timestamp}"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Save raw response
    with open(output_dir / "raw_response.txt", "w", encoding="utf-8") as f:
        f.write(response_text)
    
    print(f"Saved WebFetch response to: {output_dir}")
    return output_dir

def alternative_approaches():
    """Document alternative approaches for StepStone scraping"""
    
    approaches = """
# Alternative Approaches for StepStone Scraping

## Issue: 
StepStone uses client-side JavaScript rendering, making it difficult for WebFetch to extract job data directly.

## Solutions:

### 1. Use StepStone's Mobile Site (Often Simpler)
Try: https://m.stepstone.de/jobs/ai-engineer/in-muenchen

### 2. Use Direct API Endpoints (If Found)
StepStone might have JSON API endpoints that return job data

### 3. Try Different URL Parameters
- https://www.stepstone.de/5/ergebnisliste.html?stf=freeText&ns=1&qs=%5B%7B%22type%22%3A%22text%22%2C%22description%22%3A%22ai%20engineer%22%7D%5D&cityID=108359&radius=30
- https://www.stepstone.de/api/leads/search/

### 4. Use Jobs.de or Monster.de Instead
These sites often have simpler HTML structure:
- https://www.jobs.de/jobs?q=AI+Engineer&l=München
- https://www.monster.de/jobs/suche?q=AI+Engineer&where=München

### 5. Manual Process with Browser Tools
1. Open StepStone in browser
2. Open Developer Tools (F12)
3. Go to Network tab
4. Look for API calls that return JSON job data
5. Use those endpoints directly

### 6. Use Python with Selenium (Local Script)
```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://www.stepstone.de/jobs/ai-engineer/in-muenchen")

# Wait for jobs to load
wait = WebDriverWait(driver, 10)
job_elements = wait.until(EC.presence_of_all_elements_located(
    (By.CSS_SELECTOR, '[data-at="job-item"]')
))

jobs = []
for element in job_elements:
    job = {
        'title': element.find_element(By.CSS_SELECTOR, '[data-at="job-item-title"]').text,
        'company': element.find_element(By.CSS_SELECTOR, '[data-at="job-item-company"]').text,
        # ... extract other fields
    }
    jobs.append(job)
```
"""
    
    return approaches

def try_simpler_sites():
    """Generate URLs for sites that are easier to scrape"""
    
    sites = {
        "Indeed DE": {
            "url": "https://de.indeed.com/jobs?q=AI+Engineer&l=München&fromage=7",
            "note": "Indeed has simpler HTML structure"
        },
        "Jobs.de": {
            "url": "https://www.jobs.de/jobs?q=AI+Engineer&l=München",
            "note": "Jobs.de is typically scraper-friendly"
        },
        "Monster.de": {
            "url": "https://www.monster.de/jobs/suche?q=AI+Engineer&where=München",
            "note": "Monster has good HTML structure"
        },
        "Xing Jobs": {
            "url": "https://www.xing.com/jobs/search?keywords=AI%20Engineer&location=München",
            "note": "Xing's job portal is accessible"
        },
        "Glassdoor DE": {
            "url": "https://www.glassdoor.de/Job/münchen-ai-engineer-jobs-SRCH_IL.0,7_IC3124864_KO8,19.htm",
            "note": "Glassdoor might work with specific selectors"
        }
    }
    
    return sites

def main():
    """Main execution"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    print("🔍 StepStone Scraping Analysis")
    print("=" * 50)
    print("\n❌ Issue: StepStone uses heavy JavaScript rendering")
    print("   WebFetch sees the page shell but not the job data")
    
    print("\n✅ Alternative Solutions:")
    print(alternative_approaches())
    
    print("\n🌐 Try these easier-to-scrape sites instead:")
    sites = try_simpler_sites()
    for site_name, info in sites.items():
        print(f"\n{site_name}:")
        print(f"  URL: {info['url']}")
        print(f"  Note: {info['note']}")
    
    print("\n💡 Recommendation:")
    print("Try: 'Use WebFetch to scrape AI Engineer jobs from https://de.indeed.com/jobs?q=AI+Engineer&l=München'")

if __name__ == "__main__":
    main()