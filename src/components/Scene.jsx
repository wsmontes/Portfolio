import React, { useState, useRef, useEffect } from 'react';
import ContentFrame from './ContentFrame';
import Menu from './Menu'; 
// ...existing code...

const Scene = () => {
  const [activeNode, setActiveNode] = useState(null);
  const [showFrame, setShowFrame] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  // ...existing code...

  // Debug state changes with useEffect
  useEffect(() => {
    console.log("State changed - activeNode:", activeNode, "showFrame:", showFrame);
  }, [activeNode, showFrame]);

  const handleNodeClick = (nodeId) => {
    console.log("Node clicked:", nodeId);
    
    // Don't interrupt ongoing transitions
    if (isTransitioning) return;
    
    // Check if it's one of our main content nodes
    const contentNodes = ['professional', 'repositories', 'personal', 'about', 'contact'];
    const isContentNode = contentNodes.includes(nodeId);
    
    // Set active node for all nodes
    setActiveNode(nodeId);
    
    // Only show frame for content nodes
    if (isContentNode) {
      setIsTransitioning(true);
      
      // Get position and navigate camera there first
      const targetPosition = getNodePosition(nodeId);
      console.log("Navigating to position:", targetPosition);
      
      navigateToPosition(targetPosition, () => {
        console.log("Navigation complete for:", nodeId);
        // Show frame after camera reaches the position
        setShowFrame(true);
        setTimeout(() => setIsTransitioning(false), 500);
      });
    } else {
      // For non-content nodes, just navigate without showing frame
      const targetPosition = getNodePosition(nodeId);
      navigateToPosition(targetPosition, () => {
        console.log("Navigation complete for non-content node:", nodeId);
      });
    }
  };

  // Add a direct method to test frame visibility
  const forceShowFrame = (nodeId) => {
    setActiveNode(nodeId);
    setShowFrame(true);
  };

  // ...existing code...

  return (
    <div className="scene-container">
      {/* Existing 3D scene */}
      {/* ...existing code... */}
      
      <Menu onNodeClick={handleNodeClick} />
      
      {/* Debug buttons - for testing only, can be hidden in production */}
      <div className="debug-controls" style={{ position: 'fixed', top: '10px', left: '10px', zIndex: 2000, display: 'none' }}>
        <button onClick={() => forceShowFrame('about')}>Show About Frame</button>
        <button onClick={() => forceShowFrame('contact')}>Show Contact Frame</button>
        <button onClick={() => forceShowFrame('professional')}>Show Professional Frame</button>
        <button onClick={() => forceShowFrame('personal')}>Show Personal Frame</button>
        <button onClick={() => forceShowFrame('repositories')}>Show Repositories Frame</button>
      </div>
      
      {/* Ensure frame is displayed when conditions are met */}
      {showFrame && activeNode && (
        <ContentFrame 
          nodeId={activeNode} 
          onClose={() => {
            console.log("Closing frame");
            setShowFrame(false);
            // Reset active node after animation completes
            setTimeout(() => setActiveNode(null), 500);
          }} 
        />
      )}
    </div>
  );
};

// Helper function to get node position (ensure it doesn't throw errors)
const getNodePosition = (nodeId) => {
  // Return the 3D coordinates for the specified node
  // ...existing code...
  // Fallback position if the node isn't found
  return { x: 0, y: 0, z: 0 };
};

// Helper function to animate camera movement (ensure callback is always called)
const navigateToPosition = (position, onComplete) => {
  // Animate camera movement to the target position
  // ...existing code...
  
  // Ensure the callback is always called, even if animation fails
  // For testing, we can use a timeout to simulate navigation
  setTimeout(() => {
    if (typeof onComplete === 'function') {
      onComplete();
    }
  }, 1000);
};

export default Scene;
