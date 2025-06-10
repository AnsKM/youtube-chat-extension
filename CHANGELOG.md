# Changelog

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

## 2025-01-10: Enhanced markdown formatting with blue theme
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

## 2025-01-10: Added section headers and improved spacing
- Added pattern recognition for numbered headers with (Step X) format
- Created markdown-section-header CSS class with proper spacing
- Section headers now have 1.5em top margin for clear separation
- Expanded subheading patterns to include Key Rule, Hard Truth, Importance, etc.
- Fixed numbered list parsing to exclude section headers
- Updated documentation with new features

## 2025-01-10: Fixed parsing order issues
- Fixed bold subheading patterns (**What it is:**) by processing before HTML escaping
- Moved placeholder replacements after line break conversion
- Added support for multi-word subheading patterns (Key Rule:, Three Roles of a Hook:)
- Fixed section header regex to work with multiline content
- Added debug logging to help troubleshoot formatting issues

## 2025-01-10: Fixed table-like column splitting
- Added tab character normalization to prevent column-like display
- Normalized multiple spaces to prevent text splitting
- Fixed subheading CSS to use block display
- Enhanced debug logging to detect remaining bold markers
- Improved whitespace handling while preserving line breaks

## 2025-01-10: Added support for simple numbered headers
- Added pattern to recognize "1. Title:" format as headers
- Support bold text within numbered headers
- Created AI response formatting guide for better output
- Headers now work with or without "(Step X)" suffix
- Improved flexibility for various AI response formats

## 2025-01-10: Enhanced Gemini prompt for better formatting
- Added formatting instructions to Gemini prompt
- Encourages numbered lists with colons (1. Title: Description)
- Requests subheadings like "What it is:", "How to do it:"
- Promotes use of bold text and structured responses
- Should improve consistency of AI response formatting

## 2025-01-10: Added clickable timestamps functionality
- Comprehensive prompt engineering for Gemini to include timestamps
- Automatic detection and parsing of [MM:SS] and [H:MM:SS] format timestamps
- Clickable blue gradient timestamp pills with hover effects
- Multiple YouTube player control methods for seeking to timestamp
- Integration with video player through direct control, postMessage API, and URL parameters
- Enhanced debug logging to track timestamp detection and click events
- Updated all documentation with timestamp examples and usage guides

## 2025-01-10: Refined timestamps and removed tables
- Hide all HTML tables in chat interface to prevent layout issues
- Made timestamps more selective - only when they add real navigation value
- Improved timestamp click functionality with multiple YouTube player control methods
- Enhanced debug logging to troubleshoot click events
- Updated prompt to avoid timestamp overuse and focus on key moments
- Refined documentation to show better timestamp usage examples