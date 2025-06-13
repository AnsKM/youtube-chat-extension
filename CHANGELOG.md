# Changelog

## 2025-01-13: Debugging Chat Bubble Not Appearing
- Added extensive debug logging throughout initialization pipeline
- Fixed duplicate createChatBubble method causing conflicts
- Changed content script injection from document_idle to document_end
- Added visual console feedback to verify extension loading
- Created test-extension.html for debugging initialization issues
- Added fallback initialization for already-loaded DOM
- Enhanced error logging with stack traces

## 2025-01-13: Fixed Chat History Not Loading
- Fixed missing getAllChats handler in service-worker.js
- Added getAllChats function to retrieve all saved chat conversations
- Enhanced error handling and debugging for chat history loading
- Added console logging to help diagnose history loading issues
- Improved error UI when chat history fails to load

## 2025-01-13: Switched to DeepSeek R1 Distilled for Faster Response Generation
- Replaced slow DeepSeek R1 model with faster distilled version (deepseek-r1-0528-qwen3-8b:free)
- Significantly improved token generation speed for better chat experience
- Updated UI labels to indicate "DeepSeek R1 Distilled"
- Model description now shows "Fast distilled reasoning model"
- Maintains same free access through OpenRouter promotion

## 2025-01-13: Fixed Transcript Context Not Being Passed to AI Models
- Fixed critical bug where video transcript was not being included in AI context
- Updated GeminiClient to build enhanced prompts with transcript data
- Updated OpenRouterClient to properly include transcript in message context
- Added formatTranscript method to handle various transcript formats
- Added debug logging to track transcript passing through the system
- Both Gemini and DeepSeek models now receive full video transcript for accurate responses

## 2025-01-13: Fixed Transcript Context Not Being Passed to AI Models
- Added comprehensive logging throughout transcript pipeline
- Enhanced error handling when transcript fetch fails
- Added visual feedback showing transcript loading status and stats
- Improved user messaging when transcript is unavailable
- Added detailed debug logging to trace context flow from content script to service worker
- Clear indication of transcript availability before allowing chat

## 2025-01-13: Added DeepSeek R1 Integration via OpenRouter
- Added model selection dropdown in popup to choose between Gemini 2.5 Flash and DeepSeek R1
- Integrated OpenRouter API to enable free access to DeepSeek R1 during promotion
- Created OpenRouterClient class with support for DeepSeek's reasoning format
- Updated popup UI to show/hide appropriate API key fields based on selected model
- Modified service worker to support multiple AI providers
- Updated storage schema to handle dual API keys (geminiApiKey, openrouterApiKey)
- Added selectedModel preference to remember user's choice
- Updated manifest.json to include OpenRouter in host permissions
- Dynamic UI updates: model description, context window info, and API key help links
- Maintained all existing functionality while adding multi-model support

## 2025-01-13: Added Copy-to-Clipboard Button for AI Responses
- Added copy button at bottom-right corner of assistant messages
- Button appears on hover with subtle opacity transition
- Click to copy full message content to clipboard
- Shows green checkmark icon for 2 seconds on successful copy
- Red error state if clipboard operation fails
- Works with all message content including formatted text
- No conflict with repurpose button positioning
- Smooth animations and visual feedback

## 2025-01-13: Added Chat Maximize Overlay and Fullscreen Auto-hide
- Added maximize button to expand chat to fullscreen overlay mode
- Chat expands to 90% of viewport with semi-transparent backdrop
- Click outside or press ESC to return to normal size
- Enhanced fullscreen detection for both native and YouTube fullscreen
- Chat automatically hides when entering fullscreen mode
- Chat restores to previous state when exiting fullscreen
- Added smooth animations for maximize/minimize transitions
- Fixed message layout in maximized mode - messages now stack vertically
- Messages area constrained to 800px width for optimal readability
- Proper message alignment maintained (user right, assistant left)

## 2025-01-13: Fixed Chat History Search and Added Channel Names
- Fixed non-functional search in Chat History panel
- Added YouTube channel name extraction and storage
- Display channel name as subtitle under video title in history
- Search now works across video titles, channel names, and message content
- Updated chat data structure to include channelName field
- Added CSS styling for channel name display
- Improved visual hierarchy in chat history items

## 2025-06-10: Added AI-Powered Infographic Prompt Generation
- Added new "Infographic Prompt" section below visual suggestions
- Intelligent content type detection (AI creative, automation, data, process, comparison, concept)
- Dynamic visual styles that vary with each regeneration
- Content-specific visual elements and color schemes
- Copy-to-clipboard functionality for easy use in image generators
- Prompts optimized for DALL-E 3, Midjourney, and other AI tools
- Professional guidelines for mobile-optimized, shareable designs

## 2025-06-10: Optimized Gemini Flash for Better LinkedIn Posts
- Updated prompting philosophy from rigid rules to flexible guidelines
- Increased temperature from 0.9 to 1.0 for more creative output
- Expanded vocabulary with topK: 50 (from 40) for richer language
- Simplified templates to be inspirational examples rather than strict structures
- Enhanced insight extraction to focus on viral-worthy content
- Improved prompting to avoid literal point listing
- Added specific content handlers for different topics (AI design, coding patterns)
- Emphasized storytelling and reader engagement over information dumping

## 2025-06-10: LinkedIn Repurposing Feature Fixes
- Fixed timestamp removal: Added cleanTimestamps method to remove [MM:SS] patterns from transcripts
- Fixed content cutoff: Changed display method to use textContent instead of innerHTML to avoid truncation
- Fixed regeneration: Added variation mechanism that creates different versions on each click
- Enhanced timestamp cleaning: Added multiple layers of timestamp removal to catch all cases
- Improved variation: Each regeneration now produces different hooks, insights, and CTAs
- Updated fetchFromYouTubeAPI to optionally exclude timestamps for repurposing
- Added cleanTimestamps to content-transformer for additional safety
- Fixed display method in repurpose-ui to show full content without HTML escaping

## 2025-06-10: Fixed Content Truncation in LinkedIn Posts
- Removed substring(0, 200) limit on mainInsight that was cutting off content
- Removed substring(0, 150) limit on problemSolved
- Removed substring(0, 97) limit on supporting points
- Removed substring(0, 100) limits in hooks and content lines
- Fixed video title extraction with multiple selector fallbacks for different YouTube layouts
- Added debug logging to track metadata extraction
- Content now displays in full without arbitrary character limits

## 2025-06-10: Fixed Regenerate Button Functionality
- Fixed regenerate button not working by NOT hiding results section during regeneration
- Added isRegeneration check to preserve results visibility
- Added visual feedback with mini spinner in regenerate button during processing
- Added disabled state to prevent multiple simultaneous regenerations
- Enhanced debug logging to track regeneration attempts
- Regenerate button now properly creates different variations without UI glitches

## 2025-06-10: Enhanced Content Variation System
- Added multiple hook variations for each template type (5 variations each)
- Added 8 generic hook variations for fallback cases
- Added variation to main insight presentation (8 different intros)
- Added variation to supporting points introduction (8 different headers)
- Added variation to problem/solution presentation (8 different formats)
- Each regeneration now produces visibly different content structure
- Variation index based on generation attempt ensures consistent progression

## 2025-06-10: Fixed LinkedIn Post Formatting Issues
- Fixed word joining issues (goalHe, creativesHe) by preserving spaces when removing markdown
- Fixed incomplete "I discovered" sentence by changing personal story to source reference
- Improved supporting points extraction with proper space preservation
- Added intelligent markdown removal that maintains word boundaries
- Enhanced LLM prompting for more flexible and natural output
- Restructured insights display to show as numbered list instead of comma-separated
- Simplified requirements to allow more creative and natural post generation
- Added debug logging to track formatting issues
- Video source now appears as P.S. at end of post instead of incomplete sentence
- Cleaned up asterisk and formatting artifacts in final output

## 2025-06-10: Fixed Content Repurposing LinkedIn Post Generation
- Fixed content repurposing feature not generating proper LinkedIn posts
- Improved content extraction from AI responses and conversation history  
- Enhanced mock draft generation with specific handling for AI/tech content
- Added better conversation context passing to repurpose UI
- Fixed template structure handling in content transformer
- Improved insight extraction to handle truncated content properly
- Updated `generateMockDraft` to create engaging LinkedIn posts based on actual content
- Enhanced `extractInsightsManually` to better parse conversation context
- Added example LinkedIn post structure to AI prompts for better guidance

## 2025-01-06: Fixed LinkedIn Repurpose Feature
- Fixed LinkedIn post content generation in repurpose modal showing empty content
- Updated mock responses in content-transformer.js to return properly formatted LinkedIn posts
- Added debug logging to trace content transformation pipeline
- Improved error handling and fallback content for repurpose feature
- Updated web_accessible_resources in manifest to include nested content-repurposer files
- Enhanced mock LinkedIn post content with realistic examples and formatting
- Added better error messages when content generation fails
- Improved content transformation pipeline with proper fallbacks

## 2025-06-10: Major Project Cleanup
- Removed 6 unrelated project folders to focus solely on YouTube Chat Extension:
  - ai_job_hunter (AI job hunting application)
  - ai_offers_intel (AI offers analysis tool)
  - linkedin_personal_branding (LinkedIn automation project)
  - meta_ad_analyzer (Facebook ads analyzer)
  - youtube_educator (Separate YouTube education tool)
  - youtube_trends (YouTube trends analysis project)
- Removed empty youtube_chat_extension duplicate folder
- Removed duplicate src/smart-router folder
- Removed Python __init__.py file (not needed for JavaScript Chrome extension)
- Removed 10 test/demo files from root directory
- Project is now a clean, focused Chrome extension without unrelated code

## 2025-06-10: Enhanced markdown formatting with blue theme
- Implemented comprehensive markdown parser with modular feature flags
- Added support for H1-H6 headers with gradient blue styling and icons
- Implemented ordered/unordered lists with animated blue theme
- Added code blocks with syntax highlighting and language labels
- Added inline code, task lists, blockquotes, links, and more features
- Fixed subheading patterns (What it is:, How to:, etc.) to render as labels not bullets
- Improved numbered list parsing to handle multi-line items
- Reduced excessive spacing between list items for better readability
- All features use configurable blue color scheme with smooth animations
- Created comprehensive documentation in docs/MARKDOWN_FEATURES.md

## 2025-06-10: Added section headers and improved spacing
- Added pattern recognition for numbered headers with (Step X) format
- Created markdown-section-header CSS class with proper spacing
- Section headers now have 1.5em top margin for clear separation
- Expanded subheading patterns to include Key Rule, Hard Truth, Importance, etc.
- Fixed numbered list parsing to exclude section headers
- Updated documentation with new features

## 2025-06-10: Fixed parsing order issues
- Fixed bold subheading patterns (**What it is:**) by processing before HTML escaping
- Moved placeholder replacements after line break conversion
- Added support for multi-word subheading patterns (Key Rule:, Three Roles of a Hook:)
- Fixed section header regex to work with multiline content
- Added debug logging to help troubleshoot formatting issues

## 2025-06-10: Fixed table-like column splitting
- Added tab character normalization to prevent column-like display
- Normalized multiple spaces to prevent text splitting
- Fixed subheading CSS to use block display
- Enhanced debug logging to detect remaining bold markers
- Improved whitespace handling while preserving line breaks

## 2025-06-10: Added support for simple numbered headers
- Added pattern to recognize "1. Title:" format as headers
- Support bold text within numbered headers
- Created AI response formatting guide for better output
- Headers now work with or without "(Step X)" suffix
- Improved flexibility for various AI response formats

## 2025-06-10: Enhanced Gemini prompt for better formatting
- Added formatting instructions to Gemini prompt
- Encourages numbered lists with colons (1. Title: Description)
- Requests subheadings like "What it is:", "How to do it:"
- Promotes use of bold text and structured responses
- Should improve consistency of AI response formatting

## 2025-06-10: Added clickable timestamps functionality
- Comprehensive prompt engineering for Gemini to include timestamps
- Automatic detection and parsing of [MM:SS] and [H:MM:SS] format timestamps
- Clickable blue gradient timestamp pills with hover effects
- Multiple YouTube player control methods for seeking to timestamp
- Integration with video player through direct control, postMessage API, and URL parameters
- Enhanced debug logging to track timestamp detection and click events
- Updated all documentation with timestamp examples and usage guides

## 2025-06-10: Refined timestamps and removed tables
- Hide all HTML tables in chat interface to prevent layout issues
- Made timestamps more selective - only when they add real navigation value
- Improved timestamp click functionality with multiple YouTube player control methods
- Enhanced debug logging to troubleshoot click events
- Updated prompt to avoid timestamp overuse and focus on key moments
- Refined documentation to show better timestamp usage examples