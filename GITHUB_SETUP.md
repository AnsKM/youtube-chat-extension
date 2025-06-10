# GitHub Repository Setup Instructions

## Step 1: Authenticate GitHub CLI

First, you need to authenticate with GitHub:

```bash
gh auth login
```

Follow the prompts to:
1. Choose GitHub.com
2. Select HTTPS as preferred protocol
3. Authenticate with your browser (recommended) or paste an authentication token
4. Complete the authentication in your browser

## Step 2: Create the Repository

Once authenticated, run this command from the extension directory:

```bash
gh repo create youtube-chat-extension \
  --public \
  --description "AI-powered Chrome extension for chatting with YouTube videos. Features smart routing for 95%+ cost savings." \
  --source=. \
  --remote=origin \
  --push
```

## Step 3: Push Both Branches

The repository has been created with the main branch. Now push the smart-router branch:

```bash
# Push the smart-router-integration branch
git push -u origin smart-router-integration
```

## Step 4: Set Default Branch (Optional)

If you want to make the main branch the default on GitHub:

```bash
gh repo edit --default-branch main
```

## Step 5: Add Topics

Add relevant topics to help people find your repository:

```bash
gh repo edit --add-topic chrome-extension,youtube,ai,chatbot,gemini-api,javascript
```

## Step 6: Create Initial Release (Optional)

Create a release for the stable version:

```bash
gh release create v1.1.0 \
  --title "YouTube Chat Assistant v1.1.0" \
  --notes "Initial stable release with core chat functionality" \
  --target main
```

## Manual Alternative

If you prefer to create the repository manually:

1. Go to https://github.com/new
2. Repository name: `youtube-chat-extension`
3. Description: "AI-powered Chrome extension for chatting with YouTube videos. Features smart routing for 95%+ cost savings."
4. Choose: Public
5. Don't initialize with README (we already have one)
6. Create repository

Then add the remote and push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/youtube-chat-extension.git
git push -u origin main
git push -u origin smart-router-integration
```

## Repository Settings Recommendations

After creating the repository, consider:

1. **Enable Issues** - For bug reports and feature requests
2. **Enable Discussions** - For community Q&A
3. **Add Branch Protection** - Protect main branch
4. **Set up GitHub Pages** - For documentation (optional)
5. **Add Collaborators** - If working with others

## Next Steps

1. Update the README.md with your actual GitHub username
2. Add screenshots to the assets folder
3. Create a demo GIF for the README
4. Consider adding GitHub Actions for automated testing
5. Add contribution guidelines in CONTRIBUTING.md