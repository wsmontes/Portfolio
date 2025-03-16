/**
 * Bridge between vanilla JS and React components
 */

(function() {
    console.log('React bridge script loaded');
    
    // This will be populated by React's initialization code
    window.createContentFrame = null;
    window.closeContentFrame = null;

    // Flag to track React initialization status
    window.reactInitialized = false;

    /**
     * Fallback implementation if React isn't available
     * @param {string} nodeId - ID of the node to display
     */
    function fallbackCreateContentFrame(nodeId) {
      console.warn('Using fallback content display for:', nodeId);
      const contentPanel = document.getElementById('content-panel');
      const contentInner = contentPanel.querySelector('.content-inner');
      
      if (!contentPanel || !contentInner) {
        console.error('Content panel elements not found in the DOM');
        return;
      }
      
      contentPanel.classList.remove('hidden');
      
      // Try to load content using ContentLoader directly
      try {
        if (window.ContentLoader) {
          contentInner.innerHTML = '<div class="spinner"></div><p>Loading content...</p>';
          window.ContentLoader.loadContent(nodeId, contentInner)
            .then(() => console.log('Content loaded via fallback method'))
            .catch(err => {
              console.error('Fallback content loading failed:', err);
              contentInner.innerHTML = '<p class="error">Failed to load content. Please try again later.</p>';
            });
        } else {
          contentInner.innerHTML = '<p class="error">Content loading system is unavailable.</p>';
        }
      } catch (error) {
        console.error('Error in fallback content display:', error);
        contentInner.innerHTML = '<p class="error">An error occurred while loading content.</p>';
      }
    }

    // Initialize with fallback implementations
    window.createContentFrame = fallbackCreateContentFrame;
    window.closeContentFrame = function() {
      console.warn('Using fallback close method');
      const contentPanel = document.getElementById('content-panel');
      if (contentPanel) contentPanel.classList.add('hidden');
    };

    // Enhance React detection
    const reactRoot = document.getElementById('root');
    
    if (reactRoot) {
        console.log('React root element found, waiting for initialization');
        
        // Listen for the reactLoadFailed event
        document.addEventListener('reactLoadFailed', function() {
            console.log('React load failed event received, activating fallback rendering');
            window.reactInitialized = false;
            activateFallbackRendering();
        });
    } else {
        console.warn('React root element not found in DOM');
    }
    
    function activateFallbackRendering() {
        // Implement fallback rendering using vanilla JS
        console.log('Using vanilla JS fallback rendering');
        
        // Your fallback rendering code here...
    }
    
    // Expose the bridge API
    window.ReactBridge = {
        // Add helper to check if React is available
        isReactAvailable: function() {
            return window.reactInitialized === true;
        },
        
        // Add method to force fallback mode
        forceFallbackMode: function() {
            if (!window.reactInitialized) {
                activateFallbackRendering();
            }
        }
    };

    // Listen for the React app being ready
    document.addEventListener('reactAppReady', (event) => {
      try {
        console.log('React app ready event received');
        
        // Store the functions provided by React
        const { createContentFrame, closeContentFrame } = event.detail;
        
        // Make sure the functions are valid
        if (typeof createContentFrame !== 'function' || typeof closeContentFrame !== 'function') {
          console.error('Invalid React bridge functions received:', event.detail);
          return;
        }
        
        // Make these functions available globally
        window.createContentFrame = createContentFrame;
        window.closeContentFrame = closeContentFrame;
        window.reactInitialized = true;
        
        console.log('React bridge initialized successfully');
      } catch (error) {
        console.error('Error initializing React bridge:', error);
      }
    });

    // Check React availability during initialization
    document.addEventListener('DOMContentLoaded', function() {
      const rootElement = document.getElementById('root');
      if (!rootElement) {
        console.warn('React root element not found in DOM');
      } else {
        console.log('React root element found, waiting for initialization');
      }
    });

    // Set a timeout to check if React initialized properly
    setTimeout(() => {
      if (!window.reactInitialized) {
        console.warn('React did not initialize within the expected time frame, using fallback methods');
      }
    }, 3000);
})();

// Fallback content display when React isn't available
function fallbackCreateContentFrame(nodeId) {
    console.log(`Using fallback content display for: ${nodeId}`);
    
    const contentPanel = document.getElementById('content-panel');
    const contentInner = contentPanel.querySelector('.content-inner');
    
    // Clear previous content and show loading indicator
    contentInner.innerHTML = '<div class="loading-spinner"></div><p>Loading content...</p>';
    contentPanel.classList.remove('hidden');
    
    // Use ContentLoader to load content if available
    if (window.ContentLoader) {
        try {
            window.ContentLoader.loadContent(nodeId, contentInner)
                .then(() => {
                    console.log("Content loaded via fallback method");
                    
                    // Initialize image error handlers for all images
                    const images = contentInner.querySelectorAll('img');
                    images.forEach(img => {
                        // Add error handler if not already present
                        if (!img.hasAttribute('onerror')) {
                            img.onerror = handleImageError;
                        }
                    });
                })
                .catch(error => {
                    console.error(`Error loading content for ${nodeId}:`, error);
                    contentInner.innerHTML = `<div class="error-message">Error loading content: ${error.message}</div>`;
                });
        } catch (error) {
            console.error(`Error with ContentLoader for ${nodeId}:`, error);
            contentInner.innerHTML = `<div class="error-message">Error in content system: ${error.message}</div>`;
        }
    } else {
        contentInner.innerHTML = '<div class="error-message">Content loading system is not available.</div>';
    }
    
    return null;
}

// Define the image error handler here as well to ensure it's available
function handleImageError(event) {
    console.warn(`Failed to load image: ${event.target.src}`);
    
    // Try to load the placeholder image
    event.target.src = 'assets/images/placeholder.jpg';
    // Prevent infinite error loops
    event.target.onerror = null;
}

// Listen for React load failure
document.addEventListener('reactLoadFailed', () => {
    console.log("React load failed event received, activating fallback rendering");
    
    // Flag as using fallback mode
    window.usingReactFallback = true;
    console.log("Using vanilla JS fallback rendering");
    
    // Create a global function for creating content frames in fallback mode
    window.createContentFrame = fallbackCreateContentFrame;
    
    // Initialize any page content that might need it
    if (window.initializePageContent) {
        window.initializePageContent();
    }
});
