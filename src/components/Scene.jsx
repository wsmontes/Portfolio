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

    // Check if this is an edge node that needs special camera handling
    const isEdgeNode = checkIfEdgeNode(nodeId);
    
    // Enhanced graph focus with edge node detection
    if (window.focusOnNode && lastNavSource !== 'graph') {
      // Use enhanced camera options for edge nodes
      const cameraOptions = isEdgeNode ? {
        ensureVisible: true,
        extraDistance: isEdgeNode ? 70 : 50,
        offset: isEdgeNode ? 0.25 : 0.2
      } : {};
      
      // Pass a flag to NOT show content since we're handling that here
      window.focusOnNode(nodeId, false, cameraOptions);
    }
  };
  
  /**
   * Check if a node is at the edge of the graph
   * @param {string} nodeId - ID of the node to check
   * @returns {boolean} - Whether this is an edge node
   */
  const checkIfEdgeNode = (nodeId) => {
    // Early return if we don't have access to the graph data
    if (!window.Graph || !window.Graph.graphData) {
      return false;
    }
    
    try {
      // Get graph data
      const graphData = window.Graph.graphData();
      if (!graphData || !graphData.nodes) return false;
      
      // Find the node
      const node = graphData.nodes.find(n => n.id === nodeId);
      if (!node) return false;
      
      // Get the center node
      const centerNode = graphData.nodes.find(n => n.id === 'center');
      if (!centerNode) return false;
      
      // Calculate distance from center
      const dx = node.x - centerNode.x;
      const dy = node.y - centerNode.y;
      const dz = node.z - centerNode.z;
      const distanceFromCenter = Math.sqrt(dx*dx + dy*dy + dz*dz);
      
      // Calculate the maximum distance of any node from the center
      let maxDistance = 0;
      graphData.nodes.forEach(n => {
        if (n.id === 'center') return;
        const ndx = n.x - centerNode.x;
        const ndy = n.y - centerNode.y;
        const ndz = n.z - centerNode.z;
        const distance = Math.sqrt(ndx*ndx + ndy*ndy + ndz*ndz);
        maxDistance = Math.max(maxDistance, distance);
      });
      
      // Consider a node an edge node if it's in the outer 25% of the graph
      return distanceFromCenter > maxDistance * 0.75;
      
    } catch (error) {
      console.error("Error checking if node is an edge node:", error);
      return false;
    }
  };
  
  // Handle scene transitions with improved animations
  const handleSceneTransition = (targetNodeId, options = {}) => {
    // Don't interrupt ongoing transitions
    if (isTransitioning) return;
    
    // Start transition
    setIsTransitioning(true);
    
    // Check if this is an edge node
    const isEdgeNode = checkIfEdgeNode(targetNodeId);
    
    // Determine transition timing
    const cameraTransitionTime = isEdgeNode ? 1000 : 800;
    const contentDelay = isEdgeNode ? 800 : 600; 
    
    // First move camera to focus on node
    if (window.focusOnNode) {
      const cameraOptions = {
        duration: cameraTransitionTime,
        ensureVisible: true,
        extraDistance: isEdgeNode ? 70 : 50
      };
      
      window.focusOnNode(targetNodeId, false, cameraOptions);
    }
    
    // After camera starts moving, prepare to show content
    setTimeout(() => {
      setActiveNode(targetNodeId);
      setShowFrame(true);
      
      // Reset transitioning state after animation completes
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    }, contentDelay);
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
