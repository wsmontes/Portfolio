/**
 * Enhanced node creation for beautiful and smooth 3D force graph
 */
(function() {
    // Ensure THREE is properly initialized before using it
    function initCelestialBodies(ForceGraph3D) {
        // Wait for THREE to be available from ForceGraph3D
        if (!ForceGraph3D.hasOwnProperty('three') || !ForceGraph3D.three || typeof ForceGraph3D.three !== 'object') {
            console.warn("THREE not available from ForceGraph3D yet, retrying...");
            // Make sure we have an exit condition for the retry mechanism
            if (window._celestialRetryCount === undefined) {
                window._celestialRetryCount = 0;
            }
            
            if (window._celestialRetryCount < 10) { // Limit retries to avoid infinite loop
                window._celestialRetryCount++;
                setTimeout(() => initCelestialBodies(ForceGraph3D), 300);
                return;
            } else {
                console.error("Failed to initialize celestial bodies after multiple retries");
                return;
            }
        }
        
        // Reset retry counter
        window._celestialRetryCount = 0;
        
        // Now THREE should be available
        const THREE = ForceGraph3D.three;
        
        console.log("THREE initialized successfully from ForceGraph3D");
        
        // Cache for materials and geometries to improve performance
        const materialCache = {};
        const geometryCache = {};
        
        // Create enhanced node with beautiful materials and effects
        function createEnhancedNode(node) {
            const group = new THREE.Group();
            const size = node.size || (node.val || 100) / 2.5; // Doubled from 50 to 100
            
            // Get color based on node type with enhanced palette
            let color, emissive, metalness, roughness;
            
            // Main categories with distinct visual styles
            if (node.id === 'center') {
                color = '#ffd700'; emissive = '#ff8f00'; metalness = 0.3; roughness = 0.2;
            } 
            else if (node.id === 'professional') {
                color = '#2563eb'; emissive = '#0c4a9e'; metalness = 0.7; roughness = 0.3;
            } 
            else if (node.id === 'repositories') {
                color = '#16a34a'; emissive = '#064e3b'; metalness = 0.5; roughness = 0.4;
            } 
            else if (node.id === 'personal') {
                color = '#db2777'; emissive = '#831843'; metalness = 0.6; roughness = 0.3;
            }
            else if (node.parentId === 'professional') {
                color = '#4a90e2'; emissive = '#1e40af'; metalness = 0.8; roughness = 0.2;
            } 
            else if (node.parentId === 'repositories') {
                color = '#2ecc71'; emissive = '#047857'; metalness = 0.6; roughness = 0.3;
            } 
            else if (node.parentId === 'personal') {
                color = '#ff6b81'; emissive = '#9d174d'; metalness = 0.7; roughness = 0.2;
            } 
            else {
                color = '#94a3b8'; emissive = '#334155'; metalness = 0.5; roughness = 0.5;
            }
            
            // Create high-quality geometry with more segments for smoother appearance
            const geometryKey = `sphere-${size}`;
            if (!geometryCache[geometryKey]) {
                // Increased segments for even smoother appearance on larger nodes
                const segments = node.id === 'center' ? 64 : 
                              ['professional', 'repositories', 'personal'].includes(node.id) ? 48 : 36;
                geometryCache[geometryKey] = new THREE.SphereGeometry(size, segments, segments);
            }
            const geometry = geometryCache[geometryKey];
            
            // Create advanced material with improved appearance
            const materialKey = `${color}-${emissive}-${metalness}-${roughness}`;
            if (!materialCache[materialKey]) {
                materialCache[materialKey] = new THREE.MeshPhysicalMaterial({ 
                    color: color,
                    emissive: emissive,
                    emissiveIntensity: 0.4,
                    metalness: metalness, 
                    roughness: roughness,
                    transparent: true,
                    opacity: 0.95,
                    reflectivity: 0.5,
                    clearcoat: 0.3,
                    clearcoatRoughness: 0.25
                });
            }
            
            // Create the main sphere mesh
            const mesh = new THREE.Mesh(geometry, materialCache[materialKey]);
            
            // Add userData for animations
            mesh.userData = { 
                rotationSpeed: node.rotationSpeed || (Math.random() * 0.008) + 0.002, // Slightly reduced
                pulseSpeed: (Math.random() * 0.0015) + 0.0008, // Slightly reduced
                originalScale: 1
            };
            
            group.add(mesh);
            return group;
        }
        
        // Make available globally
        window.createBasicNode = createEnhancedNode;
        window.createCelestialBody = createEnhancedNode;
        
        // Animation function for nodes
        window.animateNodes = function(nodes, delta) {
            Object.values(nodes || {}).forEach(nodeObj => {
                if (!nodeObj || !nodeObj.group) return;
                
                nodeObj.group.children.forEach(child => {
                    if (child instanceof THREE.Mesh && child.userData.rotationSpeed) {
                        child.rotation.y += child.userData.rotationSpeed * delta;
                        child.rotation.z += child.userData.rotationSpeed * 0.5 * delta;
                        
                        // Subtle breathing/pulsing effect
                        const pulse = Math.sin(Date.now() * child.userData.pulseSpeed) * 0.03 + 1;
                        child.scale.set(pulse, pulse, pulse);
                    }
                });
            });
        };
        
        console.log("Celestial bodies module initialized successfully");
    }
    
    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initCelestialBodies(ForceGraph3D));
    } else {
        // DOM already ready, run immediately
        initCelestialBodies(ForceGraph3D);
    }
})();
