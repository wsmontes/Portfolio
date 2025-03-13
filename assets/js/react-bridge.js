/**
 * Bridge between vanilla JS and React components
 * This file allows us to create React components from regular JavaScript
 */

// This will be populated by React's initialization code
window.createContentFrame = null;
window.closeContentFrame = null;

// Listen for the React app being ready
document.addEventListener('reactAppReady', (event) => {
  // Store the functions provided by React
  const { createContentFrame, closeContentFrame } = event.detail;
  
  // Make these functions available globally
  window.createContentFrame = createContentFrame;
  window.closeContentFrame = closeContentFrame;
  
  console.log('React bridge initialized');
});
