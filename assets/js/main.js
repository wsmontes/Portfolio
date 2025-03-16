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
    
    // Listen for graph node click events with improved error handling
    window.addEventListener('nodeClick', (e) => {
      if (!e.detail) {
        console.warn('Received nodeClick event without details');
        return;
      }
      
      const nodeId = e.detail.id;
      if (!nodeId) {
        console.warn('Received nodeClick event without node ID');
        return;
      }
      
      // Type check for string before using string methods
      const isRepository = e.detail.isRepository || 
        (typeof nodeId === 'string' && nodeId.startsWith('repo-'));
      
      console.log(`Node click event received for: ${nodeId}, isRepository: ${isRepository}`);
      
      // If this event has the 'showContent' flag set to true, show content
      if (e.detail.showContent) {
        showContent(nodeId, isRepository);
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
   * Show content for a specific section with improved error handling
   * @param {string|any} section - Section ID to load
   * @param {boolean} isRepository - Whether this is a repository node
   */
  function showContent(section, isRepository = false) {
    if (section === undefined || section === null) {
      console.warn('Undefined or null section ID provided to showContent');
      return;
    }
    
    try {
      console.log(`Attempting to show content for: ${section} ${isRepository ? '(repository)' : ''}`);
      
      // Use React ContentFrame to display content
      if (typeof window.createContentFrame === 'function') {
        console.log(`Using React ContentFrame for: ${section}`);
        window.createContentFrame(section);
      } else {
        console.warn('React ContentFrame function is not available, falling back to ContentLoader');
        
        if (window.ContentLoader && typeof window.ContentLoader.loadContent === 'function') {
          // Get content panel elements
          const contentPanel = document.getElementById('content-panel');
          const contentInner = contentPanel.querySelector('.content-inner');
          
          // Make sure the panel is visible
          contentPanel.classList.remove('hidden');
          
          // Show loading indicator
          contentInner.innerHTML = '<div class="loading"><span>Loading content...</span></div>';
          
          // Load content using ContentLoader
          window.ContentLoader.loadContent(section, contentInner)
            .catch(err => {
              console.error(`Error loading content for ${section}:`, err);
              contentInner.innerHTML = '<p class="error">Error loading content. Please try again.</p>';
            });
        } else {
          console.error('Content loading system is unavailable');
          // If no loading method is available, at least show an error message
          const contentPanel = document.getElementById('content-panel');
          const contentInner = contentPanel.querySelector('.content-inner');
          contentPanel.classList.remove('hidden');
          contentInner.innerHTML = '<p class="error">Content loading system is unavailable. Check console for details.</p>';
        }
      }
    } catch (error) {
      console.error(`Error in showContent for ${section}:`, error);
    }
  }
  
  // Update window.resetGraphView usage to be more immediate
  window.addEventListener('graphLoaded', () => {
    console.log("Graph loaded event received, adjusting view immediately");
    if (window.CameraManager && window.Graph) {
      window.CameraManager.fitAllNodes(window.Graph, 800);
    } else if (window.Graph && typeof ensureAllNodesVisible === 'function') {
      ensureAllNodesVisible(window.Graph, 0);
    } else if (typeof fitNodesToView === 'function' && window.Graph) {
      fitNodesToView(window.Graph, 0, false, true);
    }
  }, { once: true });
  
  // Initialize the application with repository data
  async function initializeApp() {
    try {
        console.log('Starting application initialization...');
        
        // Show loading screen if not already displayed
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('active');
            const loadingText = loadingScreen.querySelector('p');
            if (loadingText) {
                loadingText.textContent = 'Loading repositories...';
            }
        }
        
        // Prefetch repositories and unified data in parallel
        const reposPromise = window.GithubRepoFetcher ? 
            window.GithubRepoFetcher.getRepositories() : 
            Promise.resolve([]);
        
        const unifiedDataPromise = window.ContentLoader ? 
            window.ContentLoader.getUnifiedData() : 
            Promise.resolve(null);
        
        // Wait for both to resolve
        const [repos, unifiedData] = await Promise.all([reposPromise, unifiedDataPromise]);
        
        console.log(`Loaded ${repos.length} repositories and unified data`);
        
        // Update loading message
        if (loadingScreen && loadingScreen.querySelector('p')) {
            loadingScreen.querySelector('p').textContent = 'Generating network...';
        }
        
        // Generate enhanced network data with repositories
        let networkData;
        
        if (window.NetworkDataGenerator && window.NetworkDataGenerator.generateNetworkWithRepositories) {
            networkData = await window.NetworkDataGenerator.generateNetworkWithRepositories();
        } else {
            // Fallback to basic network
            console.warn('NetworkDataGenerator not available, using minimal network data');
            networkData = window.NetworkData || { nodes: [], links: [] };
        }
        
        // Make sure the graph is initialized with our data
        if (typeof initGraph === 'function') {
            initGraph(networkData);
        } else if (window.Graph) {
            // If graph already exists but needs data
            window.Graph.graphData(networkData);
        }
        
        // Set up menu items based on network data
        await updateNavigationMenu();
        
        // Hide loading screen after a short delay to ensure render completes
        setTimeout(() => {
            if (loadingScreen) {
                loadingScreen.classList.remove('active');
            }
            
            console.log('Application fully initialized');
            
            // Ensure optimal camera view
            if (window.CameraManager && window.Graph) {
                window.CameraManager.fitAllNodes(window.Graph, 800);
            }
        }, 500);
        
    } catch (error) {
        console.error("Error initializing application:", error);
        
        // Hide loading screen even on error
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.remove('active');
        }
        
        // Show error to user
        alert("Some data could not be loaded. The portfolio will continue with limited functionality.");
    }
  }

  // Make it available globally for immediate execution from other scripts
  window.initializeApp = initializeApp;

  // Run initialization as soon as DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }
});
