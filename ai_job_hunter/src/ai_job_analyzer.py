#!/usr/bin/env python3
"""
AI Job Analyzer - Intelligent Analysis of Job Postings
Uses existing core AI modules for job description analysis
"""

import sys
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime
import re

# Add core modules to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

# Use existing core modules (following AI_CODER_INSTRUCTIONS.md)
from core.ai import GeminiClient
from core.utils import DataHelpers, FileHelpers

class AIJobAnalyzer:
    """Analyze job postings using existing AI infrastructure"""
    
    def __init__(self):
        """Initialize with existing core modules"""
        self.ai_client = GeminiClient()  # Use existing AI client
        self.data = DataHelpers()        # Use existing data utilities
        self.files = FileHelpers()       # Use existing file utilities
        
    def analyze_job_description(self, job: Dict) -> Dict:
        """Analyze a single job description using Gemini AI"""
        
        description = job.get('description', '')
        title = job.get('title', '')
        company = job.get('company', '')
        
        if not description:
            return {'error': 'No job description available'}
        
        # Create analysis prompt
        prompt = f"""Analyze this AI/tech job posting and extract key information:

**Job Title:** {title}
**Company:** {company}
**Description:** {description}

Please provide a structured analysis with:

## 1. Required Skills
List the technical skills, programming languages, and tools mentioned.

## 2. Experience Level
Determine if this is entry-level, mid-level, senior, or lead position.

## 3. AI/ML Focus Areas
Identify specific AI/ML domains (e.g., computer vision, NLP, deep learning, MLOps).

## 4. Responsibilities
Summarize the main job responsibilities.

## 5. Qualifications
List education requirements and certifications.

## 6. Company Type
Identify if it's a startup, enterprise, consultancy, or tech company.

## 7. Work Arrangement
Determine if it's remote, on-site, or hybrid.

## 8. Salary Insights
If salary information is available, analyze the compensation range.

## 9. Career Growth Potential
Assess opportunities for advancement and learning.

## 10. Job Attractiveness Score
Rate from 1-10 based on role quality, company, and growth potential.

Format the response as clear, structured text."""

        try:
            # Use existing AI client
            analysis_text = self.ai_client.generate_content(prompt)
            
            # Extract structured data from analysis
            structured_analysis = self._parse_analysis_text(analysis_text)
            
            # Add metadata
            structured_analysis.update({
                'original_job': {
                    'title': title,
                    'company': company,
                    'source': job.get('source', ''),
                    'url': job.get('url', '')
                },
                'analysis_date': datetime.now().isoformat(),
                'analyzer_version': '1.0.0'
            })
            
            return structured_analysis
            
        except Exception as e:
            return {'error': f'Analysis failed: {str(e)}'}
    
    def _parse_analysis_text(self, analysis_text: str) -> Dict:
        """Parse structured analysis from AI response"""
        
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
        
        # Extract skills (basic parsing - could be enhanced)
        skills_section = self._extract_section(analysis_text, "Required Skills")
        if skills_section:
            # Extract common tech skills
            tech_skills = re.findall(r'\b(?:Python|Java|JavaScript|R|SQL|TensorFlow|PyTorch|Keras|Docker|Kubernetes|AWS|Azure|GCP|Git|Linux|Spark|Hadoop|MongoDB|PostgreSQL|React|Vue|Angular|Node\.js|Django|Flask|FastAPI|Pandas|NumPy|Scikit-learn|OpenCV|NLTK|spaCy|Transformers|BERT|GPT|LLM|MLOps|Airflow|Jenkins|Tableau|PowerBI|Jupyter|VS Code|IntelliJ|Eclipse)\b', skills_section, re.IGNORECASE)
            structured['required_skills'] = list(set(tech_skills))
        
        # Extract experience level
        experience_section = self._extract_section(analysis_text, "Experience Level")
        if experience_section:
            if any(word in experience_section.lower() for word in ['entry', 'junior', 'graduate', 'trainee']):
                structured['experience_level'] = 'Entry Level'
            elif any(word in experience_section.lower() for word in ['senior', 'lead', 'principal', 'staff']):
                structured['experience_level'] = 'Senior Level'
            else:
                structured['experience_level'] = 'Mid Level'
        
        # Extract AI/ML focus areas
        ai_focus_section = self._extract_section(analysis_text, "AI/ML Focus Areas")
        if ai_focus_section:
            focus_areas = re.findall(r'\b(?:computer vision|CV|natural language processing|NLP|machine learning|ML|deep learning|DL|reinforcement learning|RL|MLOps|data science|neural networks|transformers|LLM|large language models|generative AI|computer vision|image processing|speech recognition|recommender systems|time series|anomaly detection|predictive modeling)\b', ai_focus_section, re.IGNORECASE)
            structured['ai_ml_focus'] = list(set(focus_areas))
        
        # Extract attractiveness score
        score_match = re.search(r'(\d+)/10|(\d+)\s*out of 10|score.*?(\d+)', analysis_text, re.IGNORECASE)
        if score_match:
            score = next((int(g) for g in score_match.groups() if g), 0)
            structured['attractiveness_score'] = min(max(score, 1), 10)
        
        return structured
    
    def _extract_section(self, text: str, section_name: str) -> str:
        """Extract a specific section from the analysis text"""
        pattern = rf'##\s*\d*\.?\s*{re.escape(section_name)}.*?\n(.*?)(?=##|\Z)'
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        return match.group(1).strip() if match else ""
    
    def analyze_job_batch(self, jobs: List[Dict], batch_size: int = 5) -> List[Dict]:
        """Analyze multiple jobs with rate limiting"""
        
        analyzed_jobs = []
        
        for i, job in enumerate(jobs):
            print(f"🤖 Analyzing job {i+1}/{len(jobs)}: {job.get('title', 'Unknown')}")
            
            analysis = self.analyze_job_description(job)
            
            # Combine original job data with analysis
            analyzed_job = {**job, 'ai_analysis': analysis}
            analyzed_jobs.append(analyzed_job)
            
            # Rate limiting to avoid API limits
            if (i + 1) % batch_size == 0 and i < len(jobs) - 1:
                print("⏳ Pausing for rate limiting...")
                import time
                time.sleep(2)
        
        return analyzed_jobs
    
    def generate_market_insights(self, analyzed_jobs: List[Dict]) -> Dict:
        """Generate market insights from analyzed jobs"""
        
        if not analyzed_jobs:
            return {'error': 'No jobs to analyze'}
        
        # Use existing data utilities for statistics
        insights = {
            'total_jobs_analyzed': len(analyzed_jobs),
            'top_companies': self._get_top_companies(analyzed_jobs),
            'skill_demand': self._analyze_skill_demand(analyzed_jobs),
            'experience_distribution': self._analyze_experience_levels(analyzed_jobs),
            'ai_focus_trends': self._analyze_ai_focus_areas(analyzed_jobs),
            'salary_insights': self._analyze_salaries(analyzed_jobs),
            'top_rated_jobs': self._get_top_rated_jobs(analyzed_jobs),
            'platform_distribution': self._analyze_platforms(analyzed_jobs),
            'generated_at': datetime.now().isoformat()
        }
        
        return insights
    
    def _get_top_companies(self, jobs: List[Dict]) -> List[Dict]:
        """Get top companies by job count"""
        company_counts = {}
        for job in jobs:
            company = job.get('company', 'Unknown')
            company_counts[company] = company_counts.get(company, 0) + 1
        
        return [{'company': k, 'job_count': v} for k, v in 
                sorted(company_counts.items(), key=lambda x: x[1], reverse=True)[:10]]
    
    def _analyze_skill_demand(self, jobs: List[Dict]) -> List[Dict]:
        """Analyze most in-demand skills"""
        skill_counts = {}
        for job in jobs:
            analysis = job.get('ai_analysis', {})
            skills = analysis.get('required_skills', [])
            for skill in skills:
                skill_counts[skill] = skill_counts.get(skill, 0) + 1
        
        return [{'skill': k, 'demand_count': v} for k, v in 
                sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:15]]
    
    def _analyze_experience_levels(self, jobs: List[Dict]) -> Dict:
        """Analyze experience level distribution"""
        level_counts = {}
        for job in jobs:
            analysis = job.get('ai_analysis', {})
            level = analysis.get('experience_level', 'Unknown')
            level_counts[level] = level_counts.get(level, 0) + 1
        
        return level_counts
    
    def _analyze_ai_focus_areas(self, jobs: List[Dict]) -> List[Dict]:
        """Analyze AI/ML focus area trends"""
        focus_counts = {}
        for job in jobs:
            analysis = job.get('ai_analysis', {})
            areas = analysis.get('ai_ml_focus', [])
            for area in areas:
                focus_counts[area] = focus_counts.get(area, 0) + 1
        
        return [{'focus_area': k, 'job_count': v} for k, v in 
                sorted(focus_counts.items(), key=lambda x: x[1], reverse=True)[:10]]
    
    def _analyze_salaries(self, jobs: List[Dict]) -> Dict:
        """Analyze salary information"""
        salaries = []
        for job in jobs:
            salary_str = job.get('salary', '')
            if salary_str and any(char.isdigit() for char in salary_str):
                salaries.append(salary_str)
        
        return {
            'total_with_salary': len(salaries),
            'salary_transparency': f"{len(salaries)}/{len(jobs)} ({len(salaries)/len(jobs)*100:.1f}%)",
            'sample_salaries': salaries[:5]
        }
    
    def _get_top_rated_jobs(self, jobs: List[Dict]) -> List[Dict]:
        """Get highest rated jobs by AI analysis"""
        rated_jobs = []
        for job in jobs:
            analysis = job.get('ai_analysis', {})
            score = analysis.get('attractiveness_score', 0)
            if score > 0:
                rated_jobs.append({
                    'title': job.get('title', ''),
                    'company': job.get('company', ''),
                    'source': job.get('source', ''),
                    'score': score,
                    'url': job.get('url', '')
                })
        
        return sorted(rated_jobs, key=lambda x: x['score'], reverse=True)[:10]
    
    def _analyze_platforms(self, jobs: List[Dict]) -> Dict:
        """Analyze distribution across platforms"""
        platform_counts = {}
        for job in jobs:
            platform = job.get('source', 'Unknown')
            platform_counts[platform] = platform_counts.get(platform, 0) + 1
        
        return platform_counts