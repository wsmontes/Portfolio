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
            category: 300,      // Main categories distance from center
            subcategory: 120,   // Subcategories distance from their parent
            cluster: 80,        // Clusters distance from their parent
            item: 40           // Items distance from their parent
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
        const parent = parentId ? { x: 0, y: 0, z: 0 } : null;
        const distMultiplier = scaledDistances[nodeType];
        const angleIncrement = this.config.orbitalIncrement[nodeType];
        
        // More even distribution around the orbit
        const baseAngle = parentIndex * (Math.PI / Math.max(3, Math.sqrt(nodes.length))); 

        nodes.forEach((node, i) => {
            // Calculate angle for this node with better distribution
            const angle = baseAngle + (i * angleIncrement);
            
            // Use golden angle for more even distribution when there are many nodes
            const goldenAngle = i * 2.39996; // Close to golden angle in radians
            const finalAngle = nodes.length > 3 ? goldenAngle : angle;
            
            // Calculate 3D spherical coordinates with controlled randomness
            const variationFactor = 0.15; // Reduced randomness for more predictable layout
            const r = distMultiplier * (1 + variationFactor * Math.random()); 
            const theta = finalAngle;
            
            // Reduce vertical variation for better visibility
            const phi = Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 8);
            
            // Convert spherical to cartesian coordinates
            node.x = r * Math.sin(phi) * Math.cos(theta);
            node.y = r * Math.sin(phi) * Math.sin(theta);
            node.z = r * Math.cos(phi);
            
            // Apply parent offset if parent exists
            if (parent) {
                node.x += parent.x;
                node.y += parent.y;
                node.z += parent.z;
            }
            
            // Set initial velocity to zero for smoother start
            node.vx = 0;
            node.vy = 0;
            node.vz = 0;
        });
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
            const baseCharge = isTinyScreen ? -30 : (isSmallScreen ? -40 : -50);
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
            
            // Base distance based on node sizes
            let distance = 30 + (sourceSize + targetSize) * (isSmallScreen ? 2 : 3);
            
            // Adjust based on node groups with screen size awareness
            if (sourceNode.group === 'category' || targetNode.group === 'category') {
                distance *= isSmallScreen ? 2.5 : 3; // More space for category connections
            } else if (sourceNode.group === 'subcategory' || targetNode.group === 'subcategory') {
                distance *= isSmallScreen ? 1.7 : 2; // More space for subcategory connections
            }
            
            return distance;
        });

        // Add collision force to prevent overlap
        forceGraph.d3Force('collision', d3.forceCollide().radius(node => {
            // Radius based on node size with padding
            const basePadding = isSmallScreen ? 1.2 : 1.5;
            return (node.visualization?.size || 3) * basePadding;
        }).strength(isSmallScreen ? 0.9 : 0.8));

        // Add radial force to maintain some structure - FIX: Remove z() method which doesn't exist
        const radialForce = d3.forceRadial(node => {
            // Scale radial distances based on screen size
            const screenScaleFactor = isSmallScreen ? 0.8 : 1;
            
            if (node.group === 'center') return 0;
            if (node.group === 'category') return 250 * screenScaleFactor;
            if (node.group === 'subcategory') return 350 * screenScaleFactor;
            if (node.group === 'cluster') return 400 * screenScaleFactor;
            return 450 * screenScaleFactor;
        }).strength(isSmallScreen ? 0.15 : 0.1).x(0).y(0);
        
        // Apply the radial force to the graph
        forceGraph.d3Force('radial', radialForce);
        
        // Add a weak centering force for X and Y axes
        if (!forceGraph.d3Force('centerX')) {
            forceGraph.d3Force('centerX', d3.forceX(0).strength(0.01));
        }
        
        if (!forceGraph.d3Force('centerY')) {
            forceGraph.d3Force('centerY', d3.forceY(0).strength(0.01));
        }
        
        // Add a z-centering force for 3D space
        if (!forceGraph.d3Force('centerZ')) {
            forceGraph.d3Force('centerZ', d3.forceZ ? d3.forceZ(0).strength(0.01) : null);
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
        
        // Update the graph
        forceGraph.graphData({nodes, links});
    }
};
