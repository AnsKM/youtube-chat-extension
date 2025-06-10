# YouTube Chat Extension - Cost Optimization Guide

## Understanding Token Costs

### Current Pricing (Gemini 2.5 Flash Preview)
- **Input tokens**: $0.00001875 per 1K tokens
- **Output tokens**: $0.000075 per 1K tokens (4x more expensive)

### Typical Token Usage

#### Video Transcript Sizes
- 10-minute video: ~3,000-5,000 tokens
- 30-minute video: ~10,000-15,000 tokens  
- 1-hour video: ~20,000-30,000 tokens
- 3-hour video: ~60,000-90,000 tokens
- 10-hour video: ~200,000-300,000 tokens

#### Cost Per Initial Message
| Video Length | Transcript Tokens | First Message Cost |
|--------------|------------------|-------------------|
| 10 minutes   | ~4,000          | ~$0.08            |
| 30 minutes   | ~12,000         | ~$0.23            |
| 1 hour       | ~25,000         | ~$0.47            |
| 3 hours      | ~75,000         | ~$1.41            |
| 10 hours     | ~250,000        | ~$4.69            |

## Important: Context Window Behavior

**The Gemini API is stateless** - every API call requires:
1. Full video transcript
2. All previous conversation history
3. System instructions
4. Current user question

This means costs increase with each message in a conversation.

## Cost Optimization Strategies

### 1. **Limit Conversation History** (Currently Implemented)
```javascript
// In api-handler.js - only keep last 10 messages
const recentHistory = conversationHistory.slice(-10);
```

### 2. **Transcript Summarization** (Future Enhancement)
For very long videos, we could:
- Summarize the transcript first (one-time cost)
- Use the summary for general questions
- Only include full transcript for specific timestamp queries

### 3. **Selective Context** (Future Enhancement)
- Detect if user is asking about specific part of video
- Only include relevant transcript segments
- Requires intelligent context selection

### 4. **Caching Strategies** (Future Enhancement)
- Cache common questions/answers
- Detect similar queries
- Reuse previous responses when appropriate

### 5. **User Controls** (Future Enhancement)
Add settings for users to control costs:
- "Lite mode" - shorter responses, limited context
- "Full mode" - complete transcript, detailed responses
- Token usage warnings for expensive operations

## Current Implementation Details

### Context Management
The extension currently includes:
1. System prompt (~500 tokens)
2. Full transcript (varies by video length)
3. Last 10 conversation exchanges
4. Current question

### Cost Tracking Features
- Real-time token counting
- Daily usage statistics
- Cost breakdown by input/output
- CSV export for expense tracking
- Reset functionality

## Recommendations for Users

1. **For Long Videos (3+ hours)**:
   - Be aware each message costs $1-5
   - Ask comprehensive questions to minimize exchanges
   - Export important conversations for future reference

2. **For Frequent Use**:
   - Monitor daily costs in extension popup
   - Set personal budget limits
   - Consider shorter videos when possible

3. **Cost-Effective Usage**:
   - Ask specific questions rather than open-ended ones
   - Combine multiple questions into single messages
   - Use timestamp references to focus responses

## Future Enhancements

### Potential Gemini API Features
- **Context caching**: Reuse transcript across messages (would dramatically reduce costs)
- **Conversation threads**: Maintain context server-side
- **Batch pricing**: Discounts for high-volume usage

### Extension Improvements
- [ ] Add cost warnings before expensive operations
- [ ] Implement transcript summarization option
- [ ] Add "budget mode" with reduced context
- [ ] Show estimated cost before sending message
- [ ] Allow users to set daily/monthly spending limits

## Example Cost Calculation

For a typical 1-hour educational video session:
```
Transcript: 25,000 tokens
5 Q&A exchanges with growing context:

Message 1: 25,050 input + 500 output = $0.51
Message 2: 25,600 input + 500 output = $0.52  
Message 3: 26,150 input + 500 output = $0.53
Message 4: 26,700 input + 500 output = $0.54
Message 5: 27,250 input + 500 output = $0.55

Total session cost: ~$2.65
```

## Key Takeaway

The main cost is repeatedly sending the full transcript with every message. Until Gemini offers context caching or conversation memory, each message requires the complete context, making longer videos exponentially more expensive to chat with.