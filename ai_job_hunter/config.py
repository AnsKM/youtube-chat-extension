#!/usr/bin/env python3
"""
AI Job Hunter Configuration
"""

import os
from pathlib import Path

# Project directories
PROJECT_DIR = Path(__file__).parent
DATA_DIR = PROJECT_DIR / "data"
CONFIG_DIR = PROJECT_DIR / "config"

# Ensure directories exist
for dir_path in [DATA_DIR, CONFIG_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)

# Apify Configuration
APIFY_TOKEN = os.getenv('APIFY_TOKEN')

# Apify Actors Configuration
ACTORS = {
    'stepstone': {
        'actor_id': 'jupri/stepstone-scraper',
        'cost_per_1k': 5.00,
        'success_rate': 86,
        'description': 'German job market leader - StepStone.de'
    },
    'indeed': {
        'actor_id': 'misceres/indeed-scraper', 
        'cost_per_1k': 5.00,
        'success_rate': 99,
        'description': 'High-volume international jobs'
    },
    'linkedin': {
        'actor_id': 'bebity/linkedin-jobs-scraper',
        'monthly_cost': 29.99,
        'success_rate': 99,
        'description': 'Professional network jobs'
    },
    'glassdoor': {
        'actor_id': 'bebity/glassdoor-jobs-scraper',
        'monthly_cost': 25.00,
        'success_rate': 99,
        'description': 'Company insights and salaries'
    }
}

# Job Search Configuration
JOB_SEARCH_CONFIG = {
    'keywords': [
        'AI Engineer',
        'AI Consultant', 
        'Machine Learning Engineer',
        'Data Scientist',
        'ML Engineer',
        'Artificial Intelligence',
        'Deep Learning Engineer',
        'MLOps Engineer',
        'AI Research Scientist',
        'Computer Vision Engineer',
        'NLP Engineer',
        'AI Product Manager'
    ],
    
    'locations': {
        'primary': ['Munich', 'München', 'Bavaria', 'Bayern'],
        'secondary': ['Berlin', 'Hamburg', 'Frankfurt', 'Cologne', 'Köln'],
        'remote': ['Remote', 'Home Office', 'Hybrid']
    },
    
    'filters': {
        'experience_levels': ['entry', 'mid', 'senior', 'lead'],
        'employment_types': ['full-time', 'contract', 'freelance'],
        'salary_min': 50000,  # Minimum salary in EUR
        'max_results_per_search': 100
    }
}

# AI Analysis Configuration  
AI_ANALYSIS_CONFIG = {
    'analyze_job_descriptions': True,
    'extract_skills': True,
    'salary_analysis': True,
    'company_analysis': True,
    'generate_insights': True
}

# Output Configuration
OUTPUT_CONFIG = {
    'formats': ['json', 'csv', 'excel'],
    'generate_reports': True,
    'create_dashboard': True,
    'backup_data': True
}

# Rate Limiting
RATE_LIMITS = {
    'stepstone': 2.0,  # seconds between requests
    'indeed': 1.5,
    'linkedin': 3.0,
    'glassdoor': 2.5
}