#!/usr/bin/env python3
"""
AI Job Hunter - Main Entry Point
Intelligent job scraping and analysis for AI/ML positions in Germany
"""

import sys
import os
from pathlib import Path

# Add core modules to path (following AI_CODER_INSTRUCTIONS.md)
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

# Use existing core modules
from core.utils import FileHelpers

# Import project modules
from src.job_scrapers import MultiPlatformJobScraper
from src.ai_job_analyzer import AIJobAnalyzer
from config import JOB_SEARCH_CONFIG, OUTPUT_CONFIG, DATA_DIR

def main():
    """Main execution function"""
    print("🤖 AI Job Hunter - Intelligent Job Scraping & Analysis")
    print("=" * 60)
    
    # Check environment
    if not os.getenv('APIFY_TOKEN'):
        print("❌ APIFY_TOKEN environment variable not set")
        print("Please set it with: export APIFY_TOKEN='your-apify-token'")
        return
    
    if not os.getenv('GOOGLE_API_KEY'):
        print("❌ GOOGLE_API_KEY environment variable not set")
        print("Please set it with: export GOOGLE_API_KEY='your-gemini-api-key'")
        return
    
    # Initialize components using existing architecture
    print("🔧 Initializing components...")
    scraper = MultiPlatformJobScraper()
    analyzer = AIJobAnalyzer()
    files = FileHelpers()  # Use existing file utilities
    
    # Configure search parameters
    keywords = JOB_SEARCH_CONFIG['keywords'][:4]  # Start with top 4 keywords
    locations = JOB_SEARCH_CONFIG['locations']['primary'][:2]  # Munich and Bavaria
    max_results = JOB_SEARCH_CONFIG['filters']['max_results_per_search']
    
    print(f"🎯 Search Configuration:")
    print(f"   Keywords: {', '.join(keywords)}")
    print(f"   Locations: {', '.join(locations)}")
    print(f"   Max results per search: {max_results}")
    print(f"   Platforms: StepStone (Germany) + Indeed (International)")
    
    # Phase 1: Scrape Jobs
    print("\n📡 Phase 1: Scraping job postings...")
    try:
        raw_results = scraper.search_all_platforms(
            keywords=keywords,
            locations=locations,
            max_results_per_search=max_results
        )
        
        # Save raw results
        saved_files = scraper.save_results(raw_results, DATA_DIR)
        print(f"💾 Raw data saved to: {DATA_DIR}")
        
        # Get all jobs for analysis
        all_jobs = []
        for platform in ['stepstone', 'indeed']:
            all_jobs.extend(raw_results.get(platform, []))
        
        print(f"✅ Total jobs found: {len(all_jobs)}")
        
    except Exception as e:
        print(f"❌ Scraping failed: {str(e)}")
        return
    
    # Phase 2: AI Analysis
    if all_jobs:
        print(f"\n🤖 Phase 2: AI Analysis of {len(all_jobs)} jobs...")
        try:
            # Analyze jobs (limit to 10 for demo to save API costs)
            sample_jobs = all_jobs[:10] if len(all_jobs) > 10 else all_jobs
            print(f"   Analyzing sample of {len(sample_jobs)} jobs for demo...")
            
            analyzed_jobs = analyzer.analyze_job_batch(sample_jobs)
            
            # Generate market insights
            print("📊 Generating market insights...")
            insights = analyzer.generate_market_insights(analyzed_jobs)
            
            # Save analyzed results
            analysis_file = DATA_DIR / f"analyzed_jobs_{files.get_timestamp()}.json"
            insights_file = DATA_DIR / f"market_insights_{files.get_timestamp()}.json"
            
            files.save_json(analyzed_jobs, analysis_file)
            files.save_json(insights, insights_file)
            
            print(f"💾 Analysis saved to: {analysis_file}")
            print(f"💾 Insights saved to: {insights_file}")
            
        except Exception as e:
            print(f"❌ Analysis failed: {str(e)}")
            # Continue without analysis
            analyzed_jobs = all_jobs
            insights = {}
    
    # Phase 3: Generate Report
    print("\n📋 Phase 3: Generating Summary Report...")
    generate_summary_report(raw_results, insights, all_jobs)
    
    print("\n🎉 AI Job Hunter completed successfully!")
    print(f"📂 Check results in: {DATA_DIR}")

def generate_summary_report(raw_results: dict, insights: dict, all_jobs: list):
    """Generate a human-readable summary report"""
    
    files = FileHelpers()
    
    # Create summary
    summary = f"""# AI Job Hunter - Summary Report
Generated: {files.get_timestamp()}

## 🎯 Search Results Overview

### Total Jobs Found: {len(all_jobs)}
- **StepStone (Germany)**: {len(raw_results.get('stepstone', []))} jobs
- **Indeed (International)**: {len(raw_results.get('indeed', []))} jobs

## 📊 Platform Performance
- **StepStone**: German job market leader, focused on local companies
- **Indeed**: International reach, good for multinational companies

## 🏢 Top Companies
"""
    
    if insights.get('top_companies'):
        for company in insights['top_companies'][:5]:
            summary += f"- **{company['company']}**: {company['job_count']} positions\n"
    
    summary += f"""
## 🛠️ Most In-Demand Skills
"""
    
    if insights.get('skill_demand'):
        for skill in insights['skill_demand'][:8]:
            summary += f"- **{skill['skill']}**: {skill['demand_count']} mentions\n"
    
    summary += f"""
## 📈 Experience Level Distribution
"""
    
    if insights.get('experience_distribution'):
        for level, count in insights['experience_distribution'].items():
            summary += f"- **{level}**: {count} positions\n"
    
    summary += f"""
## 🤖 AI/ML Focus Areas
"""
    
    if insights.get('ai_focus_trends'):
        for area in insights['ai_focus_trends'][:5]:
            summary += f"- **{area['focus_area']}**: {area['job_count']} positions\n"
    
    summary += f"""
## 💰 Salary Insights
- **Transparency**: {insights.get('salary_insights', {}).get('salary_transparency', 'N/A')}

## ⭐ Top Rated Opportunities
"""
    
    if insights.get('top_rated_jobs'):
        for job in insights['top_rated_jobs'][:3]:
            summary += f"- **{job['title']}** at {job['company']} (Score: {job['score']}/10)\n"
    
    summary += f"""
## 🎯 Next Steps
1. **Focus on high-demand skills**: {', '.join([s['skill'] for s in insights.get('skill_demand', [])[:3]])}
2. **Target top companies**: Apply to companies with multiple openings
3. **Location strategy**: Munich and Bavaria showing good opportunities
4. **Skill development**: Prioritize skills with highest demand

## 📁 Data Files Generated
- Raw job data (JSON/CSV format)
- AI analysis results
- Market insights
- This summary report

---
*Generated by AI Job Hunter v1.0.0*
*Powered by Claude Code Workflows*
"""
    
    # Save summary report
    summary_file = DATA_DIR / f"summary_report_{files.get_timestamp()}.md"
    with open(summary_file, 'w', encoding='utf-8') as f:
        f.write(summary)
    
    print(f"📝 Summary report saved: {summary_file}")

if __name__ == "__main__":
    main()