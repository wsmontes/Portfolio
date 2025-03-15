import React, { useState, useRef, useEffect } from 'react';
import './ContentFrame.css';

const ContentFrame = ({ nodeId, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [frameTitle, setFrameTitle] = useState('Content'); // Default title
  const [currentNodeId, setCurrentNodeId] = useState(nodeId);
  
  const contentContainerRef = useRef(null);
  const frameRef = useRef(null);
  
  // Handle node navigation events from within frames
  useEffect(() => {
    const handleNodeNavigation = (event) => {
      const { nodeId, source } = event.detail;
      
      if (source === 'frame') {
        console.log(`Node navigation from frame: ${nodeId}`);
        
        // First mark content as not loaded for transition
        setContentLoaded(false);
        
        // Add a small delay before changing node ID for transition effect
        setTimeout(() => {
          // Update current node ID
          setCurrentNodeId(nodeId);
        }, 300);
      }
    };
    
    // Listen for node navigation events
    window.addEventListener('nodeNavigation', handleNodeNavigation);
    
    return () => {
      window.removeEventListener('nodeNavigation', handleNodeNavigation);
    };
  }, []);
  
  // First useEffect to handle frame visibility and content loading
  useEffect(() => {
    console.log("ContentFrame mounted/updated for:", currentNodeId);
    
    // Handle escape key to close frame
    const handleEsc = event => { 
      if (event.key === 'Escape') triggerClose(); 
    };
    window.addEventListener('keydown', handleEsc);
    
    // First show the frame with the loading indicator
    const showFrameTimeout = setTimeout(() => setIsVisible(true), 10);
    
    // Then load the content
    if (contentContainerRef.current && currentNodeId) {
      // Only start loading content once the frame is visible
      const loadContentTimeout = setTimeout(() => {
        console.log(`Starting content load for node: ${currentNodeId}`);
        
        // Check if ContentLoader is available before trying to use it
        if (!window.ContentLoader) {
          console.error("ContentLoader not found - cannot load content");
          setContentLoaded(true);
          return;
        }
        
        window.ContentLoader.loadContent(currentNodeId, contentContainerRef.current)
          .then((result) => {
            console.log(`Content loaded for ${currentNodeId}`);
            
            // Short delay before showing content for smooth transition
            setTimeout(() => {
              setContentLoaded(true);
              
              // Update title from the loaded content
              updateFrameTitle(result.content?.title || '');
              
              // Initialize tabs and scrolling
              initializeInteractiveElements();
            }, 300);
          })
          .catch((error) => {
            console.error(`Failed to load content for ${currentNodeId}:`, error);
            setContentLoaded(true);
            
            // Set a generic error message in the content container
            if (contentContainerRef.current) {
              contentContainerRef.current.innerHTML = `
                <div class="content-error">
                  <h3>Error Loading Content</h3>
                  <p>${error.message || 'An error occurred while loading content.'}</p>
                  <button class="retry-btn btn primary">Retry</button>
                </div>
              `;
              
              // Add event listener to retry button
              const retryBtn = contentContainerRef.current.querySelector('.retry-btn');
              if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                  setContentLoaded(false);
                  loadContentForNode(currentNodeId);
                });
              }
            }
          });
      }, 300);
      
      return () => {
        window.removeEventListener('keydown', handleEsc);
        clearTimeout(showFrameTimeout);
        clearTimeout(loadContentTimeout);
      };
    }
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      clearTimeout(showFrameTimeout);
    };
  }, [currentNodeId]); // Re-run when currentNodeId changes
  
  // Helper function to load content for a node
  const loadContentForNode = (nodeId) => {
    if (!contentContainerRef.current || !nodeId) return;
    
    window.ContentLoader.loadContent(nodeId, contentContainerRef.current)
      .then((result) => {
        console.log(`Content loaded for ${nodeId}`);
        setContentLoaded(true);
        updateFrameTitle(result.content?.title || '');
        initializeInteractiveElements();
      })
      .catch((error) => {
        console.error(`Failed to load content for ${nodeId}:`, error);
        setContentLoaded(true);
      });
  };
  
  // Initialize interactive elements including tabs
  const initializeInteractiveElements = () => {
    if (!contentContainerRef.current) return;
    
    // Initialize tabs
    initializeTabs();
    
    // Initialize node navigation
    initializeNodeNavigation();
    
    // Initialize lazy images
    initializeLazyImages();
    
    // Initialize scrollable containers
    initializeScrollContainers();
  };
  
  // Initialize tab functionality if present
  const initializeTabs = () => {
    if (!contentContainerRef.current) return;
    
    const tabsContainers = contentContainerRef.current.querySelectorAll('.tabbed-template');
    
    tabsContainers.forEach(tabsContainer => {
      const tabButtons = tabsContainer.querySelectorAll('.tab-button');
      const tabContents = tabsContainer.querySelectorAll('.tab-content');
      
      if (tabButtons.length === 0) return;
      
      // Hide all tab contents except the first one
      tabContents.forEach((content, index) => {
        if (index === 0) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
      
      // Mark the first tab as active
      tabButtons[0].classList.add('active');
      
      // Add click handlers to tab buttons
      tabButtons.forEach(button => {
        button.addEventListener('click', function() {
          // Remove active class from all buttons and contents
          tabButtons.forEach(btn => btn.classList.remove('active'));
          tabContents.forEach(content => content.classList.remove('active'));
          
          // Add active class to clicked button
          this.classList.add('active');
          
          // Show corresponding content
          const tabId = this.getAttribute('data-tab');
          const tabContent = tabsContainer.querySelector(`.tab-content[data-tab="${tabId}"]`);
          if (tabContent) {
            tabContent.classList.add('active');
            
            // Load lazy content if needed
            if (this.getAttribute('data-lazy-load') === 'true' && 
                !tabContent.getAttribute('data-loaded')) {
              loadLazyTabContent(tabId, tabContent);
            }
          }
        });
      });
    });
  };
  
  // Initialize node navigation elements
  const initializeNodeNavigation = () => {
    if (!contentContainerRef.current) return;
    
    // Find all node navigation elements
    const nodeNavElements = contentContainerRef.current.querySelectorAll(
      '.node-nav-card, .breadcrumb-item, .hierarchy-back-btn, .top-nav-btn'
    );
    
    nodeNavElements.forEach(element => {
      // Skip if element already has click handler
      if (element.hasAttribute('data-nav-initialized')) return;
      
      element.setAttribute('data-nav-initialized', 'true');
      element.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Determine which node ID to navigate to
        let targetNodeId = null;
        
        if (element.classList.contains('node-nav-card')) {
          targetNodeId = element.getAttribute('data-node-id');
        } else if (element.classList.contains('breadcrumb-item')) {
          targetNodeId = element.getAttribute('data-node-id');
        } else if (element.classList.contains('hierarchy-back-btn')) {
          targetNodeId = element.getAttribute('data-parent-id');
        } else if (element.classList.contains('top-nav-btn')) {
          targetNodeId = element.getAttribute('data-node-id');
        }
        
        if (targetNodeId) {
          console.log(`Navigating to node ${targetNodeId} from within frame`);
          
          // Dispatch node navigation event
          const event = new CustomEvent('nodeNavigation', {
            detail: {
              nodeId: targetNodeId,
              source: 'frame'
            }
          });
          window.dispatchEvent(event);
        }
      });
    });
  };
  
  // Initialize lazy images
  const initializeLazyImages = () => {
    if (!contentContainerRef.current) return;
    
    // Use OptimizedContentHandler if available
    if (window.OptimizedContentHandler && 
        window.OptimizedContentHandler.initializeLazyImages) {
      window.OptimizedContentHandler.initializeLazyImages(contentContainerRef.current);
    }
  };
  
  // Initialize scrollable containers
  const initializeScrollContainers = () => {
    if (!contentContainerRef.current) return;
    
    if (window.OptimizedContentHandler && 
        window.OptimizedContentHandler.initializeScrollableContainers) {
      window.OptimizedContentHandler.initializeScrollableContainers(contentContainerRef.current);
    }
  };
  
  // Load lazy tab content
  const loadLazyTabContent = (tabId, tabContent) => {
    // Show loading indicator
    tabContent.innerHTML = '<div class="tab-loading"><div class="spinner"></div><p>Loading content...</p></div>';
    
    // Get content data from unified source
    if (window.ContentLoader) {
      window.ContentLoader.getTabContent(currentNodeId, tabId)
        .then(content => {
          tabContent.innerHTML = content || '<p>No content available</p>';
          tabContent.setAttribute('data-loaded', 'true');
          // Initialize any interactive elements in the lazy-loaded content
          initializeInteractiveElements();
        })
        .catch(error => {
          console.error(`Error loading tab content for ${tabId}:`, error);
          tabContent.innerHTML = '<p>Failed to load content</p>';
        });
    }
  };
  
  // Update frame title whenever current node changes
  const updateFrameTitle = (contentTitle) => {
    // Get title from unified data
    if (window.ContentLoader) {
      window.ContentLoader.getUnifiedData().then(unifiedData => {
        const nodeData = window.ContentLoader.findNodeInUnifiedData(unifiedData, currentNodeId);
        if (nodeData) {
          // First try content title, then content.title, then node name
          const title = contentTitle || nodeData.content?.title || nodeData.name || 'Content';
          setFrameTitle(title);
        }
      }).catch(error => {
        console.error("Error fetching title data:", error);
        // Fallback to content title or default
        setFrameTitle(contentTitle || 'Content');
      });
    } else {
      setFrameTitle(contentTitle || 'Content');
    }
  };

  const triggerClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    
    // Reset the graph view when closing the frame - CRITICAL FIX
    if (window.resetGraphView) {
      console.log("Resetting graph view on frame close");
      window.resetGraphView();
    }
    
    // Animation duration for smoother exit
    setTimeout(() => { 
      onClose(); 
    }, 400);
  };

  // Click outside frame to close
  const handleOutsideClick = (e) => {
    if (frameRef.current && !frameRef.current.contains(e.target)) {
      triggerClose();
    }
  };

  // Render appropriate content
  const renderContent = () => {
    if (!currentNodeId) {
      return (
        <div className="frame-fallback-content">
          <h2>Content Not Found</h2>
          <p>The requested content could not be loaded.</p>
        </div>
      );
    }
    
    return (
      <div className="frame-content-wrapper">
        {!contentLoaded && <div className="content-loader"></div>}
        <div 
          ref={contentContainerRef}
          className={`content-container ${contentLoaded ? 'loaded' : ''}`}
          key={currentNodeId} // Key helps with re-rendering when node changes
        ></div>
      </div>
    );
  };

  return (
    <div 
      className={`frame-overlay ${isClosing ? 'closing' : ''} ${isVisible ? 'visible' : ''}`}
      onClick={handleOutsideClick}
    >
      <div 
        ref={frameRef}
        className="frame-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="frame-header">
          <h2>{frameTitle}</h2>
          <button 
            className="close-button" 
            onClick={triggerClose}
            aria-label="Close"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="frame-body">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ContentFrame;
