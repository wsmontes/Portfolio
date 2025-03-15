/**
 * THREE.js Initialization Script
 * This ensures THREE is available globally before other scripts try to use it
 */
(function() {
  // Set a global flag that we're trying to initialize THREE
  window.THREE_INITIALIZING = true;
  
  function checkThreeAvailability() {
    // First check if THREE is directly available
    if (typeof window.THREE === 'object') {
      console.log("THREE.js found globally");
      window.THREE_LOADED = true;
      window.dispatchEvent(new Event('threeReady'));
      return;
    }
    
    // Then check if it's available through ForceGraph3D
    if (window.ForceGraph3D && window.ForceGraph3D.THREE) {
      console.log("THREE.js found in ForceGraph3D, making globally available");
      window.THREE = window.ForceGraph3D.THREE;
      window.THREE_LOADED = true;
      window.dispatchEvent(new Event('threeReady'));
      return;
    }
    
    // If THREE isn't available yet and script loading is still in progress
    console.log("Waiting for THREE.js to load...");
    setTimeout(checkThreeAvailability, 50);
  }
  
  // Start checking for THREE
  checkThreeAvailability();
})();

/**
 * THREE.js Initialization
 * Sets up THREE globally to avoid multiple instances
 */

// Make sure THREE is available globally
window.THREE = THREE;

console.log("THREE.js initialized globally");

// Optionally detect multiple instances
const originalWarn = console.warn;
console.warn = function() {
  const args = Array.from(arguments);
  if (args[0] && typeof args[0] === 'string' && 
      args[0].includes('Multiple instances of Three.js')) {
    console.error('THREE.js multiple instances detected. This can cause serious issues. Please check imports.');
  }
  originalWarn.apply(console, args);
};
