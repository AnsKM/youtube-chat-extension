#!/usr/bin/env python3
"""
AI Job Hunter - Cleanup Unnecessary Files
Remove old simulated scrapers and test files, keep only the Apify integration
"""

import os
import shutil
from pathlib import Path
from datetime import datetime

def cleanup_ai_job_hunter():
    """Clean up unnecessary files in ai_job_hunter project"""
    
    base_dir = Path(__file__).parent
    
    # Files to remove (old/unnecessary scripts)
    files_to_remove = [
        # Old LinkedIn scrapers (replaced by Apify)
        "linkedin_scraper.py",
        "linkedin_50_jobs.py", 
        "linkedin_enhanced_scraper.py",
        
        # Old simulation/test files
        "scrape_ai_engineer_jobs.py",
        "scrape_real_jobs.py",
        "scrape_real_live_jobs.py",
        "demo.py",
        "test_run.py",
        "test_setup.py", 
        "test_simulation.py",
        "test_webfetch.py",
        "main.py",  # Old main file
        
        # Old WebFetch attempts
        "webfetch_main.py",
        "webfetch_real_implementation.py",
        "stepstone_real_scrape_attempt.py",
        
        # Analysis scripts (functionality moved to core)
        "analyze_linkedin_jobs.py",
        "enhance_analysis.py",
        "extract_job_details.py",
        "update_dashboard_with_real_jobs.py",
        
        # Old WebFetch scraper (replaced by Apify)
        "src/webfetch_job_scrapers.py"
    ]
    
    # Documentation files to remove (redundant guides)
    docs_to_remove = [
        "WEBFETCH_USAGE_GUIDE.md",
        "WEBFETCH_UPGRADE.md",
        "THIRD_PARTY_SCRAPING_SOLUTIONS.md"  # Info is now in README
    ]
    
    # Data directories to remove (old simulated data)
    data_dirs_to_remove = [
        "data/simulation_run_20250601_233505",
        "data/test_run_20250601_233242", 
        "data/webfetch_test_20250601_234600",
        "data/webfetch_test_20250601_234639",
        "data/linkedin_50_jobs_20250602_005943",
        "data/linkedin_ai_consultant_20250602_000849",
        "data/linkedin_enhanced_20250602_010649",
        "data/linkedin_enhanced_20250602_014705",
        "data/ai_engineer_jobs_20250602_014633"
    ]
    
    # Backup directory for removed files
    backup_dir = base_dir / "backup_removed_files" / datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir.mkdir(parents=True, exist_ok=True)
    
    removed_count = 0
    
    print("🧹 AI Job Hunter Cleanup")
    print("=" * 40)
    print("Removing unnecessary files and keeping only Apify integration...")
    
    # Remove files
    print("\n📄 Removing old script files:")
    for file_name in files_to_remove:
        file_path = base_dir / file_name
        if file_path.exists():
            # Backup before removing
            backup_file = backup_dir / file_name
            backup_file.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(file_path, backup_file)
            
            # Remove original
            file_path.unlink()
            print(f"  ❌ {file_name}")
            removed_count += 1
        else:
            print(f"  ⚠️  {file_name} (not found)")
    
    # Remove documentation files
    print("\n📚 Removing redundant documentation:")
    for doc_name in docs_to_remove:
        doc_path = base_dir / doc_name
        if doc_path.exists():
            shutil.copy2(doc_path, backup_dir / doc_name)
            doc_path.unlink()
            print(f"  ❌ {doc_name}")
            removed_count += 1
    
    # Remove old data directories
    print("\n📊 Removing old simulated data:")
    for data_dir in data_dirs_to_remove:
        dir_path = base_dir / data_dir
        if dir_path.exists():
            # Backup entire directory
            shutil.copytree(dir_path, backup_dir / data_dir, dirs_exist_ok=True)
            shutil.rmtree(dir_path)
            print(f"  ❌ {data_dir}")
            removed_count += 1
    
    # Clean up empty src files if needed
    print("\n🔧 Checking src/ directory:")
    src_dir = base_dir / "src"
    if src_dir.exists():
        remaining_files = list(src_dir.glob("*.py"))
        if len(remaining_files) <= 1:  # Only __init__.py
            print("  ✅ Core modules maintained (job_scrapers.py, ai_job_analyzer.py)")
        
    print("\n" + "=" * 40)
    print(f"✅ Cleanup Complete!")
    print(f"📊 Files/directories removed: {removed_count}")
    print(f"💾 Backup created at: {backup_dir}")
    
    # Show what's remaining
    print("\n📁 Remaining essential files:")
    essential_files = [
        "app.py",              # Flask dashboard
        "config.py",           # Configuration
        "scrape_real_jobs_apify.py",  # New Apify scraper
        "src/job_scrapers.py", # Apify integration
        "src/ai_job_analyzer.py",  # AI analysis
        "requirements.txt",    # Dependencies
        "README.md",          # Documentation
        "templates/",         # Web templates
        "static/",           # Web assets
        "data/"              # Data storage
    ]
    
    for item in essential_files:
        item_path = base_dir / item
        if item_path.exists():
            print(f"  ✅ {item}")
        else:
            print(f"  ⚠️  {item} (missing)")
    
    print("\n🎯 Next Steps:")
    print("1. Run: python scrape_real_jobs_apify.py")
    print("2. Configure APIFY_TOKEN environment variable")
    print("3. Update dashboard to use real job data")
    print("4. Test the cleaned up project")

def update_readme():
    """Update README to reflect the cleaned up project"""
    
    readme_content = """# 🤖 AI Job Hunter

Real job scraping and analysis tool for AI/ML positions in Munich using Apify integration.

## 🚀 Features

- **Real Job Scraping**: Uses Apify actors for StepStone.de and Indeed
- **AI Analysis**: Gemini-powered job description analysis  
- **Interactive Dashboard**: Modern Flask web interface
- **Market Insights**: Salary trends, skill requirements, company analysis
- **Export Capabilities**: JSON, CSV, and report generation

## 📋 Prerequisites

1. **Apify Account**: Sign up at https://apify.com (free $5 credit)
2. **Google AI**: Get API key from https://aistudio.google.com

## ⚙️ Setup

1. **Environment Variables**:
```bash
export APIFY_TOKEN=your_apify_token
export GOOGLE_API_KEY=your_gemini_key
```

2. **Install Dependencies**:
```bash
pip install -r requirements.txt
```

## 🎯 Usage

### Scrape Real Jobs
```bash
python scrape_real_jobs_apify.py
```

### Run Dashboard  
```bash
python app.py
# Visit: http://localhost:5000
```

## 📁 Project Structure

```
ai_job_hunter/
├── app.py                    # Flask web dashboard
├── scrape_real_jobs_apify.py # Main scraping script
├── src/
│   ├── job_scrapers.py       # Apify integration
│   └── ai_job_analyzer.py    # AI analysis module
├── templates/                # Web interface
├── static/                   # CSS/JS assets
├── data/                     # Scraped job data
└── config.py                 # Configuration
```

## 🌐 Supported Platforms

- **StepStone.de**: German job market focus
- **Indeed.de**: International positions

## 📊 Data Output

- Real job listings with complete details
- AI-generated market analysis
- Salary and skill trend reports
- Company and location insights

## 🔧 Built With

- **Core Modules**: Uses claude_code_workflows infrastructure
- **Apify**: Professional job scraping actors
- **Gemini AI**: Content analysis and insights
- **Flask**: Modern web dashboard
- **Chart.js**: Interactive visualizations
"""
    
    readme_path = Path(__file__).parent / "README.md"
    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    print(f"\n📝 Updated README.md with cleaned project structure")

def main():
    """Main cleanup execution"""
    cleanup_ai_job_hunter()
    update_readme()

if __name__ == "__main__":
    main()