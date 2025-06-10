# 🔧 WebFetch Tool Usage Guide for Claude Code

## What is WebFetch?

WebFetch is a built-in tool in Claude Code that allows you to fetch and extract data from websites. It's like having a smart web scraper that can understand what you want to extract.

## How WebFetch Works in Claude Code

### Basic Syntax
When you ask Claude Code to scrape a website, it uses WebFetch like this:

```
<webfetch url="https://example.com" prompt="Extract specific data...">
```

### Key Features:
1. **No coding required** - Just describe what you want
2. **Smart extraction** - Uses AI to understand page structure
3. **Returns structured data** - JSON, lists, or formatted text
4. **Handles dynamic content** - Can work with JavaScript-rendered pages
5. **Free to use** - No API costs

## How to Use WebFetch for Job Scraping

### Example 1: Scraping StepStone

**You would say:**
```
"Use WebFetch to scrape AI Engineer jobs from https://www.stepstone.de/jobs/ai-engineer/in-muenchen and extract job title, company, location, salary, and job URL for each listing"
```

**Claude Code would execute:**
```xml
<webfetch 
  url="https://www.stepstone.de/jobs/ai-engineer/in-muenchen" 
  prompt="Extract all job listings from this page. For each job, get:
  - Job title
  - Company name
  - Location
  - Salary (if available)
  - Posted date
  - Direct link to job posting
  Format as JSON array">
```

**You would get back:**
```json
[
  {
    "title": "Senior AI Engineer (m/w/d)",
    "company": "BMW Group",
    "location": "München",
    "salary": "€75,000 - €95,000",
    "posted_date": "Vor 2 Tagen",
    "url": "https://www.stepstone.de/stellenangebote--Senior-AI-Engineer-BMW-Group--1234567.html"
  },
  // ... more real jobs
]
```

### Example 2: Scraping Indeed

**You would say:**
```
"Use WebFetch to get 20 Machine Learning Engineer jobs from Indeed Munich"
```

**Claude Code would execute:**
```xml
<webfetch 
  url="https://de.indeed.com/jobs?q=Machine+Learning+Engineer&l=München" 
  prompt="Extract job listings including title, company, location, salary, description snippet, and job URL">
```

## Step-by-Step Instructions

### 1. Basic Job Search Scraping
```
"Please use WebFetch to scrape [NUMBER] [JOB TITLE] jobs in [LOCATION] from [WEBSITE]"
```

Example:
```
"Please use WebFetch to scrape 30 AI Engineer jobs in Munich from StepStone"
```

### 2. Detailed Extraction
```
"Use WebFetch to scrape [WEBSITE URL] and extract these fields for each job:
- Job title
- Company name and size
- Salary range
- Required skills
- Experience level
- Application deadline
- Direct application link"
```

### 3. Multiple Pages
```
"Use WebFetch to scrape the first 3 pages of AI jobs from StepStone Munich, getting all job details"
```

### 4. Specific Company Jobs
```
"Use WebFetch to find all AI/ML positions at Siemens from their careers page"
```

## WebFetch Capabilities

### ✅ What WebFetch CAN do:
- Extract text, links, images from web pages
- Handle cookies and sessions
- Parse JavaScript-rendered content
- Follow pagination
- Extract structured data (tables, lists)
- Understand context (e.g., "get the salary" knows to look for €/$ amounts)

### ❌ What WebFetch CANNOT do:
- Login to websites (no authentication)
- Bypass CAPTCHAs
- Violate robots.txt
- Access pages requiring user interaction
- Download files or PDFs

## Best Practices

### 1. Be Specific in Your Prompts
```
Good: "Extract job title, company, salary, and full job URL"
Bad: "Get job info"
```

### 2. Start Small
```
First: "Scrape 5 jobs from StepStone"
Then: "Scrape 50 jobs from StepStone"
```

### 3. Verify URLs Work
Always test the URL in your browser first:
- ✅ https://www.stepstone.de/jobs/data-scientist/in-berlin
- ❌ https://www.linkedin.com/jobs (requires login)

### 4. Use Filters in URLs
Many job sites support URL parameters:
```
https://de.indeed.com/jobs?q=AI+Engineer&l=München&radius=10&fromage=7
                            ↑ job title  ↑ location ↑ 10km  ↑ last 7 days
```

## Real Examples You Can Try Now

### 1. StepStone - Real AI Jobs
```
"Use WebFetch to scrape AI and Machine Learning jobs from https://www.stepstone.de/jobs/artificial-intelligence/in-muenchen"
```

### 2. Indeed - Data Science Jobs
```
"Use WebFetch to get Data Science positions from https://de.indeed.com/jobs?q=Data+Science&l=München&fromage=3"
```

### 3. Jobs.de - Software Engineer
```
"Use WebFetch to extract Software Engineer roles from https://www.jobs.de/jobs?q=Software+Engineer+AI&l=München"
```

### 4. Monster.de - Tech Jobs
```
"Use WebFetch to find technology jobs at https://www.monster.de/jobs/suche?q=Machine+Learning&where=München"
```

## Saving WebFetch Results

After WebFetch returns data, you can ask:
```
"Save these job results to a JSON file and create a summary report"
```

Or integrate with your dashboard:
```
"Add these WebFetch results to the AI Job Hunter dashboard"
```

## Troubleshooting

### If WebFetch returns no results:
1. Check if the URL works in your browser
2. The site might require login (LinkedIn)
3. The site might block scrapers
4. Try a simpler prompt

### If data is incomplete:
1. Make your prompt more specific
2. The site structure might have changed
3. Some data might not be on the search page (need detail pages)

## Quick Start Commands

Copy and paste these to try WebFetch right now:

```
1. "Use WebFetch to scrape 10 AI Engineer jobs from https://www.stepstone.de/jobs/ai-engineer/in-muenchen"

2. "Use WebFetch to get Machine Learning positions from Indeed Munich posted in the last 3 days"

3. "Use WebFetch to find Data Scientist roles at BMW, Siemens, and Infineon in Munich"

4. "Use WebFetch to extract salary ranges for AI jobs in Munich from StepStone"
```

---

## 🎯 Your Next Step

Try this command in Claude Code:

**"Use WebFetch to scrape 15 real AI Engineer jobs from https://www.stepstone.de/jobs/ai-engineer/in-muenchen and save them to a JSON file"**

This will give you REAL jobs with REAL URLs that you can actually apply to!