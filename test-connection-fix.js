/**
 * Test script to verify connection fixes work properly
 * Can be run in browser console on a YouTube video page
 */

// Test connection health
async function testConnectionHealth() {
  console.log('🔍 Testing extension connection health...');
  
  try {
    const response = await chrome.runtime.sendMessage({ action: 'healthCheck' });
    console.log('✅ Health check response:', response);
    return response.success;
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return false;
  }
}

// Test reconnection
async function testReconnection() {
  console.log('🔄 Testing reconnection...');
  
  try {
    const response = await chrome.runtime.sendMessage({ action: 'reconnect' });
    console.log('✅ Reconnection response:', response);
    return response.success;
  } catch (error) {
    console.error('❌ Reconnection failed:', error);
    return false;
  }
}

// Test API key check
async function testApiKeyCheck() {
  console.log('🔑 Testing API key check...');
  
  try {
    const response = await chrome.runtime.sendMessage({ action: 'checkApiKey' });
    console.log('✅ API key check response:', response);
    return response.success && response.hasApiKey;
  } catch (error) {
    console.error('❌ API key check failed:', error);
    return false;
  }
}

// Test chat extension state
function testChatExtensionState() {
  console.log('🎯 Testing chat extension state...');
  
  // Check if extension is loaded
  const chatExtension = document.querySelector('.youtube-chat-extension');
  const chatBubble = document.querySelector('.youtube-chat-bubble');
  
  console.log('Chat UI present:', !!chatExtension);
  console.log('Chat bubble present:', !!chatBubble);
  
  if (chatExtension) {
    const input = chatExtension.querySelector('.chat-input');
    const sendBtn = chatExtension.querySelector('.chat-send');
    const connectionStatus = chatExtension.querySelector('.connection-status');
    
    console.log('Input field:', {
      present: !!input,
      disabled: input?.disabled,
      placeholder: input?.placeholder
    });
    
    console.log('Send button:', {
      present: !!sendBtn,
      disabled: sendBtn?.disabled
    });
    
    console.log('Connection status:', {
      present: !!connectionStatus,
      classes: connectionStatus?.className
    });
  }
  
  return !!chatExtension && !!chatBubble;
}

// Simulate multiple rapid requests to test race conditions
async function testRaceConditions() {
  console.log('⚡ Testing race condition handling...');
  
  const smartExtension = window.smartExtension;
  if (!smartExtension) {
    console.error('❌ Smart extension not found in global scope');
    return false;
  }
  
  // Try to send multiple messages quickly
  try {
    const promises = [];
    for (let i = 0; i < 3; i++) {
      promises.push(smartExtension.sendMessage());
    }
    
    await Promise.all(promises);
    console.log('✅ Race condition test completed');
    return true;
  } catch (error) {
    console.error('❌ Race condition test failed:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive connection fix tests...\n');
  
  const results = {
    healthCheck: await testConnectionHealth(),
    reconnection: await testReconnection(),
    apiKeyCheck: await testApiKeyCheck(),
    extensionState: testChatExtensionState()
  };
  
  console.log('\n📊 Test Results:');
  console.table(results);
  
  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed) {
    console.log('🎉 All tests passed! The connection fixes are working properly.');
  } else {
    console.log('⚠️  Some tests failed. Check the individual results above.');
  }
  
  return results;
}

// Instructions for manual testing
console.log(`
🧪 YouTube Chat Extension - Connection Fix Test Script
=====================================================

To test the fixes manually:

1. Open a YouTube video page
2. Wait for the chat extension to load
3. Run: runAllTests()

Manual test scenarios:
- Try asking multiple questions in quick succession
- Wait 30+ seconds between questions to test service worker lifecycle
- Reload the extension and try asking questions
- Open developer tools and check for connection status changes

Available test functions:
- testConnectionHealth()
- testReconnection() 
- testApiKeyCheck()
- testChatExtensionState()
- runAllTests()
`);

// Export functions to global scope for easy testing
window.testConnectionFixes = {
  testConnectionHealth,
  testReconnection,
  testApiKeyCheck,
  testChatExtensionState,
  runAllTests
};