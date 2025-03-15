/**
 * Camera Manager
 * 
 * Provides specialized functions for managing the camera position
 * and ensuring all nodes are visible in the 3D graph view.
 */

const CameraManager = {
    // Configuration settings
    config: {
        // Default animation durations in milliseconds
        durations: {
            fitAll: 1000,
            focusNode: 800,
            resetView: 600,
            resize: 800,
            autoAdjust: 400  // Reduced from 600 to 400 for faster adjustments
        },
        
        // Distance factors for different node types
        distanceFactors: {
            center: 1.2,
            category: 1.0,
            subcategory: 0.8,
            item: 0.7
        },
        
        // Minimum distances to prevent being too close
        minDistances: {
            default: 150,  // Reduced from 180 to use more screen space
            mobile: 220,   // Reduced from 250
            tablet: 180    // Reduced from 220
        },
        
        // Real-time checker configuration
        realTimeChecker: {
            enabled: false,
            checkInterval: 800,    // Reduced from 1000ms to 800ms for faster checks
            overlapThreshold: 0.6, // Reduced from 0.7 to detect overlaps earlier
            offScreenThreshold: 0.15, // Reduced from 0.2 to trigger adjustment earlier
            adjustmentCooldown: 1500, // Reduced from 3000ms to 1500ms to allow more frequent adjustments
            maxConsecutiveAdjustments: 4, // Increased from 3 to allow more adjustment attempts
        },
        
        // Debug mode to show camera position info
        debug: false
    },
    
    // Internal state for real-time checker
    _checkerState: {
        intervalId: null,
        lastAdjustmentTime: 0,
        consecutiveAdjustments: 0,
        adjustmentInProgress: false
    },
    
    /**
     * Fit all nodes within the camera view with optimal positioning
     * @param {Object} graph - 3D Force Graph instance
     * @param {Number} duration - Animation duration in ms
     * @param {Boolean} maintainAngle - Maintain current camera angle when adjusting
     * @param {Boolean} immediate - If true, skip animation and adjust immediately
     * @returns {Object} - Camera position info
     */
    fitAllNodes: function(graph, duration = this.config.durations.fitAll, maintainAngle = false, immediate = false) {
        if (!graph || !graph.graphData) {
            console.warn("Invalid graph object provided to fitAllNodes");
            return false;
        }

        // Get the actual graph data from the graph object
        const graphData = graph.graphData();
        if (!graphData.nodes || graphData.nodes.length === 0) {
            console.warn("No nodes in graph data");
            return false;
        }

        // Get current camera position for angle preservation
        const currentPos = graph.cameraPosition();
        
        // Calculate the bounding box and node metrics
        const bounds = this._calculateNodesBoundingBox(graphData.nodes);
        const metrics = this._calculateGraphMetrics(graphData.nodes);
        
        // Calculate optimal camera distance based on nodes and viewport
        const optimalDistance = this._calculateOptimalDistance(bounds, metrics);
        
        // Get viewport dimensions for better positioning
        const width = window.innerWidth;
        const height = window.innerHeight;
        const aspectRatio = width / height;
        
        // Determine camera position
        let cameraPos;
        let lookAt;
        
        if (maintainAngle) {
            // Keep current angle but adjust distance
            const currentDistance = Math.sqrt(
                currentPos.x * currentPos.x + 
                currentPos.y * currentPos.y + 
                currentPos.z * currentPos.z
            );
            
            // Maintain direction but adjust distance
            const ratio = optimalDistance / currentDistance;
            cameraPos = {
                x: currentPos.x * ratio,
                y: currentPos.y * ratio,
                z: currentPos.z * ratio
            };
            
            // Look at center of graph or current lookAt
            lookAt = currentPos.lookAt || { x: metrics.centerX, y: metrics.centerY, z: metrics.centerZ };
        } else {
            // Position camera to view from a standard angle
            // Slightly offset from direct z-axis for better perspective
            // Adjust offset based on screen aspect ratio
            const xOffset = aspectRatio > 1.5 ? 0.25 : 0.2;
            const yOffset = aspectRatio < 0.8 ? 0.25 : 0.2;
            
            cameraPos = {
                x: metrics.centerX * xOffset,  // X offset for perspective
                y: metrics.centerY * yOffset,  // Y offset for perspective
                z: optimalDistance
            };
            
            // Look at center of graph
            lookAt = { 
                x: metrics.centerX, 
                y: metrics.centerY, 
                z: metrics.centerZ 
            };
        }

        // Check if camera distance is excessively large or small and adjust if necessary
        const minDistance = this._getMinDistanceForScreenSize();
        const maxDistance = minDistance * 5;
        
        if (cameraPos.z < minDistance) {
            const ratio = minDistance / cameraPos.z;
            cameraPos.x *= ratio;
            cameraPos.y *= ratio;
            cameraPos.z = minDistance;
        } else if (cameraPos.z > maxDistance) {
            const ratio = maxDistance / cameraPos.z;
            cameraPos.x *= ratio;
            cameraPos.y *= ratio;
            cameraPos.z = maxDistance;
        }
        
        // Use different approach based on immediate flag
        if (immediate) {
            // Apply camera position immediately without animation
            graph.cameraPosition(cameraPos, lookAt, 0);
            
            if (this.config.debug) {
                console.log("View has been suboptimal for too long, auto-adjusting position");
                console.log("Camera positioned immediately at:", cameraPos, "looking at:", lookAt);
            }
        } else {
            // Apply the camera position with appropriate easing
            graph.cameraPosition(
                cameraPos,
                lookAt,
                duration,
                // Smooth easing function for better experience
                (t) => {
                    // Enhanced cubic easing: smooth start and end
                    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
                }
            );
            
            if (this.config.debug) {
                console.log("Camera positioned at:", cameraPos, "looking at:", lookAt, 
                            "distance:", optimalDistance, "screen:", width, "x", height);
            }
        }
        
        return true;
    },
    
    /**
     * Focus on a specific node with proper distancing
     * @param {Object} graph - 3D Force Graph instance
     * @param {String|Object} nodeIdOrObject - Node ID or node object
     * @param {Number} duration - Animation duration in ms
     * @param {Object} options - Additional options for focusing
     * @returns {Boolean} - Success status
     */
    focusOnNode: function(graph, nodeIdOrObject, duration = this.config.durations.focusNode, options = {}) {
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
        
        // Get node type-specific distance factor
        const distanceFactor = this._getNodeDistanceFactor(node);
        
        // Calculate appropriate distance based on node size or importance
        const nodeImportance = this._getNodeImportance(node);
        const baseDistance = this._getBaseDistanceForScreen();
        
        // More important nodes get viewed from further away to show context
        const distance = baseDistance * distanceFactor * (1 + nodeImportance * 0.3);
        
        // Determine offset based on options or default
        const offsetFactor = options.offset || 0.2;
        
        // Calculate camera position with offset
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
            duration,
            // Cubic easing for smoother animation
            (t) => t < 0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2, 3)/2
        );
        
        // Log debug info if enabled
        if (this.config.debug) {
            console.log(`Camera focused on node ${node.id} at distance ${distance}`);
        }
        
        return true;
    },
    
    /**
     * Reset camera to default home view
     * @param {Object} graph - 3D Force Graph instance
     * @param {Number} duration - Animation duration in ms
     * @returns {Object} - Camera position info
     */
    resetToHomeView: function(graph, duration = this.config.durations.resetView) {
        return this.fitAllNodes(graph, duration, false);
    },
    
    /**
     * Get node distance factor based on node type
     * @param {Object} node - Node object
     * @returns {Number} - Distance factor
     * @private
     */
    _getNodeDistanceFactor: function(node) {
        if (node.id === 'center') return this.config.distanceFactors.center;
        if (node.group === 'category') return this.config.distanceFactors.category;
        if (node.group === 'subcategory') return this.config.distanceFactors.subcategory;
        if (node.group === 'item') return this.config.distanceFactors.item;
        return 1.0; // Default factor
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
            depth: maxZ - minZ,
            center: {
                x: (minX + maxX) / 2,
                y: (minY + maxY) / 2,
                z: (minZ + maxZ) / 2
            }
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
        const width = window.innerWidth;
        const height = window.innerHeight;
        const aspectRatio = width / height;
        
        // Calculate the bounds size
        const boundsWidth = bounds.max.x - bounds.min.x;
        const boundsHeight = bounds.max.y - bounds.min.y;
        const boundsDepth = bounds.max.z - bounds.min.z;
        
        // Calculate the diagonal size of the bounding box for base calculation
        const boundsDiagonal = Math.sqrt(
            boundsWidth * boundsWidth + 
            boundsHeight * boundsHeight + 
            boundsDepth * boundsDepth
        );
        
        // Get base distance adjusted for screen size
        const baseDistance = this._getBaseDistanceForScreen();
        
        // Calculate optimal distance based on bounds and screen ratio
        // Use a more aggressive scaling factor to fill more screen space
        let optimalDistance = baseDistance * 0.85; // Reduced by 15% to use more screen space
        
        // Adjust for bounds size - larger bounds need more distance
        if (boundsDiagonal > 0) {
            // Changed from 1 + (boundsDiagonal / 500) to use a more aggressive scaling
            optimalDistance = baseDistance * (0.9 + (boundsDiagonal / 600));
        }
        
        // Adjust for aspect ratio
        if (aspectRatio > 1.5) {  // Landscape/wide screen
            optimalDistance *= 0.85;  // More aggressive reduction (was 0.9)
        } else if (aspectRatio < 0.8) {  // Portrait/tall screen
            optimalDistance *= 1.05;  // Less increase (was 1.1)
        }
        
        // Apply node importance factor
        const importanceFactor = metrics.importanceFactor || 1;
        optimalDistance *= importanceFactor;
        
        // Ensure minimum distance based on screen size
        const minDistance = this._getMinDistanceForScreenSize();
        optimalDistance = Math.max(optimalDistance, minDistance);
        
        // Adapt to mobile device constraints
        optimalDistance = this._adjustDistanceForScreenSize(optimalDistance);
        
        return optimalDistance;
    },
    
    /**
     * Get minimum distance based on screen size
     * @returns {Number} - Minimum distance
     * @private
     */
    _getMinDistanceForScreenSize: function() {
        const width = window.innerWidth;
        
        if (width <= 480) return this.config.minDistances.mobile; // Mobile
        if (width <= 992) return this.config.minDistances.tablet; // Tablet
        return this.config.minDistances.default; // Desktop
    },
    
    /**
     * Get base camera distance value based on screen size
     * @returns {Number} - Base distance
     * @private
     */
    _getBaseDistanceForScreen: function() {
        const width = window.innerWidth;
        
        if (width <= 480) return 450;       // Small mobile (was 500)
        if (width <= 768) return 400;       // Mobile (was 450)
        if (width <= 992) return 350;       // Tablet (was 400)
        if (width <= 1200) return 300;      // Small desktop (was 350)
        return 270;                         // Large desktop (was 300)
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
        // but we want to use more of the available screen space
        const screenSizeFactor = Math.max(0.9, 900 / Math.min(width, height)); // Reduced from 1000 to 900
        
        // Apply scaling with lower limits to use more screen space
        return Math.min(2500, Math.max(900, distance * screenSizeFactor));
    },
    
    /**
     * Check if current camera position provides good view of all nodes
     * @param {Object} graph - 3D Force Graph instance
     * @returns {Boolean} - True if view needs adjustment
     */
    needsViewAdjustment: function(graph) {
        if (!graph || !graph.graphData) return false;
        
        const graphData = graph.graphData();
        if (!graphData.nodes || graphData.nodes.length === 0) return false;
        
        // Get current camera position and view parameters
        const currentCameraPos = graph.cameraPosition();
        const cameraDistance = Math.sqrt(
            currentCameraPos.x * currentCameraPos.x + 
            currentCameraPos.y * currentCameraPos.y + 
            currentCameraPos.z * currentCameraPos.z
        );
        
        // Calculate metrics and optimal distance
        const bounds = this._calculateNodesBoundingBox(graphData.nodes);
        const metrics = this._calculateGraphMetrics(graphData.nodes);
        const optimalDistance = this._calculateOptimalDistance(bounds, metrics);
        
        // Check if camera is too close or too far from optimal
        const distanceRatio = cameraDistance / optimalDistance;
        if (distanceRatio < 0.5 || distanceRatio > 1.8) {
            return true;
        }
        
        // If camera position is too far from center line
        const offsetFromCenterLine = Math.sqrt(
            currentCameraPos.x * currentCameraPos.x + 
            currentCameraPos.y * currentCameraPos.y
        );
        
        // Too far from central view
        if (offsetFromCenterLine > optimalDistance * 0.4) {
            return true;
        }
        
        return false;
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
                    const result = this.fitAllNodes(graph, this.config.durations.resize, true);
                    
                    if (typeof callback === 'function') {
                        callback({
                            width: currentWidth,
                            height: currentHeight,
                            previousWidth: lastWidth,
                            previousHeight: lastHeight,
                            cameraResult: result
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
    },
    
    /**
     * Set debugging mode
     * @param {Boolean} enabled - Whether to enable debugging
     */
    setDebugMode: function(enabled) {
        this.config.debug = !!enabled;
        
        if (this.config.debug) {
            console.log('Camera Manager debug mode enabled');
        }
    },
    
    /**
     * Start real-time checking for node visibility issues
     * @param {Object} graph - 3D Force Graph instance
     * @param {Object} options - Override default checker options
     * @returns {Boolean} - Whether checker was started
     */
    startRealTimeChecker: function(graph, options = {}) {
        if (!graph || this._checkerState.intervalId) return false;
        
        // Apply custom options if provided
        if (options) {
            Object.assign(this.config.realTimeChecker, options);
        }
        
        // Set checker as enabled
        this.config.realTimeChecker.enabled = true;
        
        // Reset state
        this._checkerState.lastAdjustmentTime = 0;
        this._checkerState.consecutiveAdjustments = 0;
        
        // Start interval checks
        this._checkerState.intervalId = setInterval(() => {
            this._performRealTimeCheck(graph);
        }, this.config.realTimeChecker.checkInterval);
        
        if (this.config.debug) {
            console.log('Started real-time camera checker with interval:', 
                this.config.realTimeChecker.checkInterval);
        }
        
        return true;
    },
    
    /**
     * Stop real-time checking
     * @returns {Boolean} - Whether checker was stopped
     */
    stopRealTimeChecker: function() {
        if (!this._checkerState.intervalId) return false;
        
        clearInterval(this._checkerState.intervalId);
        this._checkerState.intervalId = null;
        this.config.realTimeChecker.enabled = false;
        
        if (this.config.debug) {
            console.log('Stopped real-time camera checker');
        }
        
        return true;
    },
    
    /**
     * Perform real-time check for visibility issues
     * @param {Object} graph - 3D Force Graph instance
     * @private
     */
    _performRealTimeCheck: function(graph) {
        if (!graph || !graph.graphData || this._checkerState.adjustmentInProgress) return;
        
        const currentTime = Date.now();
        
        // Check for cooldown period
        if (currentTime - this._checkerState.lastAdjustmentTime < 
            this.config.realTimeChecker.adjustmentCooldown) {
            return;
        }
        
        const graphData = graph.graphData();
        if (!graphData.nodes || graphData.nodes.length < 2) return;
        
        // Get current camera info
        const currentCameraPos = graph.cameraPosition();
        
        // Check for nodes outside visible screen
        const offScreenResult = this._checkNodesOffScreen(graph, graphData);
        
        // Check for node overlap
        const overlapResult = this._checkNodeOverlap(graph, graphData);
        
        // Apply camera adjustments if needed
        if (offScreenResult.needsAdjustment) {
            this._adjustForOffScreenNodes(graph, offScreenResult);
            return;
        }
        
        if (overlapResult.needsAdjustment) {
            this._adjustForNodeOverlap(graph, overlapResult);
            return;
        }
    },
    
    /**
     * Check if nodes are overlapping in the current view
     * @param {Object} graph - 3D Force Graph instance
     * @param {Object} graphData - Current graph data
     * @returns {Object} - Assessment result
     * @private
     */
    _checkNodeOverlap: function(graph, graphData) {
        const renderer = graph.renderer();
        if (!renderer) return { needsAdjustment: false };
        
        const camera = renderer.camera();
        const nodes = graphData.nodes;
        
        // Track significant overlaps
        let overlappingPairs = [];
        
        // Convert 3D positions to 2D screen positions
        const screenPositions = nodes.map(node => {
            if (node.x === undefined) return null;
            
            // Create a 3D vector for the node position
            const vector = new THREE.Vector3(node.x, node.y, node.z || 0);
            
            // Project to screen coordinates
            vector.project(camera);
            
            // Calculate screen coordinates
            const x = (vector.x + 1) * window.innerWidth / 2;
            const y = (-vector.y + 1) * window.innerHeight / 2;
            
            // Estimate screen size based on node properties
            const size = (node.val || 1) * (node.size || 1) * 5; 
            
            return {
                id: node.id,
                x,
                y,
                size,
                node
            };
        }).filter(pos => pos !== null);
        
        // Check each node pair for overlap
        for (let i = 0; i < screenPositions.length; i++) {
            const posA = screenPositions[i];
            
            for (let j = i + 1; j < screenPositions.length; j++) {
                const posB = screenPositions[j];
                
                // Calculate distance between nodes on screen
                const dx = posA.x - posB.x;
                const dy = posA.y - posB.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Determine combined size
                const combinedSize = posA.size + posB.size;
                
                // Calculate overlap percentage
                const overlap = combinedSize > 0 ? 
                    Math.max(0, 1 - (distance / combinedSize)) : 0;
                
                // If overlap exceeds threshold, record it
                if (overlap > this.config.realTimeChecker.overlapThreshold) {
                    overlappingPairs.push({
                        nodeA: posA.node,
                        nodeB: posB.node,
                        overlap
                    });
                }
            }
        }
        
        // Need adjustment if we have significant overlaps
        const needsAdjustment = overlappingPairs.length > 0;
        
        if (this.config.debug && needsAdjustment) {
            console.log(`Found ${overlappingPairs.length} overlapping node pairs`);
        }
        
        return {
            needsAdjustment,
            overlappingPairs,
            screenPositions
        };
    },
    
    /**
     * Check if nodes are outside the visible screen
     * @param {Object} graph - 3D Force Graph instance
     * @param {Object} graphData - Current graph data
     * @returns {Object} - Assessment result
     * @private
     */
    _checkNodesOffScreen: function(graph, graphData) {
        const renderer = graph.renderer();
        if (!renderer) return { needsAdjustment: false };
        
        const camera = renderer.camera();
        const nodes = graphData.nodes;
        
        // Track nodes that are off screen
        let offScreenNodes = [];
        let onScreenNodes = [];
        
        // Convert 3D positions to normalized device coordinates (-1 to 1 range)
        nodes.forEach(node => {
            if (node.x === undefined) return;
            
            // Create vector for node position
            const vector = new THREE.Vector3(node.x, node.y, node.z || 0);
            
            // Project to normalized device coordinates
            vector.project(camera);
            
            // Check if the node is off screen (beyond NDC bounds with margin)
            // Adding a small margin (-0.9 to 0.9 instead of -1 to 1)
            const margin = 0.9;
            const isOffScreen = 
                vector.x < -margin || vector.x > margin ||
                vector.y < -margin || vector.y > margin;
            
            if (isOffScreen) {
                offScreenNodes.push(node);
            } else {
                onScreenNodes.push(node);
            }
        });
        
        // Calculate percentage of off-screen nodes
        const totalNodes = nodes.length;
        const offScreenPercentage = totalNodes > 0 ? 
            offScreenNodes.length / totalNodes : 0;
        
        // Need adjustment if too many nodes are off screen
        const needsAdjustment = 
            offScreenPercentage > this.config.realTimeChecker.offScreenThreshold;
        
        if (this.config.debug && needsAdjustment) {
            console.log(`${offScreenNodes.length} nodes (${Math.round(offScreenPercentage * 100)}%) are off screen`);
        }
        
        return {
            needsAdjustment,
            offScreenNodes,
            onScreenNodes,
            offScreenPercentage
        };
    },
    
    /**
     * Adjust camera for node overlap
     * @param {Object} graph - 3D Force Graph instance
     * @param {Object} overlapResult - Result from overlap check
     * @private
     */
    _adjustForNodeOverlap: function(graph, overlapResult) {
        // Prevent too many consecutive adjustments
        if (this._checkerState.consecutiveAdjustments >= 
            this.config.realTimeChecker.maxConsecutiveAdjustments) {
            if (this.config.debug) {
                console.log('Skipping overlap adjustment: too many consecutive adjustments');
            }
            
            // Reset counter after a cooldown
            setTimeout(() => {
                this._checkerState.consecutiveAdjustments = 0;
            }, this.config.realTimeChecker.adjustmentCooldown * 2);
            
            return;
        }
        
        this._checkerState.adjustmentInProgress = true;
        
        // More aggressive immediate adjustment trigger
        // Either we've already tried once, or we have many overlapping pairs
        const needsImmediateAdjustment = 
            this._checkerState.consecutiveAdjustments >= 1 || 
            overlapResult.overlappingPairs.length > 3;
        
        if (needsImmediateAdjustment) {
            // Use immediate adjustment to quickly fix the view
            this.fitAllNodes(graph, this.config.durations.autoAdjust, false, true);
            
            if (this.config.debug) {
                console.log("View has been suboptimal for too long, auto-adjusting position");
            }
            
            // Update state
            this._checkerState.lastAdjustmentTime = Date.now();
            this._checkerState.consecutiveAdjustments++;
            this._checkerState.adjustmentInProgress = false;
            return;
        }
        
        // Get current camera position
        const currentPos = graph.cameraPosition();
        
        // Finding significant overlaps
        const overlaps = overlapResult.overlappingPairs;
        
        // Get most significant overlap
        const maxOverlap = overlaps.reduce((max, current) => 
            current.overlap > max.overlap ? current : max, overlaps[0]);
        
        // Determine a new camera angle that would separate the overlapping nodes
        const nodeA = maxOverlap.nodeA;
        const nodeB = maxOverlap.nodeB;
        
        const midPoint = {
            x: (nodeA.x + nodeB.x) / 2,
            y: (nodeA.y + nodeB.y) / 2,
            z: ((nodeA.z || 0) + (nodeB.z || 0)) / 2
        };
        
        // Get vector between nodes
        const nodeVector = {
            x: nodeB.x - nodeA.x,
            y: nodeB.y - nodeA.y,
            z: (nodeB.z || 0) - (nodeA.z || 0)
        };
        
        // Normalize the vector
        const length = Math.sqrt(
            nodeVector.x * nodeVector.x + 
            nodeVector.y * nodeVector.y + 
            nodeVector.z * nodeVector.z
        );
        
        if (length > 0) {
            nodeVector.x /= length;
            nodeVector.y /= length;
            nodeVector.z /= length;
        }
        
        // Calculate distance based on current camera position
        const distance = Math.sqrt(
            currentPos.x * currentPos.x + 
            currentPos.y * currentPos.y + 
            currentPos.z * currentPos.z
        );
        
        // Create a more pronounced perpendicular offset for better perspective shift
        // This helps with seeing nodes that are in front of each other
        const perpVector = {
            x: -nodeVector.y + (Math.random() * 0.2 - 0.1), // Add small random component
            y: nodeVector.x + (Math.random() * 0.2 - 0.1),  // Add small random component
            z: nodeVector.z * 0.1                           // Reduced z component
        };
        
        // Normalize perpendicular vector
        const perpLength = Math.sqrt(
            perpVector.x * perpVector.x + 
            perpVector.y * perpVector.y + 
            perpVector.z * perpVector.z
        );
        
        if (perpLength > 0) {
            perpVector.x /= perpLength;
            perpVector.y /= perpLength;
            perpVector.z /= perpLength;
        }
        
        // Calculate new camera position with more rotation around nodes
        // Using a larger offset to get a better perspective
        const newPos = {
            x: midPoint.x + perpVector.x * distance * 0.5,  // Increased from 0.3 to 0.5
            y: midPoint.y + perpVector.y * distance * 0.5,  // Increased from 0.3 to 0.5
            z: midPoint.z + distance * 0.95                // Slightly closer (was just distance)
        };
        
        // Move camera with animation
        graph.cameraPosition(
            newPos,
            // Look at the midpoint between the nodes
            midPoint,
            this.config.durations.autoAdjust,
            // Use easing
            (t) => t < 0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2, 3)/2,
            // On complete
            () => {
                this._checkerState.lastAdjustmentTime = Date.now();
                this._checkerState.consecutiveAdjustments++;
                this._checkerState.adjustmentInProgress = false;
                
                if (this.config.debug) {
                    console.log('Camera adjusted for node overlap with perspective shift');
                }
            }
        );
    },
    
    /**
     * Adjust camera for off-screen nodes
     * @param {Object} graph - 3D Force Graph instance
     * @param {Object} offScreenResult - Result from off-screen check
     * @private
     */
    _adjustForOffScreenNodes: function(graph, offScreenResult) {
        // Prevent too many consecutive adjustments
        if (this._checkerState.consecutiveAdjustments >= 
            this.config.realTimeChecker.maxConsecutiveAdjustments) {
            if (this.config.debug) {
                console.log('Skipping off-screen adjustment: too many consecutive adjustments');
            }
            
            // Reset counter after a cooldown
            setTimeout(() => {
                this._checkerState.consecutiveAdjustments = 0;
            }, this.config.realTimeChecker.adjustmentCooldown * 2);
            
            return;
        }
        
        this._checkerState.adjustmentInProgress = true;
        
        // More aggressive immediate adjustment threshold
        const needsImmediateAdjustment = 
            this._checkerState.consecutiveAdjustments >= 1 || 
            offScreenResult.offScreenPercentage > 0.3; // Lower threshold (was 0.4)
        
        if (needsImmediateAdjustment) {
            // Use immediate adjustment to quickly fix the view
            this.fitAllNodes(graph, this.config.durations.autoAdjust, false, true);
            
            if (this.config.debug) {
                console.log("View has been suboptimal for too long, auto-adjusting position");
            }
            
            // Update state
            this._checkerState.lastAdjustmentTime = Date.now();
            this._checkerState.consecutiveAdjustments++;
            this._checkerState.adjustmentInProgress = false;
            return;
        }
        
        // Get current camera position and adjust by zooming out
        const currentPos = graph.cameraPosition();
        const currentLookAt = currentPos.lookAt || { x: 0, y: 0, z: 0 };
        
        // Create a direction vector from lookAt to current position
        const dirX = currentPos.x - currentLookAt.x;
        const dirY = currentPos.y - currentLookAt.y;
        const dirZ = currentPos.z - currentLookAt.z;
        
        // Calculate current distance
        const currentDistance = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
        
        // More aggressive zoom factor to ensure nodes come into view faster
        const zoomFactor = 1 + (offScreenResult.offScreenPercentage * 1.5); // Increased multiplier from 1 to 1.5
        const newDistance = currentDistance * zoomFactor;
        
        // Add a slight angle change to get a better perspective of all nodes
        // This helps when nodes are directly behind each other
        const angleShift = offScreenResult.offScreenPercentage * 0.2; // Up to 0.2 radians shift (~11 degrees)
        
        // Calculate new position with slight rotation around center
        const cos = Math.cos(angleShift);
        const sin = Math.sin(angleShift);
        
        // Normalize direction vector
        const normDir = {
            x: dirX / currentDistance,
            y: dirY / currentDistance,
            z: dirZ / currentDistance
        };
        
        // Apply rotation around z-axis to the normalized direction
        const rotatedDir = {
            x: normDir.x * cos - normDir.y * sin,
            y: normDir.x * sin + normDir.y * cos,
            z: normDir.z
        };
        
        // Calculate new position with rotated direction and new distance
        const newPos = {
            x: currentLookAt.x + rotatedDir.x * newDistance,
            y: currentLookAt.y + rotatedDir.y * newDistance,
            z: currentLookAt.z + rotatedDir.z * newDistance
        };
        
        // Move camera with animation
        graph.cameraPosition(
            newPos,
            currentLookAt,
            this.config.durations.autoAdjust,
            // Use easing
            (t) => t < 0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2, 3)/2,
            // On complete
            () => {
                this._checkerState.lastAdjustmentTime = Date.now();
                this._checkerState.consecutiveAdjustments++;
                this._checkerState.adjustmentInProgress = false;
                
                if (this.config.debug) {
                    console.log('Camera adjusted with angle shift for off-screen nodes');
                }
            }
        );
    }
};

// Make the camera manager globally available
window.CameraManager = CameraManager;
