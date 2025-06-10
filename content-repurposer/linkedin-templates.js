/**
 * LinkedIn Post Templates based on proven frameworks
 * Derived from video analysis of posts with 100K+ views
 */

export const linkedInTemplates = {
  // Problem → Agitate → Solution Framework
  problemAgitatesSolution: {
    inspiration: `
This template works well when you've identified a clear problem and solution.
Feel free to adapt the structure to fit your content naturally.

Example flow:
- Start with a problem that resonates
- Make it feel real and urgent
- Share your discovery or solution
- Invite discussion
    `,
    flexibleStructure: `
Adapt as needed - the key is problem → realization → solution → engagement
    `,
    example: {
      hook_problem: "Most founders waste 80% of their marketing budget.\n\nAnd they don't even know it.",
      agitate_pain_points: "They try every new tactic.\nHire expensive agencies.\nBut revenue stays flat.",
      solution_points: "• Track ONE metric that matters\n• Test with $100 before scaling\n• Focus on your best channel only\n• Document what actually works\n• Cut everything else",
      engagement_question: "What's the biggest marketing mistake you've made?\n\n(Mine cost me $50K 😅)"
    }
  },

  // Before → After → Bridge Framework
  beforeAfterBridge: {
    inspiration: `
Great for transformation stories or showing progress.
The contrast creates engagement.

Think about:
- What changed?
- What was the turning point?
- How can others apply this?
    `,
    flexibleStructure: `
Your story of change → The key insight → How others can benefit
    `
  },

  // Storytelling Framework
  personalStory: {
    inspiration: `
Stories connect. Share authentically.

Elements that work:
- A moment of realization
- Specific details that paint a picture
- A lesson others can apply
- Vulnerability builds trust
    `,
    flexibleStructure: `
Hook with intrigue → Build tension → Share the insight → Connect to reader
    `
  },

  // List/Tips Framework
  numberList: {
    inspiration: `
Lists are scannable and shareable.

Make each point:
- Specific and actionable
- Easy to remember
- Valuable on its own

Bonus points for unexpected insights.
    `,
    flexibleStructure: `
Promise value → Deliver concisely → Add surprise → Invite additions
    `,
    example: {
      hook_number_promise: "7 YouTube features that 99% of people don't know exist:\n\n(#3 saved me 10 hours last week)",
      context_line: "I've analyzed 1,000+ hours of content. These are game-changers:",
      numbered_points: "1. 🎯 Chapters - Jump to exact moments\n   (Works on mobile too)\n\n2. 🔍 Transcript search - Find any word instantly\n   (Ctrl+F in the transcript)\n\n3. ⚡ Speed controls - 1.5x without losing clarity\n   (Press Shift + > to go faster)",
      bonus_tip: "Bonus: Press 'K' to pause/play instantly",
      engagement_question: "Which one surprised you most?"
    }
  },

  // Contrarian/Surprising Insight
  contrarian: {
    inspiration: `
Challenge assumptions respectfully.

What makes this work:
- Acknowledge the common view
- Share your different experience
- Back it up with evidence
- Show how it's useful
    `,
    flexibleStructure: `
Conventional wisdom → Your discovery → Why it matters → New perspective
    `
  }
};

// Human-like writing patterns to inject
export const humanPatterns = {
  transitions: [
    "Here's the thing:",
    "Okay, so...",
    "And yes,",
    "But wait -",
    "Quick story:",
    "Real talk:",
    "Plot twist:"
  ],
  
  casualPhrases: [
    "(yes, really)",
    "I know, I know...",
    "Stay with me here",
    "Wild, right?",
    "(learned this the hard way)",
    "Not gonna lie -",
    "Truth bomb:"
  ],
  
  emphasisPatterns: [
    "THIS →",
    "Read that again ☝️",
    "Let that sink in.",
    "(!!!)",
    "** **", // for emphasis
    "← important",
    "HUGE difference"
  ],
  
  vulnerabilityMarkers: [
    "I messed up",
    "Honestly?",
    "Full transparency:",
    "Confession:",
    "I was wrong about",
    "Took me [time] to realize",
    "My biggest mistake:"
  ],
  
  engagementStarters: [
    "Curious -",
    "Question for you:",
    "Am I the only one who",
    "Who else",
    "Anyone else notice",
    "Your turn:",
    "Unpopular opinion?"
  ]
};

// Hook formulas based on high-performing posts
export const hookFormulas = {
  beforeAfter: "{time_period} ago I {starting_point}. Today I {achievement}. Here's how:",
  
  numberPromise: "{number} {thing} that {benefit} ({specific_result}):",
  
  problem: "Most {audience} {problem}. And they don't even {realize}.",
  
  story: "I just {unexpected_action} and {surprising_result}:",
  
  contrarian: "Everyone says {common_advice}. I did {opposite} instead.",
  
  confession: "I {admission}. But {plot_twist}.",
  
  question: "Why do {observation}? The answer changed how I {outcome}.",
  
  list: "I don't: • {thing_1} • {thing_2} • {thing_3}. Still {achievement}."
};

// Simple language replacements
export const simplifyLanguage = {
  // Complex → Simple
  "utilize": "use",
  "leverage": "use",
  "implement": "start",
  "optimize": "improve",
  "facilitate": "help",
  "demonstrate": "show",
  "establish": "set up",
  "fundamental": "basic",
  "comprehensive": "complete",
  "innovative": "new",
  
  // Corporate → Human
  "best practices": "what works",
  "key takeaways": "what I learned",
  "dive deep": "look closer",
  "circle back": "come back to",
  "touch base": "check in",
  "moving forward": "from now on",
  "at the end of the day": "ultimately",
  "synergy": "working together",
  "bandwidth": "time",
  "low-hanging fruit": "easy wins"
};

// Visual suggestions based on content type
export const visualSuggestions = {
  list: "Create numbered boxes or checklist graphic",
  comparison: "Before/after split image or table",
  process: "Step-by-step flowchart or timeline",
  data: "Simple chart or percentage visual",
  story: "Personal photo or relevant screenshot",
  tips: "Infographic with icons for each tip",
  problem: "Visual representation of the pain point"
};