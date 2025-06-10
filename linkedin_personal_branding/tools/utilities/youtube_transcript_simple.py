"""
YouTube Transcript Fetcher for LinkedIn Personal Branding (Simplified Version)

This module provides functionality to fetch YouTube transcripts for content research
and inspiration using the youtube-transcript-api directly.

Example usage:
    from tools.utilities.youtube_transcript_simple import get_youtube_transcript
    
    transcript = get_youtube_transcript('https://youtube.com/watch?v=...')
"""

import re
from typing import Optional, Dict, List, Union
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter
import os


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
        # Extract video ID
        video_id = extract_video_id(url)
        if not video_id:
            raise ValueError(f"Could not extract video ID from URL: {url}")
        
        # Get available transcripts
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        
        # Try to get video title
        video_title = video_id  # Default to video ID
        try:
            # The _video_title attribute might be available
            video_title = getattr(transcript_list, '_video_title', video_id)
        except:
            pass
        
        # Try to get transcript
        transcript = None
        
        if languages:
            # Try each specified language
            for lang in languages:
                try:
                    transcript = transcript_list.find_transcript([lang])
                    break
                except:
                    continue
        
        if not transcript:
            # Try to get manually created transcript first
            try:
                transcript = transcript_list.find_manually_created_transcript()
            except:
                # Fall back to auto-generated
                try:
                    transcript = transcript_list.find_generated_transcript()
                except:
                    # Get any available transcript
                    for t in transcript_list:
                        transcript = t
                        break
        
        if not transcript:
            raise ValueError("No transcript available for this video")
        
        # Fetch the actual transcript data
        transcript_data = transcript.fetch()
        
        # Format the transcript
        if include_timestamps:
            formatted_lines = []
            for segment in transcript_data:
                timestamp = f"[{int(segment['start'])}s]"
                text = segment['text'].strip()
                formatted_lines.append(f"{timestamp} {text}")
            formatted_transcript = "\n".join(formatted_lines)
        else:
            formatter = TextFormatter()
            formatted_transcript = formatter.format_transcript(transcript_data)
        
        if include_metadata:
            return {'transcript': formatted_transcript, 'title': video_title}
        
        return formatted_transcript
        
    except Exception as e:
        import traceback
        print(f"Error retrieving transcript: {str(e)}")
        print(f"Full error trace:")
        traceback.print_exc()
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
        import traceback
        print(f"Error analyzing YouTube content: {str(e)}")
        traceback.print_exc()
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
    # Example usage - Test with user's video
    test_url = "https://youtu.be/PhhUB4OQlnw"
    
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