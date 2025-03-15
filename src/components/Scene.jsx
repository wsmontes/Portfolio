import React, { useState, useRef, useEffect } from 'react';
import ContentFrame from './ContentFrame';
import Menu from './Menu'; 

const Scene = () => {
  const [activeNode, setActiveNode] = useState(null);
  const [showFrame, setShowFrame] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [lastNavSource, setLastNavSource] = useState(null);
  
  // Register frame creation and close dispatch functions
  useEffect(() => {
    // Create dispatcher for frame creation
    window.dispatchFrameCreationEvent = (nodeId) => {
      console.log(`Frame creation event for node: ${nodeId}`);
      handleNodeClick(nodeId);
    };
    
    // Create dispatcher for frame closure
    window.dispatchFrameCloseEvent = () => {
      console.log('Frame close event');
      handleCloseFrame();
    };
    
    // Make React aware we're initialized
    window.reactInitialized = true;
    console.log('Scene component initialized React bridge dispatchers');
    
    return () => {
      // Cleanup
      delete window.dispatchFrameCreationEvent;
      delete window.dispatchFrameCloseEvent;
      window.reactInitialized = false;
    };
  }, []);
  
  // Debug state changes with useEffect
  useEffect(() => {
    console.log("Scene state changed - activeNode:", activeNode, "showFrame:", showFrame);
  }, [activeNode, showFrame]);

  // Handle node click from menu or graph
  const handleNodeClick = (nodeId) => {
    console.log("Node clicked:", nodeId);
    
    // Don't interrupt ongoing transitions
    if (isTransitioning) {
      console.log("Ignoring click during transition");
      return;
    }
    
    // Set active node
    setActiveNode(nodeId);
    
    // Show content frame
    setIsTransitioning(true);
    setShowFrame(true);
    
    // Reset transitioning state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);

    // Update graph focus - force "false" for showContent to prevent event loop
    if (window.focusOnNode && lastNavSource !== 'graph') {
      window.focusOnNode(nodeId, false);
    }
  };

  // Handle navigation between nodes from within content frames
  useEffect(() => {
    const handleNodeNavigation = (event) => {
      const { nodeId, parentId, source } = event.detail;
      
      console.log(`Node navigation event received: ${nodeId} from ${source}`);
      setLastNavSource(source);
      
      if (source === 'frame' || source === 'content' || source === 'menu') {
        handleNodeClick(nodeId);
      }
    };
    
    window.addEventListener('nodeNavigation', handleNodeNavigation);
    return () => {
      window.removeEventListener('nodeNavigation', handleNodeNavigation);
    };
  }, [lastNavSource]);

  // Listen for node click events from the graph
  useEffect(() => {
    const handleNodeClickEvent = (event) => {
      const { id, showContent } = event.detail;
      
      console.log(`Node click event: ${id}, showContent: ${showContent}`);
      setLastNavSource('graph');
      
      if (showContent) {
        handleNodeClick(id);
      } else {
        // Just update active node without showing content
        setActiveNode(id);
      }
    };
    
    window.addEventListener('nodeClick', handleNodeClickEvent);
    return () => {
      window.removeEventListener('nodeClick', handleNodeClickEvent);
    };
  }, []);

  // Close the frame
  const handleCloseFrame = () => {
    setShowFrame(false);
    
    // Dispatch frame closed event to trigger view reset
    window.dispatchEvent(new CustomEvent('contentFrameClosed'));
  };

  return (
    <div className="scene">
      {showFrame && activeNode && (
        <ContentFrame 
          nodeId={activeNode} 
          onClose={handleCloseFrame} 
        />
      )}
      <Menu onNodeClick={handleNodeClick} activeNode={activeNode} />
    </div>
  );
};

export default Scene;
