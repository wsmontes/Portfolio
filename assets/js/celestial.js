// Enhanced celestial computations for orbital dynamics and label scaling

function updateCelestialBodies(celestialBodies, dt) {
    Object.values(celestialBodies).forEach(body => {
        const { node, mesh } = body;
        // Self-rotation update
        if (node.rotationSpeed && mesh) {
            mesh.rotation.y += node.rotationSpeed * dt;
        }
        // Updated orbital movement for smooth animation
        if (node.parentId && node.orbitRadius && node.orbitSpeed) {
            const parent = celestialBodies[node.parentId];
            if (parent && parent.node) {
                const angle = (Date.now() * node.orbitSpeed * 0.001) % (Math.PI * 2);
                const orbitX = Math.cos(angle) * node.orbitRadius;
                const orbitZ = Math.sin(angle) * node.orbitRadius;
                const inclination = node.orbitAngle || 0;
                const inclinedX = orbitX;
                const inclinedZ = orbitZ * Math.cos(inclination);
                const inclinedY = orbitZ * Math.sin(inclination);
                node.x = parent.node.x + inclinedX;
                node.y = parent.node.y + inclinedY;
                node.z = parent.node.z + inclinedZ;
            }
        }
    });
}

function scaleCelestialLabels(celestialBodies, cameraDistance) {
    // Adjust labels so they remain legible regardless of zoom
    Object.values(celestialBodies).forEach(body => {
        if (body.label) {
            const scale = Math.max(0.5, Math.min(1.5, cameraDistance / 200));
            body.label.scale.set(scale, scale, scale);
        }
    });
}

window.celestialUtils = {
    updateCelestialBodies,
    scaleCelestialLabels
};
