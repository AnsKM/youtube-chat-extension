#!/usr/bin/env python3
"""
LinkedIn Personal Branding Web Application
Interactive dashboard for managing LinkedIn transformation
"""

import os
import sys
import json
import requests
import time
from pathlib import Path
from datetime import datetime, timedelta
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, session, send_file
from werkzeug.utils import secure_filename

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import existing tools
# Note: Commented out because the module expects command line args
# try:
#     from tools.scrapers.scrape_linkedin_with_token import scrape_profile_with_token
# except ImportError:
#     pass

app = Flask(__name__)
app.secret_key = 'linkedin_branding_secret_key'

# Configuration
BASE_DIR = Path(__file__).parent.parent
PROGRESS_DIR = BASE_DIR / "progress_tracking"
STRATEGY_DIR = BASE_DIR / "strategy"
RESEARCH_DIR = BASE_DIR / "research"
TOOLS_DIR = BASE_DIR / "tools"
SETTINGS_FILE = BASE_DIR / "web_app" / "app_settings.json"

# In-memory storage for API tokens (in production, use encrypted database)
app_settings = {
    'apify_token': '',
    'google_api_key': '',
    'openai_api_key': ''
}

# In-memory storage for profile data
current_profile_data = {
    'headline': 'Cyber Security Analyst and AI Engineer',
    'about_section': '',
    'connections': 366,
    'followers': 405,
    'location': '',
    'last_updated': None
}

# Load settings on startup
def load_settings():
    global app_settings
    try:
        if SETTINGS_FILE.exists():
            with open(SETTINGS_FILE, 'r') as f:
                app_settings.update(json.load(f))
    except Exception as e:
        print(f"Warning: Could not load settings: {e}")

# Save settings to file
def save_settings():
    try:
        SETTINGS_FILE.parent.mkdir(exist_ok=True)
        with open(SETTINGS_FILE, 'w') as f:
            json.dump(app_settings, f, indent=2)
    except Exception as e:
        print(f"Warning: Could not save settings: {e}")

# Initialize settings
load_settings()

# Load latest profile data on startup
def load_latest_profile_data():
    global current_profile_data
    try:
        scraped_dir = BASE_DIR / "web_app" / "scraped_data"
        if scraped_dir.exists():
            # Get most recent profile file
            profile_files = list(scraped_dir.glob("profile_*.json"))
            if profile_files:
                latest_file = max(profile_files, key=lambda f: f.stat().st_mtime)
                with open(latest_file, 'r') as f:
                    data = json.load(f)
                    # Update current profile data with scraped data
                    current_profile_data.update({
                        'headline': data.get('headline', data.get('description', '')),
                        'about_section': data.get('about', data.get('summary', '')),
                        'connections': data.get('connections', data.get('connectionsCount', 366)),
                        'followers': data.get('followers', data.get('followersCount', 405)),
                        'location': data.get('location', data.get('locationName', '')),
                        'last_updated': latest_file.stem.split('_')[-1] if '_' in latest_file.stem else None
                    })
    except Exception as e:
        print(f"Warning: Could not load profile data: {e}")

# Load profile data on startup
load_latest_profile_data()

@app.route('/')
def dashboard():
    """Main dashboard with overview and quick actions"""
    
    # Get current progress data
    current_month = datetime.now().strftime("%Y-%m-%B").lower()
    monthly_dir = PROGRESS_DIR / f"2025-06-june"  # Start with June
    
    global current_profile_data
    
    progress_data = {
        'connections': {'current': current_profile_data.get('connections', 366), 'target': 5500, 'growth': 0},
        'followers': {'current': current_profile_data.get('followers', 405), 'target': 10000, 'growth': 0},
        'revenue': {'current': 0, 'target': 20000, 'growth': 0},
        'posts_this_week': 0,
        'engagement_rate': 0,
        'profile_views': 0
    }
    
    # Get recent activities
    recent_activities = get_recent_activities()
    
    # Get this week's goals from session or default
    weekly_goals = session.get('weekly_goals', get_weekly_goals())
    
    return render_template('dashboard.html', 
                         progress=progress_data,
                         activities=recent_activities,
                         goals=weekly_goals)

@app.route('/profile')
def profile_analysis():
    """Profile analysis and transformation tools"""
    
    # Get current profile data
    profile_data = get_profile_data()
    
    # Get transformation checklist from session or default
    transformation_checklist = session.get('checklist', get_transformation_checklist())
    
    return render_template('profile.html',
                         profile=profile_data,
                         checklist=transformation_checklist)

@app.route('/content')
def content_planning():
    """Content planning and idea management"""
    
    # Get content ideas
    content_ideas = get_content_ideas()
    
    # Get content calendar
    content_calendar = get_content_calendar()
    
    # Get performance data
    content_performance = get_content_performance()
    
    return render_template('content.html',
                         ideas=content_ideas,
                         calendar=content_calendar,
                         performance=content_performance)

@app.route('/tracking')
def progress_tracking():
    """Progress tracking and metrics"""
    
    # Get all monthly data
    monthly_data = get_monthly_progress()
    
    # Get charts data
    charts_data = generate_charts_data(monthly_data)
    
    return render_template('tracking.html',
                         monthly_data=monthly_data,
                         charts=charts_data)

@app.route('/tools')
def tools_center():
    """Tools and automation center"""
    
    available_tools = [
        {
            'name': 'Profile Scraper',
            'description': 'Extract current LinkedIn profile data',
            'endpoint': '/api/scrape-profile',
            'icon': 'download'
        },
        {
            'name': 'Banner Generator',
            'description': 'Generate AI-powered LinkedIn banner',
            'endpoint': '/api/generate-banner',
            'icon': 'image'
        },
        {
            'name': 'Content Ideas',
            'description': 'AI-generated content suggestions',
            'endpoint': '/api/content-ideas',
            'icon': 'lightbulb'
        },
        {
            'name': 'Engagement Tracker',
            'description': 'Track post performance metrics',
            'endpoint': '/api/track-engagement',
            'icon': 'chart-line'
        }
    ]
    
    return render_template('tools.html', tools=available_tools)

@app.route('/posts')
def posts_management():
    """Posts management and analytics"""
    
    # Get posts data with filters
    filter_type = request.args.get('filter', 'all')  # all, week, daily, monthly
    posts_data = get_posts_data(filter_type)
    
    # Get analytics
    posts_analytics = get_posts_analytics()
    
    return render_template('posts.html', 
                         posts=posts_data, 
                         analytics=posts_analytics,
                         current_filter=filter_type)

@app.route('/settings')
def settings():
    """Settings and configuration"""
    
    current_settings = get_current_settings()
    
    return render_template('settings.html', settings=current_settings)

@app.route('/logs')
@app.route('/logs/<month>')
def daily_logs(month=None):
    """Dedicated daily logs page"""
    
    # Default to current month if not specified
    if not month:
        month = "june"  # Default to current month
    
    # Get logs for the specified month
    monthly_dir = PROGRESS_DIR / f"2025-06-{month}"
    daily_file = monthly_dir / "daily_thoughts.md"
    
    # Read existing logs
    logs_content = ""
    entries = []
    
    try:
        if daily_file.exists():
            with open(daily_file, 'r', encoding='utf-8') as f:
                logs_content = f.read()
            
            # Parse entries (split by ## headers)
            if logs_content:
                raw_entries = logs_content.split('## ')[1:]  # Skip empty first element
                seen_dates = set()  # Track duplicate dates
                
                for entry in raw_entries:
                    if entry.strip():
                        lines = entry.strip().split('\n')
                        date_line = lines[0] if lines else ""
                        content = '\n'.join(lines[1:]) if len(lines) > 1 else ""
                        
                        # Skip template entries and empty entries
                        if is_valid_log_entry(date_line, content):
                            # Avoid duplicates by checking date
                            if date_line not in seen_dates:
                                entries.append({
                                    'date': date_line,
                                    'content': content.strip()
                                })
                                seen_dates.add(date_line)
                
                # Sort entries by date (most recent first) - simple approach
                entries.reverse()
    except Exception as e:
        print(f"Error reading logs: {e}")
    
    # Available months
    available_months = []
    try:
        for month_dir in PROGRESS_DIR.glob("2025-*"):
            if month_dir.is_dir():
                month_name = month_dir.name.split('-')[-1]
                available_months.append(month_name.title())
    except:
        available_months = ["June", "July", "August"]
    
    return render_template('logs.html', 
                         entries=entries, 
                         current_month=month.title(),
                         available_months=available_months,
                         logs_file_path=str(daily_file))

# API Routes
@app.route('/api/daily-log', methods=['POST'])
def save_daily_log():
    """Save daily thoughts and observations"""
    
    data = request.get_json()
    
    try:
        # Get current month file
        monthly_dir = PROGRESS_DIR / "2025-06-june"
        daily_file = monthly_dir / "daily_thoughts.md"
        
        # Create new entry
        entry_date = datetime.now().strftime("%B %d, %Y - %A")
        
        new_entry = f"""
## {entry_date}

**Mood/Energy**: {data.get('mood', 'N/A')}/10
**LinkedIn Time Invested**: {data.get('time_invested', 0)} minutes

**Key Observations**:
{chr(10).join(f"- {obs}" for obs in data.get('observations', []))}

**Interactions**:
- Meaningful comments received: {data.get('comments_received', 0)}
- Quality connections made: {data.get('connections_made', 0)}
- DMs received: {data.get('dms_received', 0)}

**Content Ideas Sparked**:
{chr(10).join(f"- {idea}" for idea in data.get('content_ideas', []))}

**Challenges/Frustrations**:
{chr(10).join(f"- {challenge}" for challenge in data.get('challenges', []))}

**Tomorrow's Priority**:
- {data.get('tomorrow_priority', 'N/A')}

---

"""
        
        # Append to file
        with open(daily_file, 'a', encoding='utf-8') as f:
            f.write(new_entry)
        
        return jsonify({'success': True, 'message': 'Daily log saved successfully'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def run_apify_scraper(apify_token, profile_url="https://www.linkedin.com/in/anskhalid/"):
    """Run Apify LinkedIn scraper and return results"""
    import requests
    import time
    
    # Apify actor details
    ACTOR_ID = "dev_fusion~Linkedin-Profile-Scraper"  # Use ~ instead of /
    
    # Prepare input - using profileUrls as required by the actor
    run_input = {
        "profileUrls": [profile_url],  # Changed from "urls" to "profileUrls"
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
        "Authorization": f"Bearer {apify_token}",
        "Content-Type": "application/json"
    }
    
    # Start actor
    response = requests.post(api_url, json=run_input, headers=headers)
    
    if response.status_code != 201:
        raise Exception(f"Failed to start actor: {response.status_code} - {response.text}")
    
    run_data = response.json()
    run_id = run_data['data']['id']
    
    # Wait for completion (with timeout)
    status_url = f"https://api.apify.com/v2/actor-runs/{run_id}"
    max_attempts = 30  # Max 2.5 minutes
    attempt = 0
    
    while attempt < max_attempts:
        status_response = requests.get(status_url, headers={"Authorization": f"Bearer {apify_token}"})
        status_data = status_response.json()
        status = status_data['data']['status']
        
        if status in ['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT']:
            break
        
        time.sleep(5)
        attempt += 1
    
    if status != 'SUCCEEDED':
        raise Exception(f"Actor run failed with status: {status}")
    
    # Get results
    dataset_id = status_data['data']['defaultDatasetId']
    results_url = f"https://api.apify.com/v2/datasets/{dataset_id}/items"
    
    results_response = requests.get(results_url, headers={"Authorization": f"Bearer {apify_token}"})
    scraped_data = results_response.json()
    
    if not scraped_data:
        raise Exception("No data was scraped")
    
    # Return the first profile
    return scraped_data[0] if isinstance(scraped_data, list) else scraped_data

@app.route('/api/scrape-profile', methods=['POST'])
def scrape_profile():
    """Scrape LinkedIn profile using Apify"""
    
    data = request.get_json() or {}
    apify_token = data.get('apify_token') or app_settings.get('apify_token')
    
    if not apify_token:
        return jsonify({
            'success': False, 
            'error': 'Apify token required',
            'action': 'configure_token',
            'message': 'Please configure your Apify token in Settings first.'
        }), 400
    
    try:
        # Run actual Apify scraper
        profile_data = run_apify_scraper(apify_token)
        
        # Extract key fields from scraped data
        connections = profile_data.get('connections', profile_data.get('connectionsCount', 'N/A'))
        followers = profile_data.get('followers', profile_data.get('followersCount', 'N/A'))
        
        # Parse numbers if they're strings like "500+"
        if isinstance(connections, str):
            connections = int(''.join(filter(str.isdigit, connections)) or 0)
        if isinstance(followers, str):
            followers = int(''.join(filter(str.isdigit, followers)) or 0)
        
        # Save scraped data for reference
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        scraped_dir = BASE_DIR / "web_app" / "scraped_data"
        scraped_dir.mkdir(exist_ok=True)
        
        with open(scraped_dir / f"profile_{timestamp}.json", 'w') as f:
            json.dump(profile_data, f, indent=2)
        
        # Update global profile data
        global current_profile_data
        current_profile_data.update({
            'headline': profile_data.get('headline', profile_data.get('description', '')),
            'about_section': profile_data.get('about', profile_data.get('summary', '')),
            'connections': connections,
            'followers': followers,
            'location': profile_data.get('location', profile_data.get('locationName', '')),
            'last_updated': timestamp
        })
        
        result = {
            'success': True, 
            'message': 'Profile scraped successfully',
            'data': {
                'connections': connections,
                'followers': followers,
                'headline': current_profile_data['headline'],
                'about': current_profile_data['about_section'],
                'location': current_profile_data['location'],
                'timestamp': datetime.now().isoformat()
            }
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/content-ideas', methods=['POST'])
def generate_content_ideas():
    """Generate AI-powered content ideas"""
    
    data = request.get_json()
    topic = data.get('topic', 'AI automation')
    
    # Mock content ideas (replace with actual AI generation)
    ideas = [
        f"5 {topic} tools every business owner should know",
        f"Common {topic} myths debunked",
        f"My {topic} transformation journey",
        f"ROI calculator: {topic} implementation",
        f"Before/after: {topic} case study"
    ]
    
    return jsonify({'success': True, 'ideas': ideas})

@app.route('/api/daily-logs')
def get_daily_logs():
    """Get recent daily log entries"""
    
    try:
        monthly_dir = PROGRESS_DIR / "2025-06-june"
        daily_file = monthly_dir / "daily_thoughts.md"
        
        if daily_file.exists():
            with open(daily_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Get last 5 entries (simple implementation)
            entries = content.split('## ')[1:] if content else []
            recent_entries = entries[-5:] if len(entries) > 5 else entries
            
            return jsonify({'success': True, 'entries': recent_entries, 'file_path': str(daily_file)})
        else:
            return jsonify({'success': True, 'entries': [], 'file_path': str(daily_file)})
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/export-logs/<month>')
def export_logs(month):
    """Export daily logs for a specific month"""
    
    try:
        from flask import send_file
        import tempfile
        
        # Get the logs file
        monthly_dir = PROGRESS_DIR / f"2025-06-{month}"
        daily_file = monthly_dir / "daily_thoughts.md"
        
        if not daily_file.exists():
            return jsonify({'success': False, 'error': 'No logs found for this month'}), 404
        
        # Create a temporary file for download
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.md', encoding='utf-8') as temp_file:
            with open(daily_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Add export header
            export_content = f"""# Daily Logs Export - {month.title()} 2025

Generated on: {datetime.now().strftime("%B %d, %Y at %I:%M %p")}
Source: LinkedIn Personal Branding Journey

---

{content}

---

*Exported from LinkedIn Personal Branding Web App*
"""
            temp_file.write(export_content)
            temp_file_path = temp_file.name
        
        return send_file(
            temp_file_path,
            as_attachment=True,
            download_name=f"daily-logs-{month}-2025.md",
            mimetype='text/markdown'
        )
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/export-profile')
def export_profile_data():
    """Export profile data as JSON"""
    
    try:
        import tempfile
        
        # Gather all profile data
        profile_data = {
            'export_info': {
                'exported_on': datetime.now().isoformat(),
                'app_version': '1.0.0',
                'export_type': 'profile_data'
            },
            'current_profile': current_profile_data,
            'profile_analysis': get_profile_data(),
            'transformation_checklist': session.get('checklist', get_transformation_checklist()),
            'scraped_data_files': []
        }
        
        # Include recent scraped data files
        scraped_dir = BASE_DIR / "web_app" / "scraped_data"
        if scraped_dir.exists():
            for file in sorted(scraped_dir.glob("profile_*.json"), reverse=True)[:5]:
                try:
                    with open(file, 'r') as f:
                        data = json.load(f)
                    profile_data['scraped_data_files'].append({
                        'filename': file.name,
                        'timestamp': file.stem.split('_')[-1],
                        'data': data
                    })
                except:
                    continue
        
        # Create temporary JSON file
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as temp_file:
            json.dump(profile_data, temp_file, indent=2, default=str)
            temp_file_path = temp_file.name
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return send_file(
            temp_file_path,
            as_attachment=True,
            download_name=f"linkedin-profile-data-{timestamp}.json",
            mimetype='application/json'
        )
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/export-content')
def export_content_data():
    """Export content library as JSON"""
    
    try:
        import tempfile
        
        # Gather all content data
        content_data = {
            'export_info': {
                'exported_on': datetime.now().isoformat(),
                'app_version': '1.0.0',
                'export_type': 'content_library'
            },
            'content_ideas': get_content_ideas(),
            'content_calendar': get_content_calendar(),
            'content_performance': get_content_performance(),
            'templates': {
                'headline_templates': [
                    'AI Solutions Architect | Building Business-Ready AI Agents | From Cybersecurity to AI Innovation',
                    'Transforming Businesses Through AI Automation | Claude Code Expert | Ex-BMW Engineer',
                    'AI Agent Developer | Helping SMEs Automate 80% of Manual Tasks | Cybersecurity Background'
                ],
                'about_section_framework': {
                    'opening_hook': '🚀 Transforming Businesses Through AI Automation',
                    'credibility': 'I help companies build AI agents that actually work for their business.',
                    'journey': 'My journey: Started as Automotive Engineer → Cybersecurity → AI Solutions Architect',
                    'what_i_build': 'Claude Code-powered workflows, AI agents, business automation',
                    'results': '80% reduction in manual tasks, 300% faster content creation',
                    'call_to_action': 'DM me "AI AUDIT" for a free consultation'
                }
            }
        }
        
        # Create temporary JSON file
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as temp_file:
            json.dump(content_data, temp_file, indent=2, default=str)
            temp_file_path = temp_file.name
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return send_file(
            temp_file_path,
            as_attachment=True,
            download_name=f"linkedin-content-library-{timestamp}.json",
            mimetype='application/json'
        )
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/export-progress')
def export_progress_data():
    """Export progress reports as CSV and JSON"""
    
    try:
        import tempfile
        import csv
        
        # Gather all progress data
        progress_data = {
            'export_info': {
                'exported_on': datetime.now().isoformat(),
                'app_version': '1.0.0',
                'export_type': 'progress_reports'
            },
            'current_metrics': {
                'connections': current_profile_data.get('connections', 366),
                'followers': current_profile_data.get('followers', 405),
                'posts_this_week': 0,
                'profile_completeness': get_profile_data()['completeness_score']
            },
            'goals': session.get('weekly_goals', get_weekly_goals()),
            'checklist_progress': session.get('checklist', get_transformation_checklist()),
            'monthly_tracking': get_monthly_progress(),
            'target_metrics': {
                'connections': 5500,
                'followers': 10000,
                'revenue': 20000
            }
        }
        
        # Create CSV version for easy analysis
        csv_data = []
        csv_data.append(['Metric', 'Current', 'Target', 'Progress %'])
        csv_data.append(['Connections', progress_data['current_metrics']['connections'], 5500, 
                        round(progress_data['current_metrics']['connections'] / 5500 * 100, 1)])
        csv_data.append(['Followers', progress_data['current_metrics']['followers'], 10000,
                        round(progress_data['current_metrics']['followers'] / 10000 * 100, 1)])
        csv_data.append(['Profile Completeness', progress_data['current_metrics']['profile_completeness'], 100,
                        progress_data['current_metrics']['profile_completeness']])
        
        # Goals progress
        completed_goals = len([g for g in progress_data['goals'] if g['completed']])
        total_goals = len(progress_data['goals'])
        csv_data.append(['Weekly Goals', completed_goals, total_goals,
                        round(completed_goals / total_goals * 100, 1) if total_goals > 0 else 0])
        
        # Create temporary CSV file
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv', newline='') as temp_csv:
            writer = csv.writer(temp_csv)
            writer.writerows(csv_data)
            temp_csv_path = temp_csv.name
        
        # For now, return CSV (could be enhanced to return ZIP with both CSV and JSON)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return send_file(
            temp_csv_path,
            as_attachment=True,
            download_name=f"linkedin-progress-report-{timestamp}.csv",
            mimetype='text/csv'
        )
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/delete-log-entry', methods=['POST'])
def delete_log_entry():
    """Delete a specific log entry"""
    
    data = request.get_json()
    month = data.get('month', 'june')
    entry_date = data.get('date')
    
    if not entry_date:
        return jsonify({'success': False, 'error': 'Date is required'}), 400
    
    try:
        # Get the logs file
        monthly_dir = PROGRESS_DIR / f"2025-06-{month}"
        daily_file = monthly_dir / "daily_thoughts.md"
        
        if not daily_file.exists():
            return jsonify({'success': False, 'error': 'Log file not found'}), 404
        
        # Read current content
        with open(daily_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Split by ## headers and filter out the specific entry
        sections = content.split('## ')
        filtered_sections = []
        
        for i, section in enumerate(sections):
            if i == 0:  # Keep the header part
                filtered_sections.append(section)
            else:
                # Check if this section matches the date to delete
                lines = section.strip().split('\n')
                section_date = lines[0] if lines else ""
                
                # Don't include the entry we want to delete
                if entry_date not in section_date:
                    filtered_sections.append(section)
        
        # Reconstruct the file
        new_content = '## '.join(filtered_sections)
        
        # Write back to file
        with open(daily_file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        return jsonify({'success': True, 'message': 'Log entry deleted successfully'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/settings/api-keys', methods=['POST'])
def save_api_keys():
    """Save API keys to settings"""
    
    data = request.get_json()
    
    try:
        global app_settings
        
        # Update API keys
        if data.get('apify_token'):
            app_settings['apify_token'] = data['apify_token']
        if data.get('google_api_key'):
            app_settings['google_api_key'] = data['google_api_key']
        if data.get('openai_api_key'):
            app_settings['openai_api_key'] = data['openai_api_key']
        
        # Save to file
        save_settings()
        
        return jsonify({'success': True, 'message': 'API keys saved successfully'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/settings/api-keys', methods=['GET'])
def get_api_keys():
    """Get current API key status (masked for security)"""
    
    try:
        status = {}
        
        # Return masked versions for security
        for key, value in app_settings.items():
            if value:
                # Mask the API key, showing only last 4 characters
                if len(value) > 8:
                    masked = f"{'•' * (len(value) - 4)}{value[-4:]}"
                else:
                    masked = "••••"
                
                status[key] = {
                    'configured': True,
                    'masked': masked,
                    'length': len(value)
                }
            else:
                status[key] = {
                    'configured': False, 
                    'masked': '',
                    'length': 0
                }
        
        return jsonify({'success': True, 'status': status})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/weekly-review', methods=['POST'])
def save_weekly_review():
    """Save weekly review data"""
    
    data = request.get_json()
    
    try:
        # Save to appropriate weekly review file
        # Implementation details...
        
        return jsonify({'success': True, 'message': 'Weekly review saved'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/toggle-checklist', methods=['POST'])
def toggle_checklist():
    """Toggle profile transformation checklist item"""
    
    data = request.get_json()
    index = data.get('index')
    completed = data.get('completed')
    
    try:
        # Get current checklist from session or storage
        checklist = session.get('checklist', get_transformation_checklist())
        
        # Update the item
        if 0 <= int(index) < len(checklist):
            checklist[int(index)]['completed'] = completed
            session['checklist'] = checklist
            
            # Calculate progress
            completed_count = len([item for item in checklist if item['completed']])
            progress = round((completed_count / len(checklist)) * 100) if checklist else 0
            
            return jsonify({
                'success': True, 
                'progress': progress,
                'completed_count': completed_count,
                'total_count': len(checklist)
            })
        else:
            return jsonify({'success': False, 'error': 'Invalid index'}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/toggle-goal', methods=['POST'])
def toggle_goal():
    """Toggle weekly goal item"""
    
    data = request.get_json()
    index = data.get('index')
    completed = data.get('completed')
    
    try:
        # Get current goals from session or storage
        goals = session.get('weekly_goals', get_weekly_goals())
        
        # Update the item
        if 0 <= int(index) < len(goals):
            goals[int(index)]['completed'] = completed
            session['weekly_goals'] = goals
            
            # Calculate progress
            completed_count = len([item for item in goals if item['completed']])
            progress = round((completed_count / len(goals)) * 100) if goals else 0
            
            return jsonify({
                'success': True,
                'progress': progress,
                'completed_count': completed_count,
                'total_count': len(goals)
            })
        else:
            return jsonify({'success': False, 'error': 'Invalid index'}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Posts Management API Endpoints
@app.route('/api/posts', methods=['GET'])
def get_posts():
    """Get all posts with optional filtering"""
    
    filter_type = request.args.get('filter', 'all')
    posts = get_posts_data(filter_type)
    
    return jsonify({'success': True, 'posts': posts})

@app.route('/api/posts', methods=['POST'])
def create_post():
    """Create a new post"""
    
    data = request.get_json()
    
    try:
        new_post = {
            'id': str(int(time.time())),  # Simple ID generation
            'title': data.get('title', ''),
            'content': data.get('content', ''),
            'platform': data.get('platform', 'linkedin'),
            'status': data.get('status', 'draft'),
            'scheduled_date': data.get('scheduled_date'),
            'created_date': datetime.now().isoformat(),
            'engagement': {
                'likes': 0,
                'comments': 0,
                'shares': 0,
                'views': 0
            },
            'tags': data.get('tags', [])
        }
        
        # Save post to storage (in production, use database)
        posts_data = load_posts_data()
        posts_data.append(new_post)
        save_posts_data(posts_data)
        
        return jsonify({'success': True, 'post': new_post})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/posts/<post_id>', methods=['PUT'])
def update_post(post_id):
    """Update an existing post"""
    
    data = request.get_json()
    
    try:
        posts_data = load_posts_data()
        
        # Find and update post
        for i, post in enumerate(posts_data):
            if post['id'] == post_id:
                posts_data[i].update(data)
                posts_data[i]['updated_date'] = datetime.now().isoformat()
                save_posts_data(posts_data)
                return jsonify({'success': True, 'post': posts_data[i]})
        
        return jsonify({'success': False, 'error': 'Post not found'}), 404
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/posts/<post_id>', methods=['DELETE'])
def delete_post(post_id):
    """Delete a post"""
    
    try:
        posts_data = load_posts_data()
        
        # Find and remove post
        for i, post in enumerate(posts_data):
            if post['id'] == post_id:
                deleted_post = posts_data.pop(i)
                save_posts_data(posts_data)
                return jsonify({'success': True, 'deleted_post': deleted_post})
        
        return jsonify({'success': False, 'error': 'Post not found'}), 404
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/posts/<post_id>/engagement', methods=['PUT'])
def update_post_engagement(post_id):
    """Update post engagement metrics"""
    
    data = request.get_json()
    
    try:
        posts_data = load_posts_data()
        
        # Find and update engagement
        for i, post in enumerate(posts_data):
            if post['id'] == post_id:
                posts_data[i]['engagement'].update(data)
                posts_data[i]['last_engagement_update'] = datetime.now().isoformat()
                save_posts_data(posts_data)
                return jsonify({'success': True, 'engagement': posts_data[i]['engagement']})
        
        return jsonify({'success': False, 'error': 'Post not found'}), 404
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Helper functions
def is_valid_log_entry(date_line, content):
    """Check if a log entry is valid (not a template or empty)"""
    
    # Skip obviously invalid entries
    if not date_line or not content or len(content.strip()) < 20:
        return False
    
    # Skip template entries and placeholders
    invalid_indicators = [
        '___/10',  # Placeholder mood
        '___ minutes',  # Placeholder time
        'Daily Format Template',  # Template header
        'Weekly Patterns & Insights',  # Weekly section
        'Best Days for Engagement',  # Template section
        '[Date]',  # Placeholder date
        '[Day of Week]',  # Placeholder day
        '[Scale 1-10]',  # Placeholder scale
        '[Minutes]',  # Placeholder minutes
    ]
    
    for indicator in invalid_indicators:
        if indicator in date_line or indicator in content:
            return False
    
    # Check for actual meaningful content (not just structure)
    meaningful_content = False
    lines = content.split('\n')
    for line in lines:
        line = line.strip()
        if line and ':' in line and not line.endswith(':'):
            # Check if there's actual content after the colon
            parts = line.split(':', 1)
            if len(parts) > 1 and parts[1].strip():
                meaningful_content = True
                break
    
    return meaningful_content

def get_recent_activities():
    """Get recent activities from logs"""
    return [
        {'date': '2025-06-02', 'activity': 'Updated LinkedIn headline', 'type': 'profile'},
        {'date': '2025-06-02', 'activity': 'Generated banner design', 'type': 'visual'},
        {'date': '2025-06-01', 'activity': 'Planned content strategy', 'type': 'content'}
    ]

def get_weekly_goals():
    """Get current week's goals"""
    return [
        {'goal': 'Update LinkedIn profile completely', 'completed': False},
        {'goal': 'Create and upload banner', 'completed': False},
        {'goal': 'Publish transformation story', 'completed': False},
        {'goal': 'Send 100 connection requests', 'completed': False}
    ]

def get_profile_data():
    """Get current profile analysis data"""
    global current_profile_data
    
    # Calculate about section length
    about_length = len(current_profile_data.get('about_section', ''))
    
    # Calculate completeness score (simple heuristic)
    completeness = 0
    if current_profile_data.get('headline'): completeness += 20
    if about_length > 100: completeness += 20
    if about_length > 500: completeness += 20
    if current_profile_data.get('connections', 0) > 300: completeness += 20
    if current_profile_data.get('location'): completeness += 20
    
    return {
        'headline': current_profile_data.get('headline', 'No headline found'),
        'about_section_length': about_length,
        'connections': current_profile_data.get('connections', 0),
        'followers': current_profile_data.get('followers', 0),
        'completeness_score': completeness,
        'optimization_suggestions': [
            'Update headline to reflect AI expertise' if 'AI' not in current_profile_data.get('headline', '') else 'Headline looks good!',
            f'Expand about section to 1000+ characters (currently {about_length})' if about_length < 1000 else 'About section is comprehensive!',
            'Add current AI role experience',
            'Update skills section with AI technologies'
        ]
    }

def get_transformation_checklist():
    """Get profile transformation checklist"""
    return [
        {'task': 'Update headline', 'completed': False, 'priority': 'high'},
        {'task': 'Rewrite about section', 'completed': False, 'priority': 'high'},
        {'task': 'Add current experience', 'completed': False, 'priority': 'high'},
        {'task': 'Update skills list', 'completed': False, 'priority': 'medium'},
        {'task': 'Create banner', 'completed': False, 'priority': 'medium'},
        {'task': 'Add featured section', 'completed': False, 'priority': 'low'}
    ]

def get_content_ideas():
    """Get content ideas from files"""
    return [
        {'idea': 'My AI transformation journey', 'category': 'personal', 'urgency': 'high'},
        {'idea': '5 AI tools for business', 'category': 'educational', 'urgency': 'medium'},
        {'idea': 'AI vs Automation explained', 'category': 'educational', 'urgency': 'medium'},
        {'idea': 'Case study: 80% time savings', 'category': 'case_study', 'urgency': 'low'}
    ]

def get_content_calendar():
    """Get content calendar data"""
    return [
        {'date': '2025-06-03', 'topic': 'Transformation story', 'status': 'planned'},
        {'date': '2025-06-05', 'topic': 'AI tools carousel', 'status': 'draft'},
        {'date': '2025-06-07', 'topic': 'Industry insights', 'status': 'idea'}
    ]

def get_content_performance():
    """Get content performance metrics"""
    return {
        'total_posts': 0,
        'avg_engagement': 0,
        'best_performing': None,
        'worst_performing': None
    }

def get_monthly_progress():
    """Get progress data for all months"""
    return {
        'june': {'connections': 366, 'followers': 405, 'posts': 0},
        'july': {'connections': 0, 'followers': 0, 'posts': 0},
        'august': {'connections': 0, 'followers': 0, 'posts': 0}
    }

def generate_charts_data(monthly_data):
    """Generate data for charts"""
    return {
        'connections_chart': {
            'labels': ['June', 'July', 'August'],
            'data': [366, 0, 0]
        },
        'followers_chart': {
            'labels': ['June', 'July', 'August'],
            'data': [405, 0, 0]
        }
    }

def get_current_settings():
    """Get current application settings"""
    return {
        'apify_token': '',
        'google_api_key': '',
        'posting_schedule': 'Manual',
        'notifications': True,
        'theme': 'Professional'
    }

# Posts Management Helper Functions
def get_posts_data(filter_type='all'):
    """Get posts data with optional filtering"""
    
    posts_data = load_posts_data()
    
    if filter_type == 'all':
        return posts_data
    elif filter_type == 'week':
        # Filter posts from last 7 days
        week_ago = datetime.now() - timedelta(days=7)
        return [post for post in posts_data 
                if datetime.fromisoformat(post['created_date']) >= week_ago]
    elif filter_type == 'daily':
        # Filter posts from today
        today = datetime.now().date()
        return [post for post in posts_data 
                if datetime.fromisoformat(post['created_date']).date() == today]
    elif filter_type == 'monthly':
        # Filter posts from current month
        current_month = datetime.now().month
        return [post for post in posts_data 
                if datetime.fromisoformat(post['created_date']).month == current_month]
    
    return posts_data

def get_posts_analytics():
    """Get posts analytics and metrics"""
    
    posts_data = load_posts_data()
    
    if not posts_data:
        return {
            'total_posts': 0,
            'total_engagement': 0,
            'avg_engagement': 0,
            'this_week_posts': 0,
            'this_month_posts': 0,
            'top_performing': None,
            'engagement_by_day': [],
            'status_breakdown': {'draft': 0, 'published': 0, 'scheduled': 0}
        }
    
    # Calculate metrics
    total_posts = len(posts_data)
    total_engagement = sum(
        post['engagement']['likes'] + 
        post['engagement']['comments'] + 
        post['engagement']['shares']
        for post in posts_data
    )
    
    avg_engagement = round(total_engagement / total_posts, 1) if total_posts > 0 else 0
    
    # Time-based metrics
    week_ago = datetime.now() - timedelta(days=7)
    month_start = datetime.now().replace(day=1)
    
    this_week_posts = len([post for post in posts_data 
                          if datetime.fromisoformat(post['created_date']) >= week_ago])
    
    this_month_posts = len([post for post in posts_data 
                           if datetime.fromisoformat(post['created_date']) >= month_start])
    
    # Top performing post
    top_performing = max(posts_data, 
                        key=lambda p: p['engagement']['likes'] + p['engagement']['comments'],
                        default=None) if posts_data else None
    
    # Status breakdown
    status_breakdown = {'draft': 0, 'published': 0, 'scheduled': 0}
    for post in posts_data:
        status = post.get('status', 'draft')
        status_breakdown[status] = status_breakdown.get(status, 0) + 1
    
    return {
        'total_posts': total_posts,
        'total_engagement': total_engagement,
        'avg_engagement': avg_engagement,
        'this_week_posts': this_week_posts,
        'this_month_posts': this_month_posts,
        'top_performing': top_performing,
        'status_breakdown': status_breakdown
    }

def load_posts_data():
    """Load posts data from storage"""
    
    posts_file = BASE_DIR / "web_app" / "posts_data.json"
    
    try:
        if posts_file.exists():
            with open(posts_file, 'r') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading posts data: {e}")
    
    # Return sample data for demo
    return [
        {
            'id': '1717520400',
            'title': 'My AI Transformation Journey',
            'content': '🚀 From Automotive Engineer to AI Solutions Architect...\n\nThe path wasn\'t linear, but every step taught me something valuable:\n\n✅ BMW: Learned systematic problem-solving\n✅ Cybersecurity: Developed security-first mindset  \n✅ AI: Combining both to build reliable, secure automation\n\nWhat\'s your transformation story? Drop it below! 👇',
            'platform': 'linkedin',
            'status': 'published',
            'created_date': '2025-06-01T09:30:00',
            'published_date': '2025-06-01T10:00:00',
            'engagement': {
                'likes': 89,
                'comments': 12,
                'shares': 7,
                'views': 1250
            },
            'tags': ['AI', 'Career', 'Transformation', 'Personal Brand']
        },
        {
            'id': '1717606800',
            'title': '5 AI Tools Every Business Owner Should Know',
            'content': '💡 Stop doing manually what AI can do better:\n\n1. Claude Code → Development workflows\n2. Make.com → Process automation\n3. Zapier → App integrations\n4. Notion AI → Content planning\n5. Canva AI → Visual design\n\nWhich tool would save you the most time? 🤔',
            'platform': 'linkedin',
            'status': 'published',
            'created_date': '2025-06-02T14:15:00',
            'published_date': '2025-06-02T15:00:00',
            'engagement': {
                'likes': 134,
                'comments': 23,
                'shares': 15,
                'views': 2100
            },
            'tags': ['AI Tools', 'Business', 'Productivity', 'Automation']
        },
        {
            'id': '1717693200',
            'title': 'The ROI of AI Implementation',
            'content': '📊 Real numbers from my AI consulting work:\n\n• 80% reduction in manual tasks\n• 300% faster content creation\n• 60% improvement in lead qualification\n• 90% reduction in data entry errors\n\nROI achieved within 3 months for most clients.\n\nThe key? Start small, measure everything, scale what works.',
            'platform': 'linkedin',
            'status': 'draft',
            'created_date': '2025-06-02T16:30:00',
            'engagement': {
                'likes': 0,
                'comments': 0,
                'shares': 0,
                'views': 0
            },
            'tags': ['ROI', 'AI Implementation', 'Consulting', 'Results']
        }
    ]

def save_posts_data(posts_data):
    """Save posts data to storage"""
    
    posts_file = BASE_DIR / "web_app" / "posts_data.json"
    
    try:
        posts_file.parent.mkdir(exist_ok=True)
        with open(posts_file, 'w') as f:
            json.dump(posts_data, f, indent=2, default=str)
        return True
    except Exception as e:
        print(f"Error saving posts data: {e}")
        return False

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)