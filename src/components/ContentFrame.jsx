import React, { useEffect, useState } from 'react';
import './ContentFrame.css';

const ContentFrame = ({ nodeId, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Show frame on mount and add ESC key listener
  useEffect(() => {
    console.log("ContentFrame mounted for:", nodeId);
    const handleEsc = event => { if (event.key === 'Escape') triggerClose(); };
    window.addEventListener('keydown', handleEsc);
    setIsVisible(true);
    return () => {
      window.removeEventListener('keydown', handleEsc);
      console.log("ContentFrame unmounted");
    };
  }, [nodeId]);

  const triggerClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => { onClose(); }, 300);
  };

  // Use relative URLs (remove the leading slash)
  const frameUrls = {
    about: 'assets/content/about.html',
    contact: 'assets/content/contact.html'
  };
  const src = frameUrls[nodeId];
  console.log("Rendering iframe for", nodeId, "with src:", src);

  const renderContent = () => {
    if (src) {
      return (
        <iframe 
          id="content-frame" 
          src={src} 
          title={nodeId} 
          style={{ width: '100%', height: '100%', border: 'none' }}
          onLoad={() => console.log("Iframe loaded for", nodeId)}
        />
      );
    }
    return (
      <div className="frame-content">
        <h2>Content Not Found</h2>
        <p>The requested content could not be loaded.</p>
      </div>
    );
  };

  return (
    <div 
      className={`frame-overlay ${isClosing ? 'closing' : ''}`} 
      style={{ opacity: isVisible && !isClosing ? 1 : 0 }}
      onClick={triggerClose}
    >
      <div 
        className="frame-container" 
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-button" onClick={triggerClose}>×</button>
        {renderContent()}
      </div>
    </div>
  );
};

export default ContentFrame;
