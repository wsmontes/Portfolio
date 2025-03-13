/**
 * Main application script
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const contentPanel = document.getElementById('content-panel');
  const contentInner = contentPanel.querySelector('.content-inner');
  const closePanel = contentPanel.querySelector('.close-panel');
  const navLinks = document.querySelectorAll('.nav-menu a');
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  
  // Initialize the application
  init();
  
  /**
   * Initialize the application
   */
  function init() {
    // Set up event listeners
    setupEventListeners();
    
    // Hide loading screen after graph is initialized
    window.addEventListener('graphLoaded', () => {
      document.querySelector('.loading-screen').classList.add('hidden');
    });
  }
  
  /**
   * Set up event listeners
   */
  function setupEventListeners() {
    // Mobile menu toggle
    menuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
    
    // Navigation menu links
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        navMenu.classList.remove('active');
        const section = link.getAttribute('data-section');
        if (window.focusOnNode) {
          const nodeFound = window.focusOnNode(section, true);
          if (!nodeFound) {
            // Fallback if the corresponding node wasn't found: trigger nodeClick event
            const clickEvent = new CustomEvent('nodeClick', {
              detail: { id: section, showContent: true }
            });
            window.dispatchEvent(clickEvent);
          }
        } else {
          console.warn('focusOnNode not available, directly showing content');
          showContent(section);
        }
      });
    });
    
    // Close panel button
    closePanel.addEventListener('click', () => {
      contentPanel.classList.add('hidden');
      
      // Reset graph view when closing panel via the close button
      if (window.resetGraphView) {
        window.resetGraphView();
      }
    });
    
    // Listen for graph node click events - this is triggered from graph.js
    window.addEventListener('nodeClick', (e) => {
      const nodeId = e.detail.id;
      
      // If this event has the 'showContent' flag set to true, show content
      if (e.detail.showContent) {
        showContent(nodeId);
      }
    });
    
    // Reset view button
    document.getElementById('resetView').addEventListener('click', (e) => {
      e.preventDefault();
      if (window.resetGraphView) {
        window.resetGraphView();
      }
    });
  }
  
  /**
   * Show content for a specific section
   * @param {string} section - Section ID to load
   */
  function showContent(section) {
    // Check if React ContentFrame is available
    if (window.createContentFrame) {
      window.createContentFrame(section);
    } else {
      // Fallback to direct content loading if React is not available
      loadLegacyContent(section);
    }
  }
  
  /**
   * Load content for a specific section (fallback method)
   * @param {string} section - Section ID to load
   */
  function loadLegacyContent(section) {
    // Show the content panel
    contentPanel.classList.remove('hidden');
    
    // Show loading state
    contentInner.innerHTML = '<div class="spinner"></div><p>Loading content...</p>';
    
    // Load the content
    ContentLoader.loadContent(section, contentInner);
  }
});
