#!/usr/bin/env python3
"""
AI Job Hunter - Interactive Dashboard
Modern, minimalistic multi-page web application for job market analysis
"""

from flask import Flask, render_template, jsonify, request
import json
from pathlib import Path
from datetime import datetime
import re
from collections import Counter, defaultdict

app = Flask(__name__)

# Global variable to store job data
job_data = []

def load_latest_job_data():
    """Load the most recent enhanced job data"""
    global job_data
    
    data_dir = Path(__file__).parent / "data"
    
    # Find the most recent enhanced data directory
    enhanced_dirs = [d for d in data_dir.iterdir() 
                    if d.is_dir() and d.name.startswith("linkedin_enhanced_")]
    
    if not enhanced_dirs:
        # Fall back to any data directory
        all_dirs = [d for d in data_dir.iterdir() if d.is_dir()]
        if not all_dirs:
            return []
        latest_dir = max(all_dirs, key=lambda x: x.name)
    else:
        latest_dir = max(enhanced_dirs, key=lambda x: x.name)
    
    # Find JSON file in the directory
    json_files = list(latest_dir.glob("*.json"))
    if not json_files:
        return []
    
    # Load the data
    with open(json_files[0], 'r', encoding='utf-8') as f:
        job_data = json.load(f)
    
    return job_data

def extract_salary_number(salary_str):
    """Extract average salary from salary string"""
    if not salary_str:
        return None
    
    # Extract numbers from salary string
    numbers = re.findall(r'(\d+),?(\d+)', salary_str.replace(',', ''))
    if len(numbers) >= 2:
        low = int(numbers[0][0] + numbers[0][1])
        high = int(numbers[1][0] + numbers[1][1])
        return (low + high) / 2
    return None

def get_market_statistics():
    """Calculate comprehensive market statistics"""
    stats = {
        'total_jobs': len(job_data),
        'companies': len(set(job['company'] for job in job_data)),
        'avg_applications': 0,
        'salary_range': {'min': 0, 'max': 0, 'avg': 0},
        'experience_distribution': {},
        'company_distribution': {},
        'employment_types': {},
        'location_distribution': {},
        'posting_timeline': {},
        'top_skills': [],
        'industry_breakdown': {}
    }
    
    if not job_data:
        return stats
    
    # Calculate average applications
    total_apps = 0
    app_count = 0
    
    salaries = []
    
    for job in job_data:
        # Applications
        apps_str = job.get('applications', '0')
        apps_num = int(re.search(r'\d+', apps_str).group()) if re.search(r'\d+', apps_str) else 0
        if apps_num > 0:
            total_apps += apps_num
            app_count += 1
        
        # Salary
        salary = extract_salary_number(job.get('salary', ''))
        if salary:
            salaries.append(salary)
        
        # Experience level
        exp_level = job.get('experience_level', 'Not specified')
        stats['experience_distribution'][exp_level] = stats['experience_distribution'].get(exp_level, 0) + 1
        
        # Company
        company = job.get('company', 'Unknown')
        stats['company_distribution'][company] = stats['company_distribution'].get(company, 0) + 1
        
        # Employment type
        emp_type = job.get('employment_type', 'Not specified')
        stats['employment_types'][emp_type] = stats['employment_types'].get(emp_type, 0) + 1
        
        # Location
        location = job.get('location', 'Unknown')
        # Simplify location to main format
        if 'Munich' in location or 'München' in location:
            location_key = 'Munich'
        else:
            location_key = 'Other'
        stats['location_distribution'][location_key] = stats['location_distribution'].get(location_key, 0) + 1
        
        # Posting timeline
        posted = job.get('posted_date', 'Unknown')
        stats['posting_timeline'][posted] = stats['posting_timeline'].get(posted, 0) + 1
    
    # Calculate averages
    if app_count > 0:
        stats['avg_applications'] = round(total_apps / app_count)
    
    if salaries:
        stats['salary_range']['min'] = int(min(salaries))
        stats['salary_range']['max'] = int(max(salaries))
        stats['salary_range']['avg'] = int(sum(salaries) / len(salaries))
    
    # Extract top skills from job descriptions
    skills = extract_top_skills()
    stats['top_skills'] = skills[:10]
    
    # Industry breakdown
    stats['industry_breakdown'] = categorize_by_industry()
    
    return stats

def extract_top_skills():
    """Extract and count top skills from job descriptions"""
    skill_keywords = [
        'Python', 'R', 'SQL', 'Java', 'JavaScript', 'Scala',
        'TensorFlow', 'PyTorch', 'Keras', 'scikit-learn',
        'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
        'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision',
        'Data Science', 'Statistics', 'Analytics',
        'Consulting', 'Strategy', 'Project Management',
        'Leadership', 'Communication', 'Stakeholder Management'
    ]
    
    skill_count = Counter()
    
    for job in job_data:
        description = job.get('description', '') + ' ' + job.get('ai_job_analysis', '')
        description_lower = description.lower()
        
        for skill in skill_keywords:
            if skill.lower() in description_lower:
                skill_count[skill] += 1
    
    return [(skill, count) for skill, count in skill_count.most_common()]

def categorize_by_industry():
    """Categorize companies by industry"""
    industry_map = {
        'Management Consulting': ['McKinsey', 'BCG', 'Bain', 'Oliver Wyman', 'Roland Berger'],
        'Technology': ['Google', 'Microsoft', 'IBM', 'SAP'],
        'Big 4 Consulting': ['Deloitte', 'PwC', 'KPMG', 'EY'],
        'Tech Consulting': ['Accenture', 'Capgemini'],
        'Automotive': ['BMW', 'Audi', 'Mercedes'],
        'Financial Services': ['Deutsche Bank', 'Allianz'],
        'Industrial': ['Siemens'],
        'Academia': ['TUM.ai']
    }
    
    industry_count = defaultdict(int)
    
    for job in job_data:
        company = job.get('company', '')
        categorized = False
        
        for industry, companies in industry_map.items():
            if any(comp in company for comp in companies):
                industry_count[industry] += 1
                categorized = True
                break
        
        if not categorized:
            industry_count['Other'] += 1
    
    return dict(industry_count)

@app.route('/')
def index():
    """Dashboard page"""
    stats = get_market_statistics()
    return render_template('dashboard.html', stats=stats)

@app.route('/jobs')
def jobs():
    """Jobs listing page"""
    # Get filter parameters
    exp_level = request.args.get('experience', 'all')
    company_type = request.args.get('company', 'all')
    sort_by = request.args.get('sort', 'date')
    
    # Filter jobs
    filtered_jobs = job_data.copy()
    
    # Filter by experience level
    if exp_level != 'all':
        filtered_jobs = [job for job in filtered_jobs if job.get('experience_level', '').lower() == exp_level.lower()]
    
    # Filter by company type
    if company_type != 'all':
        if company_type == 'big4':
            big4_companies = ['Deloitte', 'PwC', 'KPMG', 'EY']
            filtered_jobs = [job for job in filtered_jobs if any(comp in job.get('company', '') for comp in big4_companies)]
        elif company_type == 'tech':
            tech_companies = ['Google', 'Microsoft', 'IBM', 'SAP', 'Apple', 'Amazon']
            filtered_jobs = [job for job in filtered_jobs if any(comp in job.get('company', '') for comp in tech_companies)]
        elif company_type == 'consulting':
            consulting_companies = ['McKinsey', 'BCG', 'Bain', 'Oliver Wyman', 'Roland Berger', 'Accenture', 'Capgemini']
            filtered_jobs = [job for job in filtered_jobs if any(comp in job.get('company', '') for comp in consulting_companies)]
    
    # Sort jobs
    if sort_by == 'applications':
        # Extract number from applications string
        def get_app_count(job):
            apps_str = job.get('applications', '0')
            import re
            match = re.search(r'\d+', apps_str)
            return int(match.group()) if match else 0
        filtered_jobs.sort(key=get_app_count, reverse=True)
    elif sort_by == 'salary':
        # Extract average salary
        def get_avg_salary(job):
            salary = extract_salary_number(job.get('salary', ''))
            return salary if salary else 0
        filtered_jobs.sort(key=get_avg_salary, reverse=True)
    else:  # Default sort by date
        # Sort by posted date (most recent first)
        def get_days_ago(job):
            posted = job.get('posted_date', '99 days ago')
            import re
            match = re.search(r'\d+', posted)
            return int(match.group()) if match else 99
        filtered_jobs.sort(key=get_days_ago)
    
    # Pagination
    page = request.args.get('page', 1, type=int)
    per_page = 10
    
    start = (page - 1) * per_page
    end = start + per_page
    
    total_filtered = len(filtered_jobs)
    total_pages = (total_filtered + per_page - 1) // per_page
    
    # Get unique experience levels and companies for filter options
    all_exp_levels = sorted(set(job.get('experience_level', '') for job in job_data if job.get('experience_level')))
    
    return render_template('jobs.html', 
                         jobs=filtered_jobs[start:end],
                         page=page,
                         total_pages=total_pages,
                         total_jobs=total_filtered,
                         all_jobs_count=len(job_data),
                         current_filters={
                             'experience': exp_level,
                             'company': company_type,
                             'sort': sort_by
                         },
                         experience_levels=all_exp_levels)

@app.route('/analytics')
def analytics():
    """Advanced analytics page"""
    stats = get_market_statistics()
    
    # Prepare data for various charts
    analytics_data = {
        'salary_by_level': get_salary_by_experience(),
        'applications_by_company': get_applications_by_company(),
        'job_growth_timeline': get_job_growth_timeline(),
        'skills_demand': stats['top_skills'][:15],
        'company_competitiveness': get_company_competitiveness()
    }
    
    return render_template('analytics.html', 
                         stats=stats,
                         analytics=analytics_data)

@app.route('/job/<int:job_id>')
def job_detail(job_id):
    """Individual job detail page"""
    if 0 <= job_id < len(job_data):
        job = job_data[job_id]
        
        # Extract AI score from analysis
        ai_score = 8  # Default
        if 'ai_job_analysis' in job:
            score_match = re.search(r'Score:\s*(\d+)/10', job['ai_job_analysis'])
            if score_match:
                ai_score = int(score_match.group(1))
        
        # Add score to job data
        job['ai_score'] = ai_score
        
        return render_template('job_detail.html', job=job, job_id=job_id)
    
    return "Job not found", 404

@app.route('/api/market-data')
def api_market_data():
    """API endpoint for chart data"""
    stats = get_market_statistics()
    
    # Prepare data for charts
    chart_data = {
        'experience_chart': {
            'labels': list(stats['experience_distribution'].keys()),
            'data': list(stats['experience_distribution'].values())
        },
        'company_chart': {
            'labels': list(stats['company_distribution'].keys())[:10],
            'data': list(stats['company_distribution'].values())[:10]
        },
        'timeline_chart': {
            'labels': sorted(stats['posting_timeline'].keys(), 
                           key=lambda x: int(x.split()[0]) if x != 'Unknown' else 99),
            'data': [stats['posting_timeline'][k] for k in sorted(stats['posting_timeline'].keys(),
                    key=lambda x: int(x.split()[0]) if x != 'Unknown' else 99)]
        },
        'industry_chart': {
            'labels': list(stats['industry_breakdown'].keys()),
            'data': list(stats['industry_breakdown'].values())
        }
    }
    
    return jsonify(chart_data)

def get_salary_by_experience():
    """Get average salary by experience level"""
    salary_by_exp = defaultdict(list)
    
    for job in job_data:
        exp_level = job.get('experience_level', 'Unknown')
        salary = extract_salary_number(job.get('salary', ''))
        if salary:
            salary_by_exp[exp_level].append(salary)
    
    result = {}
    for exp, salaries in salary_by_exp.items():
        if salaries:
            result[exp] = int(sum(salaries) / len(salaries))
    
    return result

def get_applications_by_company():
    """Get average applications by company type"""
    apps_by_company = defaultdict(list)
    
    for job in job_data:
        company = job.get('company', 'Unknown')
        apps_str = job.get('applications', '0')
        apps_num = int(re.search(r'\d+', apps_str).group()) if re.search(r'\d+', apps_str) else 0
        
        if apps_num > 0:
            apps_by_company[company].append(apps_num)
    
    result = {}
    for company, apps in apps_by_company.items():
        if apps:
            result[company] = int(sum(apps) / len(apps))
    
    # Return top 10
    return dict(sorted(result.items(), key=lambda x: x[1], reverse=True)[:10])

def get_job_growth_timeline():
    """Simulate job growth over time"""
    # This would use real data in production
    return {
        '7 days ago': 5,
        '6 days ago': 8,
        '5 days ago': 7,
        '4 days ago': 9,
        '3 days ago': 11,
        '2 days ago': 6,
        '1 day ago': 4
    }

def get_company_competitiveness():
    """Calculate company competitiveness score"""
    scores = {}
    
    for job in job_data:
        company = job.get('company', 'Unknown')
        
        # Factors: applications, salary, number of positions
        apps_str = job.get('applications', '0')
        apps_num = int(re.search(r'\d+', apps_str).group()) if re.search(r'\d+', apps_str) else 0
        
        salary = extract_salary_number(job.get('salary', ''))
        
        if company not in scores:
            scores[company] = {'apps': [], 'salaries': [], 'count': 0}
        
        if apps_num > 0:
            scores[company]['apps'].append(apps_num)
        if salary:
            scores[company]['salaries'].append(salary)
        scores[company]['count'] += 1
    
    # Calculate competitiveness score
    result = {}
    for company, data in scores.items():
        score = 0
        
        # Average applications (higher = more competitive)
        if data['apps']:
            avg_apps = sum(data['apps']) / len(data['apps'])
            score += min(avg_apps / 20, 10)  # Normalize to 0-10
        
        # Average salary (higher = more attractive)
        if data['salaries']:
            avg_salary = sum(data['salaries']) / len(data['salaries'])
            score += min(avg_salary / 20000, 10)  # Normalize to 0-10
        
        # Number of positions (more = more opportunities)
        score += min(data['count'] * 2, 10)  # Normalize to 0-10
        
        result[company] = round(score / 3, 1)  # Average of three factors
    
    # Return top 15
    return dict(sorted(result.items(), key=lambda x: x[1], reverse=True)[:15])

if __name__ == '__main__':
    # Load job data on startup
    job_data = load_latest_job_data()
    print(f"Loaded {len(job_data)} jobs")
    
    # Run the app on port 8080
    app.run(debug=True, host='0.0.0.0', port=8080)