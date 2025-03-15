/**
 * Graph Layout Configuration
 * Provides improved node positioning for the 3D portfolio network
 */

// Layout configuration object
const GraphLayout = {
    // Base configuration
    config: {
        // Distance multipliers for different node types
        distanceMultipliers: {
            category: 350,      // Increased from 300 for better spacing
            subcategory: 150,   // Increased from 120 for better spacing
            cluster: 100,       // Increased from 80 for better spacing
            item: 60            // Increased from 40 for better spacing
        },
        // Repulsion forces between nodes
        repulsion: {
            central: 500,
            category: 300,
            subcategory: 100,
            cluster: 80,
            item: 50
        },
        // Initial orbit positioning angles
        orbitalIncrement: {
            category: Math.PI * 0.4,     // ~72 degrees between categories
            subcategory: Math.PI * 0.5,  // 90 degrees between subcategories
            cluster: Math.PI * 0.6,      // ~108 degrees between clusters
            item: Math.PI * 0.7         // ~126 degrees between items
        },
        // Camera perspective considerations
        camera: {
            defaultDistance: 800,   // Default camera distance from center
            viewingAngle: Math.PI * 0.3,  // Typical viewing angle (radians)
            defaultViewDirection: { x: 0, y: 0, z: -1 }, // Typical view direction
            perspectiveStrength: 0.8,     // How strongly to account for perspective
            axisAvoidanceRadius: 60,      // Minimum distance from camera axis
            axisAvoidanceStrength: 0.9    // How strongly to avoid camera axis
        },
        // Initial positioning strategy
        initialPositioning: {
            spiralFactor: 1.2,           // Controls spiral spread
            verticalSpread: 0.45,        // Controls vertical distribution
            avoidCameraAxis: true,       // Specifically avoid camera axis during positioning
            minNodeDistance: 40,         // Minimum distance between any two nodes
            categorySpread: 0.9,         // How evenly to spread categories
            jitterStrength: 0.25         // Random variation to prevent perfect alignments
        }
    },

    /**
     * Initialize nodes with strategic positions
     * @param {Array} nodes - Graph nodes
     * @param {Array} links - Graph links
     * @param {Object} centerNode - The central node of the graph
     */
    initializePositions: function(nodes, links, centerNode) {
        // Get viewport scaling factor to adjust node distances based on screen size
        const viewportScaling = this._calculateViewportScaling();
        
        // Apply viewport scaling to distance multipliers
        const scaledDistances = this._getScaledDistances(viewportScaling);
        
        // Position center node at origin
        if (centerNode) {
            centerNode.fx = 0;
            centerNode.fy = 0;
            centerNode.fz = 0;
        }

        // Get parent-child relationships from links
        const childrenMap = {};
        links.forEach(link => {
            if (!childrenMap[link.source]) {
                childrenMap[link.source] = [];
            }
            childrenMap[link.source].push(link.target);
        });

        // First, position category nodes around the center
        const categoryNodes = nodes.filter(node => node.group === 'category');
        this._positionNodesInOrbit(categoryNodes, 'category', centerNode?.id, 0, scaledDistances);

        // Next, position subcategory nodes around their parent categories
        categoryNodes.forEach((categoryNode, index) => {
            const subcategoryNodes = this._getChildNodes(categoryNode.id, nodes, links, 'subcategory');
            this._positionNodesInOrbit(subcategoryNodes, 'subcategory', categoryNode.id, index, scaledDistances);
            
            // Position cluster nodes around subcategories
            subcategoryNodes.forEach((subNode, subIndex) => {
                const clusterNodes = this._getChildNodes(subNode.id, nodes, links, 'cluster');
                this._positionNodesInOrbit(clusterNodes, 'cluster', subNode.id, subIndex, scaledDistances);
                
                // Position item nodes around clusters
                clusterNodes.forEach((clusterNode, clusterIndex) => {
                    const itemNodes = this._getChildNodes(clusterNode.id, nodes, links, 'item');
                    this._positionNodesInOrbit(itemNodes, 'item', clusterNode.id, clusterIndex, scaledDistances);
                });
            });
        });
        
        // Adjust positions to ensure all nodes fit in viewport
        this._adjustPositionsToFitViewport(nodes);
        
        // Final adjustment to improve perspective visibility
        this._optimizeForCameraPerspective(nodes);
    },

    /**
     * Position nodes in an orbital pattern around a parent
     * @param {Array} nodes - Nodes to position
     * @param {String} nodeType - Type of nodes (category, subcategory, etc.)
     * @param {String} parentId - ID of parent node
     * @param {Number} parentIndex - Index of parent node (for offset)
     * @param {Object} scaledDistances - Viewport-scaled distances
     */
    _positionNodesInOrbit: function(nodes, nodeType, parentId, parentIndex, scaledDistances) {
        if (!nodes || nodes.length === 0) return;
        
        const parent = parentId ? { x: 0, y: 0, z: 0 } : null;
        const distMultiplier = scaledDistances[nodeType];
        const angleIncrement = this.config.orbitalIncrement[nodeType];
        const posConfig = this.config.initialPositioning;
        
        // Calculate a better base angle to ensure better spread around parent
        // Use a prime-based offset to avoid regular patterns
        const baseAngle = parentIndex * (Math.PI / posConfig.categorySpread) * 0.77; 
        
        // Enhanced golden angle approach for better distribution
        const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~2.4 radians
        
        // Track node positions to ensure minimum distances
        const placedPositions = [];
        
        // Sort nodes by importance or size to position more important nodes better
        const sortedNodes = [...nodes].sort((a, b) => {
            const aSize = a.visualization?.size || 1;
            const bSize = b.visualization?.size || 1;
            return bSize - aSize; // Larger nodes first
        });
        
        sortedNodes.forEach((node, i) => {
            // Start with an initial position based on fibonacci spiral
            // More predictable than pure random, but still well distributed
            const spiralAngle = baseAngle + (i * goldenAngle);
            
            // Increased variation in radius for better distribution
            // Use node index as a factor in the radius to create natural spacing
            const indexFactor = 1 + (i / (nodes.length + 1)) * posConfig.spiralFactor;
            let r = distMultiplier * indexFactor * (0.9 + posConfig.jitterStrength * Math.random());
            
            // More controlled theta to ensure even angular distribution
            const theta = spiralAngle;
            
            // Calculate vertical position with better distribution
            let verticalBias;
            if (nodeType === 'category') {
                // Categories alternate above and below with increasing height
                verticalBias = 0.3 * (i % 2 === 0 ? 1 : -1) * (1 + (i * 0.1));
            } else if (nodeType === 'subcategory') {
                // Create a three-tiered pattern for subcategories
                const tier = i % 3;
                verticalBias = (tier === 0) ? 0.4 : (tier === 1 ? 0 : -0.4);
            } else if (nodeType === 'cluster') {
                // Clusters with varied heights to prevent alignment
                verticalBias = ((i % 5) - 2) * 0.3;
            } else {
                // Items with fine-grained vertical distribution
                verticalBias = ((i % 7) - 3) * 0.2;
            }
            
            // Apply vertical bias with controlled randomness
            const phi = (Math.PI / 2) + 
                verticalBias * posConfig.verticalSpread + 
                (Math.random() - 0.5) * (Math.PI / 8);
            
            // Convert to cartesian coordinates
            let x = r * Math.sin(phi) * Math.cos(theta);
            let y = r * Math.sin(phi) * Math.sin(theta);
            let z = r * Math.cos(phi);
            
            // If avoiding camera axis and node is a category or subcategory
            if (posConfig.avoidCameraAxis && ['category', 'subcategory'].includes(nodeType)) {
                // Check if too close to z-axis (camera axis in default view)
                const xyDistance = Math.sqrt(x*x + y*y);
                if (xyDistance < posConfig.minNodeDistance) {
                    // Increase radius to move away from z-axis
                    const angleOffset = Math.random() * Math.PI * 0.5;
                    const newR = r * 1.2;
                    x = newR * Math.sin(phi) * Math.cos(theta + angleOffset);
                    y = newR * Math.sin(phi) * Math.sin(theta + angleOffset);
                }
            }
            
            // Add position jitter to break up any patterns
            const jitter = posConfig.jitterStrength;
            x += (Math.random() - 0.5) * jitter * r * 0.2;
            y += (Math.random() - 0.5) * jitter * r * 0.2;
            z += (Math.random() - 0.5) * jitter * r * 0.15;
            
            // Resolve any close overlaps with already placed nodes of the same type
            let attempts = 0;
            const maxAttempts = 5;
            let finalPos = { x, y, z };
            
            while (attempts < maxAttempts) {
                let tooClose = false;
                
                for (const pos of placedPositions) {
                    const distance = Math.sqrt(
                        Math.pow(finalPos.x - pos.x, 2) + 
                        Math.pow(finalPos.y - pos.y, 2) + 
                        Math.pow(finalPos.z - pos.z, 2)
                    );
                    
                    if (distance < posConfig.minNodeDistance) {
                        tooClose = true;
                        break;
                    }
                }
                
                if (!tooClose) break;
                
                // Adjust position by moving slightly outward and to the side
                const adjustAngle = Math.random() * Math.PI * 2;
                const adjustR = posConfig.minNodeDistance * 0.7;
                finalPos.x += Math.cos(adjustAngle) * adjustR;
                finalPos.y += Math.sin(adjustAngle) * adjustR;
                finalPos.z += (Math.random() - 0.5) * adjustR;
                
                attempts++;
            }
            
            // Set the final position
            node.x = finalPos.x;
            node.y = finalPos.y;
            node.z = finalPos.z;
            
            // Apply parent offset if parent exists
            if (parent) {
                node.x += parent.x;
                node.y += parent.y;
                node.z += parent.z;
            }
            
            // Save position for collision checking
            placedPositions.push({ x: node.x, y: node.y, z: node.z });
            
            // Set initial velocity to zero for smoother start
            node.vx = 0;
            node.vy = 0;
            node.vz = 0;
        });
        
        // Apply post-positioning checks to ensure minimum distances between all nodes
        this._ensureMinimumDistances(nodes, posConfig.minNodeDistance);
    },
    
    /**
     * Ensure minimum distances between all positioned nodes
     * @param {Array} nodes - Nodes to adjust
     * @param {Number} minDistance - Minimum distance between nodes
     */
    _ensureMinimumDistances: function(nodes, minDistance) {
        if (!nodes || nodes.length < 2) return;
        
        // Iteratively adjust positions
        const iterations = 3;
        
        for (let iter = 0; iter < iterations; iter++) {
            let adjustments = false;
            
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const node1 = nodes[i];
                    const node2 = nodes[j];
                    
                    const dx = node2.x - node1.x;
                    const dy = node2.y - node1.y;
                    const dz = node2.z - node1.z;
                    
                    const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
                    
                    if (distance < minDistance) {
                        adjustments = true;
                        
                        // Calculate repulsion vector
                        const factor = (minDistance - distance) / distance * 0.5;
                        
                        // Move nodes apart along their connecting line
                        if (!node1.fx && !node1.fy && !node1.fz) {
                            node1.x -= dx * factor;
                            node1.y -= dy * factor;
                            node1.z -= dz * factor;
                        }
                        
                        if (!node2.fx && !node2.fy && !node2.fz) {
                            node2.x += dx * factor;
                            node2.y += dy * factor;
                            node2.z += dz * factor;
                        }
                    }
                }
            }
            
            // If no adjustments were needed, break early
            if (!adjustments) break;
        }
    },

    /**
     * Calculate viewport scaling factor based on screen dimensions
     * @returns {Number} - Scaling factor for node distances
     */
    _calculateViewportScaling: function() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const minDimension = Math.min(width, height);
        const aspectRatio = width / height;
        
        // Base scaling that works well for standard screens
        let scaling = 1.0;
        
        // Adjust for different screen sizes - reduced scaling factors
        // to make nodes closer together for better visibility
        if (minDimension < 480) {
            // Small mobile devices
            scaling = 0.65;  // Reduced from 0.7
        } else if (minDimension < 768) {
            // Mobile devices
            scaling = 0.75;  // Reduced from 0.8
        } else if (minDimension < 992) {
            // Tablets
            scaling = 0.85;  // Reduced from 0.9
        } else if (minDimension < 1200) {
            // Small desktop
            scaling = 0.95;  // Reduced from 1.0
        } else {
            // Large desktop
            scaling = 1.0;   // Reduced from 1.1
        }
        
        // Adjust for aspect ratio
        if (aspectRatio < 0.8) {
            // Very tall screen - compress horizontally
            scaling *= 0.8;  // More compression (was 0.85)
        } else if (aspectRatio > 2) {
            // Very wide screen - expand horizontally
            scaling *= 1.05; // Less expansion (was 1.1)
        }
        
        return scaling;
    },
    
    /**
     * Get scaled distance multipliers based on viewport scaling
     * @param {Number} scaling - Viewport scaling factor
     * @returns {Object} - Scaled distance multipliers
     */
    _getScaledDistances: function(scaling) {
        const baseDistances = this.config.distanceMultipliers;
        const scaledDistances = {};
        
        // Apply scaling to each distance type
        Object.keys(baseDistances).forEach(key => {
            scaledDistances[key] = baseDistances[key] * scaling;
        });
        
        return scaledDistances;
    },
    
    /**
     * Adjust node positions to fit within the viewport
     * @param {Array} nodes - All nodes
     */
    _adjustPositionsToFitViewport: function(nodes) {
        if (!nodes || nodes.length === 0) return;
        
        // Calculate the bounding box of all nodes
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        
        nodes.forEach(node => {
            if (node.x !== undefined) {
                minX = Math.min(minX, node.x);
                maxX = Math.max(maxX, node.x);
            }
            if (node.y !== undefined) {
                minY = Math.min(minY, node.y);
                maxY = Math.max(maxY, node.y);
            }
            if (node.z !== undefined) {
                minZ = Math.min(minZ, node.z);
                maxZ = Math.max(maxZ, node.z);
            }
        });
        
        // Calculate the dimensions of the bounding box
        const width = maxX - minX;
        const height = maxY - minY;
        const depth = maxZ - minZ;
        
        // Get the target dimensions based on viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const aspectRatio = viewportWidth / viewportHeight;
        
        // Calculate ideal max dimensions based on viewport
        // Reduced ideal dimensions for better visibility
        const maxIdealWidth = 500 * Math.min(1.1, aspectRatio);   // Reduced from 600
        const maxIdealHeight = 400 * Math.min(1.1, 1/aspectRatio); // Reduced from 500
        
        // Calculate scaling factors if needed
        let scaleX = width > maxIdealWidth ? maxIdealWidth / width : 1;
        let scaleY = height > maxIdealHeight ? maxIdealHeight / height : 1;
        
        // Use the more constraining scale
        const scale = Math.min(scaleX, scaleY);
        
        // Always apply some scaling to ensure nodes are compact enough
        const finalScale = Math.min(scale, 0.95);
        
        // Apply scaling to all nodes
        nodes.forEach(node => {
            if (node.fx !== undefined && node.fy !== undefined) return; // Skip fixed nodes
            
            node.x *= finalScale;
            node.y *= finalScale;
            // Don't scale z as much to maintain depth perception
            node.z = node.z * (finalScale * 0.7 + 0.3);
        });
    },

    /**
     * Optimize node positions for better visibility from camera perspective
     * @param {Array} nodes - All nodes
     */
    _optimizeForCameraPerspective: function(nodes) {
        if (!nodes || nodes.length === 0) return;
        
        const camera = this.config.camera;
        const viewDir = camera.defaultViewDirection;
        const axisAvoidanceRadius = camera.axisAvoidanceRadius;
        const axisAvoidanceStrength = camera.axisAvoidanceStrength;
        
        // Calculate a plane perpendicular to the view direction
        // This helps distribute nodes more evenly in the visible space
        const viewPlaneNormal = {
            x: viewDir.x,
            y: viewDir.y,
            z: viewDir.z
        };
        
        // Calculate dot product of each node position with view direction
        // to understand which nodes might be obscured
        const nodeVisibility = {};
        nodes.forEach(node => {
            // Skip the central node (center node)
            if (node.group === 'center') {
                nodeVisibility[node.id] = { node, viewDot: -Infinity, axisDistance: Infinity };
                return;
            }
            
            const viewDot = (node.x * viewPlaneNormal.x) + 
                           (node.y * viewPlaneNormal.y) + 
                           (node.z * viewPlaneNormal.z);
            
            // Calculate distance from camera axis
            // Project node onto view plane and measure distance from origin
            const projectedX = node.x - (viewDot * viewPlaneNormal.x);
            const projectedY = node.y - (viewDot * viewPlaneNormal.y);
            const projectedZ = node.z - (viewDot * viewPlaneNormal.z);
            
            // Distance from the axis (in the projected plane)
            const axisDistance = Math.sqrt(
                Math.pow(projectedX, 2) + 
                Math.pow(projectedY, 2) + 
                Math.pow(projectedZ, 2)
            );
            
            nodeVisibility[node.id] = { node, viewDot, axisDistance };
        });
        
        // Sort nodes by group and dot product to find potential occlusions
        const sortedByVisibility = Object.values(nodeVisibility)
            .sort((a, b) => a.viewDot - b.viewDot);
        
        // First pass: Move nodes away from camera axis
        // Nodes should be at least axisAvoidanceRadius distance from the axis
        Object.values(nodeVisibility).forEach(item => {
            const node = item.node;
            
            // Skip fixed nodes and center node
            if ((node.fx !== undefined && node.fy !== undefined) || node.group === 'center') return;
            
            // If node is too close to the camera axis, move it outward
            if (item.axisDistance < axisAvoidanceRadius) {
                // Calculate desired distance
                const distanceShortfall = axisAvoidanceRadius - item.axisDistance;
                const adjustmentStrength = axisAvoidanceStrength * (1 - (item.axisDistance / axisAvoidanceRadius));
                
                // Create a vector from the origin to the projected point (direction away from axis)
                let dirX = 0, dirY = 0, dirZ = 0;
                
                if (item.axisDistance > 0.01) {  // Avoid division by zero
                    // Direction from axis to projected point
                    const projectedX = node.x - (item.viewDot * viewPlaneNormal.x);
                    const projectedY = node.y - (item.viewDot * viewPlaneNormal.y);
                    const projectedZ = node.z - (item.viewDot * viewPlaneNormal.z);
                    
                    // Normalize the direction vector
                    dirX = projectedX / item.axisDistance;
                    dirY = projectedY / item.axisDistance;
                    dirZ = projectedZ / item.axisDistance;
                } else {
                    // If too close to axis, pick a random direction
                    const randomAngle = Math.random() * Math.PI * 2;
                    dirX = Math.cos(randomAngle);
                    dirY = Math.sin(randomAngle);
                    // Slight z variation for 3D effect
                    dirZ = (Math.random() - 0.5) * 0.2;
                }
                
                // Move the node outward from the axis
                node.x += dirX * distanceShortfall * adjustmentStrength;
                node.y += dirY * distanceShortfall * adjustmentStrength;
                node.z += dirZ * distanceShortfall * adjustmentStrength;
            }
        });
        
        // Second pass: Adjust node positions to reduce occlusion
        // Start with nodes most likely to be occluded (highest dot product)
        sortedByVisibility.forEach((item, index) => {
            const node = item.node;
            
            // Skip fixed nodes and center node
            if ((node.fx !== undefined && node.fy !== undefined) || node.group === 'center') return;
            
            // Get node group for appropriate adjustments
            const group = node.group || 'unknown';
            
            // Calculate adjustment factor based on node visibility and group
            const adjustFactor = camera.perspectiveStrength * 
                (1 - (index / sortedByVisibility.length));  // More adjustment for occluded nodes
            
            // Add horizontal spread based on node index and group
            // This helps prevent nodes in similar depths from aligning
            // Use angles that aren't multiples of 30° to avoid aligning with other nodes
            const spreadAngle = ((index % 13) * 0.483) + (Math.random() * 0.2);
            const spreadRadius = adjustFactor * (
                group === 'category' ? 30 :
                group === 'subcategory' ? 25 :
                group === 'cluster' ? 20 : 15
            );
            
            // Apply a subtle spread in the XY plane (perpendicular to main view)
            // Use sine/cosine but add random variation to avoid perfect circles
            const randomOffset = Math.random() * 0.2 + 0.9; // 0.9 to 1.1
            node.x += Math.cos(spreadAngle * Math.PI * 2) * spreadRadius * randomOffset;
            node.y += Math.sin(spreadAngle * Math.PI * 2) * spreadRadius * randomOffset;
            
            // Adjust Z position (depth) to create more separation
            // Apply a slight random offset to Z to break any potential patterns
            node.z += (Math.random() - 0.5) * 10 * adjustFactor;
            
            // Check for close neighbors after adjustments
            if (index > 0) {
                for (let i = 0; i < index; i++) {
                    const otherItem = sortedByVisibility[i];
                    const otherNode = otherItem.node;
                    const distance = Math.sqrt(
                        Math.pow(node.x - otherNode.x, 2) +
                        Math.pow(node.y - otherNode.y, 2) +
                        Math.pow(node.z - otherNode.z, 2)
                    );
                    
                    // If nodes are too close, add additional separation
                    if (distance < 25) {
                        // Add repulsion vector away from the other node
                        const repulsionStrength = (25 - distance) * 0.5;
                        const dx = node.x - otherNode.x;
                        const dy = node.y - otherNode.y;
                        const dz = node.z - otherNode.z;
                        
                        // Normalize and apply repulsion
                        if (distance > 0.1) {  // Avoid division by zero
                            node.x += (dx / distance) * repulsionStrength;
                            node.y += (dy / distance) * repulsionStrength;
                            node.z += (dz / distance) * repulsionStrength;
                        }
                    }
                }
            }
        });
        
        // Final pass: Ensure no nodes are directly behind the central node from camera perspective
        if (camera.defaultViewDirection.z < 0) {  // If looking in negative Z direction
            const centralNode = nodes.find(node => node.group === 'center');
            if (centralNode) {
                nodes.forEach(node => {
                    if (node.group === 'center' || (node.fx !== undefined && node.fy !== undefined)) return;
                    
                    // Check if node is close to central node in XY plane but behind it
                    const dxFromCenter = node.x - centralNode.x;
                    const dyFromCenter = node.y - centralNode.y;
                    const dzFromCenter = node.z - centralNode.z;
                    
                    // Distance in XY plane
                    const xyDistance = Math.sqrt(dxFromCenter*dxFromCenter + dyFromCenter*dyFromCenter);
                    
                    // If node is behind center and within a cone, move it to the side
                    if (dzFromCenter > 20 && xyDistance < dzFromCenter * 0.5) {
                        // Move node sideways out of the occlusion cone
                        const angle = Math.atan2(dyFromCenter, dxFromCenter) + (Math.PI / 4) * (Math.random() > 0.5 ? 1 : -1);
                        const newDistance = Math.max(xyDistance, dzFromCenter * 0.6);
                        
                        node.x = centralNode.x + Math.cos(angle) * newDistance;
                        node.y = centralNode.y + Math.sin(angle) * newDistance;
                        
                        // Add slight z variation
                        node.z += (Math.random() - 0.5) * 15;
                    }
                });
            }
        }
    },

    /**
     * Get child nodes of a specific node
     * @param {String} parentId - Parent node ID
     * @param {Array} nodes - All nodes
     * @param {Array} links - All links
     * @param {String} groupType - Group type to filter by
     * @returns {Array} - Child nodes
     */
    _getChildNodes: function(parentId, nodes, links, groupType) {
        // Get IDs of child nodes
        const childIds = links
            .filter(link => link.source === parentId || 
                  (link.source.id && link.source.id === parentId))
            .map(link => link.target.id || link.target);
        
        // Filter nodes by child IDs and group type
        return nodes.filter(node => 
            childIds.includes(node.id) && 
            (!groupType || node.group === groupType)
        );
    },

    /**
     * Configure custom force simulation parameters
     * @param {Object} forceGraph - 3D Force Graph instance
     */
    applyForceConfiguration: function(forceGraph) {
        if (!forceGraph || !forceGraph.d3Force) return;

        // Get viewport info for adaptive force parameters
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isSmallScreen = width < 768;
        const isTinyScreen = width < 480;

        // Configure repulsion (charge) force
        forceGraph.d3Force('charge').strength(node => {
            const baseCharge = isTinyScreen ? -40 : (isSmallScreen ? -50 : -60);
            const nodeTypeMultiplier = this.config.repulsion[node.group] || 1;
            const sizeFactor = node.size || node.visualization?.size || 1;
            return baseCharge * nodeTypeMultiplier * sizeFactor;
        });

        // Custom link force for better category spacing
        forceGraph.d3Force('link').distance(link => {
            const sourceNode = typeof link.source === 'object' ? link.source : { group: 'unknown' };
            const targetNode = typeof link.target === 'object' ? link.target : { group: 'unknown' };
            
            const sourceSize = sourceNode.visualization?.size || 1;
            const targetSize = targetNode.visualization?.size || 1;
            
            // Increased base distance for better spacing
            let distance = 40 + (sourceSize + targetSize) * (isSmallScreen ? 2.2 : 3.5);
            
            // Adjust based on node groups with screen size awareness
            if (sourceNode.group === 'category' || targetNode.group === 'category') {
                distance *= isSmallScreen ? 2.8 : 3.2; // More space for category connections
            } else if (sourceNode.group === 'subcategory' || targetNode.group === 'subcategory') {
                distance *= isSmallScreen ? 2.0 : 2.3; // More space for subcategory connections
            }
            
            return distance;
        });

        // Enhanced collision force to prevent overlap with perspective consideration
        forceGraph.d3Force('collision', d3.forceCollide().radius(node => {
            // Increased radius based on node size with padding
            const basePadding = isSmallScreen ? 1.5 : 2.0;
            
            // Differentiate collision radius by node type for better layering
            let typeMultiplier = 1.0;
            if (node.group === 'category') typeMultiplier = 1.2;
            else if (node.group === 'subcategory') typeMultiplier = 1.1;
            else if (node.group === 'cluster') typeMultiplier = 1.0;
            else typeMultiplier = 0.9;
            
            return (node.visualization?.size || 3) * basePadding * typeMultiplier;
        }).strength(isSmallScreen ? 0.95 : 0.9).iterations(3)); // More iterations for better collision detection

        // Add radial force to maintain some structure - Fixed Z method issue
        const radialForce = d3.forceRadial(node => {
            // Scale radial distances based on screen size
            const screenScaleFactor = isSmallScreen ? 0.85 : 1.1;
            
            if (node.group === 'center') return 0;
            if (node.group === 'category') return 270 * screenScaleFactor;
            if (node.group === 'subcategory') return 370 * screenScaleFactor;
            if (node.group === 'cluster') return 420 * screenScaleFactor;
            return 470 * screenScaleFactor;
        }).strength(isSmallScreen ? 0.18 : 0.12).x(0).y(0);
        
        // Apply the radial force to the graph
        forceGraph.d3Force('radial', radialForce);
        
        // Add a weak centering force for X and Y axes
        if (!forceGraph.d3Force('centerX')) {
            forceGraph.d3Force('centerX', d3.forceX(0).strength(0.02));
        }
        
        if (!forceGraph.d3Force('centerY')) {
            forceGraph.d3Force('centerY', d3.forceY(0).strength(0.02));
        }
        
        // Add a z-centering force for 3D space - with improved strength
        if (!forceGraph.d3Force('centerZ')) {
            forceGraph.d3Force('centerZ', d3.forceZ ? d3.forceZ(0).strength(0.03) : null);
        }
    },
    
    /**
     * Update forces when viewport changes
     * @param {Object} forceGraph - 3D Force Graph instance
     */
    updateForces: function(forceGraph) {
        this.applyForceConfiguration(forceGraph);
    },
    
    /**
     * Handle viewport resize events
     * @param {Object} forceGraph - 3D Force Graph instance 
     * @param {Array} nodes - Graph nodes
     * @param {Array} links - Graph links
     */
    handleResize: function(forceGraph, nodes, links) {
        if (!forceGraph || !nodes) return;
        
        // Update forces for new viewport size
        this.updateForces(forceGraph);
        
        // Re-center the graph
        this._adjustPositionsToFitViewport(nodes);
        
        // Re-optimize for camera perspective
        this._optimizeForCameraPerspective(nodes);
        
        // Update the graph
        forceGraph.graphData({nodes, links});
    }
};
