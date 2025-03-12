/**
 * Network Data Generator
 * Dynamically generates network data from JSON content files
 */

class NetworkDataGenerator {
  constructor() {
    // Base network structure with center node
    this.networkData = {
      nodes: [
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
        }
      ],
      links: []
    };
    
    // Main category definitions
    this.categories = [
      {
        id: 'professional',
        name: 'Professional Experience',
        description: 'My professional journey',
        dataFile: 'data/professional.json',
        texture: 'assets/images/textures/blue-planet.jpg',
        size: 11.4,
        val: 64,
        mass: 80,
        rotationSpeed: 0.01
      },
      {
        id: 'repositories',
        name: 'Code Repositories',
        description: 'My software development projects',
        dataFile: 'data/projects.json',
        texture: 'assets/images/textures/green-planet.jpg',
        size: 12.6,
        val: 70,
        mass: 90,
        rotationSpeed: 0.008
      },
      {
        id: 'personal',
        name: 'Personal Universe',
        description: 'Personal interests and activities',
        dataFile: 'data/personal.json',
        texture: 'assets/images/textures/red-planet.jpg',
        size: 10.4,
        val: 60,
        mass: 70,
        rotationSpeed: 0.012
      }
    ];
    
    // Technology category textures
    this.techTextures = {
      javascript: 'assets/images/textures/asteroid_yellow.jpg',
      python: 'assets/images/textures/asteroid_blue.jpg',
      ai_ml: 'assets/images/textures/asteroid_purple.jpg',
      default: 'assets/images/textures/asteroid_gray.jpg'
    };
    
    // Subcategory textures by parent
    this.subcategoryTextures = {
      professional: ['assets/images/textures/moon1.jpg', 'assets/images/textures/moon2.jpg', 'assets/images/textures/moon3.jpg'],
      repositories: ['assets/images/textures/asteroid_yellow.jpg', 'assets/images/textures/asteroid_blue.jpg', 'assets/images/textures/asteroid_purple.jpg'],
      personal: ['assets/images/textures/moon_rocky.jpg', 'assets/images/textures/moon_crater.jpg', 'assets/images/textures/moon_smooth.jpg']
    };
  }
  
  /**
   * Generate the network data from JSON files
   * @returns {Promise<Object>} - NetworkData object with nodes and links
   */
  async generate() {
    try {
      // First add the main categories to the network
      await this.addMainCategories();
      
      // Then process each category's data
      await this.processCategoryData();
      
      return this.networkData;
    } catch (error) {
      console.error("Failed to generate network data:", error);
      // Return basic network data in case of error
      return {
        nodes: this.networkData.nodes.slice(0, 4), // Just center and main categories
        links: this.networkData.links.filter(l => 
          l.source === 'center' || l.target === 'center'
        )
      };
    }
  }
  
  /**
   * Add main category nodes and links to center
   */
  async addMainCategories() {
    // Add main category nodes
    this.categories.forEach(category => {
      // Add node
      this.networkData.nodes.push({
        id: category.id,
        name: category.name,
        description: category.description,
        group: 'category',
        val: category.val,
        mass: category.mass,
        size: category.size,
        texture: category.texture,
        rotationSpeed: category.rotationSpeed
      });
      
      // Add link to center
      this.networkData.links.push({
        source: 'center',
        target: category.id,
        value: 5,
        type: 'connection'
      });
    });
  }
  
  /**
   * Process data for each category
   */
  async processCategoryData() {
    const promises = this.categories.map(async (category) => {
      try {
        // Fetch the JSON data
        const response = await fetch(category.dataFile);
        if (!response.ok) {
          throw new Error(`Failed to load ${category.dataFile}: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Process the data based on category type
        switch(category.id) {
          case 'professional':
            this.processExperienceData(data, category);
            break;
          case 'repositories':
            this.processProjectsData(data, category);
            break;
          case 'personal':
            this.processPersonalData(data, category);
            break;
        }
      } catch (error) {
        console.error(`Error processing ${category.id} data:`, error);
      }
    });
    
    // Wait for all data to be processed
    await Promise.all(promises);
  }
  
  /**
   * Process professional experience data
   * @param {Object} data - Experience data
   * @param {Object} category - Category definition
   */
  processExperienceData(data, category) {
    const subcategories = [
      { id: 'linkedin', name: 'LinkedIn', description: 'Professional networking profile' },
      { id: 'cv', name: 'Curriculum Vitae', description: 'Professional work history' },
      { id: 'academic', name: 'Academic', description: 'Research and studies' }
    ];
    
    // Add subcategory nodes
    subcategories.forEach((subcategory, index) => {
      const textureIndex = index % this.subcategoryTextures[category.id].length;
      const texture = this.subcategoryTextures[category.id][textureIndex];
      
      // Add node
      this.networkData.nodes.push({
        id: subcategory.id,
        name: subcategory.name,
        description: subcategory.description,
        group: 'subcategory',
        val: 20 - (index * 2), // Decreasing values: 20, 18, 16...
        mass: 10 - index,
        size: 3.0 - (index * 0.2),
        texture: texture,
        parentId: category.id,
        rotationSpeed: 0.02 - (index * 0.002)
      });
      
      // Add link to parent
      this.networkData.links.push({
        source: category.id,
        target: subcategory.id,
        value: 3,
        type: 'connection'
      });
    });
  }
  
  /**
   * Process projects data
   * @param {Object} data - Projects data
   * @param {Object} category - Category definition
   */
  processProjectsData(data, category) {
    // Extract unique technologies to create technology clusters
    let allTechnologies = [];
    data.projects.forEach(project => {
      if (Array.isArray(project.technologies)) {
        allTechnologies = [...allTechnologies, ...project.technologies];
      }
    });
    
    // Count technology occurrences
    const techCount = {};
    allTechnologies.forEach(tech => {
      techCount[tech] = (techCount[tech] || 0) + 1;
    });
    
    // Get top technologies
    const topTechs = Object.entries(techCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tech]) => tech.toLowerCase());
    
    // Map techIds to user-friendly display names
    const techMap = {
      javascript: { name: 'JavaScript', id: 'javascript' },
      js: { name: 'JavaScript', id: 'javascript' },
      python: { name: 'Python', id: 'python' },
      tensorflow: { name: 'AI & ML', id: 'ai_ml' },
      'machine learning': { name: 'AI & ML', id: 'ai_ml' },
      ml: { name: 'AI & ML', id: 'ai_ml' },
      ai: { name: 'AI & ML', id: 'ai_ml' }
    };
    
    // Create standard technology clusters
    const techClusters = [
      { name: 'JavaScript', id: 'javascript' },
      { name: 'Python', id: 'python' },
      { name: 'AI & ML', id: 'ai_ml' }
    ];
    
    // Add technology cluster nodes
    techClusters.forEach((tech, index) => {
      // Add node
      this.networkData.nodes.push({
        id: tech.id,
        name: tech.name,
        description: `${tech.name} projects`,
        group: 'cluster',
        val: 24,
        mass: 20,
        size: 4.4,
        texture: this.techTextures[tech.id] || this.techTextures.default,
        parentId: category.id,
        rotationSpeed: 0.03 - (index * 0.003)
      });
      
      // Add link to parent
      this.networkData.links.push({
        source: category.id,
        target: tech.id,
        value: 4,
        type: 'connection'
      });
    });
    
    // Add up to 4 projects as nodes
    const projectsToShow = data.projects.slice(0, 4);
    
    projectsToShow.forEach((project, index) => {
      // Create a URL-friendly ID for the project
      const projectId = project.id ? 
        project.id.toString() : 
        project.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      
      // Determine parent technology
      let parentTech = 'javascript'; // Default
      
      if (Array.isArray(project.technologies)) {
        const lowerTechs = project.technologies.map(t => t.toLowerCase());
        
        if (lowerTechs.some(t => t === 'python' || t.includes('py'))) {
          parentTech = 'python';
        } else if (lowerTechs.some(t => t === 'tensorflow' || t.includes('ai') || t.includes('ml') || t.includes('machine'))) {
          parentTech = 'ai_ml';
        }
      }
      
      // Add node
      this.networkData.nodes.push({
        id: projectId,
        name: project.title,
        description: project.description,
        group: 'item',
        val: 12,
        mass: 2,
        size: 1.6 - (index * 0.1),
        texture: `assets/images/textures/asteroid${index + 1}.jpg`,
        parentId: parentTech,
        rotationSpeed: 0.05 + (index * 0.005)
      });
      
      // Add link to parent
      this.networkData.links.push({
        source: parentTech,
        target: projectId,
        value: 2,
        type: 'connection'
      });
    });
  }
  
  /**
   * Process personal data
   * @param {Object} data - Personal data
   * @param {Object} category - Category definition
   */
  processPersonalData(data, category) {
    const subcategories = [
      { id: 'photography', name: 'Photography', description: 'Image collection' },
      { id: 'imdb', name: 'IMDB', description: 'Entertainment database' },
      { id: 'instagram', name: 'Instagram', description: 'Visual transmission station' }
    ];
    
    // Add subcategory nodes
    subcategories.forEach((subcategory, index) => {
      const textureIndex = index % this.subcategoryTextures[category.id].length;
      const texture = this.subcategoryTextures[category.id][textureIndex];
      
      // Add node
      this.networkData.nodes.push({
        id: subcategory.id,
        name: subcategory.name,
        description: subcategory.description,
        group: 'subcategory',
        val: 18 - (index * 2), // Decreasing values: 18, 16, 14...
        mass: 12 - (index * 3),
        size: 3.4 - (index * 0.5),
        texture: texture,
        parentId: category.id,
        rotationSpeed: 0.017 + (index * 0.003)
      });
      
      // Add link to parent
      this.networkData.links.push({
        source: category.id,
        target: subcategory.id,
        value: 3,
        type: 'connection'
      });
    });
  }
}

// Export generator
window.NetworkDataGenerator = NetworkDataGenerator;
