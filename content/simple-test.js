// Simple test to verify extension can create elements
console.log('%c[SIMPLE TEST] Starting simple bubble test', 'background: #FF5722; color: white; font-size: 16px; padding: 5px;');

// Create a simple bubble without any dependencies
function createSimpleBubble() {
  console.log('[SIMPLE TEST] Creating simple bubble...');
  
  // Check if already exists
  if (document.querySelector('.simple-test-bubble')) {
    console.log('[SIMPLE TEST] Bubble already exists');
    return;
  }
  
  const bubble = document.createElement('div');
  bubble.className = 'simple-test-bubble';
  bubble.style.cssText = `
    position: fixed;
    bottom: 100px;
    right: 24px;
    width: 56px;
    height: 56px;
    background: #FF5722;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 10000;
    color: white;
    font-weight: bold;
  `;
  bubble.textContent = 'T';
  bubble.title = 'Test bubble - click me!';
  
  bubble.addEventListener('click', () => {
    alert('Test bubble clicked! Extension is working.');
    console.log('[SIMPLE TEST] Bubble clicked');
  });
  
  document.body.appendChild(bubble);
  console.log('[SIMPLE TEST] Bubble created and added to DOM');
  console.log('[SIMPLE TEST] Bubble element:', bubble);
  console.log('[SIMPLE TEST] Bubble in DOM:', document.querySelector('.simple-test-bubble'));
}

// Try to create bubble immediately
if (document.body) {
  createSimpleBubble();
} else {
  console.log('[SIMPLE TEST] Waiting for body...');
  document.addEventListener('DOMContentLoaded', createSimpleBubble);
}

console.log('[SIMPLE TEST] Script completed');