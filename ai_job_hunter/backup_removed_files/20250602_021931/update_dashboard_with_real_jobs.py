#!/usr/bin/env python3
"""
Update Dashboard with Real AI Engineer Jobs
Replaces simulated data with real scraped jobs
"""

import sys
import shutil
from pathlib import Path
from datetime import datetime

# Add modules to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from core.utils import FileHelpers

def update_dashboard():
    """Copy the real AI Engineer jobs to be used by the dashboard"""
    
    print("🔄 Updating dashboard with real AI Engineer jobs...")
    
    # Find the latest AI Engineer jobs file
    data_dir = Path(__file__).parent / "data"
    ai_engineer_dirs = [d for d in data_dir.iterdir() 
                       if d.is_dir() and d.name.startswith("ai_engineer_jobs_")]
    
    if not ai_engineer_dirs:
        print("❌ No AI Engineer job data found!")
        return False
    
    # Get the most recent scrape
    latest_dir = max(ai_engineer_dirs, key=lambda x: x.name)
    json_files = list(latest_dir.glob("*.json"))
    
    if not json_files:
        print("❌ No JSON file found in latest directory!")
        return False
    
    latest_json = json_files[0]
    
    # Create a new enhanced directory for the dashboard
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    dashboard_dir = data_dir / f"linkedin_enhanced_{timestamp}"
    dashboard_dir.mkdir(exist_ok=True)
    
    # Copy the file with the expected name format
    destination = dashboard_dir / f"linkedin_enhanced_jobs_{timestamp}.json"
    shutil.copy(latest_json, destination)
    
    print(f"✅ Copied real jobs to: {destination}")
    
    # Load and show summary
    files = FileHelpers()
    jobs = files.load_json(destination)
    
    print(f"\n📊 Dashboard will now show:")
    print(f"   - Total jobs: {len(jobs)}")
    print(f"   - Sources: StepStone & Indeed")
    print(f"   - Location: Munich")
    print(f"   - Job type: AI Engineer")
    
    # Show sample jobs
    print(f"\n📋 Sample jobs:")
    for i, job in enumerate(jobs[:3], 1):
        print(f"   {i}. {job['title']} at {job['company']}")
        print(f"      Posted: {job['posted_date']} | {job.get('applications', 'N/A')}")
    
    print(f"\n🎯 Dashboard data updated successfully!")
    print(f"   Restart the web app to see real AI Engineer jobs")
    
    return True

if __name__ == "__main__":
    update_dashboard()