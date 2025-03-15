import React, { useEffect, useState, useRef } from 'react';
import './ContentFrame.css';

const ContentFrame = ({ nodeId, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);
  const contentContainerRef = useRef(null);
  
  // Single useEffect for handling frame appearance and content loading
  useEffect(() => {
    console.log("ContentFrame mounted for:", nodeId);
    const handleEsc = event => { if (event.key === 'Escape') triggerClose(); };
    window.addEventListener('keydown', handleEsc);
    
    // First show the frame with the loading indicator
    // Small delay needed for the CSS transition to work properly
    const showFrameTimeout = setTimeout(() => setIsVisible(true), 10);
    
    // Then load the content
    if (contentContainerRef.current && nodeId) {
      // Only start loading content once the frame is visible
      const loadContentTimeout = setTimeout(() => {
        console.log(`Starting content load for node: ${nodeId}`);
        
        // Check if ContentLoader is available before trying to use it
        if (!window.ContentLoader) {
          console.error("ContentLoader not found - cannot load content");
          setContentLoaded(true);
          return;
        }
        
        window.ContentLoader.loadContent(nodeId, contentContainerRef.current)
          .then((result) => {
            // Log the data returned from the content loader
            console.log(`Content loaded for ${nodeId}:`, result);
            
            // Only mark content as loaded after the frame is fully visible
            setTimeout(() => {
              setContentLoaded(true);
            }, 300); // Wait for frame animation to complete
          })
          .catch((error) => {
            console.error(`Failed to load content for ${nodeId}:`, error);
            setContentLoaded(true);
          });
      }, 300); // Wait for frame animation to start
      
      return () => {
        window.removeEventListener('keydown', handleEsc);
        clearTimeout(showFrameTimeout);
        clearTimeout(loadContentTimeout);
        console.log("ContentFrame unmounted");
      };
    }
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      clearTimeout(showFrameTimeout);
      console.log("ContentFrame unmounted");
    };
  }, [nodeId]);

  const triggerClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    
    // Reset the graph view when closing the frame
    if (window.resetGraphView) {
      window.resetGraphView();
    }
    
    // Animation duration for smoother exit
    setTimeout(() => { onClose(); }, 400);
  };

  // Determine frame title based on node ID
  const getFrameTitle = () => {
    switch(nodeId) {
      case 'professional': return 'Professional Experience';
      case 'repositories': return 'Code Repositories';
      case 'personal': return 'Personal Projects';
      case 'about': return 'About Me';
      case 'contact': return 'Contact';
      default: return 'Content';
    }
  };

  // Render appropriate content
  const renderContent = () => {
    if (!nodeId) {
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
        ></div>
      </div>
    );
  };

  return (
    <div 
      className={`frame-overlay ${isClosing ? 'closing' : ''} ${isVisible ? 'visible' : ''}`}
      onClick={triggerClose}
    >
      <div 
        className="frame-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="frame-header">
          <h2>{getFrameTitle()}</h2>
          <button className="close-button" onClick={triggerClose} aria-label="Close">
            <span aria-hidden="true">×</span>
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
