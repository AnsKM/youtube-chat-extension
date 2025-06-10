/**
 * Simple YouTube Transcript Fetcher
 * Fetches captions directly from YouTube
 */

class TranscriptFetcher {
  constructor() {
    this.captionTracks = null;
    this.transcriptCache = new Map();
  }

  async fetchTranscript(videoId) {
    console.log('Fetching transcript for video:', videoId);
    
    // Check cache first
    if (this.transcriptCache.has(videoId)) {
      console.log('Returning cached transcript');
      return this.transcriptCache.get(videoId);
    }
    
    try {
      // Method 1: Try to get from DOM (most reliable for visible transcripts)
      const domTranscript = await this.getTranscriptFromDOM();
      if (domTranscript) {
        console.log('Got transcript from DOM');
        this.transcriptCache.set(videoId, domTranscript);
        return domTranscript;
      }

      // Method 2: Try to get from YouTube's initial player response
      const playerTranscript = await this.getTranscriptFromPlayerResponse();
      if (playerTranscript) {
        console.log('Got transcript from player response');
        this.transcriptCache.set(videoId, playerTranscript);
        return playerTranscript;
      }

      // Method 3: Try to get caption tracks from ytInitialPlayerResponse
      const captionTracks = await this.getCaptionTracksFromPage();
      if (captionTracks && captionTracks.length > 0) {
        console.log('Found caption tracks, fetching transcript...');
        const transcript = await this.fetchTranscriptFromTrack(captionTracks[0]);
        if (transcript) {
          console.log('Got transcript from caption track');
          this.transcriptCache.set(videoId, transcript);
          return transcript;
        }
      }

      // Method 4: Try the timedtext API
      const timedTextTranscript = await this.getTranscriptFromTimedText(videoId);
      if (timedTextTranscript) {
        console.log('Got transcript from timedtext API');
        this.transcriptCache.set(videoId, timedTextTranscript);
        return timedTextTranscript;
      }

      console.log('No transcript found using any method');
      throw new Error('No transcript available for this video');
    } catch (error) {
      console.error('Error fetching transcript:', error);
      return null;
    }
  }

  async getTranscriptFromDOM() {
    try {
      console.log('Attempting to get transcript from DOM...');
      
      // First, try to open the transcript panel if it's not already open
      const showTranscriptButton = Array.from(document.querySelectorAll('button')).find(
        btn => btn.textContent.includes('Show transcript') || btn.textContent.includes('Transcript')
      );
      
      if (showTranscriptButton) {
        console.log('Found "Show transcript" button, clicking...');
        showTranscriptButton.click();
        // Wait for panel to open and segments to load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Wait for segments to appear
        let waitAttempts = 0;
        while (waitAttempts < 10) {
          const segments = document.querySelector('ytd-transcript-segment-renderer');
          if (segments) {
            console.log('Transcript segments are now visible');
            break;
          }
          waitAttempts++;
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Try multiple selectors for transcript segments
      const segmentSelectors = [
        'ytd-transcript-segment-renderer',
        'ytd-transcript-body-renderer #segments-container ytd-transcript-segment-renderer',
        '.ytd-transcript-segment-list-renderer ytd-transcript-segment-renderer',
        '#segments-container .segment',
        '[class*="transcript"][class*="segment"]'
      ];
      
      let segments = [];
      let workingSelector = null;
      
      for (const selector of segmentSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          segments = elements;
          workingSelector = selector;
          console.log(`Found ${elements.length} segments with selector: ${selector}`);
          break;
        }
      }
      
      if (segments.length === 0) {
        console.log('No transcript segments found in DOM');
        return null;
      }
      
      // Extract transcript data from DOM segments
      const transcriptSegments = [];
      let lastTime = 0;
      
      for (const segment of segments) {
        // Try multiple selectors for time
        const timeElement = segment.querySelector('.segment-timestamp, [class*="time"], .cue-group-start-offset');
        const textElement = segment.querySelector('.segment-text, [class*="text"], .cue');
        
        if (!textElement) continue;
        
        const text = textElement.textContent.trim();
        if (!text) continue;
        
        // Parse time
        let time = lastTime;
        if (timeElement) {
          const timeText = timeElement.textContent.trim();
          const timeParts = timeText.split(':').map(p => parseInt(p));
          
          if (timeParts.length === 2) {
            time = timeParts[0] * 60 + timeParts[1];
          } else if (timeParts.length === 3) {
            time = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
          }
        }
        
        transcriptSegments.push({
          start: time,
          duration: 3, // Default duration
          text: text
        });
        
        lastTime = time;
      }
      
      if (transcriptSegments.length === 0) {
        console.log('No valid transcript segments extracted');
        return null;
      }
      
      console.log(`Successfully extracted ${transcriptSegments.length} transcript segments from DOM`);
      
      // Create transcript with timestamp info
      const fullTextWithTimestamps = transcriptSegments
        .map(s => `[${this.formatTime(s.start)}] ${s.text}`)
        .join(' ');
      
      return {
        segments: transcriptSegments,
        fullText: transcriptSegments.map(s => s.text).join(' '),
        fullTextWithTimestamps: fullTextWithTimestamps,
        language: 'en', // Default to English
        source: 'DOM'
      };
      
    } catch (error) {
      console.error('Error getting transcript from DOM:', error);
      return null;
    }
  }

  async getTranscriptFromYTInitialData() {
    try {
      // YouTube stores data in the page
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        if (script.textContent.includes('ytInitialData')) {
          const match = script.textContent.match(/var ytInitialData = ({.*?});/s);
          if (match) {
            const data = JSON.parse(match[1]);
            return this.extractTranscriptFromData(data);
          }
        }
      }
    } catch (error) {
      console.log('Could not get transcript from initial data:', error);
    }
    return null;
  }

  async getTranscriptFromTimedText(videoId) {
    try {
      // Try to get caption info from the page's scripts
      const scripts = document.getElementsByTagName('script');
      let captionTracks = null;
      
      for (const script of scripts) {
        const text = script.textContent;
        if (text.includes('captionTracks')) {
          // Try multiple patterns
          const patterns = [
            /"captionTracks":(\[.*?\])/,
            /"captionTracks":\s*(\[.*?\])/s,
            /captionTracks":\s*(\[[^\]]+\])/
          ];
          
          for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
              try {
                captionTracks = JSON.parse(match[1]);
                console.log('Found caption tracks with pattern');
                break;
              } catch (e) {
                console.log('Failed to parse caption tracks:', e);
              }
            }
          }
          if (captionTracks) break;
        }
      }
      
      if (!captionTracks) {
        console.log('No caption tracks found in page scripts');
        return null;
      }
      console.log('Found caption tracks:', captionTracks.length);

      // Find English track or first available
      let selectedTrack = captionTracks.find(track => 
        track.languageCode === 'en' || track.languageCode.startsWith('en')
      );
      
      if (!selectedTrack && captionTracks.length > 0) {
        selectedTrack = captionTracks[0];
      }

      if (!selectedTrack) {
        return null;
      }

      console.log('Using caption track:', selectedTrack.languageCode);

      // Fetch the actual captions
      const captionResponse = await fetch(selectedTrack.baseUrl);
      const captionText = await captionResponse.text();
      
      // Parse XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(captionText, 'text/xml');
      const textElements = xmlDoc.getElementsByTagName('text');
      
      const segments = [];
      for (const element of textElements) {
        const start = parseFloat(element.getAttribute('start'));
        const duration = parseFloat(element.getAttribute('dur')) || 0;
        const text = element.textContent
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\n/g, ' ')
          .trim();
        
        segments.push({
          start: start,
          duration: duration,
          text: text
        });
      }

      const fullTextWithTimestamps = segments
        .map(s => `[${this.formatTime(s.start)}] ${s.text}`)
        .join(' ');
      
      return {
        segments: segments,
        fullText: segments.map(s => s.text).join(' '),
        fullTextWithTimestamps: fullTextWithTimestamps,
        language: selectedTrack.languageCode
      };

    } catch (error) {
      console.log('Could not fetch from timedtext:', error);
      return null;
    }
  }

  async getTranscriptFromPlayerResponse() {
    try {
      // Try to get from the player
      const player = document.querySelector('#movie_player');
      if (player && player.getPlayerResponse) {
        const response = player.getPlayerResponse();
        console.log('Player response available:', !!response);
        
        if (response && response.captions && response.captions.playerCaptionsTracklistRenderer) {
          const tracks = response.captions.playerCaptionsTracklistRenderer.captionTracks;
          console.log('Found caption tracks in player response:', tracks?.length || 0);
          
          if (tracks && tracks.length > 0) {
            // Find English track or first available
            let selectedTrack = tracks.find(track => 
              track.languageCode === 'en' || track.languageCode.startsWith('en')
            ) || tracks[0];
            
            console.log('Selected track:', selectedTrack.name?.simpleText, selectedTrack.languageCode);
            
            // Fetch the actual transcript
            return await this.fetchTranscriptFromTrack(selectedTrack);
          }
        }
      } else {
        console.log('No player or getPlayerResponse method found');
      }
    } catch (error) {
      console.log('Could not get from player response:', error);
    }
    return null;
  }

  async getCaptionTracksFromPage() {
    try {
      // Try to find ytInitialPlayerResponse in page scripts
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        const text = script.textContent;
        if (text.includes('ytInitialPlayerResponse')) {
          console.log('Found ytInitialPlayerResponse script');
          
          // Extract the JSON data
          const match = text.match(/var ytInitialPlayerResponse = ({.+?});/s);
          if (match) {
            try {
              const playerResponse = JSON.parse(match[1]);
              console.log('Parsed player response successfully');
              
              if (playerResponse.captions && playerResponse.captions.playerCaptionsTracklistRenderer) {
                const tracks = playerResponse.captions.playerCaptionsTracklistRenderer.captionTracks;
                console.log('Found caption tracks:', tracks?.length || 0);
                return tracks || [];
              }
            } catch (e) {
              console.error('Failed to parse player response:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error getting caption tracks from page:', error);
    }
    return null;
  }

  async fetchTranscriptFromTrack(track) {
    try {
      if (!track.baseUrl) {
        console.error('No baseUrl in track:', track);
        return null;
      }

      console.log('Fetching transcript from URL:', track.baseUrl);
      
      // Fetch the transcript XML
      const response = await fetch(track.baseUrl);
      if (!response.ok) {
        console.error('Failed to fetch transcript:', response.status, response.statusText);
        return null;
      }
      
      const text = await response.text();
      console.log('Fetched transcript XML, length:', text.length);
      
      // Parse the XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      
      // Check for parse errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        console.error('XML parse error:', parseError.textContent);
        return null;
      }
      
      const textElements = xmlDoc.getElementsByTagName('text');
      console.log('Found text elements:', textElements.length);
      
      if (textElements.length === 0) {
        console.error('No text elements found in transcript');
        return null;
      }
      
      const segments = [];
      for (const element of textElements) {
        const start = parseFloat(element.getAttribute('start'));
        const duration = parseFloat(element.getAttribute('dur')) || 0;
        const text = element.textContent
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\n/g, ' ')
          .trim();
        
        if (text) {
          segments.push({
            start: start,
            duration: duration,
            text: text
          });
        }
      }
      
      console.log('Parsed segments:', segments.length);
      
      const fullTextWithTimestamps = segments
        .map(s => `[${this.formatTime(s.start)}] ${s.text}`)
        .join(' ');
      
      return {
        segments: segments,
        fullText: segments.map(s => s.text).join(' '),
        fullTextWithTimestamps: fullTextWithTimestamps,
        language: track.languageCode || 'en'
      };
      
    } catch (error) {
      console.error('Error fetching transcript from track:', error);
      return null;
    }
  }

  extractTranscriptFromData(data) {
    try {
      // Navigate through YouTube's data structure
      const playerCaptions = data?.playerCaptionsTracklistRenderer;
      if (playerCaptions && playerCaptions.captionTracks) {
        // Found caption tracks
        console.log('Found caption tracks in initial data');
        return {
          tracks: playerCaptions.captionTracks,
          message: 'Transcript tracks found, but need to fetch actual content'
        };
      }
    } catch (error) {
      console.log('Error extracting transcript:', error);
    }
    return null;
  }

  processCaptionsFromPlayer(captions) {
    // Process captions from player response
    if (captions.playerCaptionsTracklistRenderer) {
      const tracks = captions.playerCaptionsTracklistRenderer.captionTracks;
      if (tracks && tracks.length > 0) {
        return {
          available: true,
          tracks: tracks,
          message: 'Captions available'
        };
      }
    }
    return null;
  }

  // Format transcript for display
  formatTranscript(transcript) {
    if (!transcript || !transcript.segments) {
      return 'No transcript available';
    }

    return transcript.segments
      .map(segment => `[${this.formatTime(segment.start)}] ${segment.text}`)
      .join('\n');
  }

  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

// Export for use in content script
window.TranscriptFetcher = TranscriptFetcher;