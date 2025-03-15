/**
 * THREE.js initialization and global management
 */

(function() {
    // Check if THREE is already defined globally
    if (typeof window.THREE !== 'undefined' && window.THREE.REVISION) {
        console.log('THREE.js found globally');
        // THREE is already defined, no need to reinitialize
        console.log('THREE.js initialized globally');
        return;
    }
    
    // If we reach here, THREE wasn't properly initialized
    console.warn('THREE.js not properly initialized. Please check script loading order.');
    
    // Update deprecated geometry names for newer THREE.js versions
    if (window.THREE) {
        // Add compatibility wrappers for renamed classes
        if (window.THREE.CylinderGeometry && !window.THREE.CylinderBufferGeometry) {
            window.THREE.CylinderBufferGeometry = window.THREE.CylinderGeometry;
        }
        
        if (window.THREE.SphereGeometry && !window.THREE.SphereBufferGeometry) {
            window.THREE.SphereBufferGeometry = window.THREE.SphereGeometry;
        }
    }
    
    // Add error logger for THREE.js warnings
    const originalWarn = console.warn;
    console.warn = function(message) {
        // Forward to original warning function
        originalWarn.apply(console, arguments);
        
        // Check if this is a THREE.js related warning
        if (typeof message === 'string' && 
            (message.includes('THREE.') || message.includes('React'))) {
            // Log to our custom error handling if needed
        }
    };
})();
