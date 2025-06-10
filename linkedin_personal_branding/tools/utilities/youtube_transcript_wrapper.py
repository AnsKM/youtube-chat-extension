"""
YouTube Transcript Wrapper for LinkedIn Personal Branding

This module provides a workaround for Python 3.13 compatibility issues
by using subprocess to call the global yt-transcript tool.

Example usage:
    from tools.utilities.youtube_transcript_wrapper import get_youtube_transcript
    
    transcript = get_youtube_transcript('https://youtube.com/watch?v=...')
"""

import subprocess
import json
import os
import re
from typing import Optional, Dict


def extract_video_id(url: str) -> Optional[str]:
    """Extract YouTube video ID from various URL formats."""
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
        r'(?:embed\/)([0-9A-Za-z_-]{11})',
        r'(?:watch\?v=)([0-9A-Za-z_-]{11})',
        r'(?:youtu\.be\/)([0-9A-Za-z_-]{11})'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def get_youtube_transcript(url: str) -> Optional[str]:
    """
    Fetch transcript from a YouTube video using the global yt-transcript tool.
    
    Args:
        url: YouTube video URL
    
    Returns:
        Transcript text or None if failed
    """
    try:
        # Use the global yt-transcript tool
        yt_tool = "/Users/anskhalid/CascadeProjects/claude_code_workflows/tools/yt-transcript"
        
        # Run the command
        result = subprocess.run(
            [yt_tool, url],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0 and result.stdout:
            return result.stdout.strip()
        else:
            # Check stderr for error details
            error_msg = result.stderr.strip() if result.stderr else "Unknown error"
            print(f"Error fetching transcript: {error_msg}")
            return None
            
    except subprocess.TimeoutExpired:
        print("Error: Transcript fetch timed out")
        return None
    except Exception as e:
        print(f"Error fetching transcript: {str(e)}")
        return None


def analyze_youtube_content(url: str) -> Optional[Dict]:
    """
    Analyze YouTube video content for LinkedIn content inspiration.
    
    Args:
        url: YouTube video URL
    
    Returns:
        Dict with video analysis
    """
    try:
        # Get transcript
        transcript = get_youtube_transcript(url)
        if not transcript:
            return None
        
        # Extract video ID for title
        video_id = extract_video_id(url)
        title = f"YouTube Video {video_id}" if video_id else "YouTube Video"
        
        # Calculate estimated reading time (avg 200 words per minute)
        word_count = len(transcript.split())
        reading_time = round(word_count / 200)
        
        analysis = {
            'title': title,
            'url': url,
            'transcript': transcript,
            'word_count': word_count,
            'reading_time_minutes': reading_time,
            'key_points': [],  # Placeholder for future AI analysis
            'content_ideas': []  # Placeholder for LinkedIn post ideas
        }
        
        return analysis
        
    except Exception as e:
        print(f"Error analyzing YouTube content: {str(e)}")
        return None


def save_transcript_for_research(url: str, output_dir: str = None) -> Optional[str]:
    """
    Save YouTube transcript to a file for later reference.
    
    Args:
        url: YouTube video URL
        output_dir: Directory to save transcript
    
    Returns:
        Path to saved file or None if failed
    """
    try:
        # Get default output directory
        if not output_dir:
            output_dir = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                'content_inspiration',
                'youtube'
            )
        
        # Create directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Get transcript
        transcript = get_youtube_transcript(url)
        if not transcript:
            return None
        
        # Extract video ID for filename
        video_id = extract_video_id(url)
        if not video_id:
            video_id = 'unknown'
        
        # Create filename
        filename = f"{video_id}_transcript.md"
        filepath = os.path.join(output_dir, filename)
        
        # Write transcript with metadata
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(f"# YouTube Video Transcript\n\n")
            f.write(f"**URL**: {url}\n")
            f.write(f"**Video ID**: {video_id}\n\n")
            f.write("## Transcript\n\n")
            f.write(transcript)
        
        print(f"Transcript saved to: {filepath}")
        return filepath
        
    except Exception as e:
        print(f"Error saving transcript: {str(e)}")
        return None


if __name__ == "__main__":
    # Test with the provided video
    test_url = "https://youtu.be/PhhUB4OQlnw"
    
    print(f"Testing YouTube transcript wrapper with: {test_url}")
    print("-" * 50)
    
    # Get transcript
    transcript = get_youtube_transcript(test_url)
    if transcript:
        print(f"✓ Successfully fetched transcript!")
        print(f"Preview: {transcript[:200]}...")
        print(f"Total length: {len(transcript)} characters")
    else:
        print("✗ Failed to fetch transcript")
    
    print("\n" + "-" * 50)
    
    # Analyze content
    print("Analyzing content...")
    analysis = analyze_youtube_content(test_url)
    if analysis:
        print(f"✓ Video Title: {analysis['title']}")
        print(f"✓ Word Count: {analysis['word_count']}")
        print(f"✓ Reading Time: {analysis['reading_time_minutes']} minutes")
    
    # Save for research
    print("\n" + "-" * 50)
    print("Saving transcript for research...")
    saved_path = save_transcript_for_research(test_url)
    if saved_path:
        print(f"✓ Transcript saved to: {saved_path}")