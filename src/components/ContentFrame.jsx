import React, { useEffect, useState, useRef } from 'react';
import './ContentFrame.css';

const ContentFrame = ({ nodeId, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);
  const iframeRef = useRef(null);

  // Show frame on mount and add ESC key listener
  useEffect(() => {
    console.log("ContentFrame mounted for:", nodeId);
    const handleEsc = event => { if (event.key === 'Escape') triggerClose(); };
    window.addEventListener('keydown', handleEsc);
    
    // Delay visibility for animation effect
    setTimeout(() => setIsVisible(true), 50);
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      console.log("ContentFrame unmounted");
    };
  }, [nodeId]);

  const triggerClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    
    // Animation duration for smoother exit
    setTimeout(() => { onClose(); }, 400);
  };

  // Map node IDs to template paths
  const contentSources = {
    professional: 'assets/content/professional.html',
    repositories: 'assets/content/repositories.html',
    personal: 'assets/content/personal.html',
    about: 'assets/content/about.html',
    contact: 'assets/content/contact.html'
  };
  
  const src = contentSources[nodeId];
  console.log("Rendering content for", nodeId, "with src:", src);

  // Handle iframe load events
  const handleIframeLoad = () => {
    console.log("Content loaded for", nodeId);
    setContentLoaded(true);
  };

  const handleIframeError = () => {
    console.error("Failed to load content for", nodeId);
    setContentLoaded(true); // Still mark as loaded to show error message
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
    if (!src) {
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
        <iframe 
          ref={iframeRef}
          id="content-frame" 
          src={src} 
          title={getFrameTitle()}
          className={contentLoaded ? 'loaded' : ''}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
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
