#!/usr/bin/env python3
"""
LinkedIn Profile Scraper with Token Input
Usage: python scrape_linkedin_with_token.py YOUR_APIFY_TOKEN
"""

import os
import sys
import json
import time
import requests
from pathlib import Path
from datetime import datetime

# Check command line arguments
if len(sys.argv) < 2:
    print("❌ Please provide your Apify token as an argument")
    print("\nUsage: python scrape_linkedin_with_token.py YOUR_APIFY_TOKEN")
    print("\nExample: python scrape_linkedin_with_token.py apify_api_xxxxx")
    print("\nGet your token from: https://console.apify.com/account#/integrations")
    sys.exit(1)

# Get token from command line
APIFY_TOKEN = sys.argv[1]
print(f"✅ Using provided APIFY_TOKEN: {APIFY_TOKEN[:10]}...")

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

# The dev_fusion actor returns data in a specific format
# Let's handle the most common fields

# Basic info
print(f"👤 Name: {profile.get('name', profile.get('fullName', 'N/A'))}")
print(f"📍 Location: {profile.get('location', profile.get('locationName', 'N/A'))}")
print(f"💼 Headline: {profile.get('headline', profile.get('description', 'N/A'))}")
print(f"🔗 Profile URL: {profile.get('url', profile.get('profileUrl', PROFILE_URL))}")

# Connections/Followers
connections = profile.get('connections', profile.get('connectionsCount', 'N/A'))
followers = profile.get('followers', profile.get('followersCount', 'N/A'))
if connections != 'N/A':
    print(f"🔗 Connections: {connections}")
if followers != 'N/A':
    print(f"👥 Followers: {followers}")

# About section
about = profile.get('about', profile.get('summary', profile.get('aboutSection', '')))
if about:
    print(f"\n📝 About (first 200 chars):")
    print(f"   {about[:200]}...")

# Experience
experience = profile.get('experience', profile.get('positions', []))
if experience:
    print(f"\n💼 Experience ({len(experience)} positions):")
    for i, exp in enumerate(experience[:3]):  # Show first 3
        title = exp.get('title', exp.get('positionTitle', 'N/A'))
        company = exp.get('companyName', exp.get('company', exp.get('organizationName', 'N/A')))
        duration = exp.get('duration', exp.get('timePeriod', ''))
        print(f"   {i+1}. {title} at {company}")
        if duration:
            print(f"      Duration: {duration}")

# Education
education = profile.get('education', profile.get('schools', []))
if education:
    print(f"\n🎓 Education ({len(education)} entries):")
    for i, edu in enumerate(education[:2]):  # Show first 2
        school = edu.get('schoolName', edu.get('school', edu.get('institutionName', 'N/A')))
        degree = edu.get('degree', edu.get('degreeName', edu.get('fieldOfStudy', 'N/A')))
        print(f"   {i+1}. {degree} from {school}")

# Skills
skills = profile.get('skills', [])
if skills:
    print(f"\n⚡ Skills ({len(skills)} total):")
    # Show first 10 skills
    skill_names = []
    for skill in skills[:10]:
        if isinstance(skill, dict):
            skill_names.append(skill.get('name', skill.get('skillName', '')))
        else:
            skill_names.append(str(skill))
    skill_names = [s for s in skill_names if s]  # Filter empty
    if skill_names:
        print(f"   {', '.join(skill_names)}")

# Certifications
certifications = profile.get('certifications', [])
if certifications:
    print(f"\n🏆 Certifications ({len(certifications)} total):")
    for i, cert in enumerate(certifications[:3]):
        cert_name = cert.get('name', cert.get('certificationName', 'N/A'))
        authority = cert.get('authority', cert.get('issuingOrganization', ''))
        print(f"   {i+1}. {cert_name}")
        if authority:
            print(f"      Issued by: {authority}")

# Languages
languages = profile.get('languages', [])
if languages:
    print(f"\n🌐 Languages ({len(languages)} total):")
    for lang in languages:
        if isinstance(lang, dict):
            lang_name = lang.get('name', lang.get('language', ''))
            proficiency = lang.get('proficiency', '')
            if lang_name:
                print(f"   - {lang_name} {f'({proficiency})' if proficiency else ''}")
        else:
            print(f"   - {lang}")

# Additional data available
print(f"\n📊 Additional Data Available:")
available_sections = []
for key, value in profile.items():
    if key not in ['name', 'fullName', 'location', 'locationName', 'headline', 
                   'description', 'url', 'profileUrl', 'about', 'summary', 
                   'aboutSection', 'experience', 'positions', 'education', 
                   'schools', 'skills', 'certifications', 'languages']:
        if value:  # Only show non-empty sections
            if isinstance(value, list):
                available_sections.append(f"{key} ({len(value)} items)")
            elif isinstance(value, dict):
                available_sections.append(f"{key} (structured data)")
            elif isinstance(value, str) and len(value) > 50:
                available_sections.append(f"{key} (text)")
            else:
                available_sections.append(key)

if available_sections:
    for section in available_sections[:10]:  # Show first 10
        print(f"   - {section}")

# Generate analysis-ready summary
summary_file = data_dir / f"anskhalid_linkedin_summary_{timestamp}.json"
summary = {
    "profile_url": PROFILE_URL,
    "scraped_at": datetime.now().isoformat(),
    "actor_used": ACTOR_ID,
    "basic_info": {
        "name": profile.get('name', profile.get('fullName', 'N/A')),
        "headline": profile.get('headline', profile.get('description', 'N/A')),
        "location": profile.get('location', profile.get('locationName', 'N/A')),
        "about": (about[:500] + '...') if about and len(about) > 500 else about,
        "connections": connections,
        "followers": followers
    },
    "content_stats": {
        "experience_count": len(experience),
        "education_count": len(education),
        "skills_count": len(skills),
        "certifications_count": len(certifications),
        "languages_count": len(languages)
    },
    "profile_completeness": {
        "has_profile_image": bool(profile.get('profilePicture', profile.get('photo', profile.get('profileImageUrl', '')))),
        "has_background_image": bool(profile.get('backgroundImage', profile.get('coverPhoto', profile.get('backgroundImageUrl', '')))),
        "has_about_section": bool(about),
        "has_headline": bool(profile.get('headline', profile.get('description', ''))),
        "has_location": bool(profile.get('location', profile.get('locationName', '')))
    },
    "sections_available": list(profile.keys())
}

with open(summary_file, 'w', encoding='utf-8') as f:
    json.dump(summary, f, indent=2, ensure_ascii=False)

print(f"\n📋 Summary saved to: {summary_file}")

# Create a branding insights file
insights_file = data_dir / f"anskhalid_linkedin_insights_{timestamp}.txt"
with open(insights_file, 'w', encoding='utf-8') as f:
    f.write("LinkedIn Profile Insights for Personal Branding\n")
    f.write("=" * 50 + "\n\n")
    
    f.write(f"Profile: {PROFILE_URL}\n")
    f.write(f"Scraped: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
    
    f.write("QUICK WINS FOR PROFILE OPTIMIZATION:\n\n")
    
    # Check profile completeness
    if not profile.get('profilePicture', profile.get('photo', profile.get('profileImageUrl', ''))):
        f.write("❌ Add a professional profile photo\n")
    else:
        f.write("✅ Profile photo present\n")
    
    if not profile.get('backgroundImage', profile.get('coverPhoto', profile.get('backgroundImageUrl', ''))):
        f.write("❌ Add a branded background banner\n")
    else:
        f.write("✅ Background banner present\n")
    
    if not about or len(about) < 100:
        f.write("❌ Expand your About section (aim for 500+ characters)\n")
    else:
        f.write(f"✅ About section has {len(about)} characters\n")
    
    if len(skills) < 10:
        f.write(f"❌ Add more skills (currently {len(skills)}, aim for 20-50)\n")
    else:
        f.write(f"✅ Good skills coverage ({len(skills)} skills listed)\n")
    
    if not certifications:
        f.write("❌ Add relevant certifications to build credibility\n")
    else:
        f.write(f"✅ {len(certifications)} certifications showcase expertise\n")
    
    f.write("\n\nCONTENT STRATEGY INSIGHTS:\n\n")
    
    # Analyze headline for keywords
    headline = profile.get('headline', profile.get('description', ''))
    if headline:
        f.write(f"Current headline: {headline}\n")
        if len(headline) < 50:
            f.write("💡 Expand headline to include more keywords and value proposition\n")
    
    # Experience insights
    if experience:
        f.write(f"\n{len(experience)} positions demonstrate career progression\n")
        latest_role = experience[0] if experience else None
        if latest_role:
            f.write(f"Latest role: {latest_role.get('title', 'N/A')} at {latest_role.get('companyName', latest_role.get('company', 'N/A'))}\n")
    
    f.write("\n\nNEXT STEPS FOR 2025 GROWTH:\n")
    f.write("1. Optimize headline with target keywords\n")
    f.write("2. Create content around your top skills\n")
    f.write("3. Share insights from your experience\n")
    f.write("4. Engage with industry leaders\n")
    f.write("5. Build thought leadership through articles\n")

print(f"💡 Insights saved to: {insights_file}")

print("\n✅ LinkedIn profile scraping complete!")
print("\n🎯 Next steps:")
print("1. Review the raw data file for complete profile information")
print("2. Check the summary file for structured analysis")
print("3. Read the insights file for quick optimization tips")
print("4. Use this data to build your 2025 LinkedIn strategy")

print("\n🚀 Files created:")
print(f"   - Raw data: {raw_file.name}")
print(f"   - Summary: {summary_file.name}")
print(f"   - Insights: {insights_file.name}")