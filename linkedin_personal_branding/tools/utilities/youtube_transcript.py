"""
YouTube Transcript Fetcher for LinkedIn Personal Branding

This module provides functionality to fetch YouTube transcripts for content research
and inspiration. It uses the global youtube_transcript_retriever function.

Example usage:
    from tools.utilities.youtube_transcript import get_youtube_transcript
    
    transcript = get_youtube_transcript('https://youtube.com/watch?v=...')
"""

import sys
import os
from typing import Optional, Dict, List, Union

# Add the youtube_educator path directly to avoid circular imports
youtube_educator_path = '/Users/anskhalid/CascadeProjects/claude_code_workflows/projects/youtube_educator/src'
if youtube_educator_path not in sys.path:
    sys.path.insert(0, youtube_educator_path)

# Import directly from transcript_retriever
from transcript_retriever import (
    youtube_transcript_retriever as get_transcript,
    extract_video_id
)


def get_youtube_transcript(
    url: str,
    languages: Optional[List[str]] = None,
    include_timestamps: bool = False,
    include_metadata: bool = False
) -> Union[str, Dict, None]:
    """
    Fetch transcript from a YouTube video for content research.
    
    Args:
        url: YouTube video URL
        languages: List of language codes to try (e.g., ['en', 'es'])
        include_timestamps: If True, includes timestamps in the transcript
        include_metadata: If True, returns dict with transcript and video title
    
    Returns:
        Transcript text as string, or dict with 'transcript' and 'title' if include_metadata=True
        Returns None if transcript cannot be retrieved
    """
    try:
        result = get_transcript(
            url,
            languages=languages,
            include_timestamps=include_timestamps,
            include_metadata=include_metadata
        )
        return result
    except Exception as e:
        print(f"Error fetching transcript: {str(e)}")
        return None


def analyze_youtube_content(url: str) -> Optional[Dict]:
    """
    Analyze YouTube video content for LinkedIn content inspiration.
    
    Args:
        url: YouTube video URL
    
    Returns:
        Dict with video analysis including:
        - title: Video title
        - transcript: Full transcript text
        - key_points: Main talking points (for future AI analysis)
        - duration_estimate: Estimated reading time
    """
    try:
        # Get transcript with metadata
        result = get_youtube_transcript(url, include_metadata=True)
        if not result:
            return None
        
        transcript = result.get('transcript', '')
        title = result.get('title', 'Unknown Video')
        
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
        output_dir: Directory to save transcript (defaults to content_inspiration/youtube/)
    
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
        
        # Get transcript with metadata
        result = get_youtube_transcript(url, include_metadata=True)
        if not result:
            return None
        
        # Extract video ID for filename
        video_id = extract_video_id(url)
        if not video_id:
            video_id = 'unknown'
        
        # Create filename
        title = result.get('title', 'Unknown Video')
        # Clean title for filename
        clean_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).rstrip()
        clean_title = clean_title[:50]  # Limit length
        filename = f"{video_id}_{clean_title}.md"
        filepath = os.path.join(output_dir, filename)
        
        # Write transcript with metadata
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(f"# {title}\n\n")
            f.write(f"**URL**: {url}\n")
            f.write(f"**Video ID**: {video_id}\n\n")
            f.write("## Transcript\n\n")
            f.write(result.get('transcript', ''))
        
        print(f"Transcript saved to: {filepath}")
        return filepath
        
    except Exception as e:
        print(f"Error saving transcript: {str(e)}")
        return None


if __name__ == "__main__":
    # Example usage
    test_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    
    print("Testing YouTube transcript fetcher...")
    
    # Get simple transcript
    transcript = get_youtube_transcript(test_url)
    if transcript:
        print(f"\nTranscript preview: {transcript[:200]}...")
    
    # Analyze content
    analysis = analyze_youtube_content(test_url)
    if analysis:
        print(f"\nVideo Title: {analysis['title']}")
        print(f"Word Count: {analysis['word_count']}")
        print(f"Reading Time: {analysis['reading_time_minutes']} minutes")
    
    # Save for research
    saved_path = save_transcript_for_research(test_url)
    if saved_path:
        print(f"\nTranscript saved for research at: {saved_path}")