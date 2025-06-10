/**
 * LinkedIn Post Templates based on proven frameworks
 * Derived from video analysis of posts with 100K+ views
 */

export const linkedInTemplates = {
  // Problem → Agitate → Solution Framework
  problemAgitatesSolution: {
    structure: `
{hook_problem}

{agitate_pain_points}

Here's what I discovered:

{solution_points}

{engagement_question}
    `,
    instructions: {
      hook_problem: "State a specific problem your audience faces",
      agitate_pain_points: "2-3 short sentences making the problem feel urgent",
      solution_points: "3-5 bullet points with actionable solutions",
      engagement_question: "Ask about their experience with this problem"
    },
    example: {
      hook_problem: "Most founders waste 80% of their marketing budget.\n\nAnd they don't even know it.",
      agitate_pain_points: "They try every new tactic.\nHire expensive agencies.\nBut revenue stays flat.",
      solution_points: "• Track ONE metric that matters\n• Test with $100 before scaling\n• Focus on your best channel only\n• Document what actually works\n• Cut everything else",
      engagement_question: "What's the biggest marketing mistake you've made?\n\n(Mine cost me $50K 😅)"
    }
  },

  // Before → After → Bridge Framework
  beforeAfterBridge: {
    structure: `
{hook_transformation}

Before:
{before_state}

After:
{after_state}

The bridge?
{bridge_explanation}

{practical_steps}

{engagement_question}
    `,
    instructions: {
      hook_transformation: "Tease a transformation with specific timeframe/numbers",
      before_state: "2-3 lines describing the struggle",
      after_state: "2-3 lines showing the result",
      bridge_explanation: "One key insight that made the difference",
      practical_steps: "3-4 actionable steps",
      engagement_question: "Ask about their journey"
    }
  },

  // Storytelling Framework
  personalStory: {
    structure: `
{hook_story}

{story_setup}

{conflict_moment}

Then something changed:

{resolution}

The lesson?
{key_takeaway}

{application}

{engagement_question}
    `,
    instructions: {
      hook_story: "Start with intriguing moment or confession",
      story_setup: "Set the scene in 2-3 lines",
      conflict_moment: "The challenge or mistake",
      resolution: "What happened next",
      key_takeaway: "One clear lesson",
      application: "How readers can use this",
      engagement_question: "Relate to their experience"
    }
  },

  // List/Tips Framework
  numberList: {
    structure: `
{hook_number_promise}

{context_line}

{numbered_points}

{bonus_tip}

{engagement_question}
    `,
    instructions: {
      hook_number_promise: "X things/ways/lessons with specific benefit",
      context_line: "One line of context or credibility",
      numbered_points: "Each point: number + emoji + tip + one-line explanation",
      bonus_tip: "Unexpected additional insight",
      engagement_question: "Ask what they'd add"
    },
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
    structure: `
{hook_contrarian}

Everyone thinks:
{common_belief}

But here's what I learned:
{contrarian_truth}

{evidence_points}

{practical_application}

{engagement_question}
    `,
    instructions: {
      hook_contrarian: "Challenge a common belief",
      common_belief: "What most people believe",
      contrarian_truth: "The surprising reality",
      evidence_points: "3-4 points backing your claim",
      practical_application: "How to apply this insight",
      engagement_question: "Challenge their assumptions"
    }
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