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
        // If site config provides logo text different from what main.js added,
        // update it (this ensures the most specific display text is used)
        if (e.detail.config.shortTitle || e.detail.config.logo?.text) {
          const logoElement = document.querySelector('.logo a');
          if (logoElement) {
            logoElement.textContent = e.detail.config.shortTitle || 
                                      e.detail.config.logo.text || 
                                      logoElement.textContent;
          }
        }
      });
    } catch (error) {
      console.error('Initialization error:', error);
      // Continue with static navigation if dynamic fails
      setupEventListeners();
    }
  }
  
  /**
   * Update the navigation menu based on unified data source
   */
  async function updateNavigationMenu() {
    try {
      // Try to use ContentLoader to get the unified data
      let unifiedData;
      if (window.ContentLoader && window.ContentLoader.getUnifiedData) {
        unifiedData = await window.ContentLoader.getUnifiedData();
      } else {
        // Fallback to direct fetch if ContentLoader isn't available yet
        const response = await fetch('data/unified-data.json');
        if (!response.ok) throw new Error('Failed to fetch unified data');
        unifiedData = await response.json();
      }
      
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
      
      // Make navLinks reference the newly created links after DOM update
      return true;
    } catch (error) {
      console.error('Error updating navigation menu:', error);
      return false;
    }
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
