# YouTube Chat Extension - Enhanced Markdown Features

This document describes the enhanced markdown formatting features added to the YouTube Chat Extension for a more vibrant and engaging chat experience.

## Overview

The chat interface now supports rich markdown formatting with a clean blue color scheme and smooth animations. All features are modular and can be easily enabled/disabled.

## Supported Markdown Features

### 1. Headers (H1-H6)

Use `#` symbols to create headers:

```markdown
# Header 1 (with 📌 icon and blue gradient)
## Header 2 (with ▸ arrow)
### Header 3
#### Header 4
##### Header 5
###### Header 6
```

### 2. Section Headers (Numbered)

```markdown
# With Step notation:
1. Find a Core Insight (Step 1)
2. Create the Content (Step 2)

# Simple format with colon:
1. The Framework Post:
2. Educated Opinions:
3. **Why You Should [Topic]:**
```

Both patterns are automatically styled as section headers with increased spacing and blue color. Bold text within headers is supported.

### 3. Lists

#### Ordered Lists
```markdown
1. First item (with blue gradient badge)
2. Second item
3. Third item
```

#### Unordered Lists
```markdown
* Item with animated blue dot
* Another item (hover for glow effect)
- Alternative bullet syntax
```

### 4. Code

#### Code Blocks
````markdown
```javascript
const greeting = "Hello, World!";
console.log(greeting);
```
````

#### Inline Code
```markdown
Use `console.log()` to debug
```

### 5. Task Lists

```markdown
- [ ] Unchecked task
- [x] Completed task
```

### 6. Blockquotes

```markdown
> This is a blockquote with a blue gradient border
> It can span multiple lines
```

### 7. Links

```markdown
[Visit Google](https://google.com)
```

### 8. Text Formatting

```markdown
**Bold text**
==Highlighted text==
[[Ctrl+S]] keyboard shortcut
```

### 9. Subheadings/Labels

```markdown
What it is: Description text
How to do it: Step-by-step guide
When to use: Timing information
Why it matters: Explanation
Where to apply: Location details
Who benefits: Target audience
Key Rule: Important principle
Hard Truth: Reality check
Importance: Why this matters
```

These patterns are automatically styled as subheadings with blue color and proper spacing.

### 10. Horizontal Rules

```markdown
---
```

## Customization

### Enabling/Disabling Features

In `content/content-script-smart.js`, find the `formatMessage()` function and modify the `features` object:

```javascript
const features = {
  headers: true,          // Set to false to disable headers
  lists: true,           // Set to false to disable lists
  codeBlocks: true,      // Set to false to disable code blocks
  inlineCode: true,      // Set to false to disable inline code
  taskLists: true,       // Set to false to disable task lists
  blockquotes: true,     // Set to false to disable blockquotes
  horizontalRules: true, // Set to false to disable horizontal rules
  links: true,           // Set to false to disable links
  highlighting: true,    // Set to false to disable text highlighting
  keyboardShortcuts: true, // Set to false to disable keyboard shortcuts
  bold: true,            // Set to false to disable bold text
  lineBreaks: true,      // Set to false to disable line breaks
  subheadings: true      // Set to false to disable subheading patterns
};
```

### Modifying Colors

All colors use CSS variables defined in `content/styles.css`. To change the blue theme:

```css
:root {
  --accent-blue: #3b82f6;        /* Main blue color */
  --accent-blue-light: #60a5fa;  /* Light blue for gradients */
  --accent-blue-lighter: #93c5fd; /* Even lighter blue */
  --accent-blue-dark: #2563eb;   /* Dark blue for text */
  --accent-blue-darker: #1d4ed8; /* Darker blue variant */
  --code-bg: #1e293b;            /* Code block background */
  --code-border: #334155;        /* Code block border */
}
```

### Removing Specific Styling

To remove specific styling elements:

1. **Remove header icons**: Delete or comment out the `::before` pseudo-elements in `.markdown-h1` and `.markdown-h2`
2. **Remove animations**: Delete the `transition` and `transform` properties
3. **Remove gradients**: Replace `linear-gradient` with solid colors

Example - Converting gradient header to solid color:
```css
/* Original with gradient */
.markdown-h1 {
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-blue-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Modified with solid color */
.markdown-h1 {
  color: var(--accent-blue);
}
```

## Security

All user input is properly escaped using the `escapeHtml()` function to prevent XSS attacks. The implementation:
- Escapes HTML entities before processing
- Protects code blocks from being parsed
- Sanitizes URLs in links
- Prevents script injection

## Performance

The markdown parser is optimized for performance:
- Single-pass parsing for most features
- Efficient regex patterns
- Minimal DOM manipulation
- No external dependencies

## Examples

### Complex Message Example

```markdown
# Welcome to YouTube Chat! 📌

Here are some **features** you can use:

## Lists
1. Ask questions about the video
2. Get timestamps for specific topics
3. Request summaries

## Code Examples
```python
# You can share code snippets
def greet(name):
    return f"Hello, {name}!"
```

> Pro tip: Use `Ctrl+Q` to quickly toggle the chat!

---

- [ ] Try the new features
- [x] Enjoy enhanced formatting

Visit our [documentation](https://example.com) for more info.
```

This will render with:
- Gradient H1 header with pin icon
- Blue H2 header with arrow
- Numbered list with circular badges
- Syntax-highlighted code block
- Styled blockquote
- Interactive checkboxes
- Styled link
- All with smooth hover animations