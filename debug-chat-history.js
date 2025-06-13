// Debug script for chat history
// Run this in the Chrome extension service worker console

async function debugChatHistory() {
  console.log('=== Debugging Chat History ===');
  
  // Get all storage data
  const allData = await chrome.storage.local.get();
  console.log('All storage keys:', Object.keys(allData));
  
  // Find chat keys
  const chatKeys = Object.keys(allData).filter(key => key.startsWith('chat_'));
  console.log(`Found ${chatKeys.length} chat keys:`, chatKeys);
  
  // Display each chat
  chatKeys.forEach(key => {
    console.log(`\n--- ${key} ---`);
    console.log(allData[key]);
  });
  
  // Test getAllChats function
  console.log('\n=== Testing getAllChats ===');
  try {
    const chats = await getAllChats();
    console.log(`getAllChats returned ${chats.length} chats`);
    chats.forEach((chat, index) => {
      console.log(`Chat ${index + 1}:`, {
        videoId: chat.videoId,
        title: chat.title,
        messageCount: chat.messages?.length || 0,
        lastUpdated: chat.lastUpdated
      });
    });
  } catch (error) {
    console.error('Error in getAllChats:', error);
  }
}

// Run the debug function
debugChatHistory();