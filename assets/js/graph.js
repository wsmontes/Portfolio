// Self-contained graph initialization with high-quality nodes
(function() {
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        // Core elements
        const graphElement = document.getElementById('graph-container');
        const loadingScreen = document.querySelector('.loading-screen');
        const contentPanel = document.getElementById('content-panel');
        const contentInner = document.querySelector('.content-inner');
        const closePanel = document.querySelector('.close-panel');
        const navItems = document.querySelectorAll('.nav-menu a[data-section]');
        const resetViewBtn = document.getElementById('resetView');
        const zoomInBtn = document.getElementById('zoom-in');
        const zoomOutBtn = document.getElementById('zoom-out');
        const resetCameraBtn = document.getElementById('reset-camera');
        
        // Store graph instance
        let graph = null;
        
        // Camera animation duration (ms)
        const CAMERA_ANIMATION_DURATION = 1000;
        const CONTENT_DELAY = 1000;
        
        // Variables for idle detection and viewport checks
        let idleTimer = null;
        let isUserInteracting = false;
        const IDLE_TIMEOUT = 30000; // 30 seconds before checking view
        let lastViewportWidth = window.innerWidth;
        let lastViewportHeight = window.innerHeight;
        let lastOrientationAngle = window.orientation !== undefined ? window.orientation : 0;
        
        // New variables for position auto-correction
        let viewPositionTimer = null;
        let suboptimalViewStartTime = null;
        const POSITION_CHECK_INTERVAL = 1000; // Check every second
        const SUBOPTIMAL_POSITION_THRESHOLD = 5000; // Auto-correct after 5 seconds
        
        // Create basic Three.js object for node when celestial-bodies.js isn't loaded
        function createBasicNode(node) {
            // Determine node size - doubled the base size again
            const size = node.size || (node.val || 100) / 3; // Doubled from 50 to 100
            
            // Determine node color based on type
            let color;
            
            // Main categories with distinct colors
            if (node.id === 'center') color = '#ffd700';  // Gold for center
            else if (node.id === 'professional') color = '#2563eb';  // Blue
            else if (node.id === 'repositories') color = '#16a34a';  // Green
            else if (node.id === 'personal') color = '#db2777';  // Pink
            
            // Sub-nodes with lighter colors
            else if (node.parentId === 'professional') color = '#4a90e2';  // Lighter blue
            else if (node.parentId === 'repositories') color = '#2ecc71';  // Lighter green
            else if (node.parentId === 'personal') color = '#ff6b81';  // Lighter pink
            else color = '#94a3b8';  // Default gray
            
            // Create mesh with appropriate segments for quality
            const segments = 
                node.id === 'center' ? 32 : 
                ['professional', 'repositories', 'personal'].includes(node.id) ? 24 : 16;
                
            const geometry = new THREE.SphereGeometry(size, segments, segments);
            const material = new THREE.MeshPhongMaterial({ 
                color: color,
                shininess: 80,
                transparent: true,
                opacity: 0.9
            });
            
            return new THREE.Mesh(geometry, material);
        }

        // Function to safely initialize when dependencies are available
        function checkDependenciesAndInit() {
            if (window.THREE && typeof ForceGraph3D === 'function') {
                console.log("THREE and ForceGraph3D are available, initializing graph");
                initGraph();
            } else {
                console.warn('Required libraries not loaded yet, waiting for THREE_LOADED event');
                
                // Listen for THREE being ready
                window.addEventListener('threeReady', () => {
                    if (typeof ForceGraph3D === 'function') {
                        console.log("THREE is ready, ForceGraph3D available, initializing graph");
                        initGraph();
                    } else {
                        console.warn("THREE is ready but ForceGraph3D is not available");
                        setTimeout(checkDependenciesAndInit, 100);
                    }
                }, { once: true });
                
                // Fallback timeout
                setTimeout(() => {
                    if (!window.THREE || typeof ForceGraph3D !== 'function') {
                        console.error("Dependencies never loaded after waiting");
                        hideLoadingScreen();
                    } else if (!graph) {
                        console.log("Dependencies loaded via timeout check, initializing graph");
                        initGraph();
                    }
                }, 5000);
            }
        }
        
        // Initialize the graph with dynamically generated network data
        async function initGraph() {
            // Safety check - don't initialize more than once
            if (graph) return;
            
            try {
                // Generate network data dynamically from JSON files
                let networkData;
                
                if (window.NetworkDataGenerator) {
                    // Show loading message
                    if (loadingScreen) {
                        const loadingText = loadingScreen.querySelector('p');
                        if (loadingText) {
                            loadingText.textContent = 'Generating network...';
                        }
                    }
                    
                    try {
                        // Generate data from JSON files
                        const generator = new NetworkDataGenerator();
                        networkData = await generator.generate();
                        
                        // Expose the generated data globally for other components to use
                        window.NetworkData = networkData;
                    } catch (error) {
                        console.error('Error generating network data:', error);
                        // Fall back to static data if available
                        networkData = window.NetworkData || { nodes: [], links: [] };
                    }
                } else {
                    // Fall back to static data if available
                    networkData = window.NetworkData || { nodes: [], links: [] };
                }
                
                // Update loading message
                if (loadingScreen) {
                    const loadingText = loadingScreen.querySelector('p');
                    if (loadingText) {
                        loadingText.textContent = 'Building visualization...';
                    }
                }
                
                // Create graph with enhanced node quality
                graph = ForceGraph3D({ 
                    controlType: 'orbit',
                    rendererConfig: { antialias: true, alpha: true }
                })(graphElement)
                    .backgroundColor('#000008')
                    .graphData(networkData)
                    .nodeLabel(node => `${node.name}: ${node.description}`)
                    .nodeThreeObject(node => {
                        // Use the celestial bodies creator if available
                        if (window.createCelestialBody) {
                            return window.createCelestialBody(node);
                        } else {
                            // Fallback to basic node creation
                            return createBasicNode(node);
                        }
                    })
                    .nodeRelSize(40) // Doubled from 20 to 40
                    .linkWidth(link => (link.value * 1.2) / 5) // Reduced tube width 5x
                    .linkOpacity(0.6)
                    .linkDirectionalParticles(3)
                    .linkDirectionalParticleSpeed(0.002) // Reduced from 0.005 to 0.002 for slower particles
                    .linkDirectionalParticleWidth(4.0 / 5) // Reduced particle width 5x (0.8)
                    .linkColor(() => '#ffffff30')
                    .onNodeHover(handleNodeHover)
                    .onNodeClick(handleNodeClick)
                    .onBackgroundClick(hidePanel)
                    .onEngineStop(() => {
                        hideLoadingScreen();
                        
                        // Use CameraManager for initial view
                        if (window.CameraManager) {
                            window.CameraManager.fitAllNodes(graph, 1500);
                        } else {
                            // Fallback to built-in function
                            fitNodesToView(graph, 1500);
                        }
                    });
                
                // Setup force physics without direct d3 references
                safelySetupForces(graph);

                // Enhanced: Update graph layout for better node distribution based on screen size
                function updateGraphLayout() {
                    if (!graph) return;
                    
                    // Get current viewport dimensions
                    const width = window.innerWidth;
                    const height = window.innerHeight;
                    const aspectRatio = width / height;
                    
                    // Safely update forces instead of accessing d3 directly
                    try {
                        // Safely set charge force strength
                        const chargeForce = graph.d3Force('charge');
                        if (chargeForce && chargeForce.strength) {
                            if (width < 768) {
                                chargeForce.strength(-80);
                            } else if (width < 992) {
                                chargeForce.strength(-100);
                            } else {
                                chargeForce.strength(-120);
                            }
                        }
                        
                        // Safely set link distance
                        const linkForce = graph.d3Force('link');
                        if (linkForce && linkForce.distance) {
                            linkForce.distance(link => {
                                const isMain = link.source.id === 'center' && ['professional','repositories','personal'].includes(link.target.id);
                                const isSub = ['professional','repositories','personal'].includes(link.target.id);
                                
                                if (width < 768) {
                                    return isMain ? 60 : isSub ? 50 : 30;
                                } else if (width < 992) {
                                    return isMain ? 70 : isSub ? 60 : 40;
                                } else {
                                    return isMain ? 80 : isSub ? 60 : 40;
                                }
                            });
                        }
                        
                        // Safely set y force strength
                        const yForce = graph.d3Force('y');
                        if (yForce && yForce.strength) {
                            if (width < 768 && aspectRatio < 1) {
                                yForce.strength(0.05);
                            } else if (width < 992) {
                                yForce.strength(0.02);
                            } else {
                                yForce.strength(0.01);
                            }
                        }
                    } catch (e) {
                        console.warn('Error updating forces:', e);
                    }
                    
                    if (graph.refresh) graph.refresh();
                }
                
                // Function to safely setup forces without direct d3 references
                function safelySetupForces(graph) {
                    if (!graph) return;
                    
                    try {
                        // Use the graph's existing forces without referencing d3 directly
                        
                        // Adjust charge force - repels nodes from each other
                        const chargeForce = graph.d3Force('charge'); 
                        if (chargeForce && chargeForce.strength) {
                            chargeForce.strength(-120);
                        }
                        
                        // Adjust link distance based on node types
                        const linkForce = graph.d3Force('link');
                        if (linkForce && linkForce.distance) {
                            linkForce.distance(link => {
                                const sourceIsCenter = link.source.id === 'center';
                                const targetIsCategory = ['professional', 'repositories', 'personal'].includes(link.target.id);
                                
                                if (sourceIsCenter && targetIsCategory) {
                                    return 80; // Distance from center to main categories
                                } else if (targetIsCategory) {
                                    return 60; // Distance to subcategories
                                } else {
                                    return 40; // Distance to items
                                }
                            });
                        }
                    } catch (e) {
                        console.warn('Error setting up forces:', e);
                    }
                }
                
                // Enhanced: Replace the resize listener with immediate response
                function handleResize() {
                    const currentWidth = window.innerWidth;
                    const currentHeight = window.innerHeight;
                    const orientationAngle = window.orientation !== undefined ? window.orientation : 0;
                    
                    // Only update if there's a significant size change or orientation change
                    const sizeChanged = Math.abs(currentWidth - lastViewportWidth) > 50 || 
                                      Math.abs(currentHeight - lastViewportHeight) > 50;
                    const orientationChanged = lastOrientationAngle !== orientationAngle;
                    
                    if (sizeChanged || orientationChanged) {
                        // Mark that we're starting a resize operation
                        document.body.classList.add('resizing');
                        
                        // Update layout immediately
                        updateGraphLayout();
                        
                        // Calculate adaptive transition duration based on size change magnitude
                        const changeMagnitude = Math.max(
                            Math.abs(currentWidth - lastViewportWidth) / lastViewportWidth,
                            Math.abs(currentHeight - lastViewportHeight) / lastViewportHeight
                        );
                        
                        // Faster transitions for smaller changes
                        const transitionDuration = orientationChanged ? 
                            1500 : // Reduced from 2000ms for orientation changes
                            Math.min(1500, Math.max(600, changeMagnitude * 2000)); // Reduced max duration from 2000ms to 1500ms
                        
                        // Update camera to fit all nodes with better X/Y positioning immediately
                        fitNodesToView(graph, transitionDuration, false, true);
                        
                        // Remove resizing class immediately after transition starts
                        document.body.classList.remove('resizing');
                        
                        // Store current dimensions for next comparison
                        lastViewportWidth = currentWidth;
                        lastViewportHeight = currentHeight;
                        lastOrientationAngle = orientationAngle;
                    }
                }
                
                // Use the resize event with a reduced throttle for better responsiveness
                let resizeThrottle;
                window.addEventListener('resize', () => {
                    if (!resizeThrottle) {
                        resizeThrottle = setTimeout(() => {
                            resizeThrottle = null;
                            handleResize();
                        }, 50); // Reduced from 100ms to 50ms for faster response
                    }
                });
                
                window.addEventListener('orientationchange', () => {
                    // Special handler for orientation changes - reduced delay
                    setTimeout(handleResize, 50); // Reduced from 100ms to 50ms
                });
                
                updateGraphLayout();
                
                // Initialize idle detection
                setupIdleDetection();
                
                // Add position monitoring
                setupPositionMonitoring();
                
                // Add frame loop for animations
                graph.onEngineTick(() => {
                    if (window.animateNodes) {
                        window.animateNodes(graph.nodeThreeObjectExtend(), 0.016);
                    }
                });
                
                // CRITICAL: Immediate setup with no waiting
                const forceStartupPriority = () => {
                    // Mount to container without waiting
                    graph(graphElement);
                    
                    // Safely setup forces
                    safelySetupForces(graph);
                    
                    // Calculate graph metrics
                    const graphCenter = calculateGraphCenter(graph.graphData().nodes);
                    const optimalDistance = calculateOptimalCameraDistance();
                    
                    console.log("IMMEDIATE: Setting initial camera position");
                    
                    // Set camera position - keep duration for smooth movement
                    graph.cameraPosition({ 
                        x: graphCenter.x * 0.2, 
                        y: graphCenter.y * 0.2, 
                        z: optimalDistance 
                    }, { x: graphCenter.x, y: graphCenter.y, z: 0 }, 1500);
                    
                    // Update layout with safe force checks
                    updateGraphLayout();
                    
                    // Setup controls immediately
                    setupControls();
                    
                    // Hide loading screen immediately
                    hideLoadingScreen();
                    
                    // Emit graph loaded event with no delay
                    window.dispatchEvent(new Event('graphLoaded'));
                };
                
                // Execute immediately
                forceStartupPriority();

                // Make focusOnNode function available globally
                window.focusOnNode = (nodeId, showContentAfter = false) => {
                    // Use CameraManager if available
                    if (window.CameraManager) {
                        const success = window.CameraManager.focusOnNode(graph, nodeId, CAMERA_ANIMATION_DURATION);
                        
                        // If showContentAfter is true, dispatch the nodeClick event after camera movement
                        if (success && showContentAfter) {
                            setTimeout(() => {
                                const clickEvent = new CustomEvent('nodeClick', {
                                    detail: { id: nodeId, showContent: true }
                                });
                                window.dispatchEvent(clickEvent);
                            }, CONTENT_DELAY);
                        }
                        
                        return success;
                    }
                    
                    // Fallback implementation
                    const nodes = graph.graphData().nodes;
                    const node = nodes.find(n => n.id === nodeId);
                    
                    if (node) {
                        // Increased camera distances for larger nodes
                        const distance = ['professional', 'repositories', 'personal', 'about', 'contact'].includes(nodeId) ? 300 : 200;
                        const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
                        
                        // Move camera to focus on the node
                        graph.cameraPosition(
                            { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
                            node,
                            CAMERA_ANIMATION_DURATION
                        );
                        
                        // If showContentAfter is true, dispatch the nodeClick event after camera movement
                        if (showContentAfter) {
                            setTimeout(() => {
                                // Dispatch node click event with flag to show content
                                const clickEvent = new CustomEvent('nodeClick', {
                                    detail: { id: nodeId, showContent: true }
                                });
                                window.dispatchEvent(clickEvent);
                            }, CONTENT_DELAY);
                        }
                        
                        return true;
                    }
                    return false;
                };
                
                // Make resetGraphView function available globally
                window.resetGraphView = () => {
                    // Use CameraManager if available
                    if (window.CameraManager) {
                        window.CameraManager.resetToHomeView(graph, 800);
                    } else {
                        // Calculate center of graph nodes and optimal distance
                        const graphCenter = calculateGraphCenter(graph.graphData().nodes);
                        const optimalDistance = calculateOptimalCameraDistance();
                        
                        graph.cameraPosition({ 
                            x: graphCenter.x, 
                            y: graphCenter.y, 
                            z: optimalDistance 
                        }, { x: graphCenter.x, y: graphCenter.y, z: 0 }, 800);
                    }
                    
                    // If there's a content panel open, hide it
                    hidePanel();
                };
                
                // Emit graph loaded event immediately and attach a handler for auto-adjustment
                window.dispatchEvent(new Event('graphLoaded'));
                
                // Listen for the graphLoaded event with no delay in the handler
                window.addEventListener('graphLoaded', () => {
                    console.log("Graph loaded event received, adjusting view");
                    fitNodesToView(graph, 1500, false, true);
                }, { once: true });
                
                // Setup zoom control buttons
                setupZoomControls(graph);
            } catch (error) {
                console.error('Error initializing graph:', error);
                hideLoadingScreen();
            }
        }
        
        // Setup camera/zoom controls
        function setupControls() {
            // Zoom in button
            if (zoomInBtn) {
                zoomInBtn.addEventListener('click', () => {
                    if (!graph) return;
                    isUserInteracting = true;
                    resetIdleTimer();
                    
                    const { x, y, z } = graph.cameraPosition();
                    const distance = Math.sqrt(x*x + y*y + z*z);
                    const scale = Math.max(0.8, distance > 30 ? 0.8 : 0.95);
                    graph.cameraPosition({
                        x: x * scale, 
                        y: y * scale, 
                        z: z * scale
                    }, undefined, 300);
                });
            }
            
            // Zoom out button
            if (zoomOutBtn) {
                zoomOutBtn.addEventListener('click', () => {
                    if (!graph) return;
                    isUserInteracting = true;
                    resetIdleTimer();
                    
                    const { x, y, z } = graph.cameraPosition();
                    const distance = Math.sqrt(x*x + y*y + z*z);
                    const scale = Math.min(1.2, distance < 300 ? 1.2 : 1.05);
                    graph.cameraPosition({
                        x: x * scale, 
                        y: y * scale, 
                        z: z * scale
                    }, undefined, 300);
                });
            }
            
            // Reset camera button
            if (resetCameraBtn) {
                resetCameraBtn.addEventListener('click', () => {
                    if (!graph) return;
                    isUserInteracting = true;
                    resetIdleTimer();
                    
                    const optimalDistance = calculateOptimalCameraDistance();
                    graph.cameraPosition({ 
                        x: 0, y: 0, z: optimalDistance 
                    }, { x: 0, y: 0, z: 0 }, 800);
                });
            }
            
            // Reset view link
            if (resetViewBtn) {
                resetViewBtn.addEventListener('click', e => {
                    e.preventDefault();
                    if (!graph) return;
                    isUserInteracting = true;
                    resetIdleTimer();
                    
                    const optimalDistance = calculateOptimalCameraDistance();
                    graph.cameraPosition({ 
                        x: 0, y: 0, z: optimalDistance 
                    }, { x: 0, y: 0, z: 0 }, 800);
                    
                    hidePanel();
                });
            }
            
            // Section navigation
            if (navItems) {
                navItems.forEach(item => {
                    item.addEventListener('click', function(e) {
                        e.preventDefault();
                        isUserInteracting = true;
                        resetIdleTimer();
                        
                        const sectionId = this.getAttribute('data-section');
                        const node = NetworkData.nodes.find(n => n.id === sectionId);
                        if (node) handleNodeClick(node);
                    });
                });
            }
            
            // Close panel button
            if (closePanel) {
                closePanel.addEventListener('click', hidePanel);
            }
            
            // Add graph interaction listeners to reset idle timer
            graphElement.addEventListener('mousedown', () => {
                isUserInteracting = true;
                resetIdleTimer();
            });
            
            graphElement.addEventListener('touchstart', () => {
                isUserInteracting = true;
                resetIdleTimer();
            });
            
            graphElement.addEventListener('wheel', () => {
                isUserInteracting = true;
                resetIdleTimer();
            });
            
            // Listen for interaction end
            document.addEventListener('mouseup', () => {
                isUserInteracting = false;
            });
            
            document.addEventListener('touchend', () => {
                isUserInteracting = false;
            });
        }

        // Initialize idle detection
        function setupIdleDetection() {
            resetIdleTimer();
            
            // Listen for any user activity
            ['mousemove', 'keydown', 'mousedown', 'touchstart', 'click'].forEach(event => {
                document.addEventListener(event, resetIdleTimer);
            });
        }
        
        // New function to monitor camera position
        function setupPositionMonitoring() {
            // Start the position check timer
            startPositionCheckTimer();
            
            // Reset position timer on user interaction
            ['mousemove', 'keydown', 'mousedown', 'touchstart', 'click'].forEach(event => {
                document.addEventListener(event, () => {
                    // Reset the suboptimal view timer when user interacts
                    suboptimalViewStartTime = null;
                });
            });
            
            // Listen for graph interaction to reset suboptimal timer
            if (graphElement) {
                graphElement.addEventListener('mousedown', () => {
                    suboptimalViewStartTime = null;
                });
                
                graphElement.addEventListener('touchstart', () => {
                    suboptimalViewStartTime = null;
                });
                
                graphElement.addEventListener('wheel', () => {
                    suboptimalViewStartTime = null;
                });
            }
        }
        
        // Start the position check timer
        function startPositionCheckTimer() {
            clearInterval(viewPositionTimer);
            
            viewPositionTimer = setInterval(() => {
                // Don't check if user is currently interacting or content panel is open
                if (isUserInteracting || !contentPanel.classList.contains('hidden')) {
                    suboptimalViewStartTime = null;
                    return;
                }
                
                // Check if view is too far off
                const isSuboptimal = isViewSuboptimal();
                
                if (isSuboptimal) {
                    // If this is the first detection of suboptimal view, record the time
                    if (suboptimalViewStartTime === null) {
                        suboptimalViewStartTime = Date.now();
                    } 
                    // If view has been suboptimal for more than the threshold, reposition
                    else if ((Date.now() - suboptimalViewStartTime) > SUBOPTIMAL_POSITION_THRESHOLD) {
                        console.log('View has been suboptimal for too long, auto-adjusting position');
                        fitNodesToView(graph, 1500, true);
                        suboptimalViewStartTime = null;
                    }
                } else {
                    // Reset the timer if view is optimal
                    suboptimalViewStartTime = null;
                }
            }, POSITION_CHECK_INTERVAL);
        }
        
        // Reset the idle timer
        function resetIdleTimer() {
            clearTimeout(idleTimer);
            
            idleTimer = setTimeout(() => {
                // Only check if view needs adjustment when user is not actively interacting
                if (!isUserInteracting && isViewSuboptimal()) {
                    console.log('Idle detected, adjusting view for optimal visibility');
                    fitNodesToView(graph, 2000, true);
                }
            }, IDLE_TIMEOUT);
            
            // Also reset the suboptimal view timer when there's user activity
            suboptimalViewStartTime = null;
        }
        
        // Enhanced view check with additional off-center detection
        function isViewSuboptimal() {
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
            
            // Calculate optimal distance
            const optimalDistance = calculateOptimalCameraDistance();
            
            // Calculate how many nodes are visible
            const renderer = graph.renderer();
            const camera = graph.camera();
            
            if (!renderer || !camera) return false;
            
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
            
            // More strict limit for the position monitor (0.4 instead of 0.5)
            if (offsetFromCenterLine > optimalDistance * 0.4) {
                return true;
            }
            
            return false;
        }
        
        // Calculate optimal camera distance based on viewport size
        function calculateOptimalCameraDistance() {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const aspectRatio = width / height;
            
            // Base distance for various device sizes
            let baseDistance;
            
            if (width <= 480) {
                // Small mobile
                baseDistance = 300;
            } else if (width <= 768) {
                // Mobile
                baseDistance = 280;
            } else if (width <= 992) {
                // Tablet
                baseDistance = 260;
            } else if (width <= 1200) {
                // Small desktop
                baseDistance = 240;
            } else {
                // Large desktop
                baseDistance = 220;
            }
            
            // Adjust for viewport aspect ratio
            if (aspectRatio < 1) {
                // Portrait orientation needs more distance
                baseDistance *= (1.2 / aspectRatio);
            } else if (aspectRatio > 2) {
                // Ultra-wide screens
                baseDistance *= 0.9;
            }
            
            return baseDistance;
        }

        /**
         * Setup zoom control buttons
         * @param {Object} graph - 3D Force Graph instance
         */
        function setupZoomControls(graph) {
            if (zoomInBtn) {
                zoomInBtn.addEventListener('click', () => {
                    const { x, y, z } = graph.cameraPosition();
                    const distance = Math.sqrt(x*x + y*y + z*z);
                    const scale = 0.8;
                    graph.cameraPosition({
                        x: x * scale, y: y * scale, z: z * scale
                    }, undefined, 300);
                });
            }
            
            if (zoomOutBtn) {
                zoomOutBtn.addEventListener('click', () => {
                    const { x, y, z } = graph.cameraPosition();
                    const scale = 1.25;
                    graph.cameraPosition({
                        x: x * scale, y: y * scale, z: z * scale
                    }, undefined, 300);
                });
            }
            
            if (resetCameraBtn) {
                resetCameraBtn.addEventListener('click', () => {
                    graph.cameraPosition({ x: 0, y: 0, z: 220 }, { x: 0, y: 0, z: 0 }, 1000);
                });
            }
        }
        
        // Node hover handler
        function handleNodeHover(node) {
            // Change cursor
            graphElement.style.cursor = node ? 'pointer' : null;
            
            if (node) {
                resetIdleTimer();
            }
        }
        
        // Node click handler
        function handleNodeClick(node) {
            if (!node) return;
            
            isUserInteracting = true;
            resetIdleTimer();
            
            // First focus on the node (camera movement)
            const nodeId = node.id;
            
            // Focus camera on the node - increased distances for larger nodes
            const distance = nodeId === 'center' ? 400 : 250;
            const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
            graph.cameraPosition(
                { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
                node,
                CAMERA_ANIMATION_DURATION
            );
            
            // After camera has started moving, dispatch event to show content
            setTimeout(() => {
                // Dispatch node click event with flag to show content
                const clickEvent = new CustomEvent('nodeClick', {
                    detail: { id: nodeId, showContent: true }
                });
                window.dispatchEvent(clickEvent);
            }, CONTENT_DELAY);
        }
        
        // Loading screen functions - no delay needed
        function hideLoadingScreen() {
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                loadingScreen.style.display = 'none';
            }
        }
        
        // Content panel functions
        function showSectionContent(section) {
            if (!contentPanel || !contentInner) return;
            
            // Clear previous content
            contentInner.innerHTML = '';
            
            try {
                // Use ContentLoader to load content directly from JSON
                if (typeof ContentLoader === 'function') {
                    ContentLoader.loadContent(section, contentInner)
                        .then(() => {
                            console.log(`Content for ${section} loaded successfully`);
                            // Show the content panel
                            contentPanel.classList.remove('hidden');
                        })
                        .catch(error => {
                            console.error(`Error loading ${section} content:`, error);
                            contentInner.innerHTML = '<p>Failed to load content. Please try again later.</p>';
                            contentPanel.classList.remove('hidden');
                        });
                } else {
                    console.error('ContentLoader not available');
                    contentInner.innerHTML = '<p>Content loading system is not available</p>';
                    contentPanel.classList.remove('hidden');
                }
            } catch (error) {
                console.error('Error showing section content:', error);
                contentInner.innerHTML = '<p>An error occurred while loading content.</p>';
                contentPanel.classList.remove('hidden');
            }
        }
        
        function hidePanel() {
            if (!contentPanel) return;
            contentPanel.classList.add('hidden');
        }
        
        // Setup filter buttons
        function setupFilterButtons() {
            const filterBtns = document.querySelectorAll('.filter-btn');
            
            filterBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    const filterGroup = this.closest('.project-filters, .photo-filters');
                    filterGroup.querySelectorAll('.filter-btn').forEach(b => {
                        b.classList.remove('active');
                    });
                    
                    this.classList.add('active');
                    
                    const filterValue = this.getAttribute('data-filter');
                    
                    let items;
                    if (filterGroup.classList.contains('project-filters')) {
                        items = document.querySelectorAll('.project-card');
                    } else {
                        items = document.querySelectorAll('.gallery-item');
                    }
                    
                    items.forEach(item => {
                        if (filterValue === 'all' || item.classList.contains(filterValue)) {
                            item.style.display = 'block';
                        } else {
                            item.style.display = 'none';
                        }
                    });
                });
            });
        }
        
        // Load photography data
        function loadPhotographyData() {
            const gallery = document.querySelector('.gallery');
            if (!gallery) return;
            
            gallery.innerHTML = '';
            
            const photoTypes = ['portrait', 'landscape', 'street'];
            const photoCount = 9;
            
            for (let i = 1; i <= photoCount; i++) {
                const type = photoTypes[Math.floor((i - 1) / 3)];
                const photoItem = document.createElement('div');
                photoItem.className = `gallery-item ${type}`;
                
                photoItem.innerHTML = `
                    <img src="https://source.unsplash.com/random/300x200?${type}&sig=${i}" alt="${type} photo">
                    <div class="gallery-caption">
                        <h4>${type.charAt(0).toUpperCase() + type.slice(1)} #${i}</h4>
                    </div>
                `;
                
                gallery.appendChild(photoItem);
            }
        }
        
        // Enhanced: Function to fit all nodes in view with improved X/Y positioning
        function fitNodesToView(graph, duration = 1500, easeOnly = false, improveXY = false) {
            // Use CameraManager if available for better camera positioning
            if (window.CameraManager) {
                return window.CameraManager.fitAllNodes(graph, duration, easeOnly);
            }
            
            // Fallback implementation if CameraManager is not available
            if (!graph || !graph.graphData) return;
            
            console.log(`Fitting nodes to view: duration=${duration}, easeOnly=${easeOnly}, improveXY=${improveXY}`);
            
            const graphData = graph.graphData();
            
            // Don't proceed if there are no nodes
            if (!graphData.nodes || graphData.nodes.length === 0) return;
            
            // Get current camera position
            const currentPos = graph.cameraPosition();
            
            // Calculate the bounding sphere of all nodes
            let maxDistance = 0;
            let maxX = 0, maxY = 0, maxZ = 0;
            
            // Calculate graph center for better positioning
            const graphCenter = calculateGraphCenter(graphData.nodes);
            
            graphData.nodes.forEach(node => {
                if (node.x !== undefined && node.y !== undefined && node.z !== undefined) {
                    // Track max distance from graph center
                    const distX = node.x - graphCenter.x;
                    const distY = node.y - graphCenter.y;
                    const distZ = node.z;
                    const distance = Math.sqrt(distX * distX + distY * distY + distZ * distZ);
                    maxDistance = Math.max(maxDistance, distance);
                    
                    // Track max component values to determine aspect ratio
                    maxX = Math.max(maxX, Math.abs(distX));
                    maxY = Math.max(maxY, Math.abs(distY));
                    maxZ = Math.max(maxZ, Math.abs(distZ));
                }
            });
            
            // Adjust for aspect ratio of the graph (nodes might be spread more in one direction)
            const aspectRatio = Math.max(maxX / maxZ, maxZ / maxX, maxY / maxZ, maxZ / maxY, 1);
            
            // Add margin to ensure all nodes are visible
            maxDistance *= 2.0;
            
            // Calculate optimal distance based on current viewport
            const optimalDistance = calculateOptimalCameraDistance();
            
            // Use the greater of calculated distance or optimal distance
            const finalDistance = Math.max(maxDistance, optimalDistance);
            
            let targetPos;
            
            // If easeOnly is true, use current camera direction but adjust distance
            if (easeOnly) {
                const currentDist = Math.hypot(currentPos.x, currentPos.y, currentPos.z);
                targetPos = { 
                    x: currentPos.x * (finalDistance / currentDist),
                    y: currentPos.y * (finalDistance / currentDist),
                    z: currentPos.z * (finalDistance / currentDist)
                };
            } 
            // If improveXY is true, position camera to view from graph center angle
            else if (improveXY) {
                // Use the graph center X/Y position to improve camera angle
                targetPos = { 
                    x: graphCenter.x * 0.2, // Slightly offset from center
                    y: graphCenter.y * 0.2, // Slightly offset from center
                    z: finalDistance 
                };
            }
            // Default back to centered position
            else {
                targetPos = { 
                    x: 0, 
                    y: 0, 
                    z: finalDistance 
                };
            }
            
            // Determine where to look at - either centered or at graph center
            const lookAt = improveXY ? 
                { x: graphCenter.x, y: graphCenter.y, z: 0 } : 
                { x: 0, y: 0, z: 0 };
            
            // Smooth transition to the new position
            graph.cameraPosition(
                targetPos,      // Position camera 
                lookAt,         // Look at center point
                duration,       // Animation duration
                (p) => {        // Easing function for smoother motion
                    // Improved cubic easing for more natural movement
                    return p < 0.5 ? 4*p*p*p : 1-Math.pow(-2*p+2,3)/2;
                }
            );
            
            console.log("Camera positioned to view all nodes at distance:", finalDistance, 
                       "looking at:", lookAt, "from position:", targetPos);
        }

        // Calculate center position of graph nodes (weighted by importance)
        function calculateGraphCenter(nodes) {
            if (!nodes || nodes.length === 0) return { x: 0, y: 0 };
            
            let totalWeight = 0;
            let weightedX = 0;
            let weightedY = 0;
            
            // Calculate weighted center based on node size/importance
            nodes.forEach(node => {
                if (node.x === undefined || node.y === undefined) return;
                
                // Use node size or value as weight, with a minimum weight of 1
                const weight = (node.size || node.val || 1);
                totalWeight += weight;
                weightedX += node.x * weight;
                weightedY += node.y * weight;
            });
            
            // Return weighted center or default to origin
            if (totalWeight > 0) {
                return {
                    x: weightedX / totalWeight,
                    y: weightedY / totalWeight
                };
            }
            
            return { x: 0, y: 0 };
        }

        // Start initialization immediately
        checkDependenciesAndInit();
    });
})();

/**
 * Graph Initialization and Configuration
 * Implements the 3D force-directed graph visualization
 */

// Initialize variables
let Graph = null;
let graphData = null;

// Helper functions for the external graph initialization
function getNodeColor(node) {
    // Main categories with distinct colors
    if (node.id === 'center') return '#ffd700';  // Gold for center
    else if (node.id === 'professional') return '#2563eb';  // Blue
    else if (node.id === 'repositories') return '#16a34a';  // Green
    else if (node.id === 'personal') return '#db2777';  // Pink
    
    // Sub-nodes with lighter colors
    else if (node.parentId === 'professional') return '#4a90e2';  // Lighter blue
    else if (node.parentId === 'repositories') return '#2ecc71';  // Lighter green
    else if (node.parentId === 'personal') return '#ff6b81';  // Lighter pink
    else return '#94a3b8';  // Default gray
}

function getLinkWidth(link) {
    // You can customize this based on link properties
    return link.value || 1;
}

function getLinkColor(link) {
    // You can customize this based on link properties
    return '#ffffff30';
}

function createNodeObject(node) {
    // Determine node size based on visualization settings or defaults
    const size = node.visualization?.size || node.size || 3;
    
    // Get appropriate color
    const color = node.color || getNodeColor(node);
    
    // Set quality level based on node importance
    const segments = 
        node.id === 'center' ? 32 : 
        ['professional', 'repositories', 'personal'].includes(node.id) ? 24 : 16;
    
    // Create sphere with modern naming (fix deprecated SphereBufferGeometry)
    const geometry = new THREE.SphereGeometry(size, segments, segments);
    const material = new THREE.MeshPhongMaterial({
        color: color,
        shininess: 80,
        transparent: true,
        opacity: 0.9
    });
    
    return new THREE.Mesh(geometry, material);
}

// Initialize the graph when document is ready
document.addEventListener('DOMContentLoaded', function() {
    const graphContainer = document.getElementById('graph-container');
    
    // Wait for network data to be available (assuming it's set by network-data.js)
    if (typeof NetworkData !== 'undefined') {
        initializeGraph(NetworkData);
    } else {
        console.error('Network data not available');
    }
});

/**
 * Initialize the 3D force graph with the provided data
 * @param {Object} data - The graph data containing nodes and links
 */
function initializeGraph(data) {
    // Create a copy of the data to avoid modifying the original
    graphData = JSON.parse(JSON.stringify(data));
    
    // Find the center node
    const centerNode = graphData.nodes.find(node => node.id === 'center');
    
    // Initialize node positions using our custom layout
    if (typeof GraphLayout !== 'undefined') {
        GraphLayout.initializePositions(graphData.nodes, graphData.links, centerNode);
    }
    
    // Create the 3D force graph
    Graph = ForceGraph3D({ extraRenderers: [] })(document.getElementById('graph-container'))
        .graphData(graphData)
        .nodeLabel(node => node.name)
        .nodeColor(node => node.color || getNodeColor(node))
        .nodeVal(node => node.visualization?.val || 15)
        .nodeThreeObject(node => createNodeObject(node))
        .linkWidth(link => getLinkWidth(link))
        .linkColor(link => getLinkColor(link))
        .linkOpacity(0.5)
        .linkDirectionalParticles(4)
        .linkDirectionalParticleWidth(2)
        .linkDirectionalParticleSpeed(0.005)
        .onNodeClick(handleNodeClick)
        .onBackgroundClick(handleBackgroundClick);
    
    // Apply custom force configuration
    if (typeof GraphLayout !== 'undefined') {
        GraphLayout.applyForceConfiguration(Graph);
    }
    
    // Make graph globally available
    window.Graph = Graph;
    
    // Calculate initial distance and set camera position
    const initialDistance = 1500; // Temporary initial position
    Graph.cameraPosition({ x: 0, y: 0, z: initialDistance }, { x: 0, y: 0, z: 0 }, 0);
    
    // Set up controls for zoom and camera
    setupGraphControls();
    
    // Set up viewport observer to maintain proper view on resize
    if (window.CameraManager) {
        window.CameraManager.setupViewportObserver(Graph);
    }
    
    // Hide loading screen after a brief delay
    setTimeout(() => {
        document.querySelector('.loading-screen').classList.add('fade-out');
        
        // Use camera manager to position camera after force simulation has settled
        setTimeout(() => {
            document.querySelector('.loading-screen').style.display = 'none';
            
            // Position camera to view all nodes
            if (window.CameraManager) {
                window.CameraManager.fitAllNodes(Graph, 1000);
            }
        }, 500);
    }, 1000);
    
    // Define global functions for other components to use
    window.focusOnNode = (nodeId, showContentAfter) => {
        if (window.CameraManager) {
            const success = window.CameraManager.focusOnNode(Graph, nodeId, 1000);
            
            if (success && showContentAfter) {
                setTimeout(() => {
                    const event = new CustomEvent('nodeClick', {
                        detail: { id: nodeId, showContent: true }
                    });
                    window.dispatchEvent(event);
                }, 1000);
            }
            return success;
        }
        return false;
    };
    
    window.resetGraphView = () => {
        if (window.CameraManager) {
            window.CameraManager.resetToHomeView(Graph, 800);
        }
        
        // If there's a content panel open, hide it
        const contentPanel = document.getElementById('content-panel');
        if (contentPanel) {
            contentPanel.classList.add('hidden');
        }
    };
    
    // Emit graph loaded event
    window.dispatchEvent(new Event('graphLoaded'));
}

/**
 * Handle node click event
 * @param {Object} node - Clicked node
 */
function handleNodeClick(node) {
    if (!node) return;
    
    // Use CameraManager to focus on node if available
    if (window.CameraManager) {
        window.CameraManager.focusOnNode(Graph, node, 1000);
    }
    
    // Dispatch event to show content after camera movement
    setTimeout(() => {
        const event = new CustomEvent('nodeClick', {
            detail: { id: node.id, showContent: true }
        });
        window.dispatchEvent(event);
    }, 1000);
}

/**
 * Handle background click event
 */
function handleBackgroundClick() {
    // Reset camera to home view using CameraManager
    if (window.CameraManager) {
        window.CameraManager.resetToHomeView(Graph, 800);
    }
    
    // Hide content panel
    const contentPanel = document.getElementById('content-panel');
    if (contentPanel) {
        contentPanel.classList.add('hidden');
    }
}

/**
 * Set up graph controls for zoom and camera
 */
function setupGraphControls() {
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const resetCameraBtn = document.getElementById('reset-camera');
    const resetViewBtn = document.getElementById('resetView');
    
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            const { x, y, z } = Graph.cameraPosition();
            const distance = Math.sqrt(x*x + y*y + z*z);
            const scale = 0.8;
            Graph.cameraPosition({
                x: x * scale, y: y * scale, z: z * scale
            }, undefined, 300);
        });
    }
    
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            const { x, y, z } = Graph.cameraPosition();
            const scale = 1.25;
            Graph.cameraPosition({
                x: x * scale, y: y * scale, z: z * scale
            }, undefined, 300);
        });
    }
    
    if (resetCameraBtn) {
        resetCameraBtn.addEventListener('click', () => {
            if (window.CameraManager) {
                window.CameraManager.resetToHomeView(Graph, 800);
            }
        });
    }
    
    if (resetViewBtn) {
        resetViewBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.CameraManager) {
                window.CameraManager.resetToHomeView(Graph, 800);
            }
            
            // Hide content panel
            const contentPanel = document.getElementById('content-panel');
            if (contentPanel) {
                contentPanel.classList.add('hidden');
            }
        });
    }
}

// ... existing code ...
