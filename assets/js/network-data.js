// This file defines the data structure for our cosmic portfolio system

const NetworkData = {
  // Celestial bodies representing portfolio sections
  nodes: [
    // Solar system center - main portfolio hub
    { 
      id: 'center', 
      name: 'Portfolio', 
      description: 'Explore my cosmic portfolio system', 
      group: 'star',
      val: 30,
      mass: 100,
      size: 6,
      texture: 'assets/images/textures/sun.jpg',
      emissive: true,
      rotationSpeed: 0.003,
      fx: 0, fy: 0, fz: 0, // Fixed at center
      orbitRadius: 0,
      orbitSpeed: 0
    },
    
    // Major planets - main categories
    { 
      id: 'professional', 
      name: 'Professional Experience', 
      description: 'My professional journey across the cosmos', 
      group: 'planet',
      val: 24,
      mass: 30,
      size: 3.8,
      texture: 'assets/images/textures/blue-planet.jpg',
      atmosphere: true,
      rotationSpeed: 0.01,
      orbitRadius: 100,
      orbitSpeed: 0.0005,
      orbitAngle: Math.PI * 0.1,  // Slight inclination
      rings: false
    },
    { 
      id: 'repositories', 
      name: 'Code Repositories', 
      description: 'My interstellar software development missions', 
      group: 'planet',
      val: 26,
      mass: 35,
      size: 4.2,
      texture: 'assets/images/textures/green-planet.jpg',
      atmosphere: true,
      rotationSpeed: 0.008,
      orbitRadius: 160,
      orbitSpeed: 0.0004,
      orbitAngle: Math.PI * -0.05,
      rings: true  // Saturn-like rings
    },
    { 
      id: 'personal', 
      name: 'Personal Universe', 
      description: 'Personal interests and cosmic activities', 
      group: 'planet',
      val: 22,
      mass: 25,
      size: 3.5,
      texture: 'assets/images/textures/red-planet.jpg',
      atmosphere: true,
      rotationSpeed: 0.012,
      orbitRadius: 220,
      orbitSpeed: 0.0003,
      orbitAngle: Math.PI * 0.15,
      rings: false
    },
    
    // Professional moons
    { 
      id: 'linkedin', 
      name: 'LinkedIn', 
      description: 'Professional networking outpost', 
      group: 'moon',
      val: 10,
      mass: 5,
      size: 1.5,
      texture: 'assets/images/textures/moon1.jpg',
      parentId: 'professional',
      rotationSpeed: 0.02,
      orbitRadius: 15,
      orbitSpeed: 0.004,
      orbitAngle: Math.PI * 0.2
    },
    { 
      id: 'cv', 
      name: 'Curriculum Vitae', 
      description: 'Record of interstellar missions', 
      group: 'moon',
      val: 10,
      mass: 5,
      size: 1.5,
      texture: 'assets/images/textures/moon2.jpg',
      parentId: 'professional',
      rotationSpeed: 0.015,
      orbitRadius: 18,
      orbitSpeed: 0.003,
      orbitAngle: Math.PI * -0.1
    },
    { 
      id: 'academic', 
      name: 'Academic', 
      description: 'Cosmic research and studies', 
      group: 'moon',
      val: 9,
      mass: 4,
      size: 1.4,
      texture: 'assets/images/textures/moon3.jpg',
      parentId: 'professional',
      rotationSpeed: 0.018,
      orbitRadius: 12,
      orbitSpeed: 0.005,
      orbitAngle: Math.PI * 0.35
    },
    
    // Repository asteroid clusters by technology
    { 
      id: 'javascript', 
      name: 'JavaScript', 
      description: 'JavaScript cosmic modules', 
      group: 'asteroid_belt',
      val: 12,
      mass: 10,
      size: 2.2,
      texture: 'assets/images/textures/asteroid_yellow.jpg',
      parentId: 'repositories',
      rotationSpeed: 0.03,
      orbitRadius: 28,
      orbitSpeed: 0.002,
      orbitAngle: Math.PI * 0.15,
      asteroidCount: 8
    },
    { 
      id: 'python', 
      name: 'Python', 
      description: 'Python space programs', 
      group: 'asteroid_belt',
      val: 12,
      mass: 10,
      size: 2.2,
      texture: 'assets/images/textures/asteroid_blue.jpg',
      parentId: 'repositories',
      rotationSpeed: 0.025,
      orbitRadius: 35,
      orbitSpeed: 0.0018,
      orbitAngle: Math.PI * -0.2,
      asteroidCount: 6
    },
    { 
      id: 'ai_ml', 
      name: 'AI & ML', 
      description: 'Artificial Intelligence exploratory missions', 
      group: 'asteroid_belt',
      val: 12,
      mass: 11,
      size: 2.3,
      texture: 'assets/images/textures/asteroid_purple.jpg',
      parentId: 'repositories',
      rotationSpeed: 0.022,
      orbitRadius: 32,
      orbitSpeed: 0.0015,
      orbitAngle: Math.PI * 0.05,
      asteroidCount: 5
    },
    
    // Individual repository asteroids - JavaScript cluster
    { 
      id: 'techbr', 
      name: 'TechBR', 
      description: 'TechBR Group Website', 
      group: 'asteroid',
      val: 6,
      mass: 1,
      size: 0.8,
      texture: 'assets/images/textures/asteroid1.jpg',
      parentId: 'javascript',
      rotationSpeed: 0.05,
      orbitRadius: 8,
      orbitSpeed: 0.008,
      orbitAngle: Math.PI * 0.2
    },
    { 
      id: 'text_to_speech', 
      name: 'Text-to-Speech', 
      description: 'Voice synthesis module', 
      group: 'asteroid',
      val: 6,
      mass: 1,
      size: 0.7,
      texture: 'assets/images/textures/asteroid2.jpg',
      parentId: 'javascript',
      rotationSpeed: 0.06,
      orbitRadius: 10,
      orbitSpeed: 0.01,
      orbitAngle: Math.PI * 0.5
    },
    // ... more repository asteroids
    
    // Personal moons
    { 
      id: 'photography', 
      name: 'Photography', 
      description: 'Cosmic imagery collection', 
      group: 'moon',
      val: 9,
      mass: 6,
      size: 1.7,
      texture: 'assets/images/textures/moon_rocky.jpg',
      parentId: 'personal',
      rotationSpeed: 0.017,
      orbitRadius: 16,
      orbitSpeed: 0.006,
      orbitAngle: Math.PI * 0.1
    },
    { 
      id: 'imdb', 
      name: 'IMDB', 
      description: 'Galactic entertainment database', 
      group: 'moon',
      val: 8,
      mass: 4,
      size: 1.4,
      texture: 'assets/images/textures/moon_crater.jpg',
      parentId: 'personal',
      rotationSpeed: 0.022,
      orbitRadius: 20,
      orbitSpeed: 0.0055,
      orbitAngle: Math.PI * 0.3
    },
    { 
      id: 'instagram', 
      name: 'Instagram', 
      description: 'Visual transmission station', 
      group: 'moon',
      val: 7,
      mass: 3,
      size: 1.2,
      texture: 'assets/images/textures/moon_smooth.jpg',
      parentId: 'personal',
      rotationSpeed: 0.02,
      orbitRadius: 14,
      orbitSpeed: 0.007,
      orbitAngle: Math.PI * -0.15
    }
    // Add more celestial objects as needed
  ],
  
  // Gravitational connections and orbital paths
  links: [
    // Main orbital connections
    { source: 'center', target: 'professional', value: 5, type: 'orbit' },
    { source: 'center', target: 'repositories', value: 5, type: 'orbit' },
    { source: 'center', target: 'personal', value: 5, type: 'orbit' },
    
    // Professional system
    { source: 'professional', target: 'linkedin', value: 3, type: 'orbit' },
    { source: 'professional', target: 'cv', value: 3, type: 'orbit' },
    { source: 'professional', target: 'academic', value: 3, type: 'orbit' },
    
    // Repositories system
    { source: 'repositories', target: 'javascript', value: 4, type: 'orbit' },
    { source: 'repositories', target: 'python', value: 4, type: 'orbit' },
    { source: 'repositories', target: 'ai_ml', value: 4, type: 'orbit' },
    
    // JavaScript asteroids
    { source: 'javascript', target: 'techbr', value: 2, type: 'orbit' },
    { source: 'javascript', target: 'text_to_speech', value: 2, type: 'orbit' },
    
    // Personal system
    { source: 'personal', target: 'photography', value: 3, type: 'orbit' },
    { source: 'personal', target: 'imdb', value: 3, type: 'orbit' },
    { source: 'personal', target: 'instagram', value: 3, type: 'orbit' }
  ]
};
