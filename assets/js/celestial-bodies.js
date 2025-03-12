/**
 * Basic node creation for the 3D force graph
 */
(function() {
    // Get THREE from ForceGraph3D
    const THREE = ForceGraph3D.THREE;

    // Create basic node
    function createBasicNode(node) {
        const group = new THREE.Group();
        const size = (node.val || 10) / 3;
        
        // Get color based on node type
        let color = '#94a3b8'; // Default gray
        
        // Main categories
        if (node.id === 'center') color = '#ffd700'; // Gold for center
        else if (node.id === 'professional') color = '#2563eb'; // Blue
        else if (node.id === 'repositories') color = '#16a34a'; // Green
        else if (node.id === 'personal') color = '#db2777'; // Pink
        
        // Sub-nodes based on parent
        else if (node.parentId === 'professional') color = '#4a90e2'; // Lighter blue
        else if (node.parentId === 'repositories') color = '#2ecc71'; // Lighter green
        else if (node.parentId === 'personal') color = '#ff6b81'; // Lighter pink
        
        // Create sphere
        const geometry = new THREE.SphereGeometry(size, 32, 32);
        const material = new THREE.MeshLambertMaterial({ 
            color: color, 
            transparent: true, 
            opacity: 0.9 
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        group.add(mesh);
        
        return group;
    }
    
    // Make available globally
    window.createBasicNode = createBasicNode;
    window.createCelestialBody = createBasicNode; // For backward compatibility
})();
