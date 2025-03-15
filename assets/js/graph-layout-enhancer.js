/**
 * Graph Layout Enhancer
 * Additional utilities to improve node positioning in the 3D network graph
 * 
 * This module extends the existing GraphLayout functionality with more
 * aggressive node separation techniques that can be applied directly
 * to the graph instance.
 */

const GraphLayoutEnhancer = {
    /**
     * Apply enhanced node separation to an existing graph
     * @param {Object} graphInstance - The 3D Force Graph instance
     * @param {Boolean} maintainHierarchy - Whether to maintain the hierarchical structure
     */
    improveNodeSeparation: function(graphInstance, maintainHierarchy = true) {
        if (!graphInstance || !graphInstance.graphData) {
            console.warn("Invalid graph instance provided to improveNodeSeparation");
            return;
        }
        
        // Get current graph data
        const graphData = graphInstance.graphData();
        const nodes = graphData.nodes;
        const links = graphData.links;
        
        if (!nodes || nodes.length === 0) return;
        
        // Find center node
        const centerNode = nodes.find(node => node.group === 'center');
        
        // Store original positions for hierarchy preservation
        const originalPositions = {};
        nodes.forEach(node => {
            originalPositions[node.id] = {
                x: node.x,
                y: node.y,
                z: node.z
            };
        });
        
        // Apply immediate force separation
        this._forceSeparateNodes(nodes, 40); // Minimum distance of 40 units
        
        // Preserve hierarchy if requested
        if (maintainHierarchy && centerNode) {
            this._preserveHierarchicalStructure(nodes, links, centerNode, originalPositions);
        }
        
        // Ensure nodes aren't on the camera axis
        this._clearCameraAxis(nodes, centerNode);
        
        // Apply node depth staggering to prevent overlaps in z-direction
        this._staggerNodeDepths(nodes);
        
        // Update the graph with improved positions
        graphInstance.graphData(graphData);
        
        // Reheat the simulation briefly for small adjustments
        if (graphInstance.d3ReheatSimulation) {
            graphInstance.d3ReheatSimulation();
            // Cool it down after a short time
            setTimeout(() => {
                if (graphInstance.d3AlphaTarget) {
                    graphInstance.d3AlphaTarget(0);
                }
            }, 300);
        }
    },
    
    /**
     * Force separate nodes immediately to prevent overlaps
     * @param {Array} nodes - Graph nodes
     * @param {Number} minDistance - Minimum distance between nodes
     */
    _forceSeparateNodes: function(nodes, minDistance) {
        const iterations = 5; // More iterations for better separation
        const stepSize = 0.6; // Somewhat aggressive movement
        
        for (let iter = 0; iter < iterations; iter++) {
            // For each pair of nodes, check distances
            for (let i = 0; i < nodes.length; i++) {
                const nodeA = nodes[i];
                
                // Skip fixed nodes
                if (nodeA.fx !== undefined && nodeA.fy !== undefined) continue;
                
                // Accumulate movement vector for this node
                let moveX = 0, moveY = 0, moveZ = 0;
                let moveCount = 0;
                
                for (let j = 0; j < nodes.length; j++) {
                    if (i === j) continue;
                    
                    const nodeB = nodes[j];
                    
                    // Calculate distance between nodes
                    const dx = nodeA.x - nodeB.x;
                    const dy = nodeA.y - nodeB.y;
                    const dz = nodeA.z - nodeB.z;
                    const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
                    
                    // If too close, add repulsion vector
                    if (distance < minDistance) {
                        // Movement factor based on how close
                        const factor = (minDistance - distance) / distance;
                        
                        // Break ties in zero distance
                        if (distance < 0.1) {
                            // Move in random direction
                            const angle = Math.random() * Math.PI * 2;
                            moveX += Math.cos(angle) * minDistance * 0.5;
                            moveY += Math.sin(angle) * minDistance * 0.5;
                            moveZ += (Math.random() - 0.5) * minDistance * 0.5;
                        } else {
                            // Move along connection line
                            moveX += dx * factor;
                            moveY += dy * factor;
                            moveZ += dz * factor;
                        }
                        moveCount++;
                    }
                }
                
                // Apply accumulated movement (averaged and scaled)
                if (moveCount > 0) {
                    nodeA.x += (moveX / moveCount) * stepSize;
                    nodeA.y += (moveY / moveCount) * stepSize;
                    nodeA.z += (moveZ / moveCount) * stepSize;
                }
            }
        }
    },

    /**
     * Preserve hierarchical relationships after separation
     * @param {Array} nodes - Graph nodes
     * @param {Array} links - Graph links
     * @param {Object} centerNode - Central node
     * @param {Object} originalPositions - Original node positions
     */
    _preserveHierarchicalStructure: function(nodes, links, centerNode, originalPositions) {
        // Map nodes by their group type
        const nodesByGroup = {};
        nodes.forEach(node => {
            const group = node.group || 'unknown';
            if (!nodesByGroup[group]) {
                nodesByGroup[group] = [];
            }
            nodesByGroup[group].push(node);
        });
        
        // Build parent-child relationships
        const childrenOf = {};
        const parentOf = {};
        
        links.forEach(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            
            if (!childrenOf[sourceId]) {
                childrenOf[sourceId] = [];
            }
            childrenOf[sourceId].push(targetId);
            parentOf[targetId] = sourceId;
        });
        
        // Start with center node fixed at origin
        if (centerNode) {
            centerNode.x = 0;
            centerNode.y = 0;
            centerNode.z = 0;
        }
        
        // Helper function to preserve relative direction from parent
        const preserveDirection = (node, parentNode, originalPos) => {
            if (!node || !parentNode || !originalPos[node.id] || !originalPos[parentNode.id]) return;
            
            // Calculate original direction vector
            const origDx = originalPos[node.id].x - originalPos[parentNode.id].x;
            const origDy = originalPos[node.id].y - originalPos[parentNode.id].y;
            const origDz = originalPos[node.id].z - originalPos[parentNode.id].z;
            
            // Calculate original distance
            const origDistance = Math.sqrt(origDx*origDx + origDy*origDy + origDz*origDz);
            if (origDistance < 0.1) return; // Skip if original distance was too small
            
            // Get current distance
            const dx = node.x - parentNode.x;
            const dy = node.y - parentNode.y;
            const dz = node.z - parentNode.z;
            const currentDistance = Math.sqrt(dx*dx + dy*dy + dz*dz);
            
            // Normalize original direction
            const nx = origDx / origDistance;
            const ny = origDy / origDistance;
            const nz = origDz / origDistance;
            
            // Use original direction but preserve current distance
            node.x = parentNode.x + nx * currentDistance;
            node.y = parentNode.y + ny * currentDistance;
            node.z = parentNode.z + nz * currentDistance;
        };
        
        // Process by hierarchy level
        ['category', 'subcategory', 'cluster', 'item'].forEach(groupType => {
            if (!nodesByGroup[groupType]) return;
            
            nodesByGroup[groupType].forEach(node => {
                // Find parent
                const parentId = parentOf[node.id];
                if (!parentId) return;
                
                // Find parent node
                const parentNode = nodes.find(n => n.id === parentId);
                if (!parentNode) return;
                
                // Preserve direction from parent
                preserveDirection(node, parentNode, originalPositions);
            });
        });
    },
    
    /**
     * Clear the camera axis by ensuring no nodes are directly on the view axis
     * @param {Array} nodes - Graph nodes
     * @param {Object} centerNode - Central node
     */
    _clearCameraAxis: function(nodes, centerNode) {
        // Default camera looks along negative Z axis
        const minAxisDistance = 30; // Minimum distance from camera axis
        
        nodes.forEach(node => {
            // Skip center node and fixed nodes
            if (node === centerNode || (node.fx !== undefined && node.fy !== undefined)) return;
            
            // Calculate distance from axis (distance in XY plane from origin or center node)
            const origin = centerNode || { x: 0, y: 0 };
            const dx = node.x - origin.x;
            const dy = node.y - origin.y;
            const xyDistance = Math.sqrt(dx*dx + dy*dy);
            
            // If too close to axis, move outward
            if (xyDistance < minAxisDistance) {
                // Calculate angle in XY plane (or random if exactly on axis)
                let angle;
                if (xyDistance < 0.1) {
                    angle = Math.random() * Math.PI * 2;
                } else {
                    angle = Math.atan2(dy, dx);
                }
                
                // New distance from center
                const newDistance = minAxisDistance + Math.random() * 10;
                
                // Move outward
                node.x = origin.x + Math.cos(angle) * newDistance;
                node.y = origin.y + Math.sin(angle) * newDistance;
            }
        });
    },
    
    /**
     * Stagger node depths to prevent Z-axis overlap
     * @param {Array} nodes - Graph nodes
     */
    _staggerNodeDepths: function(nodes) {
        // Group nodes by approximate XY position
        const xyBuckets = {};
        const bucketSize = 40; // Size of XY grid cells
        
        nodes.forEach(node => {
            // Skip fixed nodes
            if (node.fx !== undefined && node.fy !== undefined) return;
            
            // Calculate bucket key based on XY position
            const bucketX = Math.floor(node.x / bucketSize);
            const bucketY = Math.floor(node.y / bucketSize);
            const bucketKey = `${bucketX},${bucketY}`;
            
            if (!xyBuckets[bucketKey]) {
                xyBuckets[bucketKey] = [];
            }
            
            xyBuckets[bucketKey].push(node);
        });
        
        // For each bucket, stagger Z positions
        Object.values(xyBuckets).forEach(bucketNodes => {
            if (bucketNodes.length <= 1) return;
            
            // Sort by Z to keep relative ordering
            bucketNodes.sort((a, b) => a.z - b.z);
            
            // Calculate average z
            let avgZ = bucketNodes.reduce((sum, node) => sum + node.z, 0) / bucketNodes.length;
            
            // Stagger z positions
            bucketNodes.forEach((node, i) => {
                // Distribute nodes evenly across z, centered around average
                const zSpread = 30; // How much to spread along z-axis
                const offset = zSpread * ((i / (bucketNodes.length - 1)) - 0.5);
                node.z = avgZ + offset;
            });
        });
    }
};

// Add the enhancer to window object for global access
window.GraphLayoutEnhancer = GraphLayoutEnhancer;
