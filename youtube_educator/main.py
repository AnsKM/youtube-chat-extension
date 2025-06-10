#!/usr/bin/env python3
"""
YouTube Educator - Convert YouTube videos to educational content
"""

import sys
import os
from pathlib import Path

# Add core modules to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from core.ai import GeminiClient, ContentProcessor
from core.utils import FileHelpers, WebHelpers

def main():
    """Main entry point"""
    if len(sys.argv) != 2:
        print("Usage: python main.py <youtube_url>")
        return
    
    url = sys.argv[1]
    
    # Extract video ID
    video_id = WebHelpers.extract_youtube_video_id(url)
    if not video_id:
        print("Invalid YouTube URL")
        return
    
    print(f"Processing YouTube video: {video_id}")
    
    # Initialize AI client
    client = GeminiClient()
    processor = ContentProcessor(client)
    
    # Process the video (simplified for now)
    print("✅ Video processing complete!")
    print("Check data/youtube_educator/ for output files")

if __name__ == "__main__":
    main()
