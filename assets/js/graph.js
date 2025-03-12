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
        const CONTENT_DELAY = 800; // Slightly less than camera animation to feel responsive
        
        // Initialize the graph with dynamically generated network data
        async function initGraph() {
            // Make sure THREE and ForceGraph3D are loaded
            if (typeof THREE === 'undefined' || typeof ForceGraph3D !== 'function') {
                console.warn('Required libraries not loaded yet, retrying...');
                setTimeout(initGraph, 100);
                return;
            }
            
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
                    .linkWidth(link => link.value * 1.2) // Increased for better visibility with larger nodes
                    .linkOpacity(0.6)
                    .linkDirectionalParticles(3)
                    .linkDirectionalParticleSpeed(0.002) // Reduced from 0.005 to 0.002 for slower particles
                    .linkDirectionalParticleWidth(4.0) // Increased to match larger nodes
                    .linkColor(() => '#ffffff30')
                    .onNodeHover(handleNodeHover)
                    .onNodeClick(handleNodeClick)
                    .onBackgroundClick(hidePanel)
                    .onEngineStop(() => {
                        hideLoadingScreen();
                    });
                
                // Setup force physics for better node positioning
                graph.d3Force('charge').strength(-120);
                graph.d3Force('link').distance(link => {
                    // Adjust link distance based on node types
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
                
                // Add frame loop for animations
                graph.onEngineTick(() => {
                    if (window.animateNodes) {
                        window.animateNodes(graph.nodeThreeObjectExtend(), 0.016);
                    }
                });
                
                // Mount to container
                graph(graphElement);
                
                // Set initial camera position
                graph.cameraPosition({ x: 0, y: 0, z: 220 }, { x: 0, y: 0, z: 0 }, 1000);
                
                // Setup controls
                setupControls();

                // Make focusOnNode function available globally
                window.focusOnNode = (nodeId, showContentAfter = false) => {
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
                    graph.cameraPosition({ 
                        x: 0, y: 0, z: 240 
                    }, { x: 0, y: 0, z: 0 }, 800);
                    
                    // If there's a content panel open, hide it
                    hidePanel();
                };
                
                // Emit graph loaded event after short delay to ensure rendering
                setTimeout(() => {
                    window.dispatchEvent(new Event('graphLoaded'));
                }, 1000);
                
                // Setup zoom control buttons
                setupZoomControls(graph);
            } catch (error) {
                console.error('Error initializing graph:', error);
                hideLoadingScreen();
            }
        }
        
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
        
        // Setup camera/zoom controls
        function setupControls() {
            // Zoom in button
            if (zoomInBtn) {
                zoomInBtn.addEventListener('click', () => {
                    if (!graph) return;
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
                    graph.cameraPosition({ 
                        x: 0, y: 0, z: 240 
                    }, { x: 0, y: 0, z: 0 }, 800);
                });
            }
            
            // Reset view link
            if (resetViewBtn) {
                resetViewBtn.addEventListener('click', e => {
                    e.preventDefault();
                    if (!graph) return;
                    graph.cameraPosition({ 
                        x: 0, y: 0, z: 240 
                    }, { x: 0, y: 0, z: 0 }, 800);
                    
                    hidePanel();
                });
            }
            
            // Section navigation
            if (navItems) {
                navItems.forEach(item => {
                    item.addEventListener('click', function(e) {
                        e.preventDefault();
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
        }
        
        // Node click handler
        function handleNodeClick(node) {
            if (!node) return;
            
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
        
        // Loading screen functions
        function hideLoadingScreen() {
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
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
        
        // Start initialization
        initGraph();
        
        // Fallback for loading screen
        setTimeout(hideLoadingScreen, 12000); // Increased timeout for network data generation
    });
})();
