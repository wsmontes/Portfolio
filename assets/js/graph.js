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
        
        // Initialize the graph with high-quality nodes
        function initGraph() {
            // Make sure THREE and ForceGraph3D are loaded
            if (typeof THREE === 'undefined' || typeof ForceGraph3D !== 'function') {
                console.warn('Required libraries not loaded yet, retrying...');
                setTimeout(initGraph, 100);
                return;
            }
            
            // Create graph with enhanced node quality
            graph = ForceGraph3D()
                .backgroundColor('#000008')
                .graphData(NetworkData)
                .nodeLabel(node => `${node.name}: ${node.description}`)
                .nodeRelSize(8)
                .nodeThreeObject(createHighQualityNode) // Use our custom node renderer
                .linkWidth(0.8)
                .linkOpacity(0.4)
                .linkDirectionalParticles(4)
                .linkDirectionalParticleSpeed(0.003)
                .linkDirectionalParticleWidth(1.5)
                .linkColor(() => '#ffffff50')
                .onNodeClick(handleNodeClick)
                .onNodeHover(handleNodeHover)
                .onBackgroundClick(hidePanel)
                .onEngineStop(() => {
                    hideLoadingScreen();
                });
            
            // Mount to container
            graph(graphElement);
            
            // Set initial camera position
            graph.cameraPosition({ x: 100, y: 100, z: 250 }, { x: 0, y: 0, z: 0 }, 1000);
            
            // Setup controls
            setupControls();
            
            console.log("Graph initialized successfully!");
        }
        
        // Custom function to create high-quality nodes
        function createHighQualityNode(node) {
            // Create group to hold the node objects
            const group = new THREE.Group();
            
            // Determine node size
            const size = (node.val || 10) / 3;
            
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
            
            // Create high-quality geometry with more segments for smoother appearance
            // Important nodes get more segments for better quality
            const segments = 
                node.id === 'center' ? 32 : 
                ['professional', 'repositories', 'personal'].includes(node.id) ? 24 : 16;
            
            const geometry = new THREE.SphereGeometry(size, segments, segments);
            
            // Create material with better appearance
            const material = new THREE.MeshPhongMaterial({ 
                color: color,
                shininess: 80,
                transparent: true,
                opacity: 0.9
            });
            
            // Create mesh and add to group
            const mesh = new THREE.Mesh(geometry, material);
            
            // Add slow rotation animation
            const rotationSpeed = Math.random() * 0.01 + 0.002;
            mesh.userData = { rotationSpeed };
            
            // Start the rotation animation
            animateRotation(mesh);
            
            group.add(mesh);
            return group;
        }
        
        // Animate node rotation
        function animateRotation(mesh) {
            requestAnimationFrame(() => animateRotation(mesh));
            if (mesh && mesh.userData && mesh.userData.rotationSpeed) {
                mesh.rotation.y += mesh.userData.rotationSpeed;
                mesh.rotation.z += mesh.userData.rotationSpeed * 0.3;
            }
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
        }
        
        // Node hover handler
        function handleNodeHover(node) {
            // Change cursor
            graphElement.style.cursor = node ? 'pointer' : null;
            
            if (!graph) return;
            
            // Simple highlight effect
            graph.nodeColor(n => {
                if (n === node) {
                    // Highlight hovered node
                    return node.id === 'center' ? '#fff8b9' : // Brighter gold
                           node.id === 'professional' ? '#6495ed' : // Brighter blue
                           node.id === 'repositories' ? '#3cb371' : // Brighter green
                           node.id === 'personal' ? '#ff69b4' : // Brighter pink
                           '#d3d3d3'; // Brighter gray
                } else {
                    // Regular colors for other nodes
                    return n.id === 'center' ? '#ffd700' : // Gold
                           n.id === 'professional' ? '#2563eb' : // Blue
                           n.id === 'repositories' ? '#16a34a' : // Green
                           n.id === 'personal' ? '#db2777' : // Pink
                           n.parentId === 'professional' ? '#4a90e2' : // Lighter blue
                           n.parentId === 'repositories' ? '#2ecc71' : // Lighter green
                           n.parentId === 'personal' ? '#ff6b81' : // Lighter pink
                           '#94a3b8'; // Default gray
                }
            });
        }
        
        // Node click handler
        function handleNodeClick(node) {
            if (!node || !graph) return;
            
            // Return early if it's the center/portfolio node - don't trigger any action
            if (node.id === 'center') return;
            
            // Determine suitable camera distance
            let distance = 120;
            if (['professional', 'repositories', 'personal'].includes(node.id)) distance = 100;
            
            // Calculate target position
            const distRatio = 1 + distance/Math.hypot(node.x || 0, node.y || 0, node.z || 0);
            
            // Move camera
            graph.cameraPosition(
                { 
                    x: (node.x || 0) * distRatio, 
                    y: (node.y || 0) * distRatio, 
                    z: (node.z || 0) * distRatio 
                },
                node, 
                1200
            );
            
            // Show content panel for main sections
            if (['professional', 'repositories', 'personal'].includes(node.id)) {
                setTimeout(function() {
                    showSectionContent(node.id);
                }, 1000);
            }
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
        function showSectionContent(sectionId) {
            // Map node IDs to template IDs
            let templateId;
            
            // Map the main section nodes to appropriate templates
            if (sectionId === 'professional') {
                templateId = 'professional-template';
            } else if (sectionId === 'repositories') {
                templateId = 'repositories-template';
            } else if (sectionId === 'personal') {
                templateId = 'personal-template';
            } else {
                templateId = `${sectionId}-template`; // Default mapping
            }
            
            const template = document.getElementById(templateId);
            
            if (!template) {
                console.warn(`Template not found for section: ${sectionId}, template ID: ${templateId}`);
                return;
            }
            
            contentInner.innerHTML = '';
            contentInner.appendChild(template.content.cloneNode(true));
            contentPanel.classList.remove('hidden');
            
            // Setup close button functionality
            const closeButton = document.querySelector('.close-panel');
            if (closeButton) {
                closeButton.addEventListener('click', hidePanel);
            }
            
            // Setup filter buttons if any
            setupFilterButtons();
            
            // Load dynamic content if needed
            if (sectionId === 'repositories') loadProjectsData();
            if (sectionId === 'personal') loadPhotographyData();
        }
        
        function hidePanel() {
            contentPanel.classList.add('hidden');
            
            // Reset camera to home position when panel is closed
            if (graph) {
                // Use smooth animation to return to default view
                graph.cameraPosition({ 
                    x: 0, y: 0, z: 240 
                }, { x: 0, y: 0, z: 0 }, 800);
            }
        }
        
        // Rest of your existing functions
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
        
        function loadProjectsData() {
            fetch('projects.json')
                .then(response => response.json())
                .then(data => {
                    const projectsGrid = document.querySelector('.projects-grid');
                    if (!projectsGrid) return;
                    
                    projectsGrid.innerHTML = '';
                    
                    data.projects.forEach(project => {
                        const projectCard = document.createElement('div');
                        projectCard.className = `project-card ${project.category}`;
                        
                        projectCard.innerHTML = `
                            <div class="project-image" style="background-image: url('${project.image}')"></div>
                            <div class="project-info">
                                <h3 class="project-title">${project.title}</h3>
                                <p>${project.description}</p>
                                <div class="project-tech">
                                    ${project.technologies.map(tech => `<span class="project-tech-tag">${tech}</span>`).join('')}
                                </div>
                                <div class="project-links" style="margin-top: 15px">
                                    <a href="${project.liveUrl}" class="btn primary" target="_blank">View Live</a>
                                    <a href="${project.githubUrl}" class="btn secondary" target="_blank">GitHub</a>
                                </div>
                            </div>
                        `;
                        
                        projectsGrid.appendChild(projectCard);
                    });
                })
                .catch(error => {
                    console.error('Error loading projects:', error);
                });
        }
        
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
        setTimeout(hideLoadingScreen, 8000);
    });
})();
