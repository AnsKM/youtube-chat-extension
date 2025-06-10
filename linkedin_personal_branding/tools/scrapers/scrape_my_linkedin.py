#!/usr/bin/env python3
"""
Direct LinkedIn Profile Scraper using dev_fusion/Linkedin-Profile-Scraper
Scrapes only: https://www.linkedin.com/in/anskhalid/
"""

import os
import sys
import json
import time
import requests
from pathlib import Path
from datetime import datetime

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

# Try to load .env file
env_file = Path(__file__).parent.parent.parent / '.env'
if env_file.exists():
    print(f"📄 Loading .env from: {env_file}")
    with open(env_file, 'r') as f:
        for line in f:
            if line.strip() and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                os.environ[key] = value.strip('"').strip("'")

# Get token
APIFY_TOKEN = os.getenv('APIFY_TOKEN')

if not APIFY_TOKEN:
    print("❌ APIFY_TOKEN not found in environment or .env file")
    print("\n🔍 Looking for .env files in project...")
    
    # Search for .env files
    for root, dirs, files in os.walk(Path(__file__).parent.parent.parent):
        if '.env' in files:
            print(f"Found .env at: {os.path.join(root, '.env')}")
    
    print("\n📋 Please ensure APIFY_TOKEN is set in one of these ways:")
    print("1. In .env file: APIFY_TOKEN=your_token")
    print("2. Export: export APIFY_TOKEN=your_token")
    print("3. Pass directly when running script")
    sys.exit(1)

print(f"✅ APIFY_TOKEN found: {APIFY_TOKEN[:10]}...")

# Apify actor details
ACTOR_ID = "dev_fusion/Linkedin-Profile-Scraper"
PROFILE_URL = "https://www.linkedin.com/in/anskhalid/"

# Run the actor
print(f"\n🚀 Starting LinkedIn profile scrape")
print(f"📍 Profile: {PROFILE_URL}")
print(f"🎭 Actor: {ACTOR_ID}")
print("=" * 60)

# Prepare input
run_input = {
    "urls": [PROFILE_URL],
    "maxDelay": 5,
    "minDelay": 2,
    "proxy": {
        "useApifyProxy": True,
        "apifyProxyGroups": ["RESIDENTIAL"]
    }
}

# Start the actor run
api_url = f"https://api.apify.com/v2/acts/{ACTOR_ID}/runs"
headers = {
    "Authorization": f"Bearer {APIFY_TOKEN}",
    "Content-Type": "application/json"
}

print("📤 Starting actor run...")
response = requests.post(api_url, json=run_input, headers=headers)

if response.status_code != 201:
    print(f"❌ Failed to start actor: {response.status_code}")
    print(response.text)
    sys.exit(1)

run_data = response.json()
run_id = run_data['data']['id']
print(f"✅ Actor run started with ID: {run_id}")

# Wait for completion
print("\n⏳ Waiting for scraping to complete...")
status_url = f"https://api.apify.com/v2/actor-runs/{run_id}"

while True:
    status_response = requests.get(status_url, headers={"Authorization": f"Bearer {APIFY_TOKEN}"})
    status_data = status_response.json()
    status = status_data['data']['status']
    
    if status in ['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT']:
        break
    
    print(f"   Status: {status} (checking again in 5 seconds...)")
    time.sleep(5)

if status != 'SUCCEEDED':
    print(f"❌ Actor run failed with status: {status}")
    sys.exit(1)

print(f"✅ Scraping completed successfully!")

# Get results
dataset_id = status_data['data']['defaultDatasetId']
results_url = f"https://api.apify.com/v2/datasets/{dataset_id}/items"

print("\n📥 Fetching scraped data...")
results_response = requests.get(results_url, headers={"Authorization": f"Bearer {APIFY_TOKEN}"})
scraped_data = results_response.json()

if not scraped_data:
    print("❌ No data was scraped")
    sys.exit(1)

# Process the scraped profile
profile = scraped_data[0] if isinstance(scraped_data, list) else scraped_data

# Save data
data_dir = Path(__file__).parent / "data"
data_dir.mkdir(exist_ok=True)

timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

# Save raw data
raw_file = data_dir / f"anskhalid_linkedin_raw_{timestamp}.json"
with open(raw_file, 'w', encoding='utf-8') as f:
    json.dump(profile, f, indent=2, ensure_ascii=False)

print(f"\n💾 Raw data saved to: {raw_file}")

# Display profile summary
print("\n📊 PROFILE SUMMARY")
print("=" * 50)

# Extract key fields (adapting to dev_fusion actor output format)
print(f"👤 Name: {profile.get('name', 'N/A')}")
print(f"📍 Location: {profile.get('location', 'N/A')}")
print(f"💼 Headline: {profile.get('headline', 'N/A')}")
print(f"🔗 Profile URL: {profile.get('url', PROFILE_URL)}")

# About section
about = profile.get('about', profile.get('summary', ''))
if about:
    print(f"\n📝 About (first 200 chars):")
    print(f"   {about[:200]}...")

# Experience
experience = profile.get('experience', [])
if experience:
    print(f"\n💼 Experience ({len(experience)} positions):")
    for i, exp in enumerate(experience[:3]):  # Show first 3
        title = exp.get('title', 'N/A')
        company = exp.get('companyName', exp.get('company', 'N/A'))
        print(f"   {i+1}. {title} at {company}")

# Education
education = profile.get('education', [])
if education:
    print(f"\n🎓 Education ({len(education)} entries):")
    for i, edu in enumerate(education[:2]):  # Show first 2
        school = edu.get('schoolName', edu.get('school', 'N/A'))
        degree = edu.get('degree', edu.get('degreeName', 'N/A'))
        print(f"   {i+1}. {degree} from {school}")

# Skills
skills = profile.get('skills', [])
if skills:
    print(f"\n⚡ Skills ({len(skills)} total):")
    # Show first 5 skills
    skill_names = []
    for skill in skills[:5]:
        if isinstance(skill, dict):
            skill_names.append(skill.get('name', skill.get('skillName', '')))
        else:
            skill_names.append(str(skill))
    print(f"   {', '.join(filter(None, skill_names))}")

# Additional data
print(f"\n📊 Additional Data Available:")
for key in profile.keys():
    if key not in ['name', 'location', 'headline', 'about', 'summary', 'experience', 'education', 'skills', 'url']:
        value = profile[key]
        if isinstance(value, list):
            print(f"   - {key}: {len(value)} items")
        elif isinstance(value, dict):
            print(f"   - {key}: {len(value)} fields")
        else:
            print(f"   - {key}: {type(value).__name__}")

print("\n✅ Scraping complete! Check the data folder for the full JSON file.")
print(f"📁 Full data saved to: {raw_file}")

# Generate a summary for branding analysis
summary_file = data_dir / f"anskhalid_linkedin_summary_{timestamp}.json"
summary = {
    "profile_url": PROFILE_URL,
    "scraped_at": datetime.now().isoformat(),
    "basic_info": {
        "name": profile.get('name', 'N/A'),
        "headline": profile.get('headline', 'N/A'),
        "location": profile.get('location', 'N/A'),
        "about": about[:500] if about else 'N/A'
    },
    "metrics": {
        "experience_count": len(experience),
        "education_count": len(education),
        "skills_count": len(skills),
        "has_profile_image": bool(profile.get('profilePicture', profile.get('photo', ''))),
        "has_background_image": bool(profile.get('backgroundImage', profile.get('coverPhoto', '')))
    },
    "data_available": list(profile.keys())
}

with open(summary_file, 'w', encoding='utf-8') as f:
    json.dump(summary, f, indent=2, ensure_ascii=False)

print(f"📋 Summary saved to: {summary_file}")
print("\n🎯 Use this data to build your LinkedIn personal branding strategy for 2025!")