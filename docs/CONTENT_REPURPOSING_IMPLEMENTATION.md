# Content Repurposing Implementation Guide

## Overview

The content repurposing feature transforms YouTube video transcripts into human-like LinkedIn posts (and other formats) using advanced prompt engineering and the proven frameworks from the analyzed video.

## Architecture

### Core Components

1. **Content Transformer** (`content-transformer.js`)
   - Main transformation pipeline
   - Template selection logic
   - Humanization engine
   - Platform optimization

2. **LinkedIn Templates** (`linkedin-templates.js`)
   - 5 proven post frameworks
   - Hook formulas
   - Human-like patterns
   - Language simplification

3. **Repurpose UI** (`repurpose-ui.js`)
   - Modal interface
   - Platform selection
   - Real-time editing
   - Copy functionality

## Integration Steps

### 1. Update Content Script

```javascript
// In content-script.js or chat-ui.js
import { ContentTransformer } from './content-repurposer/content-transformer.js';
import { RepurposeUI } from './content-repurposer/repurpose-ui.js';

// Initialize
const transformer = new ContentTransformer();
const repurposeUI = new RepurposeUI(transformer);

// Add to chat messages
chatMessages.forEach(message => {
  if (message.role === 'assistant') {
    repurposeUI.addRepurposeButton(message.element);
  }
});
```

### 2. Connect to Transcript Fetcher

```javascript
// Update getVideoTranscript method in repurpose-ui.js
async getVideoTranscript() {
  // Use the working transcript fetcher
  const videoId = new URL(window.location.href).searchParams.get('v');
  const response = await chrome.runtime.sendMessage({
    action: 'fetchTranscript',
    videoId: videoId
  });
  
  return response.transcript;
}
```

### 3. Update Background Script

```javascript
// In service-worker.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchTranscript') {
    // Use the youtube_transcript_fetcher.py via native messaging
    // or implement in JS using the yt-dlp approach
    fetchTranscript(request.videoId)
      .then(transcript => sendResponse({ transcript }))
      .catch(error => sendResponse({ error: error.message }));
    
    return true; // Keep channel open for async response
  }
});
```

### 4. API Integration

```javascript
// Update callAI method in content-transformer.js
async callAI(prompt, options = {}) {
  const fullPrompt = `${this.humanStylePrompt}\n\n${prompt}`;
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        generationConfig: {
          temperature: options.temperature || 0.9,
          maxOutputTokens: options.max_tokens || 4000,
          topK: 40,
          topP: 0.95
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_ONLY_HIGH"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_ONLY_HIGH"
          }
        ]
      })
    }
  );

  const data = await response.json();
  if (data.candidates && data.candidates.length > 0) {
    return data.candidates[0].content.parts[0].text;
  }
  throw new Error('Invalid response from Gemini API');
}
```

## Key Features

### 1. LinkedIn Post Framework

Based on the video analysis, posts follow this structure:
- **Hook**: 2 lines that trigger interest
- **Body**: Structured content (story, list, problem/solution)
- **Visual**: Suggested graphic/image
- **CTA**: Engagement question

### 2. Humanization Techniques

The system applies multiple layers of humanization:
- Simple language replacement
- Casual transitions and phrases
- Natural imperfections
- Varied sentence structure
- Strategic emoji usage (max 3)
- Personal touches

### 3. Template Selection

Automatically selects best template based on content:
- **Personal Story**: When transcript contains personal anecdotes
- **Number List**: When 5+ key points are identified
- **Problem/Solution**: When clear problem is discussed
- **Contrarian**: When challenging common beliefs
- **Transformation**: When showing progress/change

### 4. Anti-AI Detection

Implements techniques to avoid AI detection:
- Avoids corporate buzzwords
- Uses contractions naturally
- Varies sentence lengths (5-25 words)
- Includes minor imperfections
- Adds personal elements
- Uses specific examples/numbers

## Usage Flow

1. User watches YouTube video with extension
2. Chats with AI about video content
3. Clicks "Repurpose" button on any response
4. Selects platform (LinkedIn, Twitter, Blog)
5. Chooses style and tone
6. Clicks "Generate Content"
7. Reviews and edits generated post
8. Copies to clipboard with formatting

## Customization Options

### Platform-Specific Formats

```javascript
// LinkedIn
- Short paragraphs with line breaks
- Professional but personable tone
- 150-250 words optimal
- Visual suggestion included

// Twitter Thread
- Numbered tweets
- Cliffhangers between tweets
- Punchy, direct language
- 5-10 tweet threads

// Blog Post
- Introduction → Body → Conclusion
- Subheadings and sections
- 500-1000 words
- SEO optimization
```

### Tone Variations

- **Conversational**: Like talking to a friend
- **Professional**: Business-appropriate
- **Inspirational**: Motivational and uplifting
- **Educational**: Teaching and informative

## Testing & Quality Assurance

### 1. AI Detection Testing

Test generated content with:
- GPTZero
- Originality.ai
- Writer.com AI detector
- Copyleaks

Target: <15% AI probability

### 2. Engagement Metrics

Track on LinkedIn:
- View count
- Engagement rate
- Comment quality
- Share count

### 3. A/B Testing

Test variations:
- Different templates
- Hook styles
- Content length
- Visual types

## Best Practices

1. **One Video = One Insight**
   - Don't try to cover everything
   - Focus on the most interesting point

2. **Hook First, Always**
   - Spend extra time on first 2 lines
   - Test multiple hook variations

3. **Personal > Perfect**
   - Include specific examples
   - Share genuine reactions
   - Admit uncertainties

4. **Visual Matters**
   - Always include visual suggestion
   - Simple graphics work best
   - Screenshots add authenticity

5. **End with Engagement**
   - Ask genuine questions
   - Invite specific responses
   - Create conversation starters

## Future Enhancements

1. **Style Learning**
   - Analyze user's LinkedIn posts
   - Mimic their writing style
   - Personalized templates

2. **Performance Tracking**
   - Monitor actual LinkedIn metrics
   - Suggest improvements
   - Success pattern recognition

3. **Batch Processing**
   - Transform multiple videos
   - Content calendar integration
   - Scheduled posting

4. **Multi-Language**
   - Support for non-English content
   - Cultural adaptation
   - Local platform optimization