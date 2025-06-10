/**
 * Test script for timestamp validation fixes
 * Load this in browser console on a YouTube video page to test the fixes
 */

// Test cases for timestamp validation
const TEST_CASES = [
  {
    name: "Valid timestamps within video duration",
    input: "The key points are discussed at [2:15] and later at [5:30].",
    videoDuration: 600, // 10 minutes
    expectedValid: 2,
    expectedInvalid: 0
  },
  {
    name: "Invalid timestamps exceeding video duration",
    input: "Important info at [15:30] and conclusion at [25:45].",
    videoDuration: 600, // 10 minutes  
    expectedValid: 0,
    expectedInvalid: 2
  },
  {
    name: "Mixed valid and invalid timestamps",
    input: "Start at [1:00], middle section [8:30], and end [15:00].",
    videoDuration: 600, // 10 minutes
    expectedValid: 2,
    expectedInvalid: 1
  },
  {
    name: "No timestamps",
    input: "This is a response without any timestamp references.",
    videoDuration: 600,
    expectedValid: 0,
    expectedInvalid: 0
  },
  {
    name: "Timestamps in different formats",
    input: "See [5:15], 3:30, and [10:45] for details.",
    videoDuration: 600, // 10 minutes
    expectedValid: 1, // Only [5:15] should be processed
    expectedInvalid: 1  // [10:45] exceeds duration
  }
];

// Test the timestamp processing function
function testTimestampProcessing() {
  console.log('🧪 Testing Timestamp Validation System\n');
  
  const smartExtension = window.smartExtension;
  if (!smartExtension) {
    console.error('❌ Smart extension not found. Make sure extension is loaded.');
    return false;
  }
  
  let allTestsPassed = true;
  
  TEST_CASES.forEach((testCase, index) => {
    console.log(`\n📋 Test ${index + 1}: ${testCase.name}`);
    console.log(`Input: "${testCase.input}"`);
    console.log(`Video Duration: ${testCase.videoDuration}s`);
    
    // Temporarily set video duration for testing
    const originalDuration = smartExtension.videoDuration;
    smartExtension.videoDuration = testCase.videoDuration;
    
    try {
      // Process the text
      const processed = smartExtension.processTimestamps(testCase.input);
      
      // Count valid timestamps (clickable links)
      const validCount = (processed.match(/timestamp-link/g) || []).length;
      
      // Count descriptive time references (replaced invalid timestamps)
      const descriptiveCount = (processed.match(/descriptive-time/g) || []).length;
      
      console.log(`✅ Valid timestamps: ${validCount} (expected: ${testCase.expectedValid})`);
      console.log(`🔄 Replaced timestamps: ${descriptiveCount} (expected: ${testCase.expectedInvalid})`);
      console.log(`📝 Processed output: "${processed}"`);
      
      // Validate results
      const validMatch = validCount === testCase.expectedValid;
      const invalidMatch = descriptiveCount === testCase.expectedInvalid;
      
      if (validMatch && invalidMatch) {
        console.log('✅ Test PASSED');
      } else {
        console.log('❌ Test FAILED');
        allTestsPassed = false;
      }
      
    } catch (error) {
      console.error('❌ Test ERROR:', error);
      allTestsPassed = false;
    }
    
    // Restore original duration
    smartExtension.videoDuration = originalDuration;
  });
  
  console.log(`\n🎯 Overall Result: ${allTestsPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  return allTestsPassed;
}

// Test the valid timestamp extraction
function testValidTimestampExtraction() {
  console.log('\n🔍 Testing Valid Timestamp Extraction\n');
  
  const smartExtension = window.smartExtension;
  if (!smartExtension) {
    console.error('❌ Smart extension not found');
    return false;
  }
  
  // Mock transcript with timestamps
  const mockTranscript = {
    segments: [
      { start: 30, text: "Introduction starts here" },
      { start: 120, text: "Main topic discussion" },
      { start: 300, text: "Key insights shared" },
      { start: 480, text: "Conclusion begins" }
    ],
    fullTextWithTimestamps: "[0:30] Introduction [2:00] Main topic [5:00] Key insights [8:00] Conclusion"
  };
  
  // Temporarily set transcript
  const originalTranscript = smartExtension.transcript;
  smartExtension.transcript = mockTranscript;
  smartExtension.videoDuration = 600; // 10 minutes
  
  try {
    const validTimestamps = smartExtension.getValidTimestampsFromTranscript();
    console.log('📊 Extracted timestamps:', validTimestamps);
    console.log('📈 Count:', validTimestamps.length);
    
    // Expected timestamps: 0:30, 2:00, 5:00, 8:00
    const expected = ['0:30', '2:00', '5:00', '8:00'];
    const matches = expected.every(ts => validTimestamps.includes(ts));
    
    if (matches && validTimestamps.length === expected.length) {
      console.log('✅ Timestamp extraction PASSED');
      return true;
    } else {
      console.log('❌ Timestamp extraction FAILED');
      console.log('Expected:', expected);
      console.log('Got:', validTimestamps);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Extraction ERROR:', error);
    return false;
  } finally {
    // Restore original transcript
    smartExtension.transcript = originalTranscript;
  }
}

// Test descriptive time replacement
function testDescriptiveTimeReplacement() {
  console.log('\n🎭 Testing Descriptive Time Replacement\n');
  
  const smartExtension = window.smartExtension;
  if (!smartExtension) {
    console.error('❌ Smart extension not found');
    return false;
  }
  
  smartExtension.videoDuration = 600; // 10 minutes
  
  const testCases = [
    { seconds: 60, expected: 'early in the video' },    // 1 minute - 10% progress
    { seconds: 180, expected: 'in the first part' },    // 3 minutes - 30% progress  
    { seconds: 300, expected: 'around the middle' },    // 5 minutes - 50% progress
    { seconds: 420, expected: 'in the latter part' },   // 7 minutes - 70% progress
    { seconds: 540, expected: 'towards the end' }       // 9 minutes - 90% progress
  ];
  
  let allPassed = true;
  
  testCases.forEach(testCase => {
    const result = smartExtension.getDescriptiveTimeReference(testCase.seconds);
    const contains = result.includes(testCase.expected);
    
    console.log(`⏱️  ${testCase.seconds}s (${Math.round(testCase.seconds/6)}%): ${result}`);
    
    if (contains) {
      console.log('✅ Correct description');
    } else {
      console.log(`❌ Expected "${testCase.expected}", got "${result}"`);
      allPassed = false;
    }
  });
  
  console.log(`\n🎯 Descriptive replacement: ${allPassed ? 'PASSED' : 'FAILED'}`);
  return allPassed;
}

// Test video duration display
function testVideoDurationDisplay() {
  console.log('\n📺 Testing Video Duration Display\n');
  
  const smartExtension = window.smartExtension;
  if (!smartExtension) {
    console.error('❌ Smart extension not found');
    return false;
  }
  
  const videoDuration = smartExtension.videoDuration;
  if (videoDuration) {
    const minutes = Math.floor(videoDuration / 60);
    const seconds = videoDuration % 60;
    const durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    console.log(`📊 Current video duration: ${durationStr} (${videoDuration} seconds)`);
    
    // Check if duration is displayed in UI
    const chatUI = document.querySelector('.youtube-chat-extension');
    if (chatUI) {
      const messages = chatUI.querySelector('.chat-messages');
      const durationText = messages?.textContent?.includes('Video Duration');
      
      console.log('✅ Duration in UI:', durationText ? 'YES' : 'NO');
      return durationText;
    }
  } else {
    console.log('⚠️  No video duration detected');
    return false;
  }
}

// Run comprehensive test suite
function runTimestampValidationTests() {
  console.log('🚀 Starting Comprehensive Timestamp Validation Tests\n');
  console.log('=' .repeat(60));
  
  const results = {
    timestampProcessing: testTimestampProcessing(),
    timestampExtraction: testValidTimestampExtraction(),
    descriptiveReplacement: testDescriptiveTimeReplacement(),
    durationDisplay: testVideoDurationDisplay()
  };
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Final Test Results:');
  console.table(results);
  
  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed) {
    console.log('🎉 ALL TIMESTAMP VALIDATION TESTS PASSED!');
    console.log('✅ The hallucinated timestamp issue has been resolved.');
  } else {
    console.log('⚠️  Some tests failed. Check individual results above.');
  }
  
  return results;
}

// Instructions
console.log(`
🧪 Timestamp Validation Test Suite
===================================

Available test functions:
- runTimestampValidationTests() - Run all tests
- testTimestampProcessing() - Test timestamp validation logic  
- testValidTimestampExtraction() - Test transcript timestamp extraction
- testDescriptiveTimeReplacement() - Test invalid timestamp replacement
- testVideoDurationDisplay() - Test video duration display

To test manually:
1. Ask the extension a question that might generate timestamps
2. Check if any timestamps exceed the video duration  
3. Verify invalid timestamps are replaced with descriptive text
4. Confirm only valid timestamps are clickable

Run: runTimestampValidationTests()
`);

// Export to global scope
window.timestampValidationTests = {
  runTimestampValidationTests,
  testTimestampProcessing,
  testValidTimestampExtraction,
  testDescriptiveTimeReplacement,
  testVideoDurationDisplay
};