# LinkedIn Personal Branding Web App - Testing Instructions

## Current Status
- ✅ BrowserTools MCP server running on port 3026
- ✅ LinkedIn web app running on http://localhost:5003  
- ✅ BrowserTools Chrome extension connected ("Connected to browser-tools-server v1.2.0 at localhost:3026")
- ❌ Claude Desktop needs restart to load BrowserTools MCP functions

## What to do next after Claude Desktop restart:

### 1. Verify BrowserTools MCP Access
First test if I have access to BrowserTools functions:
```
Try: mcp__browsertools__screenshot
```

### 2. Test Web App Navigation
The LinkedIn Personal Branding app has these routes to test:
- `/` - Dashboard (currently working)
- `/profile` - Profile Analysis  
- `/content` - Content Planning
- `/posts` - My Posts
- `/competitors` - Competitor Analysis
- `/tracking` - Progress Tracking
- `/tools` - Tools Center
- `/settings` - Settings
- `/logs` - Daily Logs

### 3. Test Key Functionality
Priority testing areas:
1. **Navigation between pages** - Click sidebar items
2. **Posts management** - Create, edit, delete posts
3. **Competitor analysis** - Add competitors, scrape data
4. **Profile data** - Update profile information
5. **Settings** - API key configuration
6. **Daily logs** - Add progress entries

### 4. Use BrowserTools to:
- Take screenshots of each page
- Check console errors
- Monitor network requests during API calls
- Inspect DOM elements for issues
- Run performance audits

### 5. Current App State
- Connections: 366 (Target: 5500)
- Followers: 405 (Target: 10000) 
- Monthly Revenue: €0 (Target: €20000)
- Posts This Week: 100 (Goal: 3-5 posts)
- Progress on weekly goals: 0%

### 6. Known Issues to Check
- API functionality (requires API keys in settings)
- MCP integration for profile scraping
- Data persistence between sessions
- Chart rendering in Growth Overview

### 7. Screenshot Locations
Screenshots saved to: `/Users/anskhalid/CascadeProjects/claude_code_workflows/mcp-screenshots/`

## Server Status Required
Keep these running:
1. **BrowserTools Node server**: `npx @agentdeskai/browser-tools-server@latest` (port 3026)
2. **LinkedIn web app**: Should auto-start or run manually from web_app directory

## Next Steps
1. Restart Claude Desktop completely
2. Start new conversation
3. Ask me to take a screenshot to verify BrowserTools access
4. Begin systematic testing of all web app features