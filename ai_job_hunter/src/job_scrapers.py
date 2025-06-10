#!/usr/bin/env python3
"""
AI Job Hunter - Multi-Platform Job Scrapers
Uses existing core modules and Apify actors for job scraping
"""

import sys
import os
import time
import asyncio
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime

# Add core modules to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

# Use existing core modules (following AI_CODER_INSTRUCTIONS.md)
from core.utils import FileHelpers, DataHelpers
import requests
import json

class ApifyJobScraper:
    """Base class for Apify-based job scraping using existing core utilities"""
    
    def __init__(self, apify_token: str = None):
        """Initialize with Apify token from environment or parameter"""
        self.apify_token = apify_token or os.getenv('APIFY_TOKEN')
        if not self.apify_token:
            raise ValueError("APIFY_TOKEN environment variable required")
        
        self.base_url = "https://api.apify.com/v2"
        self.files = FileHelpers()  # Use existing file utilities
        self.data = DataHelpers()   # Use existing data utilities
        
    def run_actor(self, actor_id: str, input_data: Dict, wait_for_finish: bool = True) -> Dict:
        """Run an Apify actor and return results"""
        
        # Start actor run
        run_url = f"{self.base_url}/acts/{actor_id}/runs"
        headers = {
            'Authorization': f'Bearer {self.apify_token}',
            'Content-Type': 'application/json'
        }
        
        response = requests.post(run_url, headers=headers, json=input_data)
        response.raise_for_status()
        
        run_data = response.json()
        run_id = run_data['data']['id']
        
        if not wait_for_finish:
            return {'run_id': run_id, 'status': 'RUNNING'}
        
        # Wait for completion
        status_url = f"{self.base_url}/actor-runs/{run_id}"
        
        while True:
            status_response = requests.get(status_url, headers={'Authorization': f'Bearer {self.apify_token}'})
            status_response.raise_for_status()
            
            status_data = status_response.json()
            status = status_data['data']['status']
            
            if status in ['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT']:
                break
                
            print(f"⏳ Actor {actor_id} status: {status}")
            time.sleep(10)
        
        if status != 'SUCCEEDED':
            raise Exception(f"Actor run failed with status: {status}")
        
        # Get results
        dataset_id = status_data['data']['defaultDatasetId']
        results_url = f"{self.base_url}/datasets/{dataset_id}/items"
        
        results_response = requests.get(results_url, headers={'Authorization': f'Bearer {self.apify_token}'})
        results_response.raise_for_status()
        
        return {
            'run_id': run_id,
            'status': status,
            'results': results_response.json()
        }

class StepStoneJobScraper(ApifyJobScraper):
    """StepStone.de job scraper for German market"""
    
    def __init__(self, apify_token: str = None):
        super().__init__(apify_token)
        self.actor_id = 'jupri/stepstone-scraper'
        
    def search_jobs(self, keyword: str, location: str = "Munich", max_results: int = 100) -> List[Dict]:
        """Search for jobs on StepStone"""
        
        input_data = {
            "keyword": keyword,
            "location": location,
            "maxResults": max_results
        }
        
        print(f"🇩🇪 Searching StepStone for '{keyword}' in {location}")
        
        try:
            result = self.run_actor(self.actor_id, input_data)
            jobs = result.get('results', [])
            
            # Process and clean data using existing utilities
            processed_jobs = []
            for job in jobs:
                processed_job = {
                    'source': 'stepstone',
                    'title': job.get('title', ''),
                    'company': job.get('company', ''),
                    'location': job.get('location', location),
                    'description': job.get('description', ''),
                    'salary': job.get('salary', ''),
                    'employment_type': job.get('employmentType', ''),
                    'url': job.get('url', ''),
                    'scraped_at': datetime.now().isoformat(),
                    'search_keyword': keyword
                }
                processed_jobs.append(processed_job)
            
            print(f"✅ Found {len(processed_jobs)} jobs on StepStone")
            return processed_jobs
            
        except Exception as e:
            print(f"❌ StepStone scraping failed: {str(e)}")
            return []

class IndeedJobScraper(ApifyJobScraper):
    """Indeed job scraper for international market"""
    
    def __init__(self, apify_token: str = None):
        super().__init__(apify_token)
        self.actor_id = 'misceres/indeed-scraper'
        
    def search_jobs(self, keyword: str, location: str = "Munich, Germany", max_results: int = 100) -> List[Dict]:
        """Search for jobs on Indeed"""
        
        input_data = {
            "position": keyword,
            "location": location,
            "maxItems": max_results,
            "parseCompanyDetails": True
        }
        
        print(f"🌍 Searching Indeed for '{keyword}' in {location}")
        
        try:
            result = self.run_actor(self.actor_id, input_data)
            jobs = result.get('results', [])
            
            # Process and clean data using existing utilities
            processed_jobs = []
            for job in jobs:
                processed_job = {
                    'source': 'indeed',
                    'title': job.get('positionName', ''),
                    'company': job.get('company', ''),
                    'location': job.get('location', location),
                    'description': job.get('description', ''),
                    'salary': job.get('salary', ''),
                    'employment_type': job.get('jobType', ''),
                    'url': job.get('url', ''),
                    'company_rating': job.get('rating', ''),
                    'scraped_at': datetime.now().isoformat(),
                    'search_keyword': keyword
                }
                processed_jobs.append(processed_job)
            
            print(f"✅ Found {len(processed_jobs)} jobs on Indeed")
            return processed_jobs
            
        except Exception as e:
            print(f"❌ Indeed scraping failed: {str(e)}")
            return []

class MultiPlatformJobScraper:
    """Orchestrate job scraping across multiple platforms"""
    
    def __init__(self, apify_token: str = None):
        self.apify_token = apify_token or os.getenv('APIFY_TOKEN')
        
        # Initialize scrapers
        self.stepstone = StepStoneJobScraper(self.apify_token)
        self.indeed = IndeedJobScraper(self.apify_token)
        
        # Use existing utilities
        self.files = FileHelpers()
        self.data = DataHelpers()
        
    def search_all_platforms(self, keywords: List[str], locations: List[str], 
                           max_results_per_search: int = 50) -> Dict[str, List[Dict]]:
        """Search all platforms for given keywords and locations"""
        
        all_results = {
            'stepstone': [],
            'indeed': [],
            'summary': {
                'total_jobs': 0,
                'by_platform': {},
                'by_keyword': {},
                'search_completed_at': datetime.now().isoformat()
            }
        }
        
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
                
                # Add delay between searches
                time.sleep(2)
                
                # Search Indeed (International)
                indeed_jobs = self.indeed.search_jobs(
                    keyword=keyword, 
                    location=f"{location}, Germany" if 'Germany' not in location else location,
                    max_results=max_results_per_search
                )
                all_results['indeed'].extend(indeed_jobs)
                
                # Add delay between searches
                time.sleep(2)
        
        # Calculate summary statistics using existing data utilities
        stepstone_count = len(all_results['stepstone'])
        indeed_count = len(all_results['indeed'])
        
        all_results['summary'].update({
            'total_jobs': stepstone_count + indeed_count,
            'by_platform': {
                'stepstone': stepstone_count,
                'indeed': indeed_count
            }
        })
        
        return all_results
    
    def save_results(self, results: Dict, output_dir: Path) -> Dict[str, str]:
        """Save results using existing file utilities"""
        
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        saved_files = {}
        
        # Save complete results as JSON
        json_file = output_dir / f"ai_jobs_complete_{timestamp}.json"
        saved_files['json'] = self.files.save_json(results, json_file)
        
        # Save each platform separately
        for platform, jobs in results.items():
            if platform != 'summary' and jobs:
                platform_file = output_dir / f"ai_jobs_{platform}_{timestamp}.json"
                saved_files[f'{platform}_json'] = self.files.save_json(jobs, platform_file)
                
                # Save as CSV using existing utilities
                if jobs:
                    csv_file = output_dir / f"ai_jobs_{platform}_{timestamp}.csv"
                    saved_files[f'{platform}_csv'] = self.data.export_to_csv(jobs, csv_file)
        
        # Save summary
        summary_file = output_dir / f"search_summary_{timestamp}.json"
        saved_files['summary'] = self.files.save_json(results['summary'], summary_file)
        
        return saved_files