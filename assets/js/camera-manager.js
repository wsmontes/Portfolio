/**
 * Camera Manager
 * 
 * Provides specialized functions for managing the camera position
 * and ensuring all nodes are visible in the 3D graph view.
 */

const CameraManager = {
    /**
     * Fit all nodes within the camera view with optimal positioning
     * @param {Object} graph - 3D Force Graph instance
     * @param {Number} duration - Animation duration in ms
     * @param {Boolean} maintainAngle - Maintain current camera angle when adjusting
     * @returns {Object} - Camera position info
     */
    fitAllNodes: function(graph, duration = 1000, maintainAngle = false) {
        if (!graph || !graph.graphData) {
            console.warn('Cannot fit nodes: graph is not available');
            return null;
        }

        // Get graph data and current camera position
        const graphData = graph.graphData();
        const currentPos = graph.cameraPosition();
        
        // Skip if no nodes
        if (!graphData.nodes || !graphData.nodes.length === 0) {
            console.warn('Cannot fit nodes: no nodes in graph');
            return null;
        }

        // Calculate the bounding box and node metrics
        const bounds = this._calculateNodesBoundingBox(graphData.nodes);
        const metrics = this._calculateGraphMetrics(graphData.nodes);
        
        // Calculate optimal camera distance based on nodes and viewport
        const optimalDistance = this._calculateOptimalDistance(bounds, metrics);
        
        // Determine camera position
        let cameraPos;
        let lookAt;
        
        if (maintainAngle) {
            // Keep the current camera angle but adjust distance
            const currentDistance = Math.sqrt(
                currentPos.x * currentPos.x + 
                currentPos.y * currentPos.y + 
                currentPos.z * currentPos.z
            );
            
            // Scale the current position to optimal distance
            cameraPos = {
                x: currentPos.x * (optimalDistance / currentDistance),
                y: currentPos.y * (optimalDistance / currentDistance),
                z: currentPos.z * (optimalDistance / currentDistance)
            };
            
            // Look at graph center
            lookAt = {
                x: metrics.centerX,
                y: metrics.centerY,
                z: metrics.centerZ
            };
        } else {
            // Position camera at slight offset for better 3D perception
            cameraPos = {
                x: metrics.centerX + optimalDistance * 0.2,
                y: metrics.centerY + optimalDistance * 0.1,
                z: optimalDistance
            };
            
            // Look at the center of the graph
            lookAt = {
                x: metrics.centerX,
                y: metrics.centerY,
                z: metrics.centerZ
            };
        }
        
        // Move camera with animation
        graph.cameraPosition(
            cameraPos,
            lookAt,
            duration,
            // Smooth easing function
            (t) => {
                return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            }
        );
        
        // Return camera positioning info
        return {
            position: cameraPos,
            lookAt: lookAt,
            distance: optimalDistance,
            bounds: bounds,
            metrics: metrics
        };
    },
    
    /**
     * Focus on a specific node with proper distancing
     * @param {Object} graph - 3D Force Graph instance
     * @param {String|Object} nodeIdOrObject - Node ID or node object
     * @param {Number} duration - Animation duration in ms
     * @returns {Boolean} - Success status
     */
    focusOnNode: function(graph, nodeIdOrObject, duration = 1000) {
        if (!graph || !graph.graphData) return false;
        
        const nodes = graph.graphData().nodes;
        let node;
        
        // Find node by ID or use provided node object
        if (typeof nodeIdOrObject === 'string') {
            node = nodes.find(n => n.id === nodeIdOrObject);
            if (!node) {
                console.warn(`Node with ID ${nodeIdOrObject} not found`);
                return false;
            }
        } else if (nodeIdOrObject && nodeIdOrObject.id) {
            node = nodeIdOrObject;
        } else {
            console.warn('Invalid node identifier provided');
            return false;
        }
        
        // Calculate appropriate distance based on node size or importance
        const nodeImportance = this._getNodeImportance(node);
        const baseDistance = this._getBaseDistanceForScreen();
        
        // More important nodes get viewed from further away to show context
        const distance = baseDistance * (1 + nodeImportance * 0.5);
        
        // Angle slightly to show more of the 3D structure
        const offsetFactor = 0.2;
        
        // Calculate camera position
        const cameraPos = {
            x: node.x + distance * offsetFactor,
            y: node.y + distance * offsetFactor,
            z: node.z + distance
        };
        
        // Move camera with animation
        graph.cameraPosition(
            cameraPos,
            // Look at node
            {x: node.x, y: node.y, z: node.z},
            duration
        );
        
        return true;
    },
    
    /**
     * Reset camera to default home view
     * @param {Object} graph - 3D Force Graph instance
     * @param {Number} duration - Animation duration in ms
     */
    resetToHomeView: function(graph, duration = 1000) {
        this.fitAllNodes(graph, duration, false);
    },
    
    /**
     * Calculate the bounding box of all nodes
     * @param {Array} nodes - Graph nodes
     * @returns {Object} - Bounding box info
     * @private
     */
    _calculateNodesBoundingBox: function(nodes) {
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
        
        return {
            min: { x: minX, y: minY, z: minZ },
            max: { x: maxX, y: maxY, z: maxZ },
            width: maxX - minX,
            height: maxY - minY,
            depth: maxZ - minZ
        };
    },
    
    /**
     * Calculate graph metrics including weighted center
     * @param {Array} nodes - Graph nodes
     * @returns {Object} - Graph metrics
     * @private
     */
    _calculateGraphMetrics: function(nodes) {
        let totalWeight = 0;
        let weightedSumX = 0;
        let weightedSumY = 0;
        let weightedSumZ = 0;
        let maxDistance = 0;
        
        // Calculate weighted center based on node importance
        nodes.forEach(node => {
            if (node.x === undefined || node.y === undefined) return;
            
            const weight = this._getNodeImportance(node);
            
            totalWeight += weight;
            weightedSumX += node.x * weight;
            weightedSumY += node.y * weight;
            weightedSumZ += (node.z || 0) * weight;
        });
        
        // Calculate weighted center point
        const centerX = totalWeight > 0 ? weightedSumX / totalWeight : 0;
        const centerY = totalWeight > 0 ? weightedSumY / totalWeight : 0;
        const centerZ = totalWeight > 0 ? weightedSumZ / totalWeight : 0;
        
        // Calculate max distance from center (for radius calculation)
        nodes.forEach(node => {
            if (node.x === undefined || node.y === undefined) return;
            
            const dx = node.x - centerX;
            const dy = node.y - centerY;
            const dz = (node.z || 0) - centerZ;
            
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            maxDistance = Math.max(maxDistance, distance);
        });
        
        return {
            centerX,
            centerY,
            centerZ,
            maxDistance,
            radius: maxDistance * 1.1 // Add 10% padding
        };
    },
    
    /**
     * Get importance weight of a node based on its properties
     * @param {Object} node - Node object
     * @returns {Number} - Importance weight
     * @private
     */
    _getNodeImportance: function(node) {
        // Higher weight for more important nodes
        if (node.id === 'center') return 10;
        if (node.group === 'category') return 5;
        if (node.group === 'subcategory') return 3;
        
        // Use visualization size or val if available
        if (node.visualization && node.visualization.size) {
            return 1 + node.visualization.size / 10;
        }
        if (node.size) return 1 + node.size / 10;
        if (node.val) return 1 + node.val / 100;
        
        return 1; // Default weight
    },
    
    /**
     * Calculate optimal camera distance to view all nodes
     * @param {Object} bounds - Bounding box of nodes
     * @param {Object} metrics - Graph metrics
     * @returns {Number} - Optimal distance
     * @private
     */
    _calculateOptimalDistance: function(bounds, metrics) {
        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Field of view in radians (standard Three.js camera uses 45 degrees)
        const fovRadians = 45 * Math.PI / 180;
        
        // Calculate distance needed to see entire width and height
        const distanceForWidth = (bounds.width / 2) / Math.tan(fovRadians / 2);
        const distanceForHeight = (bounds.height / 2) / Math.tan(fovRadians / 2);
        
        // Use max to ensure all nodes are visible
        let distance = Math.max(distanceForWidth, distanceForHeight);
        
        // Account for aspect ratio
        const aspectRatio = viewportWidth / viewportHeight;
        if (aspectRatio < 1) {
            // Portrait: increase distance
            distance *= 1.2;
        } else if (aspectRatio > 2) {
            // Ultra-wide: slight decrease
            distance *= 0.9;
        }
        
        // Account for device size
        distance = this._adjustDistanceForScreenSize(distance);
        
        // Ensure we have a minimum viewing distance based on graph radius
        const minDistance = metrics.radius * 2.2;
        
        // Add a bit more distance to ensure all nodes are visible
        return Math.max(distance * 1.1, minDistance);
    },
    
    /**
     * Get base camera distance value based on screen size
     * @returns {Number} - Base distance
     * @private
     */
    _getBaseDistanceForScreen: function() {
        const width = window.innerWidth;
        
        if (width <= 480) return 500;       // Small mobile
        if (width <= 768) return 450;       // Mobile
        if (width <= 992) return 400;       // Tablet
        if (width <= 1200) return 350;      // Small desktop
        return 300;                         // Large desktop
    },
    
    /**
     * Adjust camera distance based on screen size
     * @param {Number} distance - Calculated distance
     * @returns {Number} - Adjusted distance
     * @private
     */
    _adjustDistanceForScreenSize: function(distance) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Smaller screens need relatively larger distance to account for touch controls
        const screenSizeFactor = Math.max(1, 1000 / Math.min(width, height));
        
        // Apply scaling with limits
        return Math.min(3000, Math.max(1000, distance * screenSizeFactor));
    },
    
    /**
     * Set up viewport change observer
     * @param {Object} graph - 3D Force Graph instance
     * @param {Function} callback - Optional callback after adjustment
     * @returns {Function} - Function to remove the observer
     */
    setupViewportObserver: function(graph, callback) {
        if (!graph) return () => {};
        
        let resizeTimer;
        let lastWidth = window.innerWidth;
        let lastHeight = window.innerHeight;
        
        const handleResize = () => {
            const currentWidth = window.innerWidth;
            const currentHeight = window.innerHeight;
            
            // Check if size changed significantly
            if (Math.abs(currentWidth - lastWidth) > 50 || 
                Math.abs(currentHeight - lastHeight) > 50) {
                
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    this.fitAllNodes(graph, 800, true);
                    
                    if (typeof callback === 'function') {
                        callback({
                            width: currentWidth,
                            height: currentHeight,
                            previousWidth: lastWidth,
                            previousHeight: lastHeight
                        });
                    }
                    
                    lastWidth = currentWidth;
                    lastHeight = currentHeight;
                }, 200);
            }
        };
        
        // Add resize listener
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', () => {
            setTimeout(handleResize, 100);
        });
        
        // Return removal function
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }
};
