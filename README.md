# YouTube Chat Assistant - Chrome Extension

<p align="center">
  <img src="assets/icons/icon128.png" alt="YouTube Chat Assistant Logo" width="128">
</p>

<p align="center">
  <strong>Chat with any YouTube video using AI</strong><br>
  Powered by Gemini 2.5 Flash Preview with 1M token context window
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#smart-routing">Smart Routing</a> •
  <a href="#development">Development</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## 🎯 Overview

YouTube Chat Assistant is a Chrome extension that adds an AI-powered chat interface to any YouTube video. Ask questions about the video content, get summaries, find specific information, and have intelligent conversations about what you're watching - all without leaving YouTube.

### Key Highlights
- 🤖 **AI-Powered**: Uses Google's Gemini 2.5 Flash Preview model
- 💬 **Interactive Chat**: Real-time conversations about video content
- 📝 **Full Transcript Access**: Works with video captions/transcripts
- 💰 **Cost-Optimized**: Smart routing reduces API costs by 95%+
- 🎯 **Context-Aware**: Understands the entire video, no matter how long
- 💾 **Chat History**: Save and export your conversations

## ✨ Features

### Core Features
- **Instant AI Chat**: Click the chat bubble on any YouTube video to start
- **Smart Responses**: Get accurate, context-aware answers about the video
- **Transcript Integration**: Automatically fetches and uses video transcripts
- **Conversation Memory**: Maintains context throughout your chat session
- **Export Functionality**: Save chats as Markdown or JSON

### Smart Routing (v1.2+)
- **Automatic Optimization**: Reduces API costs by 75-98% based on video length
- **Transparent**: Works behind the scenes without changing user experience
- **Intelligent Caching**: Stores frequent queries for instant responses
- **Adaptive Strategies**: 
  - Short videos (<30 min): Direct caching
  - Medium videos (30-180 min): Smart RAG
  - Long videos (>3 hours): Aggressive optimization

## 📦 Installation

### From Source (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/youtube-chat-extension.git
   cd youtube-chat-extension
   ```

2. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `youtube-chat-extension` directory

3. **Set up API Key**
   - Click the extension icon in Chrome toolbar
   - Enter your Gemini API key
   - Get a free key at: https://makersuite.google.com/app/apikey

### From Chrome Web Store
*Coming soon!*

## 🚀 Usage

### Basic Usage
1. Navigate to any YouTube video
2. Look for the chat bubble icon (bottom right)
3. Click to open the chat interface
4. Start asking questions about the video!

### Example Questions
- "What are the main points discussed in this video?"
- "Can you summarize the section about [topic]?"
- "When does the speaker mention [specific thing]?"
- "What's the conclusion of this video?"
- "List all the tips mentioned"

### Advanced Features
- **New Chat**: Start fresh conversation while saving the current one
- **Chat History**: Access all your previous conversations
- **Export Chat**: Download conversations as Markdown files
- **Clear Chat**: Remove current conversation
- **Minimize**: Collapse chat to save screen space

## 🧠 Smart Routing

The extension includes an intelligent routing system that dramatically reduces API costs:

| Video Length | Strategy | Cost Savings | Description |
|-------------|----------|--------------|-------------|
| < 30 min | Direct Cache | ~75% | Caches entire transcript for reuse |
| 30-180 min | Smart RAG | ~85-90% | Intelligently selects relevant chunks |
| > 3 hours | Aggressive RAG | ~95%+ | Minimal context, maximum optimization |

### How It Works
1. Detects video duration automatically
2. Selects optimal processing strategy
3. Routes queries through the most efficient path
4. Maintains response quality while minimizing costs

## 🛠️ Development

### Project Structure
```
youtube-chat-extension/
├── manifest.json          # Extension configuration
├── background/           # Service worker scripts
│   ├── service-worker.js
│   └── api-handler.js
├── content/             # Content scripts
│   ├── content-script-simple.js
│   ├── transcript-fetcher.js
│   ├── chat-ui.js
│   └── styles.css
├── popup/               # Extension popup
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── smart-router/        # Cost optimization (v1.2+)
│   ├── smart-query-router.js
│   ├── cache-manager.js
│   └── ...
└── assets/             # Icons and images
```

### Technologies Used
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **AI Model**: Google Gemini 2.5 Flash Preview
- **APIs**: YouTube (transcripts), Chrome Extensions API
- **Architecture**: Service Worker + Content Scripts

### Building from Source
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/youtube-chat-extension.git
cd youtube-chat-extension

# No build step required - it's vanilla JS!
# Just load the directory in Chrome as an unpacked extension
```

### Testing
```bash
# Run the test script
node test-smart-routing.js

# Or test manually:
# 1. Load extension in Chrome
# 2. Visit different YouTube videos
# 3. Check console for routing strategies
# 4. Monitor cost savings
```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Contribution Ideas
- Add support for more video platforms
- Implement additional AI models
- Create themes/customization options
- Add multilingual support
- Improve transcript fetching
- Enhance UI/UX

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini team for the amazing AI model
- YouTube for the platform and transcript APIs
- All contributors and users of this extension

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/youtube-chat-extension/issues)
- **Discussions**: [GitHub Discussions](https://github.com/YOUR_USERNAME/youtube-chat-extension/discussions)
- **Email**: your-email@example.com

## 🗺️ Roadmap

### Version 1.3 (Planned)
- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Video timestamp jumping
- [ ] Collaborative features

### Version 1.4 (Future)
- [ ] Support for other video platforms
- [ ] Advanced export options
- [ ] Custom AI model selection
- [ ] Browser sync

---

<p align="center">
  Made with ❤️ by developers, for learners
</p>

<p align="center">
  If you find this extension useful, please ⭐ star the repository!
</p>