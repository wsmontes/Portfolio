// Minimal fallback network data structure
// Only used if network-data-generator.js fails to load data from JSON

const NetworkData = {
  // Minimal nodes representing core portfolio sections
  nodes: [
    // Central hub
    { 
      id: 'center', 
      name: 'Portfolio', 
      description: 'Explore my interactive portfolio system', 
      group: 'main',
      val: 80,
      mass: 200,
      size: 18,
      texture: 'assets/images/textures/sun.jpg',
      emissive: true,
      rotationSpeed: 0.003,
      fx: 0, fy: 0, fz: 0 // Fixed at center
    },
    
    // Main categories - essential for navigation
    { 
      id: 'professional', 
      name: 'Professional Experience', 
      description: 'My professional journey', 
      group: 'category',
      val: 64,
      size: 11.4,
      texture: 'assets/images/textures/blue-planet.jpg',
      rotationSpeed: 0.01
    },
    { 
      id: 'repositories', 
      name: 'Code Repositories', 
      description: 'My software development projects', 
      group: 'category',
      val: 70,
      size: 12.6,
      texture: 'assets/images/textures/green-planet.jpg',
      rotationSpeed: 0.008
    },
    { 
      id: 'personal', 
      name: 'Personal Universe', 
      description: 'Personal interests and activities', 
      group: 'category',
      val: 60,
      size: 10.4,
      texture: 'assets/images/textures/red-planet.jpg',
      rotationSpeed: 0.012
    }
  ],
  
  // Basic connections between main nodes
  links: [
    { source: 'center', target: 'professional', value: 5, type: 'connection' },
    { source: 'center', target: 'repositories', value: 5, type: 'connection' },
    { source: 'center', target: 'personal', value: 5, type: 'connection' }
  ]
};

// This minimal fallback will only be used if the NetworkDataGenerator fails
console.log("Loaded minimal fallback network data");
