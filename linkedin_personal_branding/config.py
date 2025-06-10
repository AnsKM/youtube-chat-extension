"""
Configuration for LinkedIn Personal Branding project
"""

import os
from pathlib import Path

# Project paths
PROJECT_ROOT = Path(__file__).parent
DATA_DIR = PROJECT_ROOT / "data"
TEMPLATES_DIR = PROJECT_ROOT / "templates"
CONFIG_DIR = PROJECT_ROOT / "config"

# Ensure directories exist
DATA_DIR.mkdir(exist_ok=True)
TEMPLATES_DIR.mkdir(exist_ok=True)
CONFIG_DIR.mkdir(exist_ok=True)

# Apify configuration
APIFY_ACTOR_ID = "dev_fusion/Linkedin-Profile-Scraper"
APIFY_BASE_URL = "https://api.apify.com/v2"

# LinkedIn profile URL (your profile)
TARGET_PROFILE_URL = "https://www.linkedin.com/in/anskhalid/"

# Scraper settings
SCRAPER_CONFIG = {
    "maxDelay": 5,
    "minDelay": 2,
    "proxy": {
        "useApifyProxy": True,
        "apifyProxyGroups": ["RESIDENTIAL"]
    }
}

# Analysis settings
ANALYSIS_CONFIG = {
    "profile_sections": [
        "basic_info",
        "experience",
        "education",
        "skills",
        "certifications",
        "languages",
        "publications",
        "projects",
        "volunteer",
        "accomplishments"
    ],
    "metrics_to_track": [
        "connections_count",
        "followers_count",
        "profile_views",
        "search_appearances",
        "post_impressions"
    ],
    "branding_pillars": [
        "Professional Expertise",
        "Industry Insights",
        "Personal Journey",
        "Educational Content",
        "Community Building"
    ]
}

# Report generation settings
REPORT_CONFIG = {
    "include_sections": [
        "executive_summary",
        "profile_assessment",
        "content_strategy",
        "network_growth",
        "brand_positioning",
        "algorithm_optimization",
        "action_items",
        "metrics_tracking"
    ],
    "time_horizons": {
        "immediate": 7,  # days
        "short_term": 30,  # days
        "long_term": 90  # days
    }
}

# LinkedIn best practices (2025)
LINKEDIN_BEST_PRACTICES = {
    "headline_length": {
        "min": 100,
        "max": 220,
        "optimal": 120
    },
    "about_section_length": {
        "min": 500,
        "max": 2600,
        "optimal": 1000
    },
    "skills_count": {
        "min": 10,
        "max": 50,
        "optimal": 25
    },
    "post_frequency": {
        "min_per_week": 2,
        "max_per_week": 7,
        "optimal_per_week": 4
    },
    "engagement_window": {
        "minutes_after_post": 120  # Engage within 2 hours
    }
}

# Export all configurations
__all__ = [
    'PROJECT_ROOT',
    'DATA_DIR',
    'TEMPLATES_DIR',
    'CONFIG_DIR',
    'APIFY_ACTOR_ID',
    'APIFY_BASE_URL',
    'TARGET_PROFILE_URL',
    'SCRAPER_CONFIG',
    'ANALYSIS_CONFIG',
    'REPORT_CONFIG',
    'LINKEDIN_BEST_PRACTICES'
]