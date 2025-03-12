/**
 * Texture utilities for creating procedural textures for the cosmic portfolio
 */

// Cache for generated textures
const textureCache = {};

/**
 * Creates a texture for the sun (central portfolio hub)
 * @returns {THREE.CanvasTexture} The generated sun texture
 */
function createSunTexture() {
    if (textureCache.sun) return textureCache.sun;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Create radial gradient for sun-like appearance
    const gradient = ctx.createRadialGradient(
        512, 512, 0,
        512, 512, 512
    );
    
    // Sun colors
    gradient.addColorStop(0, '#fffad4');
    gradient.addColorStop(0.2, '#fff5a0');
    gradient.addColorStop(0.4, '#ffde50');
    gradient.addColorStop(0.6, '#ffab30');
    gradient.addColorStop(0.8, '#ff5e20');
    gradient.addColorStop(1, '#b30d00');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 1024);
    
    // Create solar prominences and sunspots
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const size = Math.random() * 80 + 20;
        const dist = Math.sqrt(Math.pow(x - 512, 2) + Math.pow(y - 512, 2));
        
        if (dist < 480) {
            // Draw a sunspot 
            if (Math.random() > 0.7) {
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(150, 30, 0, ${Math.random() * 0.5 + 0.3})`;
                ctx.fill();
            } 
            // Draw a solar prominence 
            else {
                const gradientProm = ctx.createRadialGradient(
                    x, y, 0,
                    x, y, size
                );
                
                gradientProm.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
                gradientProm.addColorStop(0.4, 'rgba(255, 190, 100, 0.6)');
                gradientProm.addColorStop(1, 'rgba(255, 100, 50, 0)');
                
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fillStyle = gradientProm;
                ctx.fill();
            }
        }
    }
    
    // Create surface details
    for (let i = 0; i < 5000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const size = Math.random() * 3 + 1;
        const dist = Math.sqrt(Math.pow(x - 512, 2) + Math.pow(y - 512, 2));
        
        if (dist < 500) {
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, ${Math.floor(Math.random() * 100) + 155}, ${Math.floor(Math.random() * 50)}, ${Math.random() * 0.3})`;
            ctx.fill();
        }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    textureCache.sun = texture;
    return texture;
}

/**
 * Creates textures for planets representing portfolio sections
 * @param {string} planetId - The ID of the planet
 * @returns {THREE.CanvasTexture} The generated planet texture
 */
function createPlanetTexture(planetId) {
    if (textureCache[planetId]) return textureCache[planetId];
    
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Define colors based on planet type
    let baseColor, landColor, accentColor, cloudColor;
    
    switch (planetId) {
        case 'professional': // Blue planet with white clouds
            baseColor = '#133c84';
            landColor = '#1e54b3';
            accentColor = '#3278e5';
            cloudColor = 'rgba(220, 240, 255, 0.6)';
            break;
            
        case 'repositories': // Green planet with slight atmosphere
            baseColor = '#155e34';
            landColor = '#198643';
            accentColor = '#22c55e';
            cloudColor = 'rgba(220, 255, 230, 0.5)';
            break;
            
        case 'personal': // Red-orange planet with patterns
            baseColor = '#9d1c1c';
            landColor = '#c43030';
            accentColor = '#e85858';
            cloudColor = 'rgba(255, 230, 220, 0.4)';
            break;
            
        default: // Generic planet
            baseColor = '#474747';
            landColor = '#686868';
            accentColor = '#a0a0a0';
            cloudColor = 'rgba(240, 240, 240, 0.5)';
    }
    
    // Fill with base color
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Generate planet surface features (continents/terrain)
    const noiseDetail = 8;
    const noiseScale = 0.01;
    let noise = generateSimplexNoise(canvas.width, canvas.height, noiseDetail, noiseScale);
    
    // Create continents using noise
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const noiseValue = noise[y * canvas.width + x];
            
            // Map the latitude (-90 to 90 degrees) to (0 to Math.PI)
            const lat = y / canvas.height * Math.PI;
            // Map the longitude (0 to 360 degrees) to (0 to 2*Math.PI)
            const lon = x / canvas.width * Math.PI * 2;
            
            // Apply elevation and terrain features
            if (noiseValue > 0.25) {
                // Land features
                const elevation = (noiseValue - 0.25) * 1.33; // Normalize to 0-1
                
                ctx.fillStyle = blendColors(
                    landColor,
                    accentColor,
                    Math.min(1, elevation * 2)
                );
                
                ctx.fillRect(x, y, 1, 1);
                
                // Add topographic details to land
                if (noiseValue > 0.4) {
                    const detail = generateSimplexNoise(canvas.width, canvas.height, 16, 0.02);
                    const detailValue = detail[y * canvas.width + x];
                    
                    if (detailValue > 0.5) {
                        ctx.fillStyle = accentColor;
                        ctx.globalAlpha = 0.3;
                        ctx.fillRect(x, y, 1, 1);
                        ctx.globalAlpha = 1.0;
                    }
                }
            }
        }
    }
    
    // Add atmospheric cloud patterns
    noise = generateSimplexNoise(canvas.width, canvas.height, 4, 0.03);
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const noiseValue = noise[y * canvas.width + x];
            
            if (noiseValue > 0.5) {
                const cloudOpacity = (noiseValue - 0.5) * 2; // Scale to 0-1
                
                ctx.fillStyle = cloudColor;
                ctx.globalAlpha = cloudOpacity * 0.7;
                ctx.fillRect(x, y, 1, 1);
                ctx.globalAlpha = 1.0;
            }
        }
    }
    
    // Add planet-specific details
    switch (planetId) {
        case 'repositories':
            // Add Saturn-like rings
            break;
            
        case 'personal':
            // Add swirling patterns
            break;
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    textureCache[planetId] = texture;
    return texture;
}

/**
 * Helper function to blend two colors
 * @param {string} color1 - First color in hex format
 * @param {string} color2 - Second color in hex format
 * @param {number} ratio - Blend ratio (0-1)
 * @returns {string} The blended color
 */
function blendColors(color1, color2, ratio) {
    // Convert hex to RGB
    const parseColor = (hexColor) => {
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        return [r, g, b];
    };
    
    // Parse colors
    const [r1, g1, b1] = parseColor(color1);
    const [r2, g2, b2] = parseColor(color2);
    
    // Blend
    const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
    const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
    const b = Math.round(b1 * (1 - ratio) + b2 * ratio);
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Generate simplex noise for texture creation
 * This is a simplified version - in production you'd use a proper noise library
 */
function generateSimplexNoise(width, height, octaves = 4, scale = 0.01) {
    const result = new Array(width * height);
    
    // Fill with random values initially
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            result[y * width + x] = Math.random();
        }
    }
    
    // Apply multiple passes of smoothing to create noise-like effect
    for (let o = 0; o < octaves; o++) {
        const smoothed = new Array(width * height);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // Get surrounding values with wrap-around
                const x1 = (x - 1 + width) % width;
                const x2 = (x + 1) % width;
                const y1 = (y - 1 + height) % height;
                const y2 = (y + 1) % height;
                
                // Calculate average of neighbors
                const val = (
                    result[y1 * width + x1] + result[y1 * width + x] + result[y1 * width + x2] +
                    result[y * width + x1] + result[y * width + x] + result[y * width + x2] +
                    result[y2 * width + x1] + result[y2 * width + x] + result[y2 * width + x2]
                ) / 9;
                
                smoothed[y * width + x] = val;
            }
        }
        
        // Mix with original with decreasing influence
        const mixFactor = 1 - (o / octaves);
        for (let i = 0; i < width * height; i++) {
            result[i] = result[i] * mixFactor + smoothed[i] * (1 - mixFactor);
        }
    }
    
    return result;
}

// Export texture functions
window.portfolioTextures = {
    createSunTexture,
    createPlanetTexture
};
