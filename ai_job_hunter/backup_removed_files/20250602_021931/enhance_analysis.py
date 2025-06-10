#!/usr/bin/env python3
"""
Enhance LinkedIn AI Analysis - Extract Structured Data
Re-process the AI analysis to properly extract structured fields
"""

import sys
import os
import re
from pathlib import Path

# Add core modules to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
sys.path.insert(0, str(Path(__file__).parent))

# Use existing core modules
from core.utils import FileHelpers

def parse_analysis_text_enhanced(analysis_text: str) -> dict:
    """Enhanced parsing of AI analysis text to extract structured data"""
    
    structured = {
        'required_skills': [],
        'experience_level': '',
        'ai_ml_focus': [],
        'responsibilities': '',
        'qualifications': '',
        'company_type': '',
        'work_arrangement': '',
        'salary_insights': '',
        'career_growth': '',
        'attractiveness_score': 0,
        'full_analysis': analysis_text
    }
    
    if not analysis_text:
        return structured
    
    # Extract Required Skills
    skills_section = extract_section_content(analysis_text, "Required Skills")
    if skills_section:
        # Extract common tech skills and consulting skills
        skill_patterns = [
            r'\b(?:Python|R|SQL|Java|JavaScript|Scala)\b',
            r'\b(?:TensorFlow|PyTorch|Keras|scikit-learn)\b',
            r'\b(?:AWS|Azure|GCP|Docker|Kubernetes)\b',
            r'\b(?:Machine Learning|ML|Deep Learning|NLP|Computer Vision)\b',
            r'\b(?:consulting|strategy|project management|stakeholder management)\b',
            r'\b(?:data analysis|statistics|mathematics|analytics)\b'
        ]
        
        all_skills = set()
        for pattern in skill_patterns:
            matches = re.findall(pattern, skills_section, re.IGNORECASE)
            all_skills.update([skill.title() for skill in matches])
        
        structured['required_skills'] = list(all_skills)
    
    # Extract Experience Level
    exp_section = extract_section_content(analysis_text, "Experience Level")
    if exp_section:
        if any(word in exp_section.lower() for word in ['senior', 'lead', 'principal']):
            structured['experience_level'] = 'Senior Level'
        elif any(word in exp_section.lower() for word in ['mid', 'intermediate']):
            structured['experience_level'] = 'Mid Level'
        elif any(word in exp_section.lower() for word in ['entry', 'junior', 'graduate']):
            structured['experience_level'] = 'Entry Level'
        else:
            # Try to extract from the text directly
            level_match = re.search(r'(Senior|Mid|Entry|Junior)\s*(?:level)?', exp_section, re.IGNORECASE)
            if level_match:
                structured['experience_level'] = level_match.group(1).title() + ' Level'
    
    # Extract AI/ML Focus Areas
    focus_section = extract_section_content(analysis_text, "AI/ML Focus Areas")
    if focus_section:
        focus_areas = []
        focus_patterns = [
            r'\b(?:machine learning|ML)\b',
            r'\b(?:deep learning|neural networks)\b',
            r'\b(?:natural language processing|NLP)\b',
            r'\b(?:computer vision|CV)\b',
            r'\b(?:reinforcement learning|RL)\b',
            r'\b(?:data science|analytics)\b',
            r'\b(?:AI strategy|artificial intelligence)\b'
        ]
        
        for pattern in focus_patterns:
            if re.search(pattern, focus_section, re.IGNORECASE):
                # Extract the matched term
                match = re.search(pattern, focus_section, re.IGNORECASE)
                if match:
                    focus_areas.append(match.group(0).lower())
        
        structured['ai_ml_focus'] = list(set(focus_areas))
    
    # Extract Responsibilities
    resp_section = extract_section_content(analysis_text, "Responsibilities")
    if resp_section:
        # Clean up the responsibilities text
        responsibilities = re.sub(r'^\*\s*', '', resp_section, flags=re.MULTILINE)
        structured['responsibilities'] = responsibilities.strip()
    
    # Extract Qualifications
    qual_section = extract_section_content(analysis_text, "Qualifications")
    if qual_section:
        structured['qualifications'] = qual_section.strip()
    
    # Extract Company Type
    company_section = extract_section_content(analysis_text, "Company Type")
    if company_section:
        # Look for company type keywords
        if 'consulting' in company_section.lower():
            structured['company_type'] = 'Management Consulting'
        elif 'tech' in company_section.lower() or 'technology' in company_section.lower():
            structured['company_type'] = 'Technology Company'
        elif 'startup' in company_section.lower():
            structured['company_type'] = 'Startup'
        elif 'enterprise' in company_section.lower():
            structured['company_type'] = 'Enterprise'
        else:
            structured['company_type'] = company_section.strip()[:50]  # Limit length
    
    # Extract Work Arrangement
    work_section = extract_section_content(analysis_text, "Work Arrangement")
    if work_section:
        if 'remote' in work_section.lower():
            structured['work_arrangement'] = 'Remote'
        elif 'hybrid' in work_section.lower():
            structured['work_arrangement'] = 'Hybrid'
        elif 'on-site' in work_section.lower() or 'office' in work_section.lower():
            structured['work_arrangement'] = 'On-site'
        else:
            structured['work_arrangement'] = work_section.strip()[:30]
    
    # Extract Salary Insights
    salary_section = extract_section_content(analysis_text, "Salary Insights")
    if salary_section:
        structured['salary_insights'] = salary_section.strip()
    
    # Extract Career Growth
    growth_section = extract_section_content(analysis_text, "Career Growth Potential")
    if growth_section:
        structured['career_growth'] = growth_section.strip()
    
    # Extract Attractiveness Score
    score_section = extract_section_content(analysis_text, "Job Attractiveness Score")
    if score_section:
        score_match = re.search(r'(\d+)/10', score_section)
        if score_match:
            structured['attractiveness_score'] = int(score_match.group(1))
        else:
            # Look for standalone numbers
            score_match = re.search(r'\b([0-9]|10)\b', score_section)
            if score_match:
                structured['attractiveness_score'] = int(score_match.group(1))
    
    return structured

def extract_section_content(text: str, section_name: str) -> str:
    """Extract content from a specific section in the analysis"""
    if not text:
        return ""
    
    # Try different section patterns
    patterns = [
        rf'\*\*{re.escape(section_name)}\*\*[:\s]*(.+?)(?=\*\*|$)',
        rf'#{1,6}\s*\d*\.?\s*{re.escape(section_name)}[:\s]*(.+?)(?=#{1,6}|\Z)',
        rf'{re.escape(section_name)}[:\s]*(.+?)(?=\n\n|\Z)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            return match.group(1).strip()
    
    return ""

def main():
    """Enhance the existing LinkedIn analysis with better structured data extraction"""
    print("🔧 Enhancing LinkedIn AI Analysis - Structured Data Extraction")
    print("=" * 70)
    
    # Find the most recent LinkedIn analysis file
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
        print(f"❌ No AI analysis file found in {latest_dir}")
        return
    
    print(f"📁 Processing: {analysis_file}")
    
    # Load the analysis data
    files = FileHelpers()
    analyzed_jobs = files.load_json(analysis_file)
    
    if not analyzed_jobs:
        print("❌ Failed to load analysis data")
        return
    
    print(f"📊 Loaded {len(analyzed_jobs)} analyzed jobs")
    
    # Enhance each job analysis
    enhanced_count = 0
    for job in analyzed_jobs:
        ai_analysis = job.get('ai_analysis', {})
        full_analysis = ai_analysis.get('full_analysis', '')
        
        if full_analysis:
            # Re-parse with enhanced extraction
            enhanced_analysis = parse_analysis_text_enhanced(full_analysis)
            
            # Update the analysis with enhanced structured data
            ai_analysis.update(enhanced_analysis)
            enhanced_count += 1
    
    # Save enhanced analysis
    timestamp = analysis_file.stem.split('_')[-1]
    enhanced_file = latest_dir / f"linkedin_enhanced_analysis_{timestamp}.json"
    files.save_json(analyzed_jobs, enhanced_file)
    
    print(f"✅ Enhanced {enhanced_count} job analyses")
    print(f"💾 Saved enhanced analysis: {enhanced_file}")
    
    # Generate enhanced summary
    print(f"\n📊 Enhanced Analysis Summary:")
    
    # Collect all structured data
    all_skills = set()
    experience_levels = {}
    ai_focus_areas = {}
    company_types = {}
    
    for job in analyzed_jobs:
        analysis = job.get('ai_analysis', {})
        
        # Skills
        skills = analysis.get('required_skills', [])
        all_skills.update(skills)
        
        # Experience levels
        exp_level = analysis.get('experience_level', 'Not specified')
        experience_levels[exp_level] = experience_levels.get(exp_level, 0) + 1
        
        # AI focus areas
        focus_areas = analysis.get('ai_ml_focus', [])
        for area in focus_areas:
            ai_focus_areas[area] = ai_focus_areas.get(area, 0) + 1
        
        # Company types
        comp_type = analysis.get('company_type', 'Not specified')
        company_types[comp_type] = company_types.get(comp_type, 0) + 1
    
    print(f"   🛠️  Unique Skills Extracted: {len(all_skills)}")
    if all_skills:
        print(f"      Top Skills: {', '.join(list(all_skills)[:5])}")
    
    print(f"   👔 Experience Levels:")
    for level, count in sorted(experience_levels.items(), key=lambda x: x[1], reverse=True):
        print(f"      • {level}: {count} jobs")
    
    print(f"   🤖 AI Focus Areas:")
    for area, count in sorted(ai_focus_areas.items(), key=lambda x: x[1], reverse=True):
        print(f"      • {area}: {count} jobs")
    
    print(f"   🏢 Company Types:")
    for comp_type, count in sorted(company_types.items(), key=lambda x: x[1], reverse=True):
        print(f"      • {comp_type}: {count} jobs")
    
    print(f"\n🎉 Enhanced analysis complete!")
    print(f"📁 Enhanced file: {enhanced_file}")

if __name__ == "__main__":
    main()