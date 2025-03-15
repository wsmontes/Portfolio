// ...existing code...

// Drastically reduce the threshold time for determining when a view is suboptimal
const SUBOPTIMAL_VIEW_THRESHOLD = 250; // Reduced from 2000ms to trigger much earlier

// ...existing code...

// Initialize the graph with optimum positioning
function initializeGraph() {
  // ...existing code...
  
  // Calculate optimum position immediately for home position
  calculateOptimumPosition(true);
  
  // ...existing code...
}

// Function to calculate optimum position
function calculateOptimumPosition(isInitializing = false) {
  // Use the same logic as in fitNodesToView but apply it immediately
  const duration = isInitializing ? 0 : 750; // No animation on initial load
  
  // Apply improved spacing algorithm before fitting
  improveNodeDistribution();
  
  fitNodesToView(duration, true, false);
  
  // Set this as the home position
  homePosition = {...currentPosition};
  
  // ...existing code...
}

// Enhanced function to improve node distribution using a planar layout
function improveNodeDistribution() {
  const nodes = graph.getNodes();
  const nodeCount = nodes.length;
  
  // Choose appropriate layout based on number of nodes
  if (nodeCount <= 8) {
    applyCircularLayout(nodes);
  } else {
    applyGridLayout(nodes);
  }
  
  // Apply additional force-directed refinement
  refineNodePositions(nodes);
  
  // After adjusting positions, update the nodes in the graph
  nodes.forEach(node => {
    graph.updateNodePosition(node.id, node.x, node.y);
  });
  
  console.log("Node distribution improved with planar layout");
}

// Arrange nodes in a circular layout for better visibility
function applyCircularLayout(nodes) {
  const nodeCount = nodes.length;
  const radius = Math.max(250, nodeCount * 40); // Adjust radius based on node count
  const centerX = 0;
  const centerY = 0;
  
  nodes.forEach((node, index) => {
    // Calculate position on circle
    const angle = (index / nodeCount) * 2 * Math.PI;
    node.x = centerX + radius * Math.cos(angle);
    node.y = centerY + radius * Math.sin(angle);
  });
}

// Arrange nodes in a grid layout for larger graphs
function applyGridLayout(nodes) {
  const nodeCount = nodes.length;
  const gridSize = Math.ceil(Math.sqrt(nodeCount)); // Creates a square-ish grid
  const spacing = 200; // Space between nodes
  
  nodes.forEach((node, index) => {
    // Calculate grid position
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    
    // Calculate actual coordinates with offset to center
    const offsetX = ((gridSize - 1) * spacing) / 2;
    const offsetY = ((Math.ceil(nodeCount / gridSize) - 1) * spacing) / 2;
    
    node.x = (col * spacing) - offsetX;
    node.y = (row * spacing) - offsetY;
  });
}

// Refine node positions with force-directed algorithm
function refineNodePositions(nodes) {
  const minDistance = 150; // Minimum distance between node centers
  const iterations = 30; // Number of iterations for refinement
  
  // Force-directed algorithm to refine the initial layout
  for (let i = 0; i < iterations; i++) {
    let totalMovement = 0;
    
    // For each pair of nodes, apply repulsive force if they're too close
    for (let a = 0; a < nodes.length; a++) {
      for (let b = a + 1; b < nodes.length; b++) {
        const nodeA = nodes[a];
        const nodeB = nodes[b];
        
        // Calculate distance between nodes
        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If nodes are too close, push them apart
        if (distance < minDistance) {
          const force = minDistance - distance;
          const forceX = (dx / distance) * force * 0.5;
          const forceY = (dy / distance) * force * 0.5;
          
          // Apply the force (move both nodes)
          nodeB.x += forceX;
          nodeB.y += forceY;
          nodeA.x -= forceX;
          nodeA.y -= forceY;
          
          totalMovement += Math.abs(forceX) + Math.abs(forceY);
        }
      }
    }
    
    // If very little movement occurred, we can stop early
    if (totalMovement < 1) break;
  }
}

// Modify the checkViewOptimality function or similar
function checkViewOptimality() {
  // ...existing code...
  if (timeInSuboptimalState > SUBOPTIMAL_VIEW_THRESHOLD) {
    console.log("View has been suboptimal for too long, auto-adjusting position");
    fitNodesToView(750, true, false); // Reduced duration from 1500ms to 750ms for faster adjustment
  }
  // ...existing code...
}

// If there's a separate fitNodesToView function
function fitNodesToView(duration, easeOnly, improveXY) {
  console.log(`Fitting nodes to view: duration=${duration}, easeOnly=${easeOnly}, improveXY=${improveXY}`);
  
  // First ensure nodes aren't overlapping
  if (improveXY) {
    improveNodeDistribution();
  }
  
  // ...existing code...
}

// Add a reset to home function that uses the optimized position
function resetToHome() {
  // Use the pre-calculated optimum position instead of a fixed position
  // ...existing code...
}

// ...existing code...
