#!/usr/bin/env python3
"""
AI Job Hunter - Test Simulation
Creates realistic sample data to demonstrate functionality without API calls
"""

import sys
import os
import json
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict

# Add core modules to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
sys.path.insert(0, str(Path(__file__).parent))

# Use existing core modules
from core.utils import FileHelpers

def generate_sample_jobs() -> List[Dict]:
    """Generate realistic sample AI Engineer jobs in Munich"""
    
    sample_jobs = [
        {
            "source": "stepstone",
            "title": "Senior AI Engineer - Computer Vision",
            "company": "BMW Group",
            "location": "Munich, Germany",
            "description": "We are looking for a Senior AI Engineer to join our autonomous driving team. You will develop computer vision algorithms for vehicle perception systems using PyTorch and TensorFlow. Requirements: 5+ years experience in ML/AI, strong Python skills, experience with deep learning frameworks.",
            "salary": "€75,000 - €95,000",
            "employment_type": "Full-time",
            "url": "https://stepstone.de/job/bmw-ai-engineer-123",
            "scraped_at": datetime.now().isoformat(),
            "search_keyword": "AI Engineer"
        },
        {
            "source": "indeed",
            "title": "AI Engineer - Natural Language Processing",
            "company": "SAP SE",
            "location": "Munich, Bayern",
            "description": "Join our AI/ML team to develop NLP solutions for enterprise software. You'll work with BERT, GPT models and build conversational AI systems. Required: Master's in CS/AI, 3+ years NLP experience, proficiency in Python, experience with transformers.",
            "salary": "€70,000 - €90,000",
            "employment_type": "Full-time",
            "url": "https://indeed.com/job/sap-nlp-engineer-456",
            "company_rating": "4.2",
            "scraped_at": datetime.now().isoformat(),
            "search_keyword": "AI Engineer"
        },
        {
            "source": "stepstone",
            "title": "Machine Learning Engineer",
            "company": "Siemens AG",
            "location": "München",
            "description": "Develop ML models for industrial IoT applications. Work with time series data, predictive maintenance algorithms. Tech stack: Python, scikit-learn, Docker, Kubernetes, AWS. Looking for 2+ years ML experience.",
            "salary": "€65,000 - €80,000",
            "employment_type": "Full-time",
            "url": "https://stepstone.de/job/siemens-ml-engineer-789",
            "scraped_at": datetime.now().isoformat(),
            "search_keyword": "AI Engineer"
        },
        {
            "source": "indeed",
            "title": "AI Research Engineer",
            "company": "Google Munich",
            "location": "Munich, Germany",
            "description": "Research and develop next-generation AI algorithms. Focus on reinforcement learning and multi-agent systems. PhD in AI/ML preferred, publications in top venues, strong mathematical background, TensorFlow/JAX expertise.",
            "salary": "€90,000 - €120,000",
            "employment_type": "Full-time",
            "url": "https://indeed.com/job/google-ai-research-101",
            "company_rating": "4.5",
            "scraped_at": datetime.now().isoformat(),
            "search_keyword": "AI Engineer"
        },
        {
            "source": "stepstone",
            "title": "AI Engineer - MLOps",
            "company": "Allianz SE",
            "location": "Munich",
            "description": "Build and maintain ML infrastructure for insurance risk models. Experience with MLflow, Kubeflow, CI/CD pipelines. Python, Docker, Kubernetes required. 3+ years DevOps/MLOps experience.",
            "salary": "€68,000 - €85,000",
            "employment_type": "Full-time",
            "url": "https://stepstone.de/job/allianz-mlops-engineer-202",
            "scraped_at": datetime.now().isoformat(),
            "search_keyword": "AI Engineer"
        }
    ]
    
    return sample_jobs

def generate_sample_analysis() -> List[Dict]:
    """Generate sample AI analysis for the jobs"""
    
    analyses = [
        {
            "required_skills": ["Python", "PyTorch", "TensorFlow", "Computer Vision", "Deep Learning"],
            "experience_level": "Senior Level",
            "ai_ml_focus": ["computer vision", "deep learning"],
            "responsibilities": "Develop autonomous driving perception systems",
            "qualifications": "5+ years ML/AI experience, strong Python skills",
            "company_type": "Enterprise Automotive",
            "work_arrangement": "On-site",
            "salary_insights": "€75,000 - €95,000 - competitive for senior level",
            "career_growth": "High growth potential in autonomous vehicle technology",
            "attractiveness_score": 9
        },
        {
            "required_skills": ["Python", "BERT", "GPT", "NLP", "Transformers"],
            "experience_level": "Mid Level",
            "ai_ml_focus": ["natural language processing", "transformers"],
            "responsibilities": "Develop NLP solutions for enterprise software",
            "qualifications": "Master's in CS/AI, 3+ years NLP experience",
            "company_type": "Enterprise Software",
            "work_arrangement": "Hybrid",
            "salary_insights": "€70,000 - €90,000 - good for NLP specialist",
            "career_growth": "Excellent opportunities in enterprise AI",
            "attractiveness_score": 8
        },
        {
            "required_skills": ["Python", "scikit-learn", "Docker", "Kubernetes", "AWS"],
            "experience_level": "Mid Level",
            "ai_ml_focus": ["machine learning", "time series"],
            "responsibilities": "Develop ML models for industrial IoT",
            "qualifications": "2+ years ML experience",
            "company_type": "Industrial Technology",
            "work_arrangement": "On-site",
            "salary_insights": "€65,000 - €80,000 - standard for mid-level",
            "career_growth": "Good opportunities in Industry 4.0",
            "attractiveness_score": 7
        },
        {
            "required_skills": ["TensorFlow", "JAX", "Reinforcement Learning", "Python"],
            "experience_level": "Senior Level",
            "ai_ml_focus": ["reinforcement learning", "research"],
            "responsibilities": "Research next-generation AI algorithms",
            "qualifications": "PhD in AI/ML preferred, publications",
            "company_type": "Tech Giant",
            "work_arrangement": "Hybrid",
            "salary_insights": "€90,000 - €120,000 - excellent for research role",
            "career_growth": "World-class research opportunities",
            "attractiveness_score": 10
        },
        {
            "required_skills": ["Python", "MLflow", "Kubeflow", "Docker", "Kubernetes"],
            "experience_level": "Mid Level",
            "ai_ml_focus": ["MLOps", "machine learning"],
            "responsibilities": "Build and maintain ML infrastructure",
            "qualifications": "3+ years DevOps/MLOps experience",
            "company_type": "Financial Services",
            "work_arrangement": "Hybrid",
            "salary_insights": "€68,000 - €85,000 - competitive for MLOps",
            "career_growth": "High demand for MLOps expertise",
            "attractiveness_score": 8
        }
    ]
    
    return analyses

def generate_market_insights(jobs: List[Dict], analyses: List[Dict]) -> Dict:
    """Generate realistic market insights"""
    
    # Count skills
    all_skills = []
    for analysis in analyses:
        all_skills.extend(analysis.get('required_skills', []))
    
    skill_counts = {}
    for skill in all_skills:
        skill_counts[skill] = skill_counts.get(skill, 0) + 1
    
    # Count experience levels
    level_counts = {}
    for analysis in analyses:
        level = analysis.get('experience_level', 'Unknown')
        level_counts[level] = level_counts.get(level, 0) + 1
    
    # Count companies
    company_counts = {}
    for job in jobs:
        company = job.get('company', 'Unknown')
        company_counts[company] = company_counts.get(company, 0) + 1
    
    insights = {
        'total_jobs_analyzed': len(jobs),
        'top_companies': [{'company': k, 'job_count': v} for k, v in 
                         sorted(company_counts.items(), key=lambda x: x[1], reverse=True)],
        'skill_demand': [{'skill': k, 'demand_count': v} for k, v in 
                        sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)],
        'experience_distribution': level_counts,
        'ai_focus_trends': [
            {'focus_area': 'computer vision', 'job_count': 1},
            {'focus_area': 'natural language processing', 'job_count': 1},
            {'focus_area': 'machine learning', 'job_count': 2},
            {'focus_area': 'MLOps', 'job_count': 1}
        ],
        'salary_insights': {
            'total_with_salary': len(jobs),
            'salary_transparency': f"{len(jobs)}/{len(jobs)} (100%)",
            'sample_salaries': [job.get('salary', '') for job in jobs if job.get('salary')]
        },
        'top_rated_jobs': [
            {'title': 'AI Research Engineer', 'company': 'Google Munich', 'source': 'indeed', 'score': 10, 'url': 'https://indeed.com/job/google-ai-research-101'},
            {'title': 'Senior AI Engineer - Computer Vision', 'company': 'BMW Group', 'source': 'stepstone', 'score': 9, 'url': 'https://stepstone.de/job/bmw-ai-engineer-123'},
            {'title': 'AI Engineer - Natural Language Processing', 'company': 'SAP SE', 'source': 'indeed', 'score': 8, 'url': 'https://indeed.com/job/sap-nlp-engineer-456'}
        ],
        'platform_distribution': {
            'stepstone': 3,
            'indeed': 2
        },
        'generated_at': datetime.now().isoformat()
    }
    
    return insights

def main():
    """Run simulation with sample data"""
    print("🎬 AI Job Hunter - Test Simulation")
    print("=" * 50)
    print("Creating realistic sample data to demonstrate functionality")
    print("")
    
    # Create test output directory
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    test_dir = Path(__file__).parent / "data" / f"simulation_run_{timestamp}"
    test_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"📁 Output directory: {test_dir}")
    
    # Generate sample data
    print("🎭 Generating sample data...")
    jobs = generate_sample_jobs()
    analyses = generate_sample_analysis()
    insights = generate_market_insights(jobs, analyses)
    
    # Combine jobs with analyses
    analyzed_jobs = []
    for i, job in enumerate(jobs):
        analyzed_job = {**job, 'ai_analysis': analyses[i] if i < len(analyses) else {}}
        analyzed_jobs.append(analyzed_job)
    
    print(f"✅ Generated {len(jobs)} sample AI Engineer jobs in Munich")
    
    # Save data using existing file helpers
    files = FileHelpers()
    
    # Save raw results
    raw_results = {
        'stepstone': [job for job in jobs if job['source'] == 'stepstone'],
        'indeed': [job for job in jobs if job['source'] == 'indeed'],
        'summary': {
            'total_jobs': len(jobs),
            'by_platform': {
                'stepstone': len([job for job in jobs if job['source'] == 'stepstone']),
                'indeed': len([job for job in jobs if job['source'] == 'indeed'])
            },
            'search_completed_at': datetime.now().isoformat()
        }
    }
    
    # Save all data
    files.save_json(raw_results, test_dir / f"ai_jobs_complete_{timestamp}.json")
    files.save_json(analyzed_jobs, test_dir / f"analyzed_jobs_{timestamp}.json") 
    files.save_json(insights, test_dir / f"market_insights_{timestamp}.json")
    
    # Save platform-specific data
    stepstone_jobs = [job for job in jobs if job['source'] == 'stepstone']
    indeed_jobs = [job for job in jobs if job['source'] == 'indeed']
    
    if stepstone_jobs:
        files.save_json(stepstone_jobs, test_dir / f"ai_jobs_stepstone_{timestamp}.json")
    if indeed_jobs:
        files.save_json(indeed_jobs, test_dir / f"ai_jobs_indeed_{timestamp}.json")
    
    print(f"💾 Sample data saved to: {test_dir}")
    
    # Generate test report
    generate_simulation_report(raw_results, insights, jobs, test_dir, timestamp)
    
    print(f"\n📊 Simulation Results:")
    print(f"   • Total jobs: {len(jobs)}")
    print(f"   • StepStone: {len(stepstone_jobs)} jobs")
    print(f"   • Indeed: {len(indeed_jobs)} jobs")
    print(f"   • All with AI analysis")
    print(f"   • Market insights generated")
    
    print(f"\n🎉 Simulation completed successfully!")
    print(f"📂 Check results in: {test_dir}")
    
    # Show key insights
    print(f"\n🔍 Key Insights from Simulation:")
    print(f"   📊 Top Skills: {', '.join([s['skill'] for s in insights['skill_demand'][:3]])}")
    print(f"   🏢 Top Company: {insights['top_companies'][0]['company']}")
    print(f"   ⭐ Highest Rated: {insights['top_rated_jobs'][0]['title']} at {insights['top_rated_jobs'][0]['company']}")
    print(f"   💰 Salary Range: €65,000 - €120,000")

def generate_simulation_report(raw_results, insights, jobs, output_dir, timestamp):
    """Generate simulation report"""
    
    report = f"""# AI Job Hunter - Simulation Report
Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
Simulation Run ID: {timestamp}

## 🎭 Simulation Overview
This is a **simulation** using realistic sample data to demonstrate the AI Job Hunter functionality without requiring actual API calls.

## 🎯 Simulated Search
- **Keyword**: AI Engineer
- **Location**: Munich, Germany
- **Sample Size**: {len(jobs)} jobs
- **Platforms**: StepStone + Indeed

## 📊 Results Summary

### Jobs Distribution
- **StepStone**: {len([j for j in jobs if j['source'] == 'stepstone'])} jobs
- **Indeed**: {len([j for j in jobs if j['source'] == 'indeed'])} jobs
- **Total**: {len(jobs)} jobs

### Top Companies (Simulation)
"""
    
    for company in insights['top_companies'][:5]:
        report += f"- **{company['company']}**: {company['job_count']} position(s)\n"
    
    report += f"""
### Most In-Demand Skills
"""
    
    for skill in insights['skill_demand'][:8]:
        report += f"- **{skill['skill']}**: {skill['demand_count']} mentions\n"
    
    report += f"""
### Experience Level Distribution
"""
    
    for level, count in insights['experience_distribution'].items():
        report += f"- **{level}**: {count} positions\n"
    
    report += f"""
### Salary Ranges (Sample Data)
- €65,000 - €80,000 (Mid-level)
- €70,000 - €90,000 (Mid-level specialist)
- €75,000 - €95,000 (Senior level)
- €90,000 - €120,000 (Senior research)

### Top Rated Opportunities
"""
    
    for job in insights['top_rated_jobs'][:3]:
        report += f"- **{job['title']}** at {job['company']} (Score: {job['score']}/10)\n"
    
    report += f"""
## 🔧 AI Analysis Features Demonstrated
✅ **Skill Extraction**: Identified required technical skills from job descriptions
✅ **Experience Classification**: Categorized jobs by seniority level  
✅ **Salary Analysis**: Extracted and analyzed compensation ranges
✅ **Company Intelligence**: Identified top hiring companies
✅ **Job Rating**: AI-scored jobs based on attractiveness (1-10 scale)
✅ **Market Insights**: Generated comprehensive market analysis

## 💰 Cost Analysis (Real Usage)
For this simulation with real APIs:
- **Scraping Cost**: ~$0.05 (5 jobs from each platform)
- **AI Analysis Cost**: ~$0.05 (5 job descriptions)
- **Total Cost**: ~$0.10

## 📁 Generated Files
- `ai_jobs_complete_{timestamp}.json` - Complete raw results
- `ai_jobs_stepstone_{timestamp}.json` - StepStone jobs only
- `ai_jobs_indeed_{timestamp}.json` - Indeed jobs only  
- `analyzed_jobs_{timestamp}.json` - Jobs with AI analysis
- `market_insights_{timestamp}.json` - Market intelligence
- `simulation_report_{timestamp}.md` - This report

## ✅ Demonstration Results
✅ **Job Scraping**: Successfully simulated multi-platform scraping
✅ **Data Processing**: Processed and structured job data
✅ **AI Analysis**: Applied AI analysis to extract insights
✅ **Market Intelligence**: Generated comprehensive market insights
✅ **Report Generation**: Created detailed reports and summaries

## 🚀 Real Usage
To run with real data:
1. Set `APIFY_TOKEN` environment variable
2. Set `GOOGLE_API_KEY` environment variable  
3. Run: `python test_run.py`

---
*Simulation completed successfully*
*AI Job Hunter v1.0.0 - Powered by Claude Code Workflows*
"""
    
    # Save report
    report_file = output_dir / f"simulation_report_{timestamp}.md"
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"📝 Simulation report saved: {report_file}")

if __name__ == "__main__":
    main()