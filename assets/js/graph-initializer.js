/**
 * Graph Initializer
 * Applies enhanced node positioning to the 3D network graph
 */

(function() {
    // Wait for DOM to be fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Apply enhancer once the graph is loaded
        applyGraphEnhancements();
    });

    /**
     * Apply graph enhancements by hooking into the existing graph instance
     */
    function applyGraphEnhancements() {
        // Try to find the graph on regular intervals until found
        const checkInterval = setInterval(() => {
            // Look for the graph instance - check common variables used in the main script
            const graphInstance = window.Graph || 
                window.portfolioGraph || 
                window.forceGraph || 
                window.graph3d || 
                findGraphInstanceInDOM();
            
            if (graphInstance && typeof graphInstance.graphData === 'function') {
                clearInterval(checkInterval);
                enhanceGraph(graphInstance);
            }
        }, 500);

        // Stop checking after 10 seconds to avoid infinite loops
        setTimeout(() => clearInterval(checkInterval), 10000);
    }

    /**
     * Try to find the graph instance in DOM elements' data
     * This is a fallback method if the graph isn't stored in a global variable
     */
    function findGraphInstanceInDOM() {
        // Common container IDs for 3D graphs
        const possibleContainers = [
            'graph-container',
            'portfolio-graph',
            'skills-network',
            'network-graph',
            'force-graph',
            '3d-graph'
        ];

        for (const id of possibleContainers) {
            const container = document.getElementById(id);
            if (container && container._graphInstance) {
                return container._graphInstance;
            }
        }

        // Try looking for canvas elements that might be the graph
        const canvasElements = document.querySelectorAll('canvas');
        for (const canvas of canvasElements) {
            if (canvas.parentNode && canvas.parentNode._graphInstance) {
                return canvas.parentNode._graphInstance;
            }
        }

        return null;
    }

    /**
     * Apply enhancements to the graph instance
     * @param {Object} graphInstance - The 3D Force Graph instance
     */
    function enhanceGraph(graphInstance) {
        console.log('Applying graph enhancements...');

        // First apply enhancer immediately for initial positioning
        if (window.GraphLayoutEnhancer) {
            window.GraphLayoutEnhancer.improveNodeSeparation(graphInstance, true);
        }

        // Also apply the core layout optimizations if available
        if (window.GraphLayout && window.GraphLayout.applyForceConfiguration) {
            window.GraphLayout.applyForceConfiguration(graphInstance);
        }

        // Setup mutation observer to detect when graph data changes
        setupGraphDataObserver(graphInstance);

        // Apply enhancements again after the graph has settled
        setTimeout(() => {
            if (window.GraphLayoutEnhancer) {
                window.GraphLayoutEnhancer.improveNodeSeparation(graphInstance, true);
            }
            
            // After enhancing node positions, update camera to show all nodes
            if (window.CameraManager) {
                window.CameraManager.fitAllNodes(graphInstance, 1000);
            }
        }, 2000);

        // Attach to window resize events to reapply optimizations
        window.addEventListener('resize', debounce(() => {
            console.log('Reapplying graph enhancements after resize...');
            if (window.GraphLayoutEnhancer) {
                window.GraphLayoutEnhancer.improveNodeSeparation(graphInstance, true);
            }
            
            // Update camera after layout changes
            if (window.CameraManager) {
                window.CameraManager.fitAllNodes(graphInstance, 800);
            }
        }, 250));
    }

    /**
     * Monitor the graph for data changes to reapply enhancements
     * @param {Object} graphInstance - The 3D Force Graph instance
     */
    function setupGraphDataObserver(graphInstance) {
        // Store original graphData method
        const originalGraphData = graphInstance.graphData;
        
        // Override graphData method to detect changes
        graphInstance.graphData = function(data) {
            // Call original method
            const result = originalGraphData.apply(this, arguments);
            
            // If this was a setter call (data provided), apply enhancements
            if (arguments.length && data) {
                console.log('Graph data updated, reapplying enhancements...');
                setTimeout(() => {
                    if (window.GraphLayoutEnhancer) {
                        window.GraphLayoutEnhancer.improveNodeSeparation(graphInstance, true);
                    }
                }, 100);
            }
            
            return result;
        };
    }

    /**
     * Debounce function to limit how often a function is called
     * @param {Function} func - Function to debounce
     * @param {Number} wait - Milliseconds to wait
     * @returns {Function} - Debounced function
     */
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
})();
