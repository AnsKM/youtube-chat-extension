import re
from typing import Optional, Dict, List, Union
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter
from ..utils.youtube_helpers import get_youtube_title


def extract_video_id(url: str) -> Optional[str]:
    """
    Extract YouTube video ID from various URL formats.
    
    Args:
        url: YouTube video URL
        
    Returns:
        Video ID if found, None otherwise
    """
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


def get_video_title(video_id: str) -> Optional[str]:
    """
    Get the title of a YouTube video.
    
    Args:
        video_id: YouTube video ID
        
    Returns:
        Video title if found, None otherwise
    """
    try:
        # Get available transcripts which includes video metadata
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        # The video title is available in the video details
        return transcript_list.video_title
    except:
        return None


def youtube_transcript_retriever(
    url: str,
    languages: Optional[List[str]] = None,
    preserve_formatting: bool = False,
    include_timestamps: bool = False,
    include_metadata: bool = False
) -> Union[str, List[Dict], Dict, None]:
    """
    Download transcript from a YouTube video.
    
    Args:
        url: YouTube video URL
        languages: List of language codes to try (e.g., ['en', 'es']). 
                  If None, will try to get any available transcript.
        preserve_formatting: If True, returns raw transcript data with timestamps
        include_timestamps: If True and preserve_formatting is False, 
                           includes timestamps in formatted text
        include_metadata: If True, returns a dict with transcript and metadata
    
    Returns:
        Transcript text as string, or list of transcript segments if preserve_formatting=True,
        or dict with 'transcript' and 'title' if include_metadata=True
        Returns None if transcript cannot be retrieved
    """
    try:
        # Extract video ID from URL
        video_id = extract_video_id(url)
        if not video_id:
            raise ValueError(f"Could not extract video ID from URL: {url}")
        
        # Get available transcripts
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        
        # Get video title
        video_title = None
        try:
            # Try to get title from transcript API first
            video_title = transcript_list._video_title
        except:
            # If that fails, try fetching from YouTube page
            video_title = get_youtube_title(url)
            
        if not video_title:
            video_title = video_id  # Fallback to video ID if title not available
        
        # Try to get transcript
        transcript = None
        
        # First, let's see what transcripts are available
        available_transcripts = []
        for t in transcript_list:
            available_transcripts.append({
                'language': t.language,
                'language_code': t.language_code,
                'is_generated': t.is_generated,
                'is_translatable': t.is_translatable
            })
        
        print(f"Video Title: {video_title}")
        print(f"Available transcripts: {len(available_transcripts)}")
        for t in available_transcripts:
            print(f"  - {t['language']} ({t['language_code']}) - {'Auto-generated' if t['is_generated'] else 'Manual'}")
        
        if languages:
            # Try each specified language
            for lang in languages:
                try:
                    transcript = transcript_list.find_transcript([lang])
                    print(f"Found transcript for language: {lang}")
                    break
                except:
                    continue
        
        if not transcript:
            # Get the first available transcript
            try:
                # Try to get manually created transcript first
                transcript = transcript_list.find_manually_created_transcript()
                print("Using manually created transcript")
            except:
                # Fall back to auto-generated
                try:
                    # Try to find auto-generated transcript in English first
                    for t in transcript_list:
                        if t.is_generated and t.language_code.startswith('en'):
                            transcript = t
                            print(f"Using auto-generated transcript: {t.language}")
                            break
                    
                    # If no English auto-generated, get any auto-generated
                    if not transcript:
                        transcript = transcript_list.find_generated_transcript()
                        print("Using auto-generated transcript")
                except:
                    # Get any available transcript
                    for t in transcript_list:
                        transcript = t
                        print(f"Using first available transcript: {t.language}")
                        break
        
        if not transcript:
            raise ValueError("No transcript available for this video")
        
        # Fetch the actual transcript data
        transcript_data = transcript.fetch()
        
        if preserve_formatting:
            if include_metadata:
                return {'transcript': transcript_data, 'title': video_title}
            return transcript_data
        
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
        print(f"Error retrieving transcript: {str(e)}")
        return None


if __name__ == "__main__":
    # Example usage
    test_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    
    # Get transcript as plain text
    transcript = youtube_transcript_retriever(test_url)
    if transcript:
        print("Transcript retrieved successfully!")
        print(transcript[:200] + "...")  # Print first 200 characters
    
    # Get transcript with timestamps
    transcript_with_time = youtube_transcript_retriever(
        test_url, 
        include_timestamps=True
    )
    if transcript_with_time:
        print("\nWith timestamps:")
        print(transcript_with_time[:300] + "...")