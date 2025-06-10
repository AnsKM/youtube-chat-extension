# AI Response Formatting Guide

This guide helps improve the formatting of AI responses in the YouTube Chat Extension.

## Current Formatting Support

The extension now supports multiple header formats:

### 1. Step-based Headers
```
1. Find a Core Insight (Step 1)
2. Create Content (Step 2)
```

### 2. Simple Numbered Headers
```
1. The Framework Post:
2. Educated Opinions:
3. **Why You Should [Topic]:**
```

### 3. Subheadings
```
What it is: Description
How to do it: Instructions
Key Rule: Important principle
```

## Improving AI Response Structure

To get better formatted responses from the AI, consider adding formatting hints to your questions:

### Example Questions for Better Formatting

Instead of:
> "What are the 5 best post formats?"

Try:
> "What are the 5 best post formats? Please format each as a numbered heading."

Or:
> "List the 5 best post formats. Use this format: '1. Format Name: Description'"

### Prompt Engineering Tips

1. **Request Specific Formatting**: Ask the AI to use numbered lists with colons
2. **Ask for Headers**: Request that main points be formatted as headers
3. **Specify Structure**: Ask for "What it is:" and "How to do it:" sections

### Example Well-Formatted Response

```markdown
## Top 5 LinkedIn Post Formats

1. The Framework Post:

What it is: A comprehensive post that packages knowledge into a framework.

How to use it: Create a step-by-step process or system that solves a specific problem.

2. Educated Opinions:

What it is: Expert opinions based on your professional experience.

Key points:
* Share analyzed patterns
* Back up with data
* Provide unique insights
```

## Supported Markdown Features

The extension supports:
- Headers with numbers and colons
- Bold text within headers
- Subheadings (What it is:, How to:, etc.)
- Lists with animated bullets
- Code blocks with syntax highlighting
- Task lists
- Links and highlighting

## Troubleshooting

If formatting isn't working as expected:

1. Check the browser console for "[YouTube Chat]" debug messages
2. Ensure the AI response follows supported patterns
3. Try rephrasing your question to request specific formatting
4. Reload the extension if changes were recently made