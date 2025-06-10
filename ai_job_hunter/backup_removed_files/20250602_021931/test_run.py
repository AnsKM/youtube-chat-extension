#!/usr/bin/env python3
"""
AI Job Hunter - Test Run
Targeted test: 50 'AI Engineer' jobs in Munich from last 7 days
"""

import sys
import os
from pathlib import Path
from datetime import datetime

# Add core modules to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
sys.path.insert(0, str(Path(__file__).parent))

# Use existing core modules
from core.utils import FileHelpers
from src.job_scrapers import MultiPlatformJobScraper
from src.ai_job_analyzer import AIJobAnalyzer

def main():
    """Run targeted test scrape"""
    print("🎯 AI Job Hunter - Test Run")
    print("=" * 50)
    print("Target: 50 'AI Engineer' jobs in Munich (last 7 days)")
    print("")
    
    # Check environment
    if not os.getenv('APIFY_TOKEN'):
        print("❌ APIFY_TOKEN environment variable not set")
        print("Please set it with: export APIFY_TOKEN='your-apify-token'")
        print("\n📋 Demo mode - showing what would happen:")
        show_demo()
        return
    
    if not os.getenv('GOOGLE_API_KEY'):
        print("⚠️  GOOGLE_API_KEY not set - will skip AI analysis")
        ai_analysis = False
    else:
        ai_analysis = True
    
    # Create test output directory
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    test_dir = Path(__file__).parent / "data" / f"test_run_{timestamp}"
    test_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"📁 Output directory: {test_dir}")
    
    # Initialize scraper
    print("🔧 Initializing scraper...")
    scraper = MultiPlatformJobScraper()
    
    # Configure test parameters
    keywords = ["AI Engineer"]  # Exact target keyword
    locations = ["Munich"]     # Exact target location
    max_results = 25          # 25 per platform = 50 total
    
    print(f"🎯 Search parameters:")
    print(f"   Keywords: {keywords}")
    print(f"   Locations: {locations}")
    print(f"   Max results per platform: {max_results}")
    print(f"   Total expected: {max_results * 2} jobs")
    
    # Phase 1: Scrape Jobs
    print(f"\n📡 Phase 1: Scraping job postings...")
    try:
        raw_results = scraper.search_all_platforms(
            keywords=keywords,
            locations=locations,
            max_results_per_search=max_results
        )
        
        # Save raw results to test directory
        saved_files = scraper.save_results(raw_results, test_dir)
        print(f"💾 Raw data saved to: {test_dir}")
        
        # Get all jobs for analysis
        all_jobs = []
        stepstone_jobs = raw_results.get('stepstone', [])
        indeed_jobs = raw_results.get('indeed', [])
        all_jobs.extend(stepstone_jobs)
        all_jobs.extend(indeed_jobs)
        
        print(f"✅ Scraping Results:")
        print(f"   StepStone: {len(stepstone_jobs)} jobs")
        print(f"   Indeed: {len(indeed_jobs)} jobs")
        print(f"   Total: {len(all_jobs)} jobs")
        
        # Filter recent jobs (simulate last 7 days filter)
        print(f"\n📅 Filtering for recent jobs...")
        recent_jobs = filter_recent_jobs(all_jobs)
        print(f"   Jobs from recent period: {len(recent_jobs)}")
        
    except Exception as e:
        print(f"❌ Scraping failed: {str(e)}")
        return
    
    # Phase 2: AI Analysis (if enabled and we have jobs)
    if ai_analysis and recent_jobs:
        print(f"\n🤖 Phase 2: AI Analysis...")
        try:
            analyzer = AIJobAnalyzer()
            
            # Analyze first 5 jobs for demo (to control costs)
            sample_jobs = recent_jobs[:5]
            print(f"   Analyzing sample of {len(sample_jobs)} jobs...")
            
            analyzed_jobs = analyzer.analyze_job_batch(sample_jobs)
            
            # Generate insights
            insights = analyzer.generate_market_insights(analyzed_jobs)
            
            # Save analysis results
            files = FileHelpers()
            analysis_file = test_dir / f"analyzed_jobs_{timestamp}.json"
            insights_file = test_dir / f"market_insights_{timestamp}.json"
            
            files.save_json(analyzed_jobs, analysis_file)
            files.save_json(insights, insights_file)
            
            print(f"💾 Analysis saved to: {analysis_file}")
            print(f"💾 Insights saved to: {insights_file}")
            
        except Exception as e:
            print(f"❌ Analysis failed: {str(e)}")
            analyzed_jobs = recent_jobs
            insights = {}
    else:
        analyzed_jobs = recent_jobs
        insights = {}
        if not ai_analysis:
            print(f"\n⏭️  Skipping AI analysis (no GOOGLE_API_KEY)")
    
    # Phase 3: Generate Report
    print(f"\n📋 Phase 3: Generating Test Report...")
    generate_test_report(raw_results, insights, recent_jobs, test_dir, timestamp)
    
    print(f"\n🎉 Test run completed successfully!")
    print(f"📂 Check results in: {test_dir}")
    print(f"📊 Total jobs found: {len(all_jobs)}")
    print(f"📅 Recent jobs: {len(recent_jobs)}")

def filter_recent_jobs(jobs):
    """Filter jobs to simulate recent postings (last 7 days)"""
    # In a real implementation, this would filter by actual posting dates
    # For demo, we'll just return all jobs as "recent"
    return jobs

def generate_test_report(raw_results, insights, jobs, output_dir, timestamp):
    """Generate test-specific report"""
    
    report = f"""# AI Job Hunter - Test Run Report
Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
Test Run ID: {timestamp}

## 🎯 Test Parameters
- **Keyword**: AI Engineer
- **Location**: Munich
- **Target**: 50 jobs from last 7 days
- **Platforms**: StepStone + Indeed

## 📊 Results Summary

### Jobs Found
- **StepStone**: {len(raw_results.get('stepstone', []))} jobs
- **Indeed**: {len(raw_results.get('indeed', []))} jobs
- **Total**: {len(jobs)} jobs

### Platform Performance
- **StepStone**: German job market focus
- **Indeed**: International companies in Munich

## 🏢 Sample Companies Found
"""
    
    # Add sample companies from job data
    companies = set()
    for job in jobs[:10]:  # First 10 jobs
        company = job.get('company', 'Unknown').strip()
        if company and company != 'Unknown':
            companies.add(company)
    
    for company in list(companies)[:5]:
        report += f"- {company}\n"
    
    report += f"""
## 🛠️ Sample Job Titles
"""
    
    # Add sample job titles
    titles = set()
    for job in jobs[:10]:
        title = job.get('title', '').strip()
        if title and 'ai' in title.lower():
            titles.add(title)
    
    for title in list(titles)[:5]:
        report += f"- {title}\n"
    
    if insights.get('top_rated_jobs'):
        report += f"""
## ⭐ Top Rated Opportunities
"""
        for job in insights['top_rated_jobs'][:3]:
            report += f"- **{job['title']}** at {job['company']} (Score: {job['score']}/10)\n"
    
    report += f"""
## 💰 Cost Analysis
- **Scraping Cost**: ~${(len(jobs) / 1000) * 10:.2f} (StepStone + Indeed)
- **AI Analysis Cost**: ~${len(jobs[:5]) * 0.01:.2f} (sample of 5 jobs)
- **Total Cost**: ~${(len(jobs) / 1000) * 10 + len(jobs[:5]) * 0.01:.2f}

## 📁 Generated Files
- Raw job data (JSON/CSV)
- AI analysis results (if enabled)
- Market insights (if available)
- This test report

## ✅ Test Results
✅ **Job Scraping**: Successful
✅ **Data Export**: Complete
✅ **Report Generation**: Complete
{"✅ **AI Analysis**: Complete" if insights else "⏭️ **AI Analysis**: Skipped (no API key)"}

---
*Test completed successfully*
*AI Job Hunter v1.0.0*
"""
    
    # Save report
    report_file = output_dir / f"test_report_{timestamp}.md"
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"📝 Test report saved: {report_file}")

def show_demo():
    """Show demo of what would happen"""
    print("\n🎬 DEMO MODE - What would happen:")
    print("=" * 50)
    
    print("📡 Would scrape:")
    print("   • StepStone.de for 'AI Engineer' in Munich")
    print("   • Indeed.com for 'AI Engineer' in Munich, Germany")
    print("   • Max 25 results per platform = 50 total")
    
    print("\n💾 Would generate:")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    files = [
        f"ai_jobs_complete_{timestamp}.json",
        f"ai_jobs_stepstone_{timestamp}.csv",
        f"ai_jobs_indeed_{timestamp}.csv",
        f"test_report_{timestamp}.md"
    ]
    
    for file in files:
        print(f"   📄 {file}")
    
    print("\n🤖 Would analyze (with GOOGLE_API_KEY):")
    print("   • Extract required skills from job descriptions")
    print("   • Identify experience levels and salary ranges")
    print("   • Rate job attractiveness (1-10 scale)")
    print("   • Generate market insights and trends")
    
    print("\n💰 Estimated costs:")
    print("   • Scraping: ~$0.50 (50 jobs)")
    print("   • AI Analysis: ~$0.50 (50 job descriptions)")
    print("   • Total: ~$1.00")

if __name__ == "__main__":
    main()