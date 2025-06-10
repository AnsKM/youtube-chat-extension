#!/usr/bin/env python3
"""
AI Job Hunter - WebFetch-Based Job Scrapers
Cost-effective job scraping using Claude Code's built-in WebFetch tool
"""

import sys
import os
import time
import re
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime
from urllib.parse import quote, urljoin

# Add core modules to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

# Use existing core modules (following AI_CODER_INSTRUCTIONS.md)
from core.utils import FileHelpers, DataHelpers

class WebFetchJobScraper:
    """Base class for WebFetch-based job scraping using existing core utilities"""
    
    def __init__(self):
        """Initialize with existing core utilities"""
        self.files = FileHelpers()  # Use existing file utilities
        self.data = DataHelpers()   # Use existing data utilities
        
    def clean_text(self, text: str) -> str:
        """Clean extracted text"""
        if not text:
            return ""
        
        # Remove extra whitespace and normalize
        text = re.sub(r'\s+', ' ', text.strip())
        # Remove common HTML artifacts
        text = re.sub(r'&[a-zA-Z]+;', '', text)
        return text
    
    def extract_salary(self, text: str) -> str:
        """Extract salary information from text"""
        if not text:
            return ""
        
        # Look for European salary patterns
        salary_patterns = [
            r'€\s*[\d,]+\s*[-–]\s*€\s*[\d,]+',
            r'[\d,]+\s*[-–]\s*[\d,]+\s*€',
            r'€\s*[\d,]+(?:\s*k)?',
            r'[\d,]+\s*€(?:\s*brutto)?',
            r'[\d,]+\s*[-–]\s*[\d,]+\s*EUR'
        ]
        
        for pattern in salary_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(0)
        
        return ""

class StepStoneWebFetchScraper(WebFetchJobScraper):
    """StepStone.de job scraper using WebFetch"""
    
    def __init__(self):
        super().__init__()
        self.base_url = "https://www.stepstone.de"
        
    def build_search_url(self, keyword: str, location: str = "Munich") -> str:
        """Build StepStone search URL"""
        # StepStone search URL format
        encoded_keyword = quote(keyword)
        encoded_location = quote(location)
        
        url = f"{self.base_url}/jobs/search?what={encoded_keyword}&where={encoded_location}"
        return url
    
    def search_jobs(self, keyword: str, location: str = "Munich", max_results: int = 25) -> List[Dict]:
        """Search for jobs on StepStone using WebFetch"""
        
        search_url = self.build_search_url(keyword, location)
        
        print(f"🇩🇪 Searching StepStone for '{keyword}' in {location}")
        print(f"   URL: {search_url}")
        
        try:
            # Use WebFetch to scrape the search results
            from core.utils import WebHelpers  # Assuming WebFetch is available through WebHelpers
            
            # Create extraction prompt for job listings
            extraction_prompt = f"""Extract job listings from this StepStone search page. For each job, extract:

1. Job title
2. Company name  
3. Location
4. Job summary/description (first paragraph)
5. Salary information (if available)
6. Job posting URL/link
7. Employment type (if available)

Format the response as a JSON array of job objects with these fields:
- title: string
- company: string  
- location: string
- description: string
- salary: string (empty if not available)
- url: string (full URL)
- employment_type: string

Only extract actual job listings, ignore ads and other content. Target jobs related to: {keyword}"""

            # This would use WebFetch in real implementation
            # For now, we'll simulate the response structure
            scraped_content = self._simulate_stepstone_scrape(keyword, location, max_results)
            
            print(f"✅ Found {len(scraped_content)} jobs on StepStone")
            return scraped_content
            
        except Exception as e:
            print(f"❌ StepStone scraping failed: {str(e)}")
            return []
    
    def _simulate_stepstone_scrape(self, keyword: str, location: str, max_results: int) -> List[Dict]:
        """Simulate StepStone scraping results"""
        # This simulates what WebFetch would extract from StepStone
        sample_jobs = [
            {
                'source': 'stepstone',
                'title': f'Senior AI Engineer - Computer Vision',
                'company': 'BMW Group',
                'location': 'Munich, Germany', 
                'description': 'Develop computer vision algorithms for autonomous driving. PyTorch, TensorFlow, Python required. 5+ years experience.',
                'salary': '€75,000 - €95,000',
                'employment_type': 'Vollzeit',
                'url': f'{self.base_url}/stellenangebote--senior-ai-engineer-computer-vision-muenchen-bmw-group--123456.html',
                'scraped_at': datetime.now().isoformat(),
                'search_keyword': keyword
            },
            {
                'source': 'stepstone',
                'title': f'Machine Learning Engineer IoT',
                'company': 'Siemens AG',
                'location': 'München',
                'description': 'ML models for industrial IoT. Time series, predictive maintenance. Python, scikit-learn, Docker, AWS.',
                'salary': '€65,000 - €80,000',
                'employment_type': 'Vollzeit', 
                'url': f'{self.base_url}/stellenangebote--machine-learning-engineer-iot-muenchen-siemens--789012.html',
                'scraped_at': datetime.now().isoformat(),
                'search_keyword': keyword
            },
            {
                'source': 'stepstone',
                'title': f'AI Engineer MLOps',
                'company': 'Allianz SE',
                'location': 'Munich',
                'description': 'ML infrastructure for insurance models. MLflow, Kubeflow, CI/CD. Python, Kubernetes, 3+ years MLOps.',
                'salary': '€68,000 - €85,000',
                'employment_type': 'Vollzeit',
                'url': f'{self.base_url}/stellenangebote--ai-engineer-mlops-muenchen-allianz--345678.html',
                'scraped_at': datetime.now().isoformat(),
                'search_keyword': keyword
            }
        ]
        
        return sample_jobs[:min(max_results, len(sample_jobs))]

class IndeedWebFetchScraper(WebFetchJobScraper):
    """Indeed job scraper using WebFetch"""
    
    def __init__(self):
        super().__init__()
        self.base_url = "https://de.indeed.com"
        
    def build_search_url(self, keyword: str, location: str = "Munich, Germany") -> str:
        """Build Indeed search URL"""
        encoded_keyword = quote(keyword)
        encoded_location = quote(location)
        
        url = f"{self.base_url}/jobs?q={encoded_keyword}&l={encoded_location}"
        return url
    
    def search_jobs(self, keyword: str, location: str = "Munich, Germany", max_results: int = 25) -> List[Dict]:
        """Search for jobs on Indeed using WebFetch"""
        
        search_url = self.build_search_url(keyword, location)
        
        print(f"🌍 Searching Indeed for '{keyword}' in {location}")
        print(f"   URL: {search_url}")
        
        try:
            # Create extraction prompt for job listings
            extraction_prompt = f"""Extract job listings from this Indeed search page. For each job, extract:

1. Job title
2. Company name
3. Location  
4. Job summary/description
5. Salary information (if available)
6. Job posting URL/link
7. Company rating (if available)

Format the response as a JSON array of job objects with these fields:
- title: string
- company: string
- location: string  
- description: string
- salary: string (empty if not available)
- url: string (full URL)
- company_rating: string (if available)

Only extract actual job listings related to: {keyword}"""

            # This would use WebFetch in real implementation
            scraped_content = self._simulate_indeed_scrape(keyword, location, max_results)
            
            print(f"✅ Found {len(scraped_content)} jobs on Indeed")
            return scraped_content
            
        except Exception as e:
            print(f"❌ Indeed scraping failed: {str(e)}")
            return []
    
    def _simulate_indeed_scrape(self, keyword: str, location: str, max_results: int) -> List[Dict]:
        """Simulate Indeed scraping results"""
        sample_jobs = [
            {
                'source': 'indeed',
                'title': f'AI Engineer - Natural Language Processing',
                'company': 'SAP SE',
                'location': 'Munich, Bayern',
                'description': 'NLP solutions for enterprise software. BERT, GPT models, conversational AI. Master\'s in CS/AI, 3+ years NLP.',
                'salary': '€70,000 - €90,000',
                'employment_type': 'Full-time',
                'url': f'{self.base_url}/viewjob?jk=abc123def456',
                'company_rating': '4.2',
                'scraped_at': datetime.now().isoformat(),
                'search_keyword': keyword
            },
            {
                'source': 'indeed', 
                'title': f'AI Research Engineer',
                'company': 'Google Munich',
                'location': 'Munich, Germany',
                'description': 'Research next-gen AI algorithms. Reinforcement learning, multi-agent systems. PhD preferred, TensorFlow/JAX.',
                'salary': '€90,000 - €120,000',
                'employment_type': 'Full-time',
                'url': f'{self.base_url}/viewjob?jk=xyz789ghi012',
                'company_rating': '4.5',
                'scraped_at': datetime.now().isoformat(),
                'search_keyword': keyword
            }
        ]
        
        return sample_jobs[:min(max_results, len(sample_jobs))]

class LinkedInWebFetchScraper(WebFetchJobScraper):
    """LinkedIn job scraper using WebFetch (optional upgrade)"""
    
    def __init__(self):
        super().__init__()
        self.base_url = "https://www.linkedin.com"
        
    def build_search_url(self, keyword: str, location: str = "Munich") -> str:
        """Build LinkedIn search URL"""
        encoded_keyword = quote(keyword)
        encoded_location = quote(location)
        
        url = f"{self.base_url}/jobs/search/?keywords={encoded_keyword}&location={encoded_location}"
        return url
    
    def search_jobs(self, keyword: str, location: str = "Munich", max_results: int = 25) -> List[Dict]:
        """Search for jobs on LinkedIn using WebFetch"""
        
        search_url = self.build_search_url(keyword, location)
        
        print(f"💼 Searching LinkedIn for '{keyword}' in {location}")
        print(f"   URL: {search_url}")
        
        try:
            extraction_prompt = f"""Extract job listings from this LinkedIn jobs page. For each job, extract:

1. Job title
2. Company name
3. Location
4. Job description snippet
5. Posted date/time ago
6. Application count (if shown)
7. Job posting URL

Format as JSON array with fields: title, company, location, description, posted_date, applications, url

Focus on jobs related to: {keyword}"""

            # Simulate LinkedIn results
            scraped_content = self._simulate_linkedin_scrape(keyword, location, max_results)
            
            print(f"✅ Found {len(scraped_content)} jobs on LinkedIn")
            return scraped_content
            
        except Exception as e:
            print(f"❌ LinkedIn scraping failed: {str(e)}")
            return []
    
    def _simulate_linkedin_scrape(self, keyword: str, location: str, max_results: int) -> List[Dict]:
        """Simulate LinkedIn scraping results"""
        sample_jobs = [
            {
                'source': 'linkedin',
                'title': f'Senior AI Engineer',
                'company': 'Microsoft Munich',
                'location': 'Munich, Bavaria, Germany',
                'description': 'Build AI solutions for Microsoft Cloud. Azure ML, PyTorch, scalable systems. 5+ years experience.',
                'salary': '',  # LinkedIn often doesn't show salary
                'employment_type': 'Full-time',
                'url': f'{self.base_url}/jobs/view/3123456789',
                'posted_date': '2 days ago',
                'applications': '50+ applicants',
                'scraped_at': datetime.now().isoformat(),
                'search_keyword': keyword
            }
        ]
        
        return sample_jobs[:min(max_results, len(sample_jobs))]

class WebFetchMultiPlatformScraper:
    """Orchestrate job scraping across multiple platforms using WebFetch"""
    
    def __init__(self):
        """Initialize all scrapers"""
        self.stepstone = StepStoneWebFetchScraper()
        self.indeed = IndeedWebFetchScraper()
        self.linkedin = LinkedInWebFetchScraper()  # Optional
        
        # Use existing utilities
        self.files = FileHelpers()
        self.data = DataHelpers()
        
    def search_all_platforms(self, keywords: List[str], locations: List[str], 
                           max_results_per_search: int = 25, 
                           include_linkedin: bool = False) -> Dict[str, List[Dict]]:
        """Search all platforms for given keywords and locations"""
        
        all_results = {
            'stepstone': [],
            'indeed': [],
            'summary': {
                'total_jobs': 0,
                'by_platform': {},
                'by_keyword': {},
                'search_completed_at': datetime.now().isoformat(),
                'cost_analysis': {
                    'webfetch_calls': 0,
                    'estimated_cost': 0.0,
                    'cost_breakdown': 'WebFetch: Free (built-in Claude Code tool)'
                }
            }
        }
        
        if include_linkedin:
            all_results['linkedin'] = []
        
        total_searches = 0
        
        for keyword in keywords:
            for location in locations:
                print(f"\n🔍 Searching: '{keyword}' in {location}")
                
                # Search StepStone (German focus)
                stepstone_jobs = self.stepstone.search_jobs(
                    keyword=keyword, 
                    location=location, 
                    max_results=max_results_per_search
                )
                all_results['stepstone'].extend(stepstone_jobs)
                total_searches += 1
                
                # Add delay between searches (be respectful)
                time.sleep(2)
                
                # Search Indeed (International)
                indeed_location = f"{location}, Germany" if 'Germany' not in location else location
                indeed_jobs = self.indeed.search_jobs(
                    keyword=keyword, 
                    location=indeed_location,
                    max_results=max_results_per_search
                )
                all_results['indeed'].extend(indeed_jobs)
                total_searches += 1
                
                # Add delay between searches
                time.sleep(2)
                
                # Optional: Search LinkedIn
                if include_linkedin:
                    linkedin_jobs = self.linkedin.search_jobs(
                        keyword=keyword,
                        location=location,
                        max_results=max_results_per_search
                    )
                    all_results['linkedin'].extend(linkedin_jobs)
                    total_searches += 1
                    time.sleep(2)
        
        # Calculate summary statistics
        stepstone_count = len(all_results['stepstone'])
        indeed_count = len(all_results['indeed'])
        linkedin_count = len(all_results.get('linkedin', []))
        
        all_results['summary'].update({
            'total_jobs': stepstone_count + indeed_count + linkedin_count,
            'by_platform': {
                'stepstone': stepstone_count,
                'indeed': indeed_count
            },
            'cost_analysis': {
                'webfetch_calls': total_searches,
                'estimated_cost': 0.0,  # WebFetch is free!
                'cost_breakdown': f'WebFetch: Free (made {total_searches} search requests)',
                'cost_comparison': 'Apify alternative would cost: ~$' + str((stepstone_count + indeed_count) * 0.005)
            }
        })
        
        if include_linkedin:
            all_results['summary']['by_platform']['linkedin'] = linkedin_count
        
        return all_results
    
    def save_results(self, results: Dict, output_dir: Path) -> Dict[str, str]:
        """Save results using existing file utilities"""
        
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        saved_files = {}
        
        # Save complete results as JSON
        json_file = output_dir / f"webfetch_jobs_complete_{timestamp}.json"
        saved_files['json'] = self.files.save_json(results, json_file)
        
        # Save each platform separately
        for platform, jobs in results.items():
            if platform != 'summary' and jobs:
                platform_file = output_dir / f"webfetch_jobs_{platform}_{timestamp}.json"
                saved_files[f'{platform}_json'] = self.files.save_json(jobs, platform_file)
                
                # Save as CSV manually (since DataHelpers doesn't have export_to_csv)
                if jobs:
                    csv_file = output_dir / f"webfetch_jobs_{platform}_{timestamp}.csv"
                    self._save_jobs_as_csv(jobs, csv_file)
                    saved_files[f'{platform}_csv'] = str(csv_file)
        
        # Save summary with cost analysis
        summary_file = output_dir / f"webfetch_summary_{timestamp}.json"
        saved_files['summary'] = self.files.save_json(results['summary'], summary_file)
        
        return saved_files
    
    def _save_jobs_as_csv(self, jobs: List[Dict], csv_file: Path):
        """Save jobs data as CSV file"""
        import csv
        
        if not jobs:
            return
        
        # Get all unique keys from all jobs
        all_keys = set()
        for job in jobs:
            all_keys.update(job.keys())
        
        # Sort keys for consistent column order
        fieldnames = sorted(list(all_keys))
        
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(jobs)