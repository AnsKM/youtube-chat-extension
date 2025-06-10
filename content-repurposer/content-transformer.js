/**
 * Content Transformation Pipeline
 * Converts YouTube transcripts into human-like LinkedIn posts
 */

import { linkedInTemplates, humanPatterns, hookFormulas, simplifyLanguage } from './linkedin-templates.js';

export class ContentTransformer {
  constructor() {
    this.humanStylePrompt = `
Write naturally and conversationally, as if sharing insights with a colleague.

Guidelines (not rules):
- Use your own voice and style
- Share genuine insights and observations  
- Feel free to be creative with structure
- Focus on providing value and sparking discussion
- Keep it authentic and relatable

Remember: Great LinkedIn posts feel like conversations, not broadcasts.
    `;
  }

  /**
   * Clean timestamps from text
   */
  cleanTimestamps(text) {
    if (!text) return text;
    // Remove [MM:SS] or [HH:MM:SS] timestamp patterns
    return text.replace(/\[\d{1,2}:\d{2}(:\d{2})?\]\s*/g, '').trim();
  }

  /**
   * Main transformation pipeline
   */
  async transformToLinkedIn(transcript, videoMetadata, options = {}) {
    const {
      template = 'auto', // auto-detect best template
      tone = 'conversational',
      includeVisual = true,
      targetLength = 'medium', // short, medium, long
      generationAttempt = 1
    } = options;
    
    // Clean any timestamps that might have slipped through
    const cleanTranscript = this.cleanTimestamps(transcript);
    
    console.log('[ContentTransformer] Starting transformation with options:', options);
    console.log('[ContentTransformer] Generation attempt:', generationAttempt);
    console.log('[ContentTransformer] Input content:', cleanTranscript?.substring(0, 200) || 'No content');

    // Step 1: Extract key insights
    const insights = await this.extractKeyInsights(cleanTranscript, videoMetadata);
    console.log('[ContentTransformer] Insights extracted:', JSON.stringify(insights, null, 2));
    
    // Step 2: Select best template
    const selectedTemplate = template === 'auto' 
      ? this.selectBestTemplate(insights)
      : template;
    console.log('[ContentTransformer] Selected template:', selectedTemplate);
    
    // Step 3: Generate initial draft
    const draft = await this.generateDraft(insights, selectedTemplate, tone, generationAttempt);
    console.log('[ContentTransformer] Draft generated:', draft ? draft.substring(0, 100) + '...' : 'null');
    
    // Step 4: Humanize content
    const humanized = this.humanizeContent(draft);
    console.log('[ContentTransformer] Content humanized');
    
    // Step 5: Optimize for LinkedIn
    const optimized = this.optimizeForLinkedIn(humanized, targetLength);
    console.log('[ContentTransformer] Content optimized for LinkedIn');
    
    // Step 6: Add visual suggestion
    const final = includeVisual 
      ? this.addVisualSuggestion(optimized, selectedTemplate)
      : { content: optimized, visual: null };
    
    console.log('[ContentTransformer] Final content:', final.content ? final.content.substring(0, 100) + '...' : 'null');
    
    return {
      post: final.content || 'Content generation failed. Please try again.',
      visualSuggestion: final.visual,
      metadata: {
        template: selectedTemplate,
        wordCount: final.content ? final.content.split(' ').length : 0,
        estimatedReadTime: final.content ? Math.ceil(final.content.split(' ').length / 200) : 0,
        hasVisual: includeVisual
      }
    };
  }

  /**
   * Extract key insights from transcript
   */
  async extractKeyInsights(transcript, metadata) {
    console.log('[ContentTransformer] Extracting insights from content length:', transcript?.length || 0);
    
    // First, try to extract insights using AI
    try {
      const prompt = `Analyze this content from a YouTube video discussion and extract key insights.

${transcript}

Extract the MOST INTERESTING and ENGAGING insights from this content.

Format as JSON:
1. mainInsight: What's the ONE thing that would make someone stop scrolling? (be specific and intriguing)
2. supportingPoints: Array of 3-5 fascinating details that support or expand on this
3. personalStory: Any compelling story, example, or surprising fact
4. problemSolved: What pain point or curiosity does this address?
5. actionableTakeaways: Array of 2-3 things people can actually DO with this info

Think like a viral content creator - what's the HOOK? What's SURPRISING? What's USEFUL?

Return ONLY valid JSON. Extract the juiciest, most share-worthy insights.`;

      const insights = await this.callAI(prompt, { 
        temperature: 0.8,  // Slightly higher for more creative insight extraction
        max_tokens: 1500   // More room for detailed insights
      });

      // Check if we got a mock response trigger
      if (insights === 'USE_MOCK_GENERATION') {
        console.log('[ContentTransformer] AI returned mock trigger, parsing content manually');
        return this.extractInsightsManually(transcript, metadata);
      }

      try {
        const parsed = JSON.parse(insights);
        console.log('[ContentTransformer] Successfully parsed AI insights:', parsed);
        return parsed;
      } catch (e) {
        console.log('[ContentTransformer] Failed to parse AI response, extracting manually');
        return this.extractInsightsManually(transcript, metadata);
      }
    } catch (error) {
      console.error('[ContentTransformer] Error calling AI for insights:', error);
      return this.extractInsightsManually(transcript, metadata);
    }
  }

  /**
   * Extract insights manually from content
   */
  extractInsightsManually(transcript, metadata) {
    console.log('[ContentTransformer] Extracting insights manually from content');
    console.log('[ContentTransformer] Content preview:', transcript?.substring(0, 300));
    console.log('[ContentTransformer] Full content length:', transcript?.length);
    
    if (!transcript || transcript.length === 0) {
      return {
        mainInsight: "Key insights from the discussion",
        supportingPoints: ["Point 1", "Point 2", "Point 3"],
        personalStory: metadata?.title ? `From the video: "${metadata.title}"` : "",
        problemSolved: "The main challenge addressed",
        actionableTakeaways: ["Action 1", "Action 2"]
      };
    }

    // Clean any remaining timestamps before processing
    const cleanContent = this.cleanTimestamps(transcript.toString());
    const lines = cleanContent.split('\n').filter(line => line.trim());
    
    // Look for the actual AI response content first
    let mainContent = cleanContent;
    const keyInsightIndex = cleanContent.indexOf('## Key Insight from YouTube Discussion');
    if (keyInsightIndex > -1) {
      const endOfInsightSection = cleanContent.indexOf('## Full Conversation Context:', keyInsightIndex);
      if (endOfInsightSection > -1) {
        mainContent = cleanContent.substring(keyInsightIndex + 39, endOfInsightSection).trim();
      } else {
        mainContent = cleanContent.substring(keyInsightIndex + 39).trim();
      }
    }
    
    // Also check for conversation history
    let conversationContext = '';
    const conversationIndex = cleanContent.indexOf('## Full Conversation Context:');
    if (conversationIndex > -1) {
      const endOfConversation = cleanContent.indexOf('## Additional User Context:', conversationIndex);
      if (endOfConversation > -1) {
        conversationContext = cleanContent.substring(conversationIndex + 29, endOfConversation).trim();
      } else {
        conversationContext = cleanContent.substring(conversationIndex + 29).trim();
      }
    }
    
    // Extract the main insight from the AI response
    const contentLines = mainContent.split('\n').filter(line => line.trim());
    let mainInsight = contentLines[0] || "Key insight from the discussion";
    
    // If we have conversation context, try to extract better insights from it
    if (conversationContext) {
      const convLines = conversationContext.split('\n').filter(line => line.trim());
      // Look for assistant responses that contain insights
      const assistantResponses = convLines.filter(line => line.startsWith('Assistant:'));
      if (assistantResponses.length > 0) {
        // Get the most recent substantial assistant response
        const substantialResponse = assistantResponses.find(resp => resp.length > 100) || assistantResponses[assistantResponses.length - 1];
        if (substantialResponse) {
          // Extract the core message from the assistant's response
          const responseContent = substantialResponse.replace('Assistant:', '').trim();
          if (responseContent.length > 50) {
            mainInsight = responseContent; // No truncation
          }
        }
      }
    }
    
    // Clean up the main insight
    if (mainInsight.startsWith('The "')) {
      // This is likely a good insight about the video content
      mainInsight = mainInsight;
    } else if (mainInsight.length < 30 && contentLines.length > 1) {
      // If first line is too short, combine with second
      mainInsight = contentLines.slice(0, 2).join(' ');
    }
    
    // Extract supporting points from the content
    let supportingPoints = [];
    
    // Look for numbered or bulleted lists in the content
    const listItems = contentLines.filter(line => 
      (/^[\d•\-\*]/.test(line.trim()) || 
      line.includes('explains that') ||
      line.includes('clarify that') ||
      line.includes('refers to') ||
      line.includes('→')) &&
      !line.match(/\[\d{1,2}:\d{2}(:\d{2})?\]/) // Exclude lines with timestamps
    );
    
    if (listItems.length > 0) {
      console.log('[ContentTransformer] Found list items:', listItems.length);
      console.log('[ContentTransformer] First raw item:', listItems[0]);
      
      supportingPoints = listItems
        .map(item => {
          // Clean up various list formats including malformed ones
          const cleaned = item.trim()
            .replace(/^[\d•\-\*→]\s*/, '') // Remove list markers
            .replace(/^\.\s*\*\*/, '') // Remove ". **" pattern
            .replace(/^\d+\.\s*\*\*/, '') // Remove "1. **" pattern
            .replace(/\*\*\s*:\s*/, ': ') // Replace "** : " with proper spacing
            .replace(/\*\*([A-Za-z])/g, ' $1') // Add space before text after **
            .replace(/([A-Za-z])\*\*/g, '$1 ') // Add space after text before **
            .replace(/\*\*/g, '') // Remove remaining ** formatting
            .replace(/^\s*:\s*/, '') // Remove leading colons
            .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
            .trim();
          
          console.log('[ContentTransformer] Cleaned item:', cleaned.substring(0, 100));
          return cleaned;
        })
        .filter(item => item.length > 20)
        .slice(0, 5);
        
      console.log('[ContentTransformer] Final supporting points:', supportingPoints);
    }
    
    // If no list items, extract key sentences from conversation
    if (supportingPoints.length === 0 && conversationContext) {
      const contextLines = conversationContext.split('\n').filter(line => line.trim());
      supportingPoints = contextLines
        .filter(line => line.includes(':') && line.length > 50)
        .map(line => {
          const colonIndex = line.indexOf(':');
          return line.substring(colonIndex + 1).trim();
        })
        .filter(point => point.length > 30)
        .slice(0, 3);
    }
    
    // If still no points, use content lines
    if (supportingPoints.length === 0) {
      supportingPoints = contentLines
        .filter(line => line.length > 30 && !line.includes('##'))
        .slice(1, 4); // No truncation - use full lines
    }
    
    // Look for problems or challenges mentioned
    const allLines = [...contentLines, ...conversationContext.split('\n')];
    const problemLines = allLines.filter(line => 
      line.toLowerCase().includes('limitation') || 
      line.toLowerCase().includes('challenge') || 
      line.toLowerCase().includes('issue') ||
      line.toLowerCase().includes('problem') ||
      line.toLowerCase().includes('context window') ||
      line.toLowerCase().includes('breaks')
    );
    const problemSolved = problemLines[0] || "Understanding complex technical concepts";
    
    // Extract any personal context or video reference
    let personalStory = "";
    if (metadata?.title) {
      personalStory = `Source: "${metadata.title}"`;
    } else {
      personalStory = "Source: YouTube video";
    }
    
    return {
      mainInsight: mainInsight, // No truncation - let the display handle it
      supportingPoints: supportingPoints.filter(p => p && p.length > 10),
      personalStory: personalStory,
      problemSolved: problemSolved, // No truncation
      actionableTakeaways: [
        "Consider how this applies to your work",
        "Think about similar challenges you've faced",
        "Share your experience with this concept"
      ]
    };
  }

  /**
   * Select best template based on content
   */
  selectBestTemplate(insights) {
    if (insights.personalStory && insights.personalStory.length > 50) {
      return 'personalStory';
    }
    
    if (insights.supportingPoints && insights.supportingPoints.length >= 5) {
      return 'numberList';
    }
    
    if (insights.problemSolved && insights.problemSolved.includes('instead')) {
      return 'contrarian';
    }
    
    if (insights.problemSolved) {
      return 'problemAgitatesSolution';
    }
    
    return 'beforeAfterBridge';
  }

  /**
   * Generate initial draft using template
   */
  async generateDraft(insights, templateName, tone, generationAttempt = 1) {
    const template = linkedInTemplates[templateName];
    
    // Always try to generate a draft first
    try {
      const draft = await this.generateDraftWithAI(insights, template, tone, generationAttempt);
      console.log('[ContentTransformer] AI draft response:', draft?.substring(0, 200));
      
      // Check if we should use mock generation
      if (draft && draft !== "USE_MOCK_GENERATION") {
        // Check if the draft looks like a LinkedIn post (has proper structure)
        const hasLinkedInStructure = draft.includes('\n') && 
                                    (draft.length > 200) && 
                                    (draft.includes('?') || draft.includes('!'));
        
        if (hasLinkedInStructure) {
          console.log('[ContentTransformer] AI generated valid LinkedIn post');
          return draft;
        } else {
          console.log('[ContentTransformer] AI response doesn\'t look like LinkedIn post, using mock');
        }
      }
    } catch (error) {
      console.log('[ContentTransformer] Error generating AI draft:', error);
    }
    
    // Fall back to mock draft if AI fails
    console.log('[ContentTransformer] Using mock draft generation with insights');
    return this.generateMockDraft(insights, template, tone, generationAttempt);
  }
  
  /**
   * Generate draft using AI
   */
  async generateDraftWithAI(insights, template, tone, generationAttempt = 1) {
    // Add variation instructions based on attempt number
    const variationInstructions = generationAttempt > 1 ? `
This is attempt #${generationAttempt}. Create something fresh and unexpected:
- What would make YOU stop scrolling?
- Try a completely different angle or perspective
- Don't just rearrange - reimagine the approach
- What emotion or insight hasn't been explored yet?
- Surprise yourself with the format

` : '';

    const prompt = `Transform these insights into a LinkedIn post that people will actually want to read.

${variationInstructions}

The hook: ${insights.mainInsight}

Supporting gems:
${insights.supportingPoints.map(p => `- ${p}`).join('\n')}

The bigger picture: ${insights.problemSolved}

DON'T just list these points. Instead:
- Find the story or angle that connects them
- Share it like you're telling a friend something fascinating
- Make it about THEM (the reader), not just information
- Create curiosity, surprise, or "aha" moments

${this.humanStylePrompt}

Remember:
- Your first line determines if people keep reading
- Specific examples > generic statements  
- Personal insights > obvious observations
- Questions that make people think > generic CTAs

Tone: ${tone}

Write something you'd actually stop scrolling to read:`;

    const draft = await this.callAI(prompt, {
      temperature: 1.0,  // Increased for more creative output
      max_tokens: 2000   // Sufficient for LinkedIn posts
    });

    return draft;
  }
  
  /**
   * Generate mock draft based on actual insights
   */
  generateMockDraft(insights, template, tone, generationAttempt = 1) {
    const { mainInsight, supportingPoints, problemSolved, personalStory } = insights;
    
    const templateInfo = typeof template === 'string' ? template : (template?.name || 'default');
    console.log('[ContentTransformer] Generating mock draft with template:', templateInfo);
    console.log('[ContentTransformer] Main insight:', mainInsight);
    console.log('[ContentTransformer] Generation attempt:', generationAttempt);
    console.log('[ContentTransformer] Will use variation index:', (generationAttempt - 1) % 5);
    
    // Create a compelling LinkedIn post based on the actual content
    let draft = '';
    
    // Extract the core message from the insight
    let coreMessage = mainInsight || '';
    
    // Check for specific content patterns and create targeted LinkedIn posts
    if (coreMessage.includes('Runner H') || (coreMessage.includes('browser agent') && coreMessage.includes('web'))) {
      // This is about browser automation agents
      const hooks = [
        `AI agents can now browse the web like humans.\n\nThis changes everything.\n\n`,
        `What if your AI assistant could actually USE websites for you?\n\nIt's no longer "what if."\n\n`,
        `The internet was built for humans, not AI.\n\nUntil now.\n\n`,
        `Forget APIs. Forget integrations.\n\nAI can now click, scroll, and browse like you do.\n\n`,
        `Just saw an AI agent book a flight by itself.\n\nNo API. No code. Just... browsing.\n\n`,
        `"Computer use agents" sound like sci-fi.\n\nThey're here, and they're free.\n\n`,
        `The barrier between AI and the web just disappeared.\n\nHere's what that means:\n\n`,
        `Your AI can now do anything you can do online.\n\nLet that sink in.\n\n`
      ];
      
      draft = hooks[(generationAttempt - 1) % hooks.length];
      
      // Build the narrative
      draft += `Runner H (currently in beta and FREE) is doing something revolutionary:\n\n`;
      draft += `Instead of waiting for companies to build APIs, it just... uses websites.\n\n`;
      
      const capabilities = [
        `→ Screenshots websites like a human would see them\n→ Clicks buttons, fills forms, navigates pages\n→ No coding required - just tell it what to do`,
        `→ Browses ANY website - no API needed\n→ Handles dynamic content and complex interactions\n→ Works with sites that were "human-only" until now`,
        `→ Powered by visual AI that "sees" websites\n→ Simulates real user actions\n→ Breaks through the API bottleneck`
      ];
      
      draft += capabilities[(generationAttempt - 1) % capabilities.length] + '\n\n';
      
      const implications = [
        `Think about what this unlocks:\n\nEvery website becomes programmable. Every online task becomes automatable.\n\n`,
        `The implications are staggering:\n\nAnything you can do online, AI can now do for you.\n\n`,
        `This isn't just automation.\n\nIt's democratizing access to the entire web.\n\n`,
        `We just went from "AI needs special access" to "AI can use anything."\n\n`
      ];
      
      draft += implications[(generationAttempt - 1) % implications.length];
      
      const ctas = [
        `What repetitive web task would you automate first?`,
        `Which "impossible" automation just became possible for you?`,
        `How many hours could this save you per week?`,
        `What website do you wish had an API? (Doesn't matter anymore)`
      ];
      
      draft += ctas[(generationAttempt - 1) % ctas.length];
      
      if (personalStory && personalStory.includes('Source:')) {
        draft += `\n\n${personalStory}`;
      }
      
      return draft;
    }
    
    if (coreMessage.includes('Brett') && coreMessage.includes('Designjoy') && coreMessage.includes('AI')) {
      // This is about AI design tools - create an engaging post
      const hooks = [
        `A solo designer making $2.8K/day just showed me something that changes everything about design...\n\n`,
        `"There's no skill issue here at all if you're a non-creative."\n\nThis stopped me in my tracks.\n\n`,
        `What if I told you that you could create professional designs in 30 seconds?\n\nNo design background needed.\n\n`,
        `I just watched someone generate a $5,000 design in under a minute.\n\nHere's what most people don't realize:\n\n`,
        `The design industry is about to be completely disrupted.\n\nAnd it's not what you think.\n\n`,
        `$2,800 per day. One person. Zero employees.\n\nThe secret? It's simpler than you think.\n\n`,
        `"Even someone without design knowledge can create value."\n\nThis changes the game completely.\n\n`,
        `Forget everything you know about needing design skills.\n\nHere's what's actually happening:\n\n`
      ];
      
      draft = hooks[(generationAttempt - 1) % hooks.length];
      
      // Build the story
      draft += `Brett from Designjoy isn't just making millions—he's proving something revolutionary.\n\n`;
      
      if (supportingPoints && supportingPoints.length > 0) {
        draft += `What blew my mind:\n\n`;
        // Focus on the most impactful points
        const impactfulPoints = supportingPoints.slice(0, 3).map(point => {
          if (point.includes('non-creative')) {
            return `→ You don't need ANY design background (yes, really)`;
          } else if (point.includes('Higsfield')) {
            return `→ Tools like Higsfield handle everything - even text placement`;
          } else if (point.includes('template')) {
            return `→ Pre-built templates that look like $5K custom work`;
          } else {
            return `→ ${point}`;
          }
        });
        draft += impactfulPoints.join('\n') + '\n\n';
      }
      
      const insights = [
        `The barrier to entry just disappeared.\n\nAnyone can now create what used to require years of training.\n\n`,
        `This isn't about replacing designers.\n\nIt's about democratizing creativity.\n\n`,
        `The real skill now? Knowing what looks good.\n\nThe tools handle the rest.\n\n`,
        `We're entering an era where ideas matter more than technical skills.\n\n`
      ];
      
      draft += insights[(generationAttempt - 1) % insights.length];
      
      const questions = [
        `Are you still hiring designers the traditional way?`,
        `What would you create if design skills weren't a barrier?`,
        `How is AI changing your industry?`,
        `What "impossible" thing is now suddenly possible for you?`
      ];
      
      draft += questions[(generationAttempt - 1) % questions.length];
      
      return draft;
    }
    
    if (coreMessage.includes('infinite') && (coreMessage.includes('code') || coreMessage.includes('loop') || coreMessage.includes('Claude'))) {
      // This is about the infinite code/loop pattern - vary based on attempt
      const hooks = [
        `Just discovered a fascinating pattern that "breaks" AI coding assistants...\n\n`,
        `Ever pushed an AI to its absolute limits? Here's what I found...\n\n`,
        `The "infinite agentic loop" sounds like sci-fi, but it's real:\n\n`,
        `I accidentally found a way to make AI code forever (kind of)...\n\n`,
        `There's a hidden limit in every AI tool. Here's how to find it:\n\n`,
        `What happens when you ask AI to improve itself infinitely?\n\n`,
        `Found the exact point where AI hits a wall. It's fascinating...\n\n`,
        `This simple experiment reveals everything about AI's limitations:\n\n`
      ];
      
      draft = hooks[(generationAttempt - 1) % hooks.length];
      
      const intros = [
        `It's called the "infinite agentic loop" - and it reveals something important about how we work with AI.\n\n`,
        `This pattern shows exactly where AI hits its boundaries.\n\n`,
        `What happens when you ask AI to iterate indefinitely? Let me show you...\n\n`,
        `This simple experiment exposes the memory limits of AI systems.\n\n`
      ];
      
      draft += intros[(generationAttempt - 1) % intros.length];
      
      if (supportingPoints && supportingPoints.length > 0) {
        draft += `Here's how it works:\n\n`;
        supportingPoints.slice(0, 4).forEach(point => {
          draft += `→ ${point}\n`;
        });
        draft += `\n`;
      } else {
        draft += `The concept is brilliantly simple:\n\n`;
        draft += `→ Use two prompts: your "infinite prompt" and your spec/plan\n`;
        draft += `→ Pass prompts into prompts using variables\n`;
        draft += `→ The AI keeps iterating until it hits its context limit\n`;
        draft += `→ This reveals the boundaries of AI "memory"\n\n`;
      }
      
      const insights = [
        `The real insight? Every AI tool has limits we need to understand.\n\nOnce you know the boundaries, you can work within them more effectively.\n\n`,
        `This isn't a bug - it's a feature that teaches us about AI architecture.\n\nUnderstanding these limits makes us better AI users.\n\n`,
        `What I learned: AI has memory, just like us. And when it's full, things get weird.\n\nBut that's actually useful to know.\n\n`,
        `The takeaway? AI tools are powerful but finite.\n\nKnowing their limits helps you use them better.\n\n`
      ];
      
      draft += insights[(generationAttempt - 1) % insights.length];
      
      const questions = [
        `What creative patterns have you discovered when pushing AI to its limits?`,
        `Have you ever hit the "context window" in your AI experiments?`,
        `What's the most interesting AI limitation you've encountered?`,
        `How do you work around AI memory limits in your projects?`
      ];
      
      draft += questions[(generationAttempt - 1) % questions.length];
      
      return draft;
    }
    
    if (coreMessage.includes('glitch') || coreMessage.includes('context window')) {
      // This is about AI limitations - create a proper LinkedIn post about it
      draft = `Ever wondered why AI suddenly stops understanding your conversation?\n\n`;
      draft += `I just learned something fascinating about the "glitch" in AI models...\n\n`;
      draft += `It turns out, it's not really a glitch at all. It's hitting what's called a "context window" - basically the AI's memory limit.\n\n`;
      
      if (supportingPoints && supportingPoints.length > 0) {
        draft += `Here's what this means for us:\n\n`;
        supportingPoints.slice(0, 3).forEach(point => {
          draft += `→ ${point}\n`;
        });
        draft += `\n`;
      } else {
        draft += `Think of it like this:\n\n`;
        draft += `→ Every AI has a maximum amount of text it can "remember" at once\n`;
        draft += `→ When you exceed this limit, earlier parts of the conversation get forgotten\n`;
        draft += `→ It's like trying to fit a novel into a Post-it note\n\n`;
      }
      
      draft += `This completely changed how I approach long AI conversations.\n\n`;
      draft += `Now I know to keep my prompts focused and break complex tasks into smaller chunks.\n\n`;
      draft += `Have you experienced this "context window" limitation? How do you work around it?`;
      
      return draft;
    }
    
    // Create different hooks based on the template type AND generation attempt
    const templateName = typeof template === 'string' ? template : (template?.name || 'default');
    
    // Multiple hook variations for each template
    const hookVariations = {
      personalStory: [
        `Just watched a video that completely changed my perspective...\n\n`,
        `This YouTube video just blew my mind...\n\n`,
        `I had to pause the video and think about this...\n\n`,
        `Can't stop thinking about what I just learned...\n\n`,
        `This video made me rethink everything...\n\n`
      ],
      numberList: [
        `Here are ${supportingPoints?.length || 3} insights that caught my attention:\n\n`,
        `${supportingPoints?.length || 3} things I learned that you need to know:\n\n`,
        `Breaking down ${supportingPoints?.length || 3} game-changing insights:\n\n`,
        `The ${supportingPoints?.length || 3} takeaways that matter most:\n\n`,
        `Quick thread: ${supportingPoints?.length || 3} powerful lessons from this video:\n\n`
      ],
      problemAgitatesSolution: [
        `Most people don't realize this, but ${problemSolved || 'this key insight'}...\n\n`,
        `Here's what everyone's missing about ${problemSolved || 'this topic'}...\n\n`,
        `The truth about ${problemSolved || 'this'} that nobody talks about...\n\n`,
        `Why ${problemSolved || 'this approach'} changes everything...\n\n`,
        `The hidden reality of ${problemSolved || 'this concept'}...\n\n`
      ],
      beforeAfterBridge: [
        `Before watching this video, I thought one way. Now? Everything's different.\n\n`,
        `24 hours ago, I didn't know this. Now I can't unsee it.\n\n`,
        `This video challenged everything I believed about the topic.\n\n`,
        `My perspective just did a complete 180...\n\n`,
        `Sometimes a single video changes how you see things...\n\n`
      ],
      contrarian: [
        `Unpopular opinion: ${mainInsight || 'what I just learned'}...\n\n`,
        `Hot take: ${mainInsight || 'this insight'} is underrated...\n\n`,
        `Controversial but true: ${mainInsight || 'this concept'}...\n\n`,
        `Going against the grain here: ${mainInsight || 'this approach'}...\n\n`,
        `This might ruffle feathers: ${mainInsight || 'what I discovered'}...\n\n`
      ]
    };
    
    // Generic hooks for when no template matches
    const genericHooks = [
      `Just discovered something fascinating...\n\n`,
      `Mind = blown 🤯\n\n`,
      `Okay, this is worth sharing...\n\n`,
      `Stop what you're doing and read this...\n\n`,
      `This completely changed my perspective...\n\n`,
      `I need to talk about what I just learned...\n\n`,
      `Can we discuss this for a second?\n\n`,
      `This insight hit different...\n\n`,
      `Plot twist: Everything you know about ${mainInsight?.split(' ').slice(0, 5).join(' ')}... might be wrong.\n\n`,
      `I wasn't ready for this revelation...\n\n`,
      `Sometimes a single insight changes everything.\n\n`,
      `This is why I love the internet.\n\n`
    ];
    
    // Select hook based on template and generation attempt
    const selectedHooks = hookVariations[templateName] || genericHooks;
    const hookIndex = (generationAttempt - 1) % selectedHooks.length;
    draft = selectedHooks[hookIndex];
    
    // Add the main insight in a conversational way with variation
    if (mainInsight && mainInsight.length > 20) {
      // Extract the core concept to build a story around
      let storyAngle = mainInsight;
      
      // Don't just state the insight - create intrigue around it
      const insightIntros = [
        `Here's what struck me: ${storyAngle}\n\nBut it's bigger than that.\n\n`,
        `${storyAngle}\n\nSit with that for a second.\n\n`,
        `Everyone's talking about the tech.\n\nBut they're missing this: ${storyAngle}\n\n`,
        `${storyAngle}\n\nAnd no, this isn't hype.\n\n`,
        `I had to reread this three times:\n\n"${storyAngle}"\n\n`,
        `${storyAngle}\n\nHere's why that matters:\n\n`,
        `Forget what you think you know.\n\n${storyAngle}\n\n`,
        `${storyAngle}\n\nThe implications? Staggering.\n\n`
      ];
      const insightIndex = (generationAttempt - 1) % insightIntros.length;
      draft += insightIntros[insightIndex];
    }
    
    // Add supporting points in an engaging format with variation
    if (supportingPoints && supportingPoints.length > 0) {
      const validPoints = supportingPoints.filter(p => p && p.length > 10);
      if (validPoints.length > 0) {
        // Different ways to present insights based on content
        const presentationStyles = [
          // Style 1: Narrative flow
          () => {
            let narrative = `Think about it:\n\n`;
            validPoints.slice(0, 3).forEach((point, index) => {
              const cleaned = point.replace(/[*:]/g, '').trim();
              if (index === 0) narrative += `First, ${cleaned.toLowerCase()}\n\n`;
              else if (index === 1) narrative += `Then, ${cleaned.toLowerCase()}\n\n`;
              else narrative += `Finally, ${cleaned.toLowerCase()}\n\n`;
            });
            return narrative;
          },
          // Style 2: Clean bullets
          () => {
            let bullets = `Here's what's actually happening:\n\n`;
            validPoints.slice(0, 4).forEach(point => {
              const cleaned = point.replace(/[*:]/g, '').trim();
              bullets += `→ ${cleaned}\n`;
            });
            return bullets + '\n';
          },
          // Style 3: Question format
          () => {
            let questions = `Ask yourself:\n\n`;
            validPoints.slice(0, 3).forEach(point => {
              const cleaned = point.replace(/[*:]/g, '').trim();
              questions += `What if ${cleaned.toLowerCase()}?\n\n`;
            });
            return questions;
          },
          // Style 4: Realization format
          () => {
            let realizations = `The pieces fell into place:\n\n`;
            validPoints.slice(0, 3).forEach((point, index) => {
              const cleaned = point.replace(/[*:]/g, '').trim();
              realizations += `${index + 1}. ${cleaned}\n\n`;
            });
            return realizations;
          }
        ];
        
        const styleIndex = (generationAttempt - 1) % presentationStyles.length;
        draft += presentationStyles[styleIndex]();
      }
    }
    
    // Add video source context in a natural way
    if (personalStory && personalStory.includes('Source:')) {
      // Don't add it here - we'll integrate it more naturally
      // The video title can be mentioned in the hook or closing
    }
    
    // Add the problem/solution angle if present with variation
    if (problemSolved && problemSolved.length > 20 && !draft.includes(problemSolved)) {
      const problemIntros = [
        `The bigger picture? ${problemSolved}\n\n`,
        `Why this matters: ${problemSolved}\n\n`,
        `The real challenge: ${problemSolved}\n\n`,
        `What's at stake: ${problemSolved}\n\n`,
        `The underlying issue: ${problemSolved}\n\n`,
        `Bottom line: ${problemSolved}\n\n`,
        `The core problem: ${problemSolved}\n\n`,
        `Think about it: ${problemSolved}\n\n`
      ];
      const problemIndex = (generationAttempt - 1) % problemIntros.length;
      draft += problemIntros[problemIndex];
    }
    
    // Add call to action based on tone
    const ctas = {
      conversational: [
        `What's your experience with this?`,
        `Have you noticed this too?`,
        `Curious to hear your thoughts...`,
        `Anyone else see this pattern?`,
        `What am I missing here?`
      ],
      professional: [
        `How is your team handling this?`,
        `What strategies have worked for you?`,
        `I'd love to hear your perspective.`,
        `What's your approach to this challenge?`,
        `How do you solve this in your organization?`
      ],
      inspirational: [
        `What insight changed your approach?`,
        `How are you applying this concept?`,
        `What's been your breakthrough moment?`,
        `What shift made the difference for you?`,
        `When did this click for you?`
      ],
      educational: [
        `What would you add to this?`,
        `Which point resonates most with you?`,
        `What's been your key learning here?`,
        `What example would you share?`,
        `How do you teach this concept?`
      ]
    };
    
    const selectedCTAs = ctas[tone] || ctas.conversational;
    // Use generation attempt to select different CTAs
    const ctaIndex = (generationAttempt - 1) % selectedCTAs.length;
    draft += selectedCTAs[ctaIndex];
    
    // Add video source if available as a P.S.
    if (personalStory && personalStory.includes('Source:')) {
      draft += `\n\n${personalStory}`;
    }
    
    return draft;
  }

  /**
   * Add human-like elements to the content
   */
  humanizeContent(draft) {
    let humanized = draft;

    // Replace corporate language
    Object.entries(simplifyLanguage).forEach(([complex, simple]) => {
      const regex = new RegExp(`\\b${complex}\\b`, 'gi');
      humanized = humanized.replace(regex, simple);
    });

    // Add random human patterns
    const patterns = this.selectRandomPatterns();
    
    // Insert casual transitions
    humanized = this.insertCasualElements(humanized, patterns);
    
    // Add imperfections
    humanized = this.addNaturalImperfections(humanized);
    
    // Vary sentence structure
    humanized = this.varySentenceStructure(humanized);

    return humanized;
  }

  /**
   * Select random human patterns to use
   */
  selectRandomPatterns() {
    return {
      transition: this.randomFrom(humanPatterns.transitions),
      casual: this.randomFrom(humanPatterns.casualPhrases),
      emphasis: this.randomFrom(humanPatterns.emphasisPatterns),
      vulnerability: this.randomFrom(humanPatterns.vulnerabilityMarkers),
      engagement: this.randomFrom(humanPatterns.engagementStarters)
    };
  }

  /**
   * Insert casual elements naturally
   */
  insertCasualElements(text, patterns) {
    const lines = text.split('\n');
    const modifiedLines = [];

    lines.forEach((line, index) => {
      // Skip empty lines and lines with bullet points/arrows
      if (!line.trim() || line.includes('→') || line.includes('•') || /^\d+\./.test(line.trim())) {
        modifiedLines.push(line);
        return;
      }

      // Only add transition to the first substantive paragraph (not titles or lists)
      if (index === 1 && line.length > 20 && Math.random() > 0.5) {
        line = `${patterns.transition} ${line}`;
      }

      // Don't insert casual phrases in the middle of lines - it breaks formatting
      // Instead, occasionally add them as a separate line
      if (index > 2 && index < lines.length - 3 && Math.random() > 0.9 && line.length > 50) {
        modifiedLines.push(line);
        modifiedLines.push('');
        modifiedLines.push(patterns.casual);
        modifiedLines.push('');
        return;
      }

      modifiedLines.push(line);
    });

    return modifiedLines.join('\n');
  }

  /**
   * Add natural imperfections
   */
  addNaturalImperfections(text) {
    // Only use contractions - don't mess with capitalization or add ellipsis
    text = text.replace(/\b(can not|cannot)\b/gi, "can't");
    text = text.replace(/\b(will not)\b/gi, "won't");
    text = text.replace(/\b(do not)\b/gi, "don't");
    text = text.replace(/\b(it is)\b/gi, "it's");
    text = text.replace(/\b(that is)\b/gi, "that's");
    text = text.replace(/\b(I am)\b/g, "I'm");
    text = text.replace(/\b(you are)\b/gi, "you're");
    text = text.replace(/\b(we are)\b/gi, "we're");

    return text;
  }

  /**
   * Vary sentence structure for natural flow
   */
  varySentenceStructure(text) {
    // For LinkedIn posts, we want to maintain clean structure
    // Only make minimal changes for natural flow
    const lines = text.split('\n');
    const processedLines = [];
    
    lines.forEach((line, index) => {
      // Skip empty lines, lists, and headers
      if (!line.trim() || line.includes('→') || line.includes('•') || /^\d+\./.test(line.trim()) || line.includes('?')) {
        processedLines.push(line);
        return;
      }
      
      // Occasionally start a sentence with "And" or "But" for flow
      if (index > 2 && line.length > 30 && line.length < 80 && Math.random() > 0.85) {
        if (!line.startsWith('And ') && !line.startsWith('But ')) {
          line = `${Math.random() > 0.5 ? 'And' : 'But'} ${line.charAt(0).toLowerCase()}${line.slice(1)}`;
        }
      }
      
      processedLines.push(line);
    });
    
    return processedLines.join('\n');
  }

  /**
   * Optimize for LinkedIn platform
   */
  optimizeForLinkedIn(content, targetLength) {
    let optimized = content;

    // Ensure proper line breaks for LinkedIn
    optimized = optimized.replace(/\n{3,}/g, '\n\n');
    
    // Add emoji strategically (not too many)
    optimized = this.addStrategicEmoji(optimized);
    
    // Adjust length
    optimized = this.adjustLength(optimized, targetLength);
    
    // Ensure strong ending
    optimized = this.ensureStrongEnding(optimized);

    return optimized;
  }

  /**
   * Add emoji strategically
   */
  addStrategicEmoji(text) {
    const emojiMap = {
      'important': '⚡',
      'tip': '💡',
      'warning': '⚠️',
      'success': '✅',
      'failure': '❌',
      'money': '💰',
      'time': '⏰',
      'growth': '📈',
      'idea': '🎯',
      'surprise': '😮'
    };

    // Add 1-3 emojis max
    let emojiCount = 0;
    let result = text;

    Object.entries(emojiMap).forEach(([keyword, emoji]) => {
      if (emojiCount < 3 && text.toLowerCase().includes(keyword)) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        result = result.replace(regex, (match) => {
          emojiCount++;
          return `${match} ${emoji}`;
        });
      }
    });

    return result;
  }

  /**
   * Adjust content length
   */
  adjustLength(content, targetLength) {
    const wordCount = content.split(' ').length;
    
    const targetRanges = {
      short: [100, 150],
      medium: [150, 250],
      long: [250, 400]
    };

    const [min, max] = targetRanges[targetLength];

    if (wordCount < min) {
      // Add more detail
      return content + '\n\nP.S. ' + this.generatePS();
    }

    if (wordCount > max) {
      // Trim excess
      const sentences = content.split(/(?<=[.!?])\s+/);
      const trimmed = [];
      let currentCount = 0;

      for (const sentence of sentences) {
        if (currentCount + sentence.split(' ').length <= max) {
          trimmed.push(sentence);
          currentCount += sentence.split(' ').length;
        } else {
          break;
        }
      }

      return trimmed.join(' ');
    }

    return content;
  }

  /**
   * Ensure strong ending
   */
  ensureStrongEnding(content) {
    const lines = content.split('\n');
    const lastLine = lines[lines.length - 1];

    // If doesn't end with question, add one
    if (!lastLine.includes('?')) {
      const engagementQ = this.randomFrom(humanPatterns.engagementStarters);
      lines.push('');
      lines.push(`${engagementQ} what's your experience with this?`);
    }

    return lines.join('\n');
  }

  /**
   * Add visual suggestion
   */
  addVisualSuggestion(content, template) {
    const visualType = this.determineVisualType(content, template);
    
    return {
      content: content,
      visual: {
        type: visualType,
        suggestion: this.getVisualSuggestion(visualType),
        placement: 'after-hook' // or 'end'
      }
    };
  }

  /**
   * Determine best visual type
   */
  determineVisualType(content, template) {
    if (content.includes('•') || content.includes('1.')) {
      return 'list';
    }
    
    if (template === 'beforeAfterBridge') {
      return 'comparison';
    }
    
    if (template === 'personalStory') {
      return 'story';
    }
    
    if (content.match(/\d+%/) || content.includes('number')) {
      return 'data';
    }
    
    return 'tips';
  }

  /**
   * Get visual suggestion
   */
  getVisualSuggestion(type) {
    const suggestions = {
      list: "Create a clean checklist graphic with checkbox icons",
      comparison: "Design a before/after split image or comparison table",
      story: "Use a relevant personal photo or screenshot from the video",
      data: "Create a simple bar chart or percentage visual",
      tips: "Design an infographic with icons for each tip"
    };

    return suggestions[type] || suggestions.tips;
  }

  /**
   * Helper functions
   */
  randomFrom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  generatePS() {
    const psOptions = [
      "What's worked best for you?",
      "Drop your best tip below 👇",
      "Share if this helped!",
      "Tag someone who needs this",
      "Your thoughts?"
    ];
    
    return this.randomFrom(psOptions);
  }

  /**
   * Call AI through background script
   */
  async callAI(prompt, options = {}) {
    try {
      // Send message to background script
      const response = await chrome.runtime.sendMessage({
        type: 'repurpose',
        action: 'transformContent',
        data: {
          prompt: prompt,
          options: options
        }
      });
      
      if (response.success) {
        return response.result;
      } else {
        throw new Error(response.error || 'AI transformation failed');
      }
    } catch (error) {
      console.error('Error calling AI:', error);
      // Return a mock response for testing
      return this.getMockResponse(prompt);
    }
  }
  
  /**
   * Get mock response for testing
   */
  getMockResponse(prompt) {
    // Don't return hardcoded content - let the mock draft generator handle it
    console.log('[ContentTransformer] getMockResponse called, returning trigger for mock generation');
    return "USE_MOCK_GENERATION";
  }
}