/**
 * Graph Layout Coordinator
 * 
 * Coordinates between node layout algorithms and camera positioning
 * to ensure consistent and optimal visualization of the graph
 */

const GraphLayoutCoordinator = {
    /**
     * Initialize the coordinator with reference to key components
     * @param {Object} options - Configuration options
     */
    init: function(options = {}) {
        this.graph = options.graph || null;
        this.cameraManager = options.cameraManager || window.CameraManager;
        this.layoutManager = options.layoutManager || window.GraphLayout;
        this.layoutEnhancer = options.layoutEnhancer || window.GraphLayoutEnhancer;
        
        // Configuration settings
        this.config = {
            // Whether to apply layout changes automatically when camera moves
            autoAdjustLayout: options.autoAdjustLayout !== undefined ? options.autoAdjustLayout : true,
            
            // Whether to adjust camera automatically after layout changes
            autoAdjustCamera: options.autoAdjustCamera !== undefined ? options.autoAdjustCamera : true,
            
            // Whether to log debug information
            debug: options.debug || false,
            
            // Callback for when coordination is complete
            onCoordinationComplete: options.onCoordinationComplete || null,
            
            // Timing settings
            timings: {
                // Delay before camera adjustment after layout change (ms)
                cameraAdjustmentDelay: options.cameraAdjustmentDelay || 200,
                
                // Delay before layout adjustment after camera movement (ms)
                layoutAdjustmentDelay: options.layoutAdjustmentDelay || 300
            }
        };
        
        // Internal state
        this._state = {
            // Whether coordination is currently in progress
            coordinating: false,
            
            // Timestamp of last layout change
            lastLayoutChange: 0,
            
            // Timestamp of last camera movement
            lastCameraMovement: 0,
            
            // Current camera position
            currentCamera: { position: null, lookAt: null }
        };
        
        // Setup observers if graph is provided during initialization
        if (this.graph) {
            this._setupObservers();
        }
        
        if (this.config.debug) {
            console.log('GraphLayoutCoordinator initialized with graph:', !!this.graph);
        }
        
        return this;
    },
    
    /**
     * Set the graph to coordinate
     * @param {Object} graph - 3D Force Graph instance
     */
    setGraph: function(graph) {
        this.graph = graph;
        this._setupObservers();
        
        if (this.config.debug) {
            console.log('Graph set in coordinator');
        }
        
        return this;
    },
    
    /**
     * Apply layout improvements followed by camera adjustments
     * @param {Object} options - Options for the coordination process
     */
    coordinate: function(options = {}) {
        if (!this.graph) {
            console.warn('Cannot coordinate: no graph is set');
            return;
        }
        
        this._state.coordinating = true;
        
        const layoutOptions = options.layout || {};
        const cameraOptions = options.camera || {};
        
        // Start by applying layout improvements
        this._applyLayoutImprovements(layoutOptions);
        
        // Then adjust camera after layout is updated, with delay
        setTimeout(() => {
            this._adjustCamera(cameraOptions);
            
            this._state.coordinating = false;
            
            // Call completion callback if provided
            if (typeof this.config.onCoordinationComplete === 'function') {
                this.config.onCoordinationComplete();
            }
        }, this.config.timings.cameraAdjustmentDelay);
        
        return this;
    },
    
    /**
     * Apply optimizations to the graph layout
     * @param {Object} options - Layout optimization options
     * @private
     */
    _applyLayoutImprovements: function(options = {}) {
        if (!this.graph || !this.layoutEnhancer) return;
        
        const maintainHierarchy = options.maintainHierarchy !== undefined ? 
                                 options.maintainHierarchy : true;
        
        if (this.config.debug) {
            console.log('Applying layout improvements with options:', options);
        }
        
        try {
            this.layoutEnhancer.improveNodeSeparation(
                this.graph, 
                maintainHierarchy
            );
            
            this._state.lastLayoutChange = Date.now();
        } catch (err) {
            console.error('Error applying layout improvements:', err);
        }
    },
    
    /**
     * Adjust camera to show all nodes
     * @param {Object} options - Camera adjustment options
     * @private
     */
    _adjustCamera: function(options = {}) {
        if (!this.graph || !this.cameraManager) return;
        
        const duration = options.duration || 800;
        const maintainAngle = options.maintainAngle !== undefined ? 
                             options.maintainAngle : false;
        
        if (this.config.debug) {
            console.log('Adjusting camera with options:', options);
        }
        
        try {
            this.cameraManager.fitAllNodes(
                this.graph,
                duration,
                maintainAngle
            );
            
            this._state.lastCameraMovement = Date.now();
        } catch (err) {
            console.error('Error adjusting camera:', err);
        }
    },
    
    /**
     * Set up observers for graph changes and camera movements
     * @private
     */
    _setupObservers: function() {
        if (!this.graph) return;
        
        // Observe camera position changes
        this._setupCameraObserver();
        
        // Observe graph data changes
        this._setupGraphDataObserver();
        
        // Observe viewport changes
        if (this.cameraManager) {
            this.cameraManager.setupViewportObserver(this.graph, (changeInfo) => {
                if (this.config.debug) {
                    console.log('Viewport changed:', changeInfo);
                }
                
                // Improve layout after viewport change if auto adjustment is enabled
                if (this.config.autoAdjustLayout && this.layoutEnhancer) {
                    setTimeout(() => {
                        this._applyLayoutImprovements({ maintainHierarchy: true });
                    }, this.config.timings.layoutAdjustmentDelay);
                }
            });
        }
    },
    
    /**
     * Set up observer for camera position changes
     * @private
     */
    _setupCameraObserver: function() {
        // We need to use a polling approach since there's no built-in event
        // for camera position changes in most 3D force graph libraries
        
        // Store original cameraPosition method to wrap it
        const originalCameraPosition = this.graph.cameraPosition;
        
        this.graph.cameraPosition = (...args) => {
            // Call original method
            const result = originalCameraPosition.apply(this.graph, args);
            
            // If it was a setter call (with arguments)
            if (args.length) {
                this._onCameraPositionChanged();
            }
            
            return result;
        };
    },
    
    /**
     * Set up observer for graph data changes
     * @private
     */
    _setupGraphDataObserver: function() {
        // Store original graphData method
        const originalGraphData = this.graph.graphData;
        
        // Override graphData method to detect changes
        this.graph.graphData = (...args) => {
            // Call original method
            const result = originalGraphData.apply(this.graph, args);
            
            // If it was a setter call (with arguments)
            if (args.length && args[0]) {
                this._onGraphDataChanged();
            }
            
            return result;
        };
    },
    
    /**
     * Handle camera position change
     * @private
     */
    _onCameraPositionChanged: function() {
        // Skip if we're currently coordinating to avoid feedback loops
        if (this._state.coordinating) return;
        
        this._state.lastCameraMovement = Date.now();
        
        // Apply layout improvements if auto adjustment is enabled
        // and it's been a while since the last layout change
        if (this.config.autoAdjustLayout && 
            this.layoutEnhancer && 
            (Date.now() - this._state.lastLayoutChange > 1000)) {
            
            // Delay layout adjustment to avoid constant updates during camera movement
            setTimeout(() => {
                // Skip if camera has moved again in the meantime
                if (Date.now() - this._state.lastCameraMovement < 300) return;
                
                this._applyLayoutImprovements({ maintainHierarchy: true });
            }, this.config.timings.layoutAdjustmentDelay);
        }
    },
    
    /**
     * Handle graph data change
     * @private
     */
    _onGraphDataChanged: function() {
        // Skip if we're currently coordinating to avoid feedback loops
        if (this._state.coordinating) return;
        
        this._state.lastLayoutChange = Date.now();
        
        // Adjust camera if auto adjustment is enabled
        if (this.config.autoAdjustCamera && this.cameraManager) {
            setTimeout(() => {
                this._adjustCamera({ duration: 800, maintainAngle: false });
            }, this.config.timings.cameraAdjustmentDelay);
        }
    }
};

// Make coordinator available globally
window.GraphLayoutCoordinator = GraphLayoutCoordinator;
