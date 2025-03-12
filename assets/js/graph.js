// Ensure THREE access from ForceGraph3D
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
        
        // Initialize the graph
        function initGraph() {
            // Make sure ForceGraph3D is loaded before proceeding
            if (typeof ForceGraph3D !== 'function') {
                console.warn('ForceGraph3D not loaded yet, retrying...');
                setTimeout(initGraph, 100);
                return;
            }

            // Basic setup without celestial themes - just a clean 3D graph
            graph = ForceGraph3D()
                .backgroundColor('#000000')
                .graphData(NetworkData)
                .nodeLabel(node => `${node.name}: ${node.description}`)
                .nodeRelSize(6)
                .nodeColor(node => {
                    // Basic color scheme
                    if (node.id === 'center') return '#ffd700';
                    if (node.id === 'professional') return '#2563eb';
                    if (node.id === 'repositories') return '#16a34a';
                    if (node.id === 'personal') return '#db2777';
                    if (node.parentId === 'professional') return '#4a90e2';
                    if (node.parentId === 'repositories') return '#2ecc71';
                    if (node.parentId === 'personal') return '#ff6b81';
                    return '#94a3b8';
                })
                .linkWidth(0.5)
                .linkOpacity(0.4)
                .linkDirectionalParticles(2)
                .linkColor(() => '#ffffff50')
                .onNodeClick(handleNodeClick)
                .onEngineStop(() => {
                    hideLoadingScreen();
                });
            
            // Mount to container
            graph(graphElement);
            
            // Set initial camera position
            graph.cameraPosition({ x: 0, y: 0, z: 240 });
            
            // Setup controls
            setupControls();
        }
        
        // Setup zoom and camera controls
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
        
        // Handle node click
        function handleNodeClick(node) {
            if (!node || !graph) return;
            
            // Determine suitable camera distance based on node type
            let distance = 120;
            if (node.id === 'center') distance = 200;
            else if (['professional', 'repositories', 'personal'].includes(node.id)) distance = 100;
            
            // Move camera to look at node
            const distRatio = 1 + distance/Math.hypot(node.x || 0, node.y || 0, node.z || 0);
            graph.cameraPosition(
                { 
                    x: (node.x || 0) * distRatio, 
                    y: (node.y || 0) * distRatio, 
                    z: (node.z || 0) * distRatio 
                },
                node, 
                1000
            );
            
            // Show content panels based on node type
            if (node.id === 'center') {
                hidePanel();
            }
            else if (['professional', 'repositories', 'personal'].includes(node.id)) {
                showSectionContent(node.id);
            }
        }
        
        // Show content panel with section data
        function showSectionContent(sectionId) {
            const templateId = `${sectionId}-template`;
            const template = document.getElementById(templateId);
            
            if (!template) return;
            
            contentInner.innerHTML = '';
            contentInner.appendChild(template.content.cloneNode(true));
            contentPanel.classList.remove('hidden');
            
            // Setup filter buttons if any
            setupFilterButtons();
            
            // Load dynamic content if needed
            if (sectionId === 'projects') loadProjectsData();
            if (sectionId === 'photography') loadPhotographyData();
        }
        
        // Hide content panel
        function hidePanel() {
            contentPanel.classList.add('hidden');
        }
        
        // Hide loading screen
        function hideLoadingScreen() {
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
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
        
        // Load projects data
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
        
        // Close panel button
        if (closePanel) {
            closePanel.addEventListener('click', hidePanel);
        }
        
        // Start initialization
        initGraph();
        
        // Fallback for loading screen
        setTimeout(hideLoadingScreen, 8000);
    });
})();
