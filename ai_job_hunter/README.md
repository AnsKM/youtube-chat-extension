# 🤖 AI Job Hunter

Real job scraping and analysis tool for AI/ML positions in Munich using Apify integration.

## 🚀 Features

- **Real Job Scraping**: Uses Apify actors for StepStone.de and Indeed
- **AI Analysis**: Gemini-powered job description analysis  
- **Interactive Dashboard**: Modern Flask web interface
- **Market Insights**: Salary trends, skill requirements, company analysis
- **Export Capabilities**: JSON, CSV, and report generation

## 📋 Prerequisites

1. **Apify Account**: Sign up at https://apify.com (free $5 credit)
2. **Google AI**: Get API key from https://aistudio.google.com

## ⚙️ Setup

1. **Environment Variables**:
```bash
export APIFY_TOKEN=your_apify_token
export GOOGLE_API_KEY=your_gemini_key
```

2. **Install Dependencies**:
```bash
pip install -r requirements.txt
```

## 🎯 Usage

### Scrape Real Jobs
```bash
python scrape_real_jobs_apify.py
```

### Run Dashboard  
```bash
python app.py
# Visit: http://localhost:5000
```

## 📁 Project Structure

```
ai_job_hunter/
├── app.py                    # Flask web dashboard
├── scrape_real_jobs_apify.py # Main scraping script
├── src/
│   ├── job_scrapers.py       # Apify integration
│   └── ai_job_analyzer.py    # AI analysis module
├── templates/                # Web interface
├── static/                   # CSS/JS assets
├── data/                     # Scraped job data
└── config.py                 # Configuration
```

## 🌐 Supported Platforms

- **StepStone.de**: German job market focus
- **Indeed.de**: International positions

## 📊 Data Output

- Real job listings with complete details
- AI-generated market analysis
- Salary and skill trend reports
- Company and location insights

## 🔧 Built With

- **Core Modules**: Uses claude_code_workflows infrastructure
- **Apify**: Professional job scraping actors
- **Gemini AI**: Content analysis and insights
- **Flask**: Modern web dashboard
- **Chart.js**: Interactive visualizations
