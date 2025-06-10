#!/usr/bin/env python3
"""
LinkedIn Profile Scraper for Personal Branding Analysis
Uses existing Apify integration to extract comprehensive profile data
"""

import sys
import os
import time
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any

# Try to load .env file if python-dotenv is available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # .env won't be loaded but environment variables can still be set manually

# Add core modules to path (following AI_CODER_INSTRUCTIONS.md)
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

# Use existing core modules
from core.ai import GeminiClient
from core.utils import FileHelpers, DataHelpers
import requests
import json

class LinkedInProfileScraper:
    """LinkedIn profile scraper using Apify actors"""
    
    def __init__(self, apify_token: str = None):
        """Initialize with Apify token from environment or parameter"""
        self.apify_token = apify_token or os.getenv('APIFY_TOKEN')
        if not self.apify_token:
            raise ValueError("APIFY_TOKEN environment variable required")
        
        self.base_url = "https://api.apify.com/v2"
        self.files = FileHelpers()  # Use existing file utilities
        self.data = DataHelpers()   # Use existing data utilities
        
        # LinkedIn profile scraper actor ID
        self.actor_id = 'dev_fusion/Linkedin-Profile-Scraper'
        
    def run_actor(self, actor_id: str, input_data: Dict, wait_for_finish: bool = True) -> Dict:
        """Run an Apify actor and return results"""
        
        print(f"🚀 Starting Apify actor: {actor_id}")
        
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
        
        print(f"📋 Actor run started with ID: {run_id}")
        
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
                
            print(f"⏳ Actor status: {status}")
            time.sleep(10)
        
        if status != 'SUCCEEDED':
            raise Exception(f"Actor run failed with status: {status}")
        
        print(f"✅ Actor completed successfully")
        
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
    
    def scrape_profile(self, profile_url: str) -> Dict:
        """Scrape a LinkedIn profile for comprehensive analysis"""
        
        print(f"🔍 Scraping LinkedIn profile: {profile_url}")
        print("=" * 60)
        
        # Configure input for dev_fusion/Linkedin-Profile-Scraper
        input_data = {
            "urls": [profile_url],
            "maxDelay": 5,
            "minDelay": 2,
            "proxy": {
                "useApifyProxy": True,
                "apifyProxyGroups": ["RESIDENTIAL"]
            }
        }
        
        try:
            result = self.run_actor(self.actor_id, input_data)
            profiles = result.get('results', [])
            
            if not profiles:
                raise Exception("No profile data extracted")
            
            profile_data = profiles[0]  # Get first (and should be only) profile
            
            # Process and enhance the scraped data
            processed_profile = self._process_profile_data(profile_data)
            
            print("✅ Profile scraping completed successfully!")
            return processed_profile
            
        except Exception as e:
            print(f"❌ Profile scraping failed: {str(e)}")
            raise
    
    def _process_profile_data(self, raw_data: Dict) -> Dict:
        """Process and structure the raw profile data"""
        
        processed = {
            'scraping_metadata': {
                'scraped_at': datetime.now().isoformat(),
                'profile_url': raw_data.get('url', ''),
                'scraper_version': 'apify/linkedin-profile-scraper'
            },
            
            # Basic Profile Information
            'basic_info': {
                'full_name': raw_data.get('fullName', ''),
                'headline': raw_data.get('headline', ''),
                'location': raw_data.get('location', ''),
                'about_section': raw_data.get('about', ''),
                'profile_image_url': raw_data.get('profileImageUrl', ''),
                'background_image_url': raw_data.get('backgroundImageUrl', ''),
                'public_identifier': raw_data.get('publicIdentifier', '')
            },
            
            # Network & Engagement Metrics
            'engagement_metrics': {
                'connections_count': raw_data.get('connectionsCount', 0),
                'followers_count': raw_data.get('followersCount', 0),
                'mutual_connections_count': raw_data.get('mutualConnectionsCount', 0)
            },
            
            # Professional Experience
            'experience': raw_data.get('experience', []),
            
            # Education
            'education': raw_data.get('education', []),
            
            # Skills & Endorsements
            'skills': raw_data.get('skills', []),
            
            # Certifications
            'certifications': raw_data.get('certifications', []),
            
            # Projects
            'projects': raw_data.get('projects', []),
            
            # Volunteer Experience
            'volunteer_experience': raw_data.get('volunteerExperience', []),
            
            # Publications
            'publications': raw_data.get('publications', []),
            
            # Languages
            'languages': raw_data.get('languages', []),
            
            # Courses
            'courses': raw_data.get('courses', []),
            
            # Accomplishments & Awards
            'accomplishments': raw_data.get('accomplishments', []),
            
            # Contact Information
            'contact_info': raw_data.get('contactInfo', {}),
            
            # Raw data for reference
            'raw_data': raw_data
        }
        
        return processed
    
    def save_profile_data(self, profile_data: Dict, output_dir: Path = None) -> Dict[str, str]:
        """Save profile data in multiple formats"""
        
        if output_dir is None:
            output_dir = Path(__file__).parent / "data"
        
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        profile_name = profile_data['basic_info']['public_identifier'] or 'linkedin_profile'
        
        saved_files = {}
        
        # Save complete profile as JSON
        json_file = output_dir / f"{profile_name}_complete_{timestamp}.json"
        saved_files['complete_json'] = self.files.save_json(profile_data, json_file)
        
        # Save summary data as JSON (excluding raw data)
        summary_data = {k: v for k, v in profile_data.items() if k != 'raw_data'}
        summary_file = output_dir / f"{profile_name}_summary_{timestamp}.json"
        saved_files['summary_json'] = self.files.save_json(summary_data, summary_file)
        
        # Create analysis-ready CSV for experience
        if profile_data.get('experience'):
            experience_csv = output_dir / f"{profile_name}_experience_{timestamp}.csv"
            saved_files['experience_csv'] = self.data.export_to_csv(
                profile_data['experience'], experience_csv
            )
        
        # Create analysis-ready CSV for skills
        if profile_data.get('skills'):
            skills_csv = output_dir / f"{profile_name}_skills_{timestamp}.csv"
            saved_files['skills_csv'] = self.data.export_to_csv(
                profile_data['skills'], skills_csv
            )
        
        return saved_files

def generate_branding_analysis(profile_data: Dict) -> str:
    """Generate LinkedIn personal branding analysis using AI"""
    
    try:
        # Use existing AI client from core
        ai_client = GeminiClient()
        
        print("\n🧠 Generating LinkedIn personal branding analysis...")
        
        # Create comprehensive analysis prompt
        analysis_prompt = f"""
        Analyze this LinkedIn profile for personal branding optimization and growth strategies in 2025.
        
        PROFILE DATA:
        Name: {profile_data['basic_info']['full_name']}
        Headline: {profile_data['basic_info']['headline']}
        Location: {profile_data['basic_info']['location']}
        Connections: {profile_data['engagement_metrics']['connections_count']}
        Followers: {profile_data['engagement_metrics']['followers_count']}
        
        About Section: {profile_data['basic_info']['about_section'][:500]}...
        
        Experience: {len(profile_data.get('experience', []))} positions
        Education: {len(profile_data.get('education', []))} institutions
        Skills: {len(profile_data.get('skills', []))} listed skills
        
        ANALYSIS REQUIRED:
        
        ## 1. Current Profile Strength Assessment
        - Overall profile completeness score (1-10)
        - Headline effectiveness analysis
        - About section optimization opportunities
        - Profile photo and banner recommendations
        
        ## 2. Content Strategy for 2025
        - Trending topics in their industry/field
        - Content pillars to establish thought leadership
        - Posting frequency and timing recommendations
        - Content formats that drive engagement (text, carousel, video, polls)
        
        ## 3. Network Growth Strategy
        - Target audience identification
        - Connection building tactics
        - Engagement strategies to increase followers
        - Community building opportunities
        
        ## 4. Personal Brand Positioning
        - Unique value proposition clarity
        - Industry positioning opportunities
        - Competitive differentiation strategies
        - Authority building tactics
        
        ## 5. 2025 LinkedIn Algorithm Optimization
        - Profile optimization for LinkedIn's algorithm
        - Content strategies that maximize reach
        - Engagement tactics that boost visibility
        - Feature utilization (LinkedIn Live, Newsletter, etc.)
        
        ## 6. Specific Action Items
        - Immediate improvements (next 7 days)
        - Short-term strategy (next 30 days)
        - Long-term brand building (next 90 days)
        - Metrics to track progress
        
        ## 7. Industry-Specific Recommendations
        Based on their background, provide tailored advice for their specific field/industry.
        
        Provide specific, actionable recommendations with examples where possible.
        Format as a comprehensive markdown report.
        """
        
        # Generate analysis
        analysis = ai_client.generate_content(analysis_prompt)
        
        return analysis
        
    except Exception as e:
        print(f"❌ AI analysis failed: {str(e)}")
        print("💡 Note: Make sure GOOGLE_API_KEY is configured for Gemini")
        return None

def main():
    """Main execution function"""
    
    linkedin_url = "https://www.linkedin.com/in/anskhalid/"
    
    print("🔗 LinkedIn Profile Scraper & Personal Branding Analyzer")
    print("=" * 60)
    print(f"Target Profile: {linkedin_url}")
    print("Purpose: Personal branding strategy analysis for 2025")
    print()
    
    try:
        # Check if Apify token is configured
        if not os.getenv('APIFY_TOKEN'):
            print("❌ APIFY_TOKEN environment variable not found!")
            print("\n📋 To configure:")
            print("1. Sign up at https://apify.com (free $5 credit)")
            print("2. Get your API token from Settings > Integrations")
            print("3. Set environment variable: export APIFY_TOKEN=your_token")
            return
        
        # Initialize scraper
        scraper = LinkedInProfileScraper()
        
        # Scrape the profile
        profile_data = scraper.scrape_profile(linkedin_url)
        
        # Save the data
        data_dir = Path(__file__).parent / "data"
        saved_files = scraper.save_profile_data(profile_data, data_dir)
        
        # Generate AI analysis
        analysis = generate_branding_analysis(profile_data)
        
        if analysis:
            # Save analysis report
            files = FileHelpers()
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            analysis_file = data_dir / f"linkedin_branding_analysis_{timestamp}.md"
            files.save_text(analysis, analysis_file)
            saved_files['branding_analysis'] = str(analysis_file)
        
        # Print summary
        print("\n🎯 SCRAPING & ANALYSIS COMPLETE!")
        print("=" * 50)
        
        basic_info = profile_data['basic_info']
        metrics = profile_data['engagement_metrics']
        
        print(f"👤 Profile: {basic_info['full_name']}")
        print(f"📍 Location: {basic_info['location']}")
        print(f"🎯 Headline: {basic_info['headline']}")
        print(f"🔗 Connections: {metrics['connections_count']}")
        print(f"👥 Followers: {metrics['followers_count']}")
        print(f"💼 Experience: {len(profile_data.get('experience', []))} positions")
        print(f"🎓 Education: {len(profile_data.get('education', []))} institutions")
        print(f"⚡ Skills: {len(profile_data.get('skills', []))} listed")
        
        print("\n📁 Files Created:")
        for file_type, file_path in saved_files.items():
            print(f"  {file_type}: {file_path}")
        
        print("\n🚀 Next Steps:")
        print("1. Review the branding analysis report")
        print("2. Implement immediate action items")
        print("3. Track progress using suggested metrics")
        print("4. Execute 30-day and 90-day strategies")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print("💡 Check your Apify token and network connection")

if __name__ == "__main__":
    main()