# 🚀 AI Job Hunter - Interactive Dashboard Guide

## Overview
A beautiful, modern, and minimalistic multi-page web application for analyzing Munich's AI consultant job market.

## 🎨 Design Features
- **Modern & Minimalistic**: Clean interface with Tailwind CSS
- **Glassmorphism Effects**: Subtle transparency and blur effects
- **Gradient Accents**: Beautiful color gradients for visual appeal
- **Smooth Animations**: Hover effects and transitions
- **Responsive Design**: Works perfectly on all devices

## 📊 Dashboard Pages

### 1. Main Dashboard (`/`)
The landing page with comprehensive market overview:

- **Key Metrics Cards**:
  - Total Jobs (50)
  - Companies Hiring (20+)
  - Average Applications per Position
  - Salary Range (€45k - €180k)

- **Interactive Charts**:
  - Experience Level Distribution (Doughnut Chart)
  - Top Hiring Companies (Horizontal Bar)
  - Industry Breakdown (Pie Chart)
  - Job Posting Timeline (Line Chart)
  
- **Skills Overview**: Top 10 in-demand skills with mention counts

### 2. Jobs Listing (`/jobs`)
Browse all AI consultant positions with:

- **Rich Job Cards**: 
  - Company, location, and posting date
  - Experience level and employment type badges
  - Salary ranges (when available)
  - Application count
  - AI Score badge (7-10/10)
  
- **Advanced Filters**:
  - Experience Level
  - Company Type
  - Sort options (Date, Applications, Salary)
  
- **Pagination**: Clean navigation through all 50 jobs

### 3. Advanced Analytics (`/analytics`)
Deep market insights with multiple visualizations:

- **Salary Analysis**:
  - Average salary by experience level
  - Career progression insights
  - 300% potential salary growth visualization

- **Competition Analysis**:
  - Applications by company (bar chart)
  - Company Competitiveness Index (0-10 scale)
  
- **Skills Demand**:
  - Radar chart of top 15 skills
  - Categorized breakdown (Technical, Soft, Domain)
  
- **Market Trends**:
  - 7-day posting timeline
  - Key market insights cards
  - Growth predictions

### 4. Job Detail Page (`/job/{id}`)
Individual job pages featuring:

- **Complete Job Description**: Full formatted description
- **AI Analysis Tab**: Comprehensive AI-powered insights
- **Company Information**: Size, culture, and insights
- **Visual AI Score**: Circular progress indicator
- **Similar Jobs**: Related position recommendations

## 🛠️ Technical Stack
- **Backend**: Flask (Python)
- **Frontend**: HTML5, Tailwind CSS, Chart.js
- **Data**: JSON files from enhanced LinkedIn scraper
- **Charts**: Chart.js with modern configurations

## 🚀 How to Run

1. **Simple Method**:
   ```bash
   cd /Users/anskhalid/CascadeProjects/claude_code_workflows/projects/ai_job_hunter
   ./run_app.sh
   ```

2. **Manual Method**:
   ```bash
   # Create virtual environment
   python3 -m venv venv
   
   # Activate it
   source venv/bin/activate
   
   # Install Flask
   pip install flask
   
   # Run the app
   python app.py
   ```

3. **Access the Dashboard**:
   - Open your browser
   - Navigate to: `http://localhost:5000`
   - Explore all pages and features!

## 📈 Key Insights Available

### Market Overview
- 50 AI Consultant positions in Munich
- 20+ companies actively hiring
- Average 75 applications per position
- Salary range: €45,000 - €180,000

### Top Employers
1. McKinsey & Company
2. Boston Consulting Group
3. Deloitte
4. Google Munich
5. BMW Group

### Most Demanded Skills
1. Python (95% of jobs)
2. Machine Learning (88%)
3. Consulting (82%)
4. Communication (78%)
5. Cloud Platforms (75%)

### Career Growth Path
- Entry Level: €45k-65k (24% of jobs)
- Mid Level: €65k-85k (22% of jobs)
- Senior Level: €110k-140k (20% of jobs)
- Principal Level: €140k-180k (18% of jobs)

## 🎯 Features Highlights

1. **Real-time Data**: All data from the last 7 days
2. **AI-Powered Analysis**: Each job has comprehensive AI insights
3. **Interactive Visualizations**: Multiple chart types for different insights
4. **Responsive Design**: Works on desktop, tablet, and mobile
5. **Export Options**: Download complete market reports (PDF)

## 💡 Usage Tips

1. Start with the Dashboard for market overview
2. Browse Jobs to find specific positions
3. Check Analytics for strategic insights
4. Click on any job for detailed AI analysis
5. Use filters to narrow your search

## 🔄 Data Updates
The dashboard automatically loads the most recent enhanced job data from the `data/` directory. Run the enhanced scraper to get fresh data:

```bash
python linkedin_enhanced_scraper.py
```

---

**Note**: This dashboard provides a comprehensive view of Munich's AI consulting job market, helping you make informed career decisions with beautiful visualizations and AI-powered insights.