# YouTube Chat Extension - Setup Instructions

## Prerequisites

1. **API Key Required**:
   - Gemini API key (for both chat functionality and content repurposing)

2. **Chrome/Edge Browser** version 88 or later

## Installation Steps

### 1. Clone or Download the Extension

```bash
git clone [repository-url]
cd youtube-chat-extension
```

### 2. Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the extension directory

### 3. Configure API Key

1. Click the extension icon in Chrome toolbar
2. Go to Settings/Options
3. Enter your Gemini API key
   - This single key powers both chat and content repurposing features
4. Save settings

## Using the Extension

### Basic Chat Feature

1. Navigate to any YouTube video
2. Click the chat bubble icon (bottom right)
3. Ask questions about the video
4. The AI will respond based on the video content

### Content Repurposing Feature

1. After getting a response in chat
2. Click the **Repurpose** button below any AI message
3. In the modal:
   - Select platform (LinkedIn, Twitter, Blog)
   - Choose content style
   - Select tone
   - Click **Generate Content**
4. Edit the generated content if needed
5. Click copy to clipboard

## Configuration Options

### manifest.json Permissions

The extension requires these permissions:
- `activeTab` - Access current YouTube tab
- `storage` - Save API keys and settings
- `https://www.youtube.com/*` - Access YouTube content
- `https://generativelanguage.googleapis.com/*` - Gemini API calls

### Settings

Configure in popup settings:
- **Theme**: Light/Dark/Auto
- **Language**: Interface language
- **Model Selection**: Choose AI model (Gemini 2.5 Flash)
- **API Key**: Single Gemini API key for all features

## Troubleshooting

### Transcript Not Loading

1. **Check if video has captions**: Not all videos have transcripts
2. **Try refreshing**: Reload the YouTube page
3. **Check console**: Press F12 and look for errors

### Repurpose Feature Not Working

1. **Verify Gemini API key**: Must be valid and have credits
2. **Check API limits**: Ensure you haven't hit rate limits
3. **Test with shorter videos**: Long transcripts may timeout

### Extension Not Appearing

1. **Check installation**: Ensure extension is enabled in chrome://extensions
2. **Reload extension**: Click reload button in extensions page
3. **Check for conflicts**: Disable other YouTube extensions temporarily

## Development Setup

### Running Tests

```bash
# Test content transformer
node test-repurpose-feature.js

# Check for TypeScript errors
npm run check-types
```

### Building for Production

```bash
# Create production build
npm run build

# Package for Chrome Web Store
npm run package
```

### File Structure

```
youtube-chat-extension/
├── manifest.json              # Extension manifest
├── src/
│   ├── background/           # Service worker
│   ├── content/             # Content scripts
│   ├── content-repurposer/  # Repurposing logic
│   └── popup/               # Extension popup
├── docs/                    # Documentation
└── tests/                   # Test files
```

## API Usage & Costs

### Gemini API (All Features)
- **Model**: Gemini 2.5 Flash
- **Pricing**: ~$0.00001875 per 1K input tokens, ~$0.000075 per 1K output tokens
- **Average chat**: ~500 tokens ($0.01)
- **Average repurpose**: ~3K tokens ($0.06)
- **Monthly estimate**: $5-15 for regular use of both features

## Privacy & Security

- API keys stored locally in Chrome storage
- No data sent to external servers except APIs
- Transcripts cached locally for performance
- Chat history saved per video (optional)

## Support

- **Issues**: Report on GitHub issues
- **Updates**: Check releases page
- **Documentation**: See /docs folder

## Future Features

1. **Batch Processing**: Transform multiple videos
2. **Style Learning**: Adapt to your writing style
3. **Schedule Posting**: Direct LinkedIn integration
4. **Analytics**: Track post performance
5. **More Platforms**: Instagram, Medium, etc.