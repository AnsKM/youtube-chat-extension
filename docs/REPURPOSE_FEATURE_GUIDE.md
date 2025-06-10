# Content Repurposing Feature - User Guide

## Overview

The content repurposing feature is seamlessly integrated into the existing YouTube Chat Extension. It allows you to transform AI responses about YouTube videos into LinkedIn posts (and other formats) with just a few clicks.

## How It Works

### 1. Normal Chat Experience Unchanged
- The extension works exactly as before
- Same UI, same chat functionality
- Chat with Gemini AI about any YouTube video

### 2. New "Repurpose" Button
When you get a substantial AI response (100+ characters), you'll see a small **"Repurpose"** button appear below the message:

```
AI: Here's my analysis of the video...
[detailed response about the video]

[⟐ Repurpose]  ← This button appears here
```

### 3. Click to Open Repurpose Modal
Clicking the button opens a clean modal with options:
- **Platform**: LinkedIn (default), Twitter/X
- **Style**: Auto-detect, Story, Tips List, Problem→Solution, etc.
- **Tone**: Conversational, Professional, Inspirational

### 4. Generate & Copy
- Click "Generate Content" 
- Wait 5-10 seconds for transformation
- Review the generated LinkedIn post
- Click copy button to copy to clipboard
- Close modal and continue chatting

## Visual Flow

```
1. Chat normally with the AI
   ↓
2. AI provides detailed response
   ↓
3. "Repurpose" button appears
   ↓
4. Click button → Modal opens
   ↓
5. Select options → Generate
   ↓
6. Copy result → Close modal
   ↓
7. Continue chatting
```

## Key Features

### Maintains Original Experience
- ✅ Same chat UI and functionality
- ✅ No changes to core features
- ✅ Repurpose is optional/additional
- ✅ Only appears for substantial responses

### Smart Content Transformation
- Uses video title and metadata
- Applies LinkedIn best practices
- Human-like writing style
- Multiple templates to choose from

### Simple Integration
- One button added to AI responses
- Clean modal overlay
- Quick copy functionality
- Non-intrusive design

## Testing Instructions

1. **Load Extension**
   - Chrome → chrome://extensions/
   - Developer mode ON
   - Load unpacked → Select extension folder

2. **Set API Key**
   - Click extension icon
   - Enter Gemini API key
   - Save

3. **Test on YouTube**
   - Go to any YouTube video
   - Chat with the AI
   - Look for "Repurpose" button on AI responses
   - Try generating LinkedIn posts

## What Makes This Special

1. **Non-Disruptive**: The feature is completely optional and doesn't change the main chat experience
2. **Context-Aware**: Uses the video content and AI's analysis for accurate transformation
3. **Human-Like Output**: Applies proven LinkedIn writing techniques
4. **One-Click Copy**: Easy to use the generated content

## Troubleshooting

- **No Repurpose Button?** Only appears on AI responses longer than 100 characters
- **Generation Fails?** Check your Gemini API key is valid
- **Modal Won't Open?** Try refreshing the YouTube page

The repurpose feature is designed to be a helpful addition without changing what users love about the original extension!