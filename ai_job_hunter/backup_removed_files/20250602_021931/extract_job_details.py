#!/usr/bin/env python3
"""
Extract Job Details from LinkedIn Analysis
Show exactly where the important details are stored and how to access them
"""

import sys
import os
import json
import re
from pathlib import Path

# Add core modules to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
sys.path.insert(0, str(Path(__file__).parent))

# Use existing core modules
from core.utils import FileHelpers

def extract_structured_details_from_full_analysis(full_analysis_text):
    """Extract key details from the full_analysis text"""
    
    details = {
        'required_skills': [],
        'responsibilities': [],
        'qualifications': [],
        'experience_level': '',
        'salary_insights': '',
        'career_growth': '',
        'work_arrangement': '',
        'company_type': '',
        'attractiveness_score': 0
    }
    
    if not full_analysis_text:
        return details
    
    # Extract Required Skills section
    skills_match = re.search(r'\*\*1\.\s*Required Skills:\*\*\s*(.*?)(?=\*\*2\.|$)', full_analysis_text, re.DOTALL | re.IGNORECASE)
    if skills_match:
        skills_text = skills_match.group(1)
        # Extract specific technologies mentioned
        tech_patterns = [
            r'\b(?:Python|R|Java|JavaScript|SQL|Scala)\b',
            r'\b(?:TensorFlow|PyTorch|Keras|scikit-learn)\b', 
            r'\b(?:AWS|Azure|GCP|Docker|Kubernetes)\b',
            r'\b(?:Machine Learning|ML|Deep Learning|NLP|Computer Vision)\b'
        ]
        
        found_skills = set()
        for pattern in tech_patterns:
            matches = re.findall(pattern, skills_text, re.IGNORECASE)
            found_skills.update(matches)
        
        details['required_skills'] = list(found_skills)
    
    # Extract Responsibilities section
    resp_match = re.search(r'\*\*4\.\s*Responsibilities:\*\*\s*(.*?)(?=\*\*5\.|$)', full_analysis_text, re.DOTALL | re.IGNORECASE)
    if resp_match:
        resp_text = resp_match.group(1).strip()
        # Extract bullet points
        responsibilities = re.findall(r'\*\s*(.+?)(?=\n|$)', resp_text)
        details['responsibilities'] = [resp.strip() for resp in responsibilities if resp.strip()]
    
    # Extract Qualifications section
    qual_match = re.search(r'\*\*5\.\s*Qualifications:\*\*\s*(.*?)(?=\*\*6\.|$)', full_analysis_text, re.DOTALL | re.IGNORECASE)
    if qual_match:
        qual_text = qual_match.group(1).strip()
        details['qualifications'] = [qual_text] if qual_text else []
    
    # Extract Experience Level
    exp_match = re.search(r'\*\*2\.\s*Experience Level:\*\*\s*(.*?)(?=\*\*3\.|$)', full_analysis_text, re.DOTALL | re.IGNORECASE)
    if exp_match:
        exp_text = exp_match.group(1).strip()
        details['experience_level'] = exp_text
    
    # Extract Salary Insights
    salary_match = re.search(r'\*\*8\.\s*Salary Insights:\*\*\s*(.*?)(?=\*\*9\.|$)', full_analysis_text, re.DOTALL | re.IGNORECASE)
    if salary_match:
        salary_text = salary_match.group(1).strip()
        details['salary_insights'] = salary_text
    
    # Extract Career Growth
    growth_match = re.search(r'\*\*9\.\s*Career Growth Potential:\*\*\s*(.*?)(?=\*\*10\.|$)', full_analysis_text, re.DOTALL | re.IGNORECASE)
    if growth_match:
        growth_text = growth_match.group(1).strip()
        details['career_growth'] = growth_text
    
    # Extract Company Type
    company_match = re.search(r'\*\*6\.\s*Company Type:\*\*\s*(.*?)(?=\*\*7\.|$)', full_analysis_text, re.DOTALL | re.IGNORECASE)
    if company_match:
        company_text = company_match.group(1).strip()
        details['company_type'] = company_text
    
    # Extract Work Arrangement
    work_match = re.search(r'\*\*7\.\s*Work Arrangement:\*\*\s*(.*?)(?=\*\*8\.|$)', full_analysis_text, re.DOTALL | re.IGNORECASE)
    if work_match:
        work_text = work_match.group(1).strip()
        details['work_arrangement'] = work_text
    
    # Extract Attractiveness Score
    score_match = re.search(r'\*\*10\.\s*Job Attractiveness Score:\*\*\s*(\d+)/10', full_analysis_text, re.IGNORECASE)
    if score_match:
        details['attractiveness_score'] = int(score_match.group(1))
    
    return details

def main():
    """Extract and display job details from LinkedIn analysis"""
    print("📋 LinkedIn Job Details Extractor")
    print("=" * 50)
    
    # Load the LinkedIn analysis
    data_dir = Path(__file__).parent / "data"
    linkedin_dirs = [d for d in data_dir.iterdir() if d.is_dir() and d.name.startswith("linkedin_ai_consultant_")]
    
    if not linkedin_dirs:
        print("❌ No LinkedIn data found.")
        return
    
    latest_dir = max(linkedin_dirs, key=lambda x: x.name)
    analysis_file = None
    
    for file in latest_dir.iterdir():
        if file.name.startswith("linkedin_ai_analysis_") and file.name.endswith(".json"):
            analysis_file = file
            break
    
    if not analysis_file:
        print(f"❌ No analysis file found")
        return
    
    print(f"📁 Reading: {analysis_file}")
    
    # Load and process
    files = FileHelpers()
    jobs = files.load_json(analysis_file)
    
    print(f"📊 Processing {len(jobs)} jobs...\n")
    
    # Extract and display details for each job
    for i, job in enumerate(jobs, 1):
        print(f"🔍 Job {i}: {job.get('title', 'Unknown Title')}")
        print(f"🏢 Company: {job.get('company', 'Unknown Company')}")
        print(f"💰 Salary: {job.get('salary', 'Not specified')}")
        print(f"📅 Posted: {job.get('posted_date', 'Unknown')}")
        print(f"👥 Applications: {job.get('applications', 'Unknown')}")
        
        # Get AI analysis
        ai_analysis = job.get('ai_analysis', {})
        full_analysis = ai_analysis.get('full_analysis', '')
        
        if full_analysis:
            print(f"\n🤖 AI Analysis Available:")
            
            # Extract structured details
            details = extract_structured_details_from_full_analysis(full_analysis)
            
            if details['required_skills']:
                print(f"   🛠️  Required Skills: {', '.join(details['required_skills'])}")
            
            if details['responsibilities']:
                print(f"   📋 Key Responsibilities:")
                for resp in details['responsibilities'][:3]:  # Show top 3
                    print(f"      • {resp}")
            
            if details['experience_level']:
                print(f"   👔 Experience Level: {details['experience_level']}")
            
            if details['company_type']:
                print(f"   🏢 Company Type: {details['company_type']}")
            
            if details['work_arrangement']:
                print(f"   🏠 Work Arrangement: {details['work_arrangement']}")
            
            if details['salary_insights']:
                print(f"   💰 Salary Analysis: {details['salary_insights'][:100]}...")
            
            if details['career_growth']:
                print(f"   📈 Career Growth: {details['career_growth'][:100]}...")
            
            if details['attractiveness_score']:
                print(f"   ⭐ AI Score: {details['attractiveness_score']}/10")
        
        else:
            print(f"   ❌ No AI analysis available")
        
        print(f"\n" + "="*60 + "\n")
    
    # Summary of where to find the data
    print(f"📍 Data Location Summary:")
    print(f"=" * 30)
    print(f"✅ **Basic job info** is in the main job object:")
    print(f"   • job['title'] - Job title")
    print(f"   • job['company'] - Company name")
    print(f"   • job['salary'] - Salary range")
    print(f"   • job['posted_date'] - When posted")
    print(f"   • job['applications'] - Application count")
    print(f"   • job['description'] - Job description")
    print(f"   • job['url'] - LinkedIn URL")
    
    print(f"\n✅ **Detailed analysis** is in job['ai_analysis']['full_analysis']:")
    print(f"   • Contains structured sections 1-10")
    print(f"   • Required Skills, Responsibilities, Qualifications")
    print(f"   • Experience Level, Company Type, Work Arrangement")
    print(f"   • Salary Insights, Career Growth, Attractiveness Score")
    
    print(f"\n💡 **To access structured data**:")
    print(f"   Use the extract_structured_details_from_full_analysis() function")
    print(f"   Or parse the 'full_analysis' text manually")
    
    print(f"\n🎯 **Recommendation**: The most valuable information is in:")
    print(f"   1. job['ai_analysis']['full_analysis'] - Complete detailed analysis")
    print(f"   2. Basic job fields (title, company, salary, etc.) - Quick overview")

if __name__ == "__main__":
    main()