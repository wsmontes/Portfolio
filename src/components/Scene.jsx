import React, { useState, useRef, useEffect } from 'react';
import ContentFrame from './ContentFrame';
import Menu from './Menu'; 
// ...existing code...

const Scene = () => {
  const [activeNode, setActiveNode] = useState(null);
  const [showFrame, setShowFrame] = useState(false);
  // ...existing code...

  // Debug state changes with useEffect
  useEffect(() => {
    console.log("State changed - activeNode:", activeNode, "showFrame:", showFrame);
  }, [activeNode, showFrame]);

  const handleNodeClick = (nodeId) => {
    console.log("Node clicked:", nodeId);
    // Removed early return for 'portfolio' node so that content frame always shows
    setActiveNode(nodeId);
    setShowFrame(true);

    const targetPosition = getNodePosition(nodeId);
    console.log("Navigating to position:", targetPosition);

    navigateToPosition(targetPosition, () => {
      console.log("Navigation complete for:", nodeId);
    });
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
      
      {/* Debug buttons - uncommented for testing */}
      <div className="debug-controls" style={{ position: 'fixed', top: '10px', left: '10px', zIndex: 2000 }}>
        <button onClick={() => forceShowFrame('about')}>Show About Frame</button>
        <button onClick={() => forceShowFrame('contact')}>Show Contact Frame</button>
      </div>
      
      {/* Ensure frame is always rendered when showFrame is true */}
      {showFrame && activeNode && (
        <ContentFrame 
          nodeId={activeNode} 
          onClose={() => {
            console.log("Closing frame");
            setShowFrame(false);
            // Optional: add a timeout to reset active node after animation
            setTimeout(() => setActiveNode(null), 300);
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
