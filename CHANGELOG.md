# Changelog

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