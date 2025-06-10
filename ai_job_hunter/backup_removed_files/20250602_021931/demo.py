#!/usr/bin/env python3
"""
AI Job Hunter - Demo Script
Shows how to use the AI Job Hunter without requiring API keys
"""

import sys
import os
from pathlib import Path

# Add core modules to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
sys.path.insert(0, str(Path(__file__).parent))

from core.utils import FileHelpers
import config
JOB_SEARCH_CONFIG = config.JOB_SEARCH_CONFIG
ACTORS = config.ACTORS

def show_configuration():
    """Display current configuration"""
    print("🔧 AI Job Hunter Configuration")
    print("=" * 50)
    
    print(f"📍 Target Locations:")
    for location in JOB_SEARCH_CONFIG['locations']['primary']:
        print(f"   • {location}")
    
    print(f"\n🎯 AI Keywords:")
    for keyword in JOB_SEARCH_CONFIG['keywords'][:6]:
        print(f"   • {keyword}")
    
    print(f"\n🌐 Scraping Platforms:")
    for platform, config in ACTORS.items():
        if platform in ['stepstone', 'indeed']:
            print(f"   • {platform.title()}: {config['description']} (${config['cost_per_1k']}/1K results)")

def show_expected_output():
    """Show what the tool will generate"""
    print("\n📊 Expected Output Files")
    print("=" * 50)
    
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    output_files = [
        f"ai_jobs_complete_{timestamp}.json",
        f"ai_jobs_stepstone_{timestamp}.json",
        f"ai_jobs_stepstone_{timestamp}.csv", 
        f"ai_jobs_indeed_{timestamp}.json",
        f"ai_jobs_indeed_{timestamp}.csv",
        f"analyzed_jobs_{timestamp}.json",
        f"market_insights_{timestamp}.json",
        f"summary_report_{timestamp}.md"
    ]
    
    for file in output_files:
        print(f"   📄 {file}")

def show_sample_analysis():
    """Show sample AI analysis output"""
    print("\n🤖 Sample AI Analysis Output")
    print("=" * 50)
    
    sample_analysis = {
        "required_skills": ["Python", "TensorFlow", "PyTorch", "SQL", "Docker"],
        "experience_level": "Mid Level",
        "ai_ml_focus": ["machine learning", "deep learning", "computer vision"],
        "company_type": "Tech Startup",
        "work_arrangement": "Hybrid",
        "attractiveness_score": 8,
        "career_growth": "High potential for growth in AI team"
    }
    
    print("Sample job analysis:")
    for key, value in sample_analysis.items():
        print(f"   • {key}: {value}")

def show_market_insights():
    """Show sample market insights"""
    print("\n📈 Sample Market Insights")
    print("=" * 50)
    
    insights = {
        "top_skills": ["Python (89%)", "Machine Learning (76%)", "TensorFlow (54%)"],
        "experience_distribution": {"Entry": "15%", "Mid": "45%", "Senior": "40%"},
        "top_companies": ["SAP", "BMW", "Siemens", "Deutsche Bank"],
        "average_salary_transparency": "32% of jobs show salary"
    }
    
    for category, data in insights.items():
        print(f"   📊 {category.replace('_', ' ').title()}:")
        if isinstance(data, list):
            for item in data:
                print(f"      • {item}")
        elif isinstance(data, dict):
            for key, value in data.items():
                print(f"      • {key}: {value}")
        else:
            print(f"      • {data}")

def show_cost_breakdown():
    """Show cost breakdown for running the tool"""
    print("\n💰 Cost Breakdown (Example: 200 AI Jobs)")
    print("=" * 50)
    
    print("Apify Scraping Costs:")
    print("   • StepStone: $5 per 1,000 results → ~$1 for 200 jobs")
    print("   • Indeed: $5 per 1,000 results → ~$1 for 200 jobs")
    print("   📊 Scraping Total: ~$2")
    
    print("\nGoogle Gemini AI Analysis:")
    print("   • ~$0.01 per job description analysis")
    print("   • 200 jobs × $0.01 = ~$2")
    print("   📊 AI Analysis Total: ~$2")
    
    print("\n🎯 TOTAL COST: ~$4 for 200 analyzed AI jobs")
    print("   💡 Very cost-effective for comprehensive job market analysis!")

def main():
    """Main demo function"""
    print("🤖 AI Job Hunter - Demo & Configuration Overview")
    print("=" * 60)
    
    # Check if APIs are configured
    apify_token = os.getenv('APIFY_TOKEN')
    google_key = os.getenv('GOOGLE_API_KEY')
    
    if apify_token and google_key:
        print("✅ All API keys configured - Ready to run!")
        print("🚀 Execute: python main.py")
    else:
        print("📋 Demo Mode - Configuration Overview")
        if not apify_token:
            print("⚠️  APIFY_TOKEN not set")
        if not google_key:
            print("⚠️  GOOGLE_API_KEY not set")
    
    show_configuration()
    show_expected_output()
    show_sample_analysis()
    show_market_insights()
    show_cost_breakdown()
    
    print("\n" + "=" * 60)
    print("🎯 TO GET STARTED:")
    print("=" * 60)
    print("1. Get Apify token: https://apify.com/")
    print("2. Get Google AI key: https://makersuite.google.com/")
    print("3. Set environment variables:")
    print("   export APIFY_TOKEN='your-apify-token'")
    print("   export GOOGLE_API_KEY='your-google-ai-key'")
    print("4. Run the tool:")
    print("   python main.py")
    
    print("\n🔧 For testing setup:")
    print("   python test_setup.py")
    
    print("\n📚 For detailed documentation:")
    print("   cat README.md")
    
    print("\n🎉 Happy job hunting! 🇩🇪🤖")

if __name__ == "__main__":
    main()