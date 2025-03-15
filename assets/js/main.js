/**
 * Main application script
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const contentPanel = document.getElementById('content-panel');
  const contentInner = contentPanel.querySelector('.content-inner');
  const closePanel = contentPanel.querySelector('.close-panel');
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  
  // Initialize the application
  init();
  
  /**
   * Initialize the application
   */
  async function init() {
    try {
      console.log('Initializing main application...');
      
      // Check if React bridge is available
      if (window.createContentFrame) {
        console.log('React bridge functions detected during initialization');
      } else {
        console.warn('React bridge functions not available during initialization');
      }
      
      // Load data and update navigation menu
      await updateNavigationMenu();
      
      // Set up event listeners
      setupEventListeners();
      
      // Hide loading screen after graph is initialized
      window.addEventListener('graphLoaded', () => {
        document.querySelector('.loading-screen').classList.add('hidden');
      });
      
      // Listen for site configuration changes
      window.addEventListener('siteConfigApplied', (e) => {
        // Update logo text from site config
        if (e.detail.config.shortTitle || e.detail.config.logo?.text) {
          const logoElement = document.querySelector('.logo a');
          if (logoElement) {
            logoElement.textContent = e.detail.config.shortTitle || 
                                      e.detail.config.logo.text || 
                                      logoElement.textContent;
          }
        }
      });
      
      // Listen for React becoming available after initialization
      if (!window.reactInitialized) {
        document.addEventListener('reactAppReady', () => {
          console.log('React became available after initialization');
        });
      }
      
      console.log('Main application initialized successfully');
    } catch (error) {
      console.error('Initialization error:', error);
      // Even without fallbacks, still set up event listeners
      setupEventListeners();
    }
  }
  
  /**
   * Update the navigation menu based on unified data source
   */
  async function updateNavigationMenu() {
    // Get the unified data using ContentLoader
    const unifiedData = await window.ContentLoader.getUnifiedData();
    
    if (!unifiedData || !unifiedData.graphConfig || !unifiedData.graphConfig.categories) {
      throw new Error('Invalid or missing categories in unified data');
    }
    
    // Get the categories from the unified data
    const categories = unifiedData.graphConfig.categories;
    
    // Clear existing menu items
    navMenu.innerHTML = '';
    
    // Create menu items for each category
    categories.forEach(category => {
      // Create new list item
      const listItem = document.createElement('li');
      
      // Create link
      const link = document.createElement('a');
      link.href = '#';
      link.setAttribute('data-section', category.id);
      link.textContent = category.name;
      
      // Add link to list item
      listItem.appendChild(link);
      
      // Add list item to menu
      navMenu.appendChild(listItem);
    });
    
    console.log('Navigation menu updated with data from unified source');
    
    // Apply menu colors if available
    if (window.applyMenuColors && window.networkData) {
      window.applyMenuColors(window.networkData);
    }
    
    return true;
  }
  
  /**
   * Set up event listeners
   */
  function setupEventListeners() {
    // Mobile menu toggle
    menuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
    
    // Navigation menu links - use event delegation for dynamically created items
    navMenu.addEventListener('click', (e) => {
      const link = e.target.closest('a[data-section]');
      if (!link) return; // Not clicking on a navigation link
      
      e.preventDefault();
      navMenu.classList.remove('active');
      const section = link.getAttribute('data-section');
      window.focusOnNode(section, true);
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
    
    // Reset view button with improved camera management
    document.getElementById('resetView').addEventListener('click', (e) => {
      e.preventDefault();
      
      // Use CameraManager if available for better view fitting
      if (window.CameraManager && window.Graph) {
        window.CameraManager.resetToHomeView(window.Graph, 800);
      } else if (window.resetGraphView) {
        window.resetGraphView();
      }
    });
    
    // Listen for graph loaded event to position camera optimally
    window.addEventListener('graphLoaded', () => {
      console.log("Graph loaded event received");
      
      // Use CameraManager for optimal initial viewing
      if (window.CameraManager && window.Graph) {
        // Short delay to let force simulation start
        setTimeout(() => {
          window.CameraManager.fitAllNodes(window.Graph, 1000);
        }, 100);
      }
      
      // Hide loading screen
      document.querySelector('.loading-screen').classList.add('hidden');
    }, { once: true });
  }
  
  /**
   * Show content for a specific section
   * @param {string} section - Section ID to load
   */
  function showContent(section) {
    console.log(`Attempting to show content for: ${section}`);
    
    // Use React ContentFrame to display content
    if (typeof window.createContentFrame === 'function') {
      console.log(`Using React ContentFrame for: ${section}`);
      window.createContentFrame(section);
    } else {
      console.error('React ContentFrame function is not available');
      // If React isn't available for some unexpected reason, at least show an error message
      contentPanel.classList.remove('hidden');
      contentInner.innerHTML = '<p class="error">Content loading system is unavailable. Check console for details.</p>';
    }
  }
  
  // Update window.resetGraphView usage to be more immediate
  window.addEventListener('graphLoaded', () => {
    console.log("Graph loaded event received, adjusting view immediately");
    if (window.Graph && typeof ensureAllNodesVisible === 'function') {
        ensureAllNodesVisible(window.Graph, 0);
    } else if (typeof fitNodesToView === 'function' && window.Graph) {
        fitNodesToView(window.Graph, 0, false, true);
    }
  }, { once: true });
});
