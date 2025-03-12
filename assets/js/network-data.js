// This file defines the data structure for our portfolio network system

const NetworkData = {
  // Nodes representing portfolio sections
  nodes: [
    // Central hub - main portfolio hub
    { 
      id: 'center', 
      name: 'Portfolio', 
      description: 'Explore my interactive portfolio system', 
      group: 'main',
      val: 30,
      mass: 100,
      size: 6,
      texture: 'assets/images/textures/sun.jpg',
      emissive: true,
      rotationSpeed: 0.003,
      fx: 0, fy: 0, fz: 0 // Fixed at center
    },
    
    // Major nodes - main categories
    { 
      id: 'professional', 
      name: 'Professional Experience', 
      description: 'My professional journey', 
      group: 'category',
      val: 24,
      mass: 30,
      size: 3.8,
      texture: 'assets/images/textures/blue-planet.jpg',
      rotationSpeed: 0.01
    },
    { 
      id: 'repositories', 
      name: 'Code Repositories', 
      description: 'My software development projects', 
      group: 'category',
      val: 26,
      mass: 35,
      size: 4.2,
      texture: 'assets/images/textures/green-planet.jpg',
      rotationSpeed: 0.008
    },
    { 
      id: 'personal', 
      name: 'Personal Universe', 
      description: 'Personal interests and activities', 
      group: 'category',
      val: 22,
      mass: 25,
      size: 3.5,
      texture: 'assets/images/textures/red-planet.jpg',
      rotationSpeed: 0.012
    },
    
    // Professional sub-nodes
    { 
      id: 'linkedin', 
      name: 'LinkedIn', 
      description: 'Professional networking profile', 
      group: 'subcategory',
      val: 10,
      mass: 5,
      size: 1.5,
      texture: 'assets/images/textures/moon1.jpg',
      parentId: 'professional',
      rotationSpeed: 0.02
    },
    { 
      id: 'cv', 
      name: 'Curriculum Vitae', 
      description: 'Professional work history', 
      group: 'subcategory',
      val: 10,
      mass: 5,
      size: 1.5,
      texture: 'assets/images/textures/moon2.jpg',
      parentId: 'professional',
      rotationSpeed: 0.015
    },
    { 
      id: 'academic', 
      name: 'Academic', 
      description: 'Research and studies', 
      group: 'subcategory',
      val: 9,
      mass: 4,
      size: 1.4,
      texture: 'assets/images/textures/moon3.jpg',
      parentId: 'professional',
      rotationSpeed: 0.018
    },
    
    // Repository clusters by technology
    { 
      id: 'javascript', 
      name: 'JavaScript', 
      description: 'JavaScript projects', 
      group: 'cluster',
      val: 12,
      mass: 10,
      size: 2.2,
      texture: 'assets/images/textures/asteroid_yellow.jpg',
      parentId: 'repositories',
      rotationSpeed: 0.03
    },
    { 
      id: 'python', 
      name: 'Python', 
      description: 'Python projects', 
      group: 'cluster',
      val: 12,
      mass: 10,
      size: 2.2,
      texture: 'assets/images/textures/asteroid_blue.jpg',
      parentId: 'repositories',
      rotationSpeed: 0.025
    },
    { 
      id: 'ai_ml', 
      name: 'AI & ML', 
      description: 'Artificial Intelligence projects', 
      group: 'cluster',
      val: 12,
      mass: 11,
      size: 2.3,
      texture: 'assets/images/textures/asteroid_purple.jpg',
      parentId: 'repositories',
      rotationSpeed: 0.022
    },
    
    // Individual repository items - JavaScript cluster
    { 
      id: 'techbr', 
      name: 'TechBR', 
      description: 'TechBR Group Website', 
      group: 'item',
      val: 6,
      mass: 1,
      size: 0.8,
      texture: 'assets/images/textures/asteroid1.jpg',
      parentId: 'javascript',
      rotationSpeed: 0.05
    },
    { 
      id: 'text_to_speech', 
      name: 'Text-to-Speech', 
      description: 'Voice synthesis module', 
      group: 'item',
      val: 6,
      mass: 1,
      size: 0.7,
      texture: 'assets/images/textures/asteroid2.jpg',
      parentId: 'javascript',
      rotationSpeed: 0.06
    },
    
    // Personal sub-nodes
    { 
      id: 'photography', 
      name: 'Photography', 
      description: 'Image collection', 
      group: 'subcategory',
      val: 9,
      mass: 6,
      size: 1.7,
      texture: 'assets/images/textures/moon_rocky.jpg',
      parentId: 'personal',
      rotationSpeed: 0.017
    },
    { 
      id: 'imdb', 
      name: 'IMDB', 
      description: 'Entertainment database', 
      group: 'subcategory',
      val: 8,
      mass: 4,
      size: 1.4,
      texture: 'assets/images/textures/moon_crater.jpg',
      parentId: 'personal',
      rotationSpeed: 0.022
    },
    { 
      id: 'instagram', 
      name: 'Instagram', 
      description: 'Visual transmission station', 
      group: 'subcategory',
      val: 7,
      mass: 3,
      size: 1.2,
      texture: 'assets/images/textures/moon_smooth.jpg',
      parentId: 'personal',
      rotationSpeed: 0.02
    }
  ],
  
  // Connections between nodes
  links: [
    // Main connections
    { source: 'center', target: 'professional', value: 5, type: 'connection' },
    { source: 'center', target: 'repositories', value: 5, type: 'connection' },
    { source: 'center', target: 'personal', value: 5, type: 'connection' },
    
    // Professional system
    { source: 'professional', target: 'linkedin', value: 3, type: 'connection' },
    { source: 'professional', target: 'cv', value: 3, type: 'connection' },
    { source: 'professional', target: 'academic', value: 3, type: 'connection' },
    
    // Repositories system
    { source: 'repositories', target: 'javascript', value: 4, type: 'connection' },
    { source: 'repositories', target: 'python', value: 4, type: 'connection' },
    { source: 'repositories', target: 'ai_ml', value: 4, type: 'connection' },
    
    // JavaScript items
    { source: 'javascript', target: 'techbr', value: 2, type: 'connection' },
    { source: 'javascript', target: 'text_to_speech', value: 2, type: 'connection' },
    
    // Personal system
    { source: 'personal', target: 'photography', value: 3, type: 'connection' },
    { source: 'personal', target: 'imdb', value: 3, type: 'connection' },
    { source: 'personal', target: 'instagram', value: 3, type: 'connection' }
  ]
};
