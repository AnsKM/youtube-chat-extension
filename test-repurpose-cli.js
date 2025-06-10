#!/usr/bin/env node

/**
 * CLI Test for Content Repurposing Feature
 * Run: node test-repurpose-cli.js
 */

import { linkedInTemplates, humanPatterns, hookFormulas } from './content-repurposer/linkedin-templates.js';
import { ContentTransformer } from './content-repurposer/content-transformer.js';

console.log('🧪 Testing Content Repurposing Feature\n');

// Test 1: Check Templates
console.log('1️⃣ Available LinkedIn Templates:');
console.log('--------------------------------');
Object.keys(linkedInTemplates).forEach(template => {
    console.log(`✅ ${template}`);
});

// Test 2: Show a sample template
console.log('\n2️⃣ Sample Template (Problem → Solution):');
console.log('----------------------------------------');
console.log(linkedInTemplates.problemAgitatesSolution.structure);

// Test 3: Test Content Transformation
console.log('\n3️⃣ Testing Content Transformation:');
console.log('----------------------------------');

const sampleTranscript = `
Welcome to this video about productivity. Today I want to share 5 techniques that completely changed how I work.

First, time blocking. Instead of having a vague to-do list, I now schedule specific time slots for each task. This has increased my focus dramatically.

Second, the Pomodoro technique. Working in 25-minute bursts with 5-minute breaks keeps me energized throughout the day.

Third, the Eisenhower matrix helps me prioritize. I categorize tasks by urgency and importance, which prevents me from wasting time on low-priority items.

Fourth, digital minimalism. I've removed social media apps from my phone and use website blockers during work hours.

Finally, morning routines. Starting my day with exercise, meditation, and planning sets a positive tone for everything that follows.

The results? I'm getting twice as much done in half the time, and I actually have energy left for my personal life.
`;

const transformer = new ContentTransformer();

// Mock the AI call for testing
transformer.callAI = async (prompt) => {
    console.log('\n📝 AI Prompt Preview:');
    console.log('--------------------');
    console.log(prompt.substring(0, 200) + '...\n');
    
    // Return mock insights
    return JSON.stringify({
        mainInsight: "5 productivity techniques can double your output while preserving work-life balance",
        supportingPoints: [
            "Time blocking increases focus by creating dedicated work sessions",
            "Pomodoro technique maintains energy throughout the day",
            "Eisenhower matrix prevents wasting time on low-priority tasks",
            "Digital minimalism eliminates major distractions",
            "Morning routines set a positive tone for the entire day"
        ],
        personalStory: "I implemented all 5 techniques and now get twice as much done in half the time",
        problemSolved: "Feeling overwhelmed, unfocused, and exhausted from work",
        actionableTakeaways: [
            "Start with one technique and master it before adding others",
            "Track your results to see what works best for you",
            "Adjust the techniques to fit your lifestyle"
        ]
    });
};

// Transform content
transformer.transformToLinkedIn(sampleTranscript, {
    title: "5 Productivity Techniques That Changed My Life",
    channel: "Productivity Pro",
    duration: "10:23"
}, {
    template: 'numberList',
    tone: 'conversational',
    includeVisual: true
}).then(result => {
    console.log('✨ Transformation Result:');
    console.log('------------------------');
    console.log('\n📱 LinkedIn Post:');
    console.log(result.post);
    
    if (result.visualSuggestion) {
        console.log('\n🖼️ Visual Suggestion:');
        console.log(result.visualSuggestion.suggestion);
    }
    
    console.log('\n📊 Metadata:');
    console.log(`- Template: ${result.metadata.template}`);
    console.log(`- Word Count: ${result.metadata.wordCount}`);
    console.log(`- Read Time: ${result.metadata.estimatedReadTime} min`);
    
    console.log('\n✅ Test Complete!');
}).catch(error => {
    console.error('\n❌ Error:', error.message);
});

// Test 4: Show humanization patterns
console.log('\n4️⃣ Humanization Patterns:');
console.log('-------------------------');
console.log('Casual transitions:', humanPatterns.transitions.slice(0, 5).join(', '));
console.log('Emphasis patterns:', humanPatterns.emphasisPatterns.slice(0, 5).join(', '));

// Test 5: Show hook formulas
console.log('\n5️⃣ Hook Formulas:');
console.log('-----------------');
Object.entries(hookFormulas).slice(0, 3).forEach(([type, formula]) => {
    console.log(`${type}: "${formula}"`);
});