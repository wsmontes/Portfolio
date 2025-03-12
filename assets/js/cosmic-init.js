document.addEventListener('DOMContentLoaded', function() {
    // ...existing DOM element references...
    
    // Add missing createCelestialBody function if not defined
    window.createCelestialBody = window.createCelestialBody || function(node) {
        const group = new THREE.Group();
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry((node.val || 10) / 3, 16, 16),
            new THREE.MeshLambertMaterial({ 
                color: node.group === 'star' ? '#ffd700' : '#4a6cf7', 
                transparent: true, 
                opacity: 0.9 
            })
        );
        group.add(sphere);
        return group;
    };

    // Update loading message with cinematic feel
    function updateLoadingMessage(message) {
        const loadingMessage = document.querySelector('.loading-screen p');
        if (loadingMessage) {
            loadingMessage.textContent = message;
        }
    }
    
    // At the beginning, ensure createStarfield exists (using the one defined in graph.js)
    if (typeof createStarfield !== 'function') {
        // Optionally, define it here as well or reference the global one:
        window.createStarfield = function(container) {
            // ...existing code for starfield creation...
            // (Replicate the implementation from graph.js if needed)
        };
    }

    // Initialize the force graph with cinematic camera transitions and responsive controls
    function initForceGraph() {
        graph = ForceGraph3D({
            controlType: 'orbit',
            rendererConfig: { 
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance'
            }
        })
        // Set background to pure black and enable a cosmic starfield effect
        .backgroundColor('#000')
        .graphData(NetworkData)
        .nodeLabel(n => `${n.name}\n${n.description}`)
        // Use the global createCelestialBody function
        .nodeThreeObject(n => window.createCelestialBody(n))
        .nodeThreeObjectExtend(false)
        .enableNodeDrag(false)
        // Enable full mouse navigation controls
        .enableNavigationControls(true)
        .linkOpacity(0.2)
        .linkWidth(link => link.value * 0.5)
        .linkDirectionalParticles(4)
        .linkDirectionalParticleSpeed(0.004)
        .onNodeHover(node => {
             // Show pointer when hovering clickable nodes
             graphElement.style.cursor = node ? 'pointer' : 'default';
        })
        .onNodeClick(n => window.handleNodeClick(n))
        .onBackgroundClick(handleSpaceClick)
        .d3AlphaDecay(0.02)
        .d3VelocityDecay(0.15)
        .cooldownTime(3000)
        .onEngineStop(() => {
            console.log("Cosmic system stabilized");
            hideLoadingScreen();
            startOrbitalAnimation();
            // Cinematic transition to overview after stabilization
            setTimeout(() => resetViewWithAnimation(), 600);
        });
        
        // Add ambient lighting and dramatic point lights for stellar effects
        const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
        graph.scene().add(ambientLight);
        const starLight = new THREE.PointLight(0xffffcc, 1.5, 500);
        starLight.position.set(0, 0, 0);
        graph.scene().add(starLight);
        
        // ...existing code to add graph to container...
        graph(document.getElementById('graph-container'));
        
        // Responsive canvas sizing
        window.addEventListener('resize', handleResize);
    }
    
    function handleResize() {
        graph.width(window.innerWidth);
        graph.height(window.innerHeight);
    }
    
    // ...existing helper functions (createStarfield, setupNavigationControls, hideLoadingScreen)...
    
    // Main initialization call
    function init() {
        if (typeof THREE === 'undefined') {
            console.warn('THREE.js not loaded yet, retrying...');
            return setTimeout(init, 100);
        }
        updateLoadingMessage("Creating starfield...");
        // Use the global createStarfield function
        window.createStarfield(document.getElementById('stars-container'));
        updateLoadingMessage("Forming celestial bodies...");
        initForceGraph();
        setupNavigationControls();
        // NEW: Start automatic camera rotation
        autoRotateCamera();
    }
    
    init();
});
