/**
 * Content Loader
 * Dynamically loads content from unified JSON data source
 */

class ContentLoader {
  /**
   * Load content from the unified data source
   * @param {string} nodeId - Node ID to load content for
   * @param {HTMLElement} container - Container element to populate
   * @returns {Promise} - Promise resolved when content is loaded
   */
  static async loadContent(nodeId, container) {
    try {
      // Get the unified data
      const unifiedData = await this.getUnifiedData();
      
      // Find the node in the unified data structure
      const nodeData = this.findNodeInUnifiedData(unifiedData, nodeId);
      
      if (!nodeData) {
        container.innerHTML = `<p class="error">Node ID "${nodeId}" not found in unified data</p>`;
        return null;
      }
      
      // Get content from the node data
      const content = nodeData.content;
      
      if (!content) {
        container.innerHTML = `<p class="error">No content found for ${nodeId}</p>`;
        return null;
      }
      
      // Render based on node group
      switch (nodeData.group) {
        case 'main':
          this.renderCenterNode(content, container);
          break;
        case 'category':
          this.renderCategoryNode(nodeId, content, container);
          break;
        case 'subcategory':
        case 'cluster':
          this.renderSubcategoryNode(nodeId, nodeData, content, container, unifiedData);
          break;
        case 'item':
          this.renderItemNode(nodeId, nodeData, content, container, unifiedData);
          break;
        default:
          container.innerHTML = `<p class="error">Unknown node group: ${nodeData.group}</p>`;
      }
      
      return nodeData;
    } catch (error) {
      console.error(`Error loading content for ${nodeId}:`, error);
      container.innerHTML = `<p class="error">Failed to load content. Please try again.</p>`;
      throw error;
    }
  }
  
  /**
   * Legacy content loading method (for backward compatibility)
   * @param {string} contentType - Type of content
   * @param {HTMLElement} container - Container element
   * @returns {Promise} - Promise resolved when content is loaded
   */
  static async legacyLoadContent(contentType, container) {
    try {
      // Handle edge nodes by checking for parent relationship
      // First get info about the node to determine if it's an edge node
      const nodeInfo = this.getNodeInfo(contentType);
      let data;
      
      if (nodeInfo && nodeInfo.parentId) {
        // This is an edge node - get parent data only
        const parentId = nodeInfo.parentId;
        
        try {
          // Fetch the parent category's data only - don't try to fetch edge node specific data
          data = await this.fetchContentData(parentId);
          
          // Render based on parent type
          switch(parentId) {
            case 'professional':
              this.renderProfessionalDetail(contentType, nodeInfo, data, container);
              break;
            case 'repositories':
              if (contentType === 'javascript' || contentType === 'python' || contentType === 'ai_ml') {
                this.renderProjectCategory(contentType, nodeInfo, data, container);
              } else {
                this.renderProjectDetail(contentType, nodeInfo, data, container);
              }
              break;
            case 'personal':
              this.renderPersonalDetail(contentType, nodeInfo, data, container);
              break;
            default:
              console.error(`Unknown parent type: ${parentId}`);
              container.innerHTML = `<p class="error">Content type not supported: ${contentType}</p>`;
          }
        } catch (error) {
          console.error(`Error loading parent data for ${contentType}:`, error);
          container.innerHTML = `<p class="error">Failed to load content for ${nodeInfo.name}. Please try again.</p>`;
        }
      } else {
        // This is a main category node
        data = await this.fetchContentData(contentType);
        
        switch(contentType) {
          case 'professional':
            this.renderProfessional(data, container);
            break;
          case 'repositories':
            this.renderProjects(data, container);
            break;
          case 'personal':
            this.renderPersonal(data, container);
            break;
          case 'about':
            this.renderAbout(data, container);
            break;
          case 'contact':
            this.renderContact(data, container);
            break;
          default:
            console.error(`Unknown content type: ${contentType}`);
            container.innerHTML = `<p class="error">Content type not supported: ${contentType}</p>`;
        }
      }
      
      return data;
    } catch (error) {
      console.error(`Error loading ${contentType} content:`, error);
      container.innerHTML = `<p class="error">Failed to load content. Please try again.</p>`;
      throw error;
    }
  }
  
  /**
   * Get node info from the network data
   * @param {string} nodeId - Node ID to look up
   * @returns {Object|null} - Node info object or null if not found
   */
  static getNodeInfo(nodeId) {
    if (window.NetworkData && window.NetworkData.nodes) {
      return window.NetworkData.nodes.find(node => node.id === nodeId) || null;
    }
    return null;
  }
  
  /**
   * Fetch the unified data JSON
   * @returns {Promise<Object>} - Unified data object
   */
  static async getUnifiedData() {
    // Check if data is already cached
    if (window._unifiedDataCache) {
      return window._unifiedDataCache;
    }
    
    // Fetch the unified data
    try {
      const response = await fetch('data/unified-data.json');
      if (!response.ok) {
        throw new Error(`Failed to load unified data: ${response.status}`);
      }
      
      const unifiedData = await response.json();
      // Cache the data to prevent repeated fetches
      window._unifiedDataCache = unifiedData;
      return unifiedData;
    } catch (error) {
      console.error("Error fetching unified data:", error);
      throw error;
    }
  }
  
  /**
   * Find a node in the unified data structure by ID
   * @param {Object} unifiedData - Unified data object
   * @param {string} nodeId - Node ID to find
   * @returns {Object|null} - Node data or null if not found
   */
  static findNodeInUnifiedData(unifiedData, nodeId) {
    if (!unifiedData || !unifiedData.graphConfig) {
      return null;
    }
    
    // Check if it's the center node
    if (unifiedData.graphConfig.centerNode.id === nodeId) {
      return unifiedData.graphConfig.centerNode;
    }
    
    // Check categories
    for (const category of unifiedData.graphConfig.categories) {
      if (category.id === nodeId) {
        return category;
      }
      
      // Check children of this category
      if (Array.isArray(category.children)) {
        const childNode = this.findNodeInChildren(category.children, nodeId);
        if (childNode) {
          return childNode;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Recursively search for a node in children array
   * @param {Array} children - Array of child nodes
   * @param {string} nodeId - Node ID to find
   * @returns {Object|null} - Node data or null if not found
   */
  static findNodeInChildren(children, nodeId) {
    for (const child of children) {
      if (child.id === nodeId) {
        return child;
      }
      
      if (Array.isArray(child.children)) {
        const foundInGrandchildren = this.findNodeInChildren(child.children, nodeId);
        if (foundInGrandchildren) {
          return foundInGrandchildren;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Render center node (portfolio hub)
   * @param {Object} content - Node content
   * @param {HTMLElement} container - Container element
   */
  static renderCenterNode(content, container) {
    let html = `
      <div class="section-content">
        <h2 class="section-title">${content.title}</h2>
        <p class="section-intro">${content.intro}</p>
        <div class="navigation-help">
    `;
    
    // Add sections if available
    if (Array.isArray(content.sections)) {
      content.sections.forEach(section => {
        html += `
          <div class="help-section">
            <h3>${section.title}</h3>
            <p>${section.text}</p>
          </div>
        `;
      });
    }
    
    html += `</div></div>`;
    container.innerHTML = html;
  }
  
  /**
   * Render category node (main sections)
   * @param {string} nodeId - Node ID
   * @param {Object} content - Node content
   * @param {HTMLElement} container - Container element
   */
  static renderCategoryNode(nodeId, content, container) {
    switch (nodeId) {
      case 'professional':
        this.renderProfessional(content, container);
        break;
      case 'repositories':
        this.renderProjects(content, container);
        break;
      case 'personal':
        this.renderPersonal(content, container);
        break;
      case 'about':
        this.renderAbout(content, container);
        break;
      case 'contact':
        this.renderContact(content, container);
        break;
      default:
        // Generic category rendering
        let html = `
          <div class="section-content">
            <h2 class="section-title">${content.title}</h2>
            <p class="section-intro">${content.intro || ''}</p>
            <div class="generic-content">
              <p>${content.description || 'No additional content available.'}</p>
            </div>
          </div>
        `;
        container.innerHTML = html;
    }
  }
  
  /**
   * Render subcategory or cluster node
   * @param {string} nodeId - Node ID
   * @param {Object} nodeData - Complete node data
   * @param {Object} content - Node content
   * @param {HTMLElement} container - Container element
   * @param {Object} unifiedData - Complete unified data
   */
  static renderSubcategoryNode(nodeId, nodeData, content, container, unifiedData) {
    // Find parent category to determine rendering strategy
    const parentId = nodeData.parentId;
    
    if (parentId === 'professional') {
      this.renderProfessionalSubcategory(nodeId, nodeData, content, container);
    } else if (parentId === 'repositories') {
      this.renderRepositoryCluster(nodeId, nodeData, content, container, unifiedData);
    } else if (parentId === 'personal') {
      this.renderPersonalSubcategory(nodeId, nodeData, content, container, unifiedData);
    } else {
      // Generic subcategory rendering
      let html = `
        <div class="section-content">
          <h2 class="section-title">${content.title || nodeData.name}</h2>
          <p class="section-description">${content.description || nodeData.description}</p>
          <div class="node-info">
            <h3>Category</h3>
            <p>${parentId || 'Unknown'}</p>
          </div>
        </div>
      `;
      container.innerHTML = html;
    }
  }
  
  /**
   * Render professional subcategory (LinkedIn, CV, Academic)
   * @param {string} nodeId - Node ID
   * @param {Object} nodeData - Node data
   * @param {Object} content - Node content
   * @param {HTMLElement} container - Container element
   */
  static renderProfessionalSubcategory(nodeId, nodeData, content, container) {
    let html = `
      <div class="section-content">
        <h2 class="section-title">${content.title || nodeData.name}</h2>
        <div class="detail-view">
          <div class="card detail-card">
            <p>${content.description || nodeData.description}</p>
            ${content.icon ? `<i class="${content.icon} detail-icon"></i>` : ''}
            ${content.institution ? `<p><strong>${content.institution}</strong></p>` : ''}
            ${content.degree ? `<p>${content.degree}</p>` : ''}
            ${content.graduationYear ? `<p>Class of ${content.graduationYear}</p>` : ''}
            ${content.url ? `<a href="${content.url}" target="_blank" class="btn primary">
              <i class="fas fa-external-link-alt"></i> ${content.urlText || 'View Details'}
            </a>` : ''}
          </div>
        </div>
      </div>
    `;
    container.innerHTML = html;
  }
  
  /**
   * Render repository cluster (JavaScript, Python, AI/ML)
   * @param {string} nodeId - Node ID
   * @param {Object} nodeData - Node data
   * @param {Object} content - Node content
   * @param {HTMLElement} container - Container element
   * @param {Object} unifiedData - Complete unified data
   */
  static renderRepositoryCluster(nodeId, nodeData, content, container, unifiedData) {
    // Get parent category to access all projects
    const parentCategory = unifiedData.graphConfig.categories.find(c => c.id === 'repositories');
    if (!parentCategory || !parentCategory.content || !parentCategory.content.projects) {
      container.innerHTML = `
        <div class="section-content">
          <h2 class="section-title">${content.title || nodeData.name}</h2>
          <p class="error">No project data available.</p>
        </div>
      `;
      return;
    }
    
    // Get all projects
    const allProjects = parentCategory.content.projects;
    
    // Filter projects by technology
    const filterValue = content.filterValue;
    const filteredProjects = allProjects.filter(project => {
      if (!project.technologies) return false;
      
      if (Array.isArray(filterValue)) {
        // Multiple filter values
        return filterValue.some(filter => 
          project.technologies.some(tech => 
            tech.toLowerCase().includes(filter.toLowerCase())
          )
        );
      } else {
        // Single filter value
        return project.technologies.some(tech => 
          tech.toLowerCase().includes(filterValue.toLowerCase())
        );
      }
    });
    
    let html = `
      <div class="section-content">
        <h2 class="section-title">${content.title || nodeData.name}</h2>
        <p class="section-description">${content.description || nodeData.description}</p>
        <div class="projects-grid">
    `;
    
    if (filteredProjects.length === 0) {
      html += `<p class="empty-state">No ${nodeData.name} projects available.</p>`;
    } else {
      filteredProjects.forEach(project => {
        html += `
          <div class="project-card">
            <div class="project-image">
              <img src="${project.image}" alt="${project.title}" onerror="handleImageError(event)">
            </div>
            <div class="project-details">
              <h3>${project.title}</h3>
              <p>${project.description}</p>
              <div class="technologies">
                ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
              </div>
              <div class="project-links">
                <a href="${project.liveUrl}" target="_blank" class="btn primary"><i class="fas fa-external-link-alt"></i> View Live</a>
                <a href="${project.githubUrl}" target="_blank" class="btn secondary"><i class="fab fa-github"></i> GitHub</a>
              </div>
            </div>
          </div>
        `;
      });
    }
    
    html += `</div></div>`;
    container.innerHTML = html;
  }
  
  /**
   * Render personal subcategory (Photography, IMDB, Instagram)
   * @param {string} nodeId - Node ID
   * @param {Object} nodeData - Node data
   * @param {Object} content - Node content
   * @param {HTMLElement} container - Container element
   * @param {Object} unifiedData - Complete unified data
   */
  static renderPersonalSubcategory(nodeId, nodeData, content, container, unifiedData) {
    // Get parent category to access all personal data
    const parentCategory = unifiedData.graphConfig.categories.find(c => c.id === 'personal');
    if (!parentCategory || !parentCategory.content) {
      container.innerHTML = `
        <div class="section-content">
          <h2 class="section-title">${content.title || nodeData.name}</h2>
          <p class="error">No personal data available.</p>
        </div>
      `;
      return;
    }
    
    const parentContent = parentCategory.content;
    
    let html = `
      <div class="section-content">
        <h2 class="section-title">${content.title || nodeData.name}</h2>
        <p class="section-description">${content.description || nodeData.description}</p>
    `;
    
    if (nodeId === 'photography' && Array.isArray(parentContent.photos)) {
      // Show photo gallery with filters
      const categories = parentContent.categories || [];
      
      if (categories.length > 0) {
        html += `<div class="photo-filters">`;
        categories.forEach((category, index) => {
          const activeClass = index === 0 ? 'active' : '';
          html += `<button class="filter-btn ${activeClass}" data-filter="${category.id}">${category.name}</button>`;
        });
        html += `</div>`;
      }
      
      html += `<div class="gallery">`;
      
      if (parentContent.photos.length === 0) {
        html += `<p class="empty-state">No photos available.</p>`;
      } else {
        parentContent.photos.forEach(photo => {
          html += `
            <div class="gallery-item" data-category="${photo.category || ''}">
              <img src="${photo.image}" alt="${photo.title || 'Photo'}" onerror="handleImageError(event)">
              <div class="gallery-caption">
                <h3>${photo.title || 'Untitled'}</h3>
                <p>${photo.description || ''}</p>
              </div>
            </div>
          `;
        });
      }
      
      html += `</div>`;
      
    } else if (nodeId === 'imdb' && Array.isArray(parentContent.imdb)) {
      // Show IMDB content
      html += `
        <div class="imdb-content">
          <div class="media-grid">
      `;
      
      parentContent.imdb.forEach(item => {
        html += `
          <div class="media-item">
            <img src="${item.image || 'assets/images/media/default-movie.jpg'}" alt="${item.title}" onerror="handleImageError(event)">
            <h3>${item.title}</h3>
            <p>Rating: ${item.rating || '★★★☆☆'}</p>
          </div>
        `;
      });
      
      html += `
          </div>
          <p class="external-link">
            <a href="https://www.imdb.com/" target="_blank" class="btn primary">
              <i class="fas fa-external-link-alt"></i> View IMDB Profile
            </a>
          </p>
        </div>
      `;
      
    } else if (nodeId === 'instagram' && Array.isArray(parentContent.instagram)) {
      // Show Instagram content
      html += `
        <div class="instagram-feed">
          <div class="insta-grid">
      `;
      
      parentContent.instagram.forEach(post => {
        html += `
          <div class="insta-item">
            <img src="${post.image}" alt="Instagram post" onerror="handleImageError(event)">
            ${post.caption ? `<div class="insta-caption">${post.caption}</div>` : ''}
          </div>
        `;
      });
      
      html += `
          </div>
          <p class="external-link">
            <a href="https://www.instagram.com/" target="_blank" class="btn primary">
              <i class="fab fa-instagram"></i> Follow on Instagram
            </a>
          </p>
        </div>
      `;
    } else {
      // Generic rendering
      html += `<p class="empty-state">No specific content available for ${nodeData.name}.</p>`;
    }
    
    html += `</div>`;
    container.innerHTML = html;
    
    // Initialize filters if needed
    if (nodeId === 'photography') {
      this.initPhotoFilters(container);
    }
  }
  
  /**
   * Render item node (individual projects)
   * @param {string} nodeId - Node ID
   * @param {Object} nodeData - Node data
   * @param {Object} content - Node content
   * @param {HTMLElement} container - Container element
   * @param {Object} unifiedData - Complete unified data
   */
  static renderItemNode(nodeId, nodeData, content, container, unifiedData) {
    // Get project ID from content or use node ID
    const projectId = content.projectId || nodeId;
    
    // Find the project in repositories content
    const reposCategory = unifiedData.graphConfig.categories.find(c => c.id === 'repositories');
    
    if (!reposCategory || !reposCategory.content || !reposCategory.content.projects) {
      container.innerHTML = `
        <div class="section-content">
          <h2 class="section-title">${content.title || nodeData.name}</h2>
          <p class="error">Project data not available.</p>
        </div>
      `;
      return;
    }
    
    // Find the specific project
    const project = reposCategory.content.projects.find(p => p.id === projectId);
    
    if (!project) {
      container.innerHTML = `
        <div class="section-content">
          <h2 class="section-title">${content.title || nodeData.name}</h2>
          <p class="error">Project '${projectId}' not found in the data.</p>
        </div>
      `;
      return;
    }
    
    // Render project detail
    const html = `
      <div class="section-content">
        <h2 class="section-title">${project.title}</h2>
        
        <div class="project-detail">
          <div class="project-detail-image">
            <img src="${project.image}" alt="${project.title}" onerror="handleImageError(event)">
          </div>
          
          <div class="project-detail-content">
            <div class="project-description">
              <h3>Overview</h3>
              <p>${project.description}</p>
            </div>
            
            <div class="project-technologies">
              <h3>Technologies Used</h3>
              <div class="technologies">
                ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
              </div>
            </div>
            
            <div class="project-actions">
              ${project.liveUrl ? `<a href="${project.liveUrl}" target="_blank" class="btn primary"><i class="fas fa-external-link-alt"></i> View Live</a>` : ''}
              ${project.githubUrl ? `<a href="${project.githubUrl}" target="_blank" class="btn secondary"><i class="fab fa-github"></i> View Source</a>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
  }
  
  // Legacy fetch function - maintained for backward compatibility
  static async fetchContentData(contentType) {
    // Try to use unified data first
    try {
      const unifiedData = await this.getUnifiedData();
      
      // Find the category in unified data
      const category = unifiedData.graphConfig.categories.find(c => c.id === contentType);
      
      if (category && category.content) {
        console.log(`Using unified data for ${contentType}`);
        return category.content;
      }
    } catch (error) {
      console.warn(`Could not load ${contentType} from unified data, falling back to separate JSON:`, error);
    }
    
    // Fall back to separate JSON files
    try {
      let path;
      switch (contentType) {
        case 'repositories':
          path = 'data/projects.json';
          break;
        case 'about':
          path = 'data/about.json';
          break;
        case 'professional':
        case 'personal':
        case 'contact':
          path = `data/${contentType}.json`;
          break;
        default:
          throw new Error(`No data file for content type: ${contentType}`);
      }
        
      console.log(`Fetching content from: ${path}`);
      const response = await fetch(path);
      
      if (!response.ok) {
        throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Successfully loaded ${contentType} data:`, data);
      return data;
    } catch (error) {
      console.error(`Error fetching ${contentType} data:`, error);
      throw error;
    }
  }
  
  /**
   * Render About Me content
   * @param {Object} data - About data
   * @param {HTMLElement} container - Container element
   */
  static renderAbout(data, container) {
    let html = `
      <div class="section-content">
        <h2 class="section-title">${data.title}</h2>
        <div class="about-content">
          <div class="about-image">
            <img src="${data.profileImage}" alt="Profile Picture" onerror="handleImageError(event)">
          </div>
          <div class="about-text">
            <p>${data.introduction}</p>
            <p>${data.bio}</p>
            <h3>Skills</h3>
            <div class="skills-container">
              ${data.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
            </div>
            <div class="contact-info">
              <p>Email: <a href="mailto:${data.contact.email}">${data.contact.email}</a></p>
              <p>LinkedIn: <a href="${data.contact.linkedin}" target="_blank">${data.contact.linkedin}</a></p>
            </div>
          </div>
        </div>
      </div>
    `;
    container.innerHTML = html;
  }
  
  /**
   * Render professional experience content
   * @param {Object} data - Professional experience data
   * @param {HTMLElement} container - Container element
   */
  static renderProfessional(data, container) {
    let html = `
      <div class="section-content">
        <h2 class="section-title">Professional Experience</h2>
        <div class="professional-content">
    `;
    
    // Add experience cards
    if (data.experiences && data.experiences.length) {
      data.experiences.forEach(exp => {
        html += `
          <div class="card">
            <h3><i class="${exp.icon}"></i> ${exp.title}</h3>
            <p>${exp.description}</p>
            <div class="date-range">${exp.dateRange}</div>
            <a href="${exp.detailsLink}" class="btn primary"><i class="fas fa-external-link-alt"></i> View Details</a>
          </div>
        `;
      });
    } else {
      html += `<p class="no-content">No professional experience available</p>`;
    }
    
    html += `</div></div>`;
    container.innerHTML = html;
  }
  
  /**
   * Render detail page for professional subcategory (LinkedIn, CV, Academic)
   * @param {string} nodeId - Edge node ID 
   * @param {Object} nodeInfo - Node information from NetworkData
   * @param {Object} parentData - Parent category data
   * @param {HTMLElement} container - Container element
   */
  static renderProfessionalDetail(nodeId, nodeInfo, parentData, container) {
    // Better mapping of edge node IDs to experiences in parent data
    let experience;
    const experiences = parentData.experiences || [];
    
    if (nodeId === 'linkedin') {
      // First experience is typically current job
      experience = experiences[0];
    } else if (nodeId === 'cv') {
      // Second experience for CV/resume details
      experience = experiences.length > 1 ? experiences[1] : experiences[0];
    } else if (nodeId === 'academic') {
      // Find academic entry by looking for specific keywords
      experience = experiences.find(exp => 
        exp.title.toLowerCase().includes('education') || 
        exp.title.toLowerCase().includes('academic') ||
        exp.description.toLowerCase().includes('degree') ||
        exp.description.toLowerCase().includes('university')
      ) || experiences[experiences.length - 1]; // Fallback to last experience
    }
    
    if (!experience) {
      container.innerHTML = `
        <div class="section-content">
          <h2 class="section-title">${nodeInfo.name}</h2>
          <p class="error">No information found in the professional experience data for ${nodeInfo.name}</p>
          <div class="node-info">
            <h3>About this section</h3>
            <p>${nodeInfo.description}</p>
          </div>
        </div>
      `;
      return;
    }
    
    const html = `
      <div class="section-content">
        <h2 class="section-title">${nodeInfo.name}</h2>
        <div class="detail-view">
          <div class="card detail-card">
            <h3>${experience.icon ? `<i class="${experience.icon}"></i>` : ''} ${experience.title}</h3>
            <p>${experience.description}</p>
            <div class="date-range">${experience.dateRange || ''}</div>
            ${experience.url ? `<a href="${experience.url}" target="_blank" class="btn primary"><i class="fas fa-external-link-alt"></i> ${experience.urlText || 'View Details'}</a>` : ''}
          </div>
          <div class="node-info">
            <h3>About this section</h3>
            <p>${nodeInfo.description}</p>
            <p class="node-meta">Category: ${nodeInfo.parentId}</p>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
  }
  
  /**
   * Render projects content from projects.json
   * @param {Object} data - Projects data
   * @param {HTMLElement} container - Container element
   */
  static renderProjects(data, container) {
    let html = `
      <div class="section-content">
        <h2 class="section-title">Code Repositories</h2>
        <div class="project-filters">
          <button class="filter-btn active" data-filter="all">All Projects</button>
          <button class="filter-btn" data-filter="web">Web Apps</button>
          <button class="filter-btn" data-filter="mobile">Mobile Apps</button>
          <button class="filter-btn" data-filter="other">Other Projects</button>
        </div>
        <div class="projects-grid">
    `;
    
    // Add project cards
    data.projects.forEach(project => {
      html += `
        <div class="project-card" data-category="${project.category}">
          <div class="project-image">
            <img src="${project.image}" alt="${project.title}" onerror="handleImageError(event)">
          </div>
          <div class="project-details">
            <h3>${project.title}</h3>
            <p>${project.description}</p>
            <div class="technologies">
              ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
            </div>
            <div class="project-links">
              <a href="${project.liveUrl}" target="_blank" class="btn primary"><i class="fas fa-external-link-alt"></i> View Live</a>
              <a href="${project.githubUrl}" target="_blank" class="btn secondary"><i class="fab fa-github"></i> GitHub</a>
            </div>
          </div>
        </div>
      `;
    });
    
    html += `</div></div>`;
    container.innerHTML = html;
    
    // Initialize project filters
    this.initProjectFilters(container);
  }
  
  /**
   * Render project category for technology clusters (JavaScript, Python, AI/ML)
   * @param {string} nodeId - Edge node ID (javascript, python, ai_ml)
   * @param {Object} nodeInfo - Node information from NetworkData
   * @param {Object} parentData - Parent category data
   * @param {HTMLElement} container - Container element
   */
  static renderProjectCategory(nodeId, nodeInfo, parentData, container) {
    let categoryName;
    let filterKeyword;
    
    // Map nodeId to proper display name and filter keyword
    switch (nodeId) {
      case 'javascript': 
        categoryName = 'JavaScript'; 
        filterKeyword = 'javascript';
        break;
      case 'python': 
        categoryName = 'Python'; 
        filterKeyword = 'python';
        break;
      case 'ai_ml': 
        categoryName = 'AI & Machine Learning'; 
        // Multiple possible keywords for AI/ML projects
        filterKeyword = ['ai', 'ml', 'machine learning', 'artificial intelligence', 'tensorflow', 'pytorch'];
        break;
      default: 
        categoryName = nodeInfo.name;
        filterKeyword = nodeId.toLowerCase();
    }
    
    const projects = parentData.projects || [];
    
    // Filter projects that match the technology
    const categoryProjects = projects.filter(project => {
      const technologies = project.technologies || [];
      const techLower = technologies.map(tech => tech.toLowerCase());
      
      if (Array.isArray(filterKeyword)) {
        // Check if any of the keywords match
        return filterKeyword.some(keyword => 
          techLower.some(tech => tech.includes(keyword)) || 
          project.category === keyword ||
          (project.description && project.description.toLowerCase().includes(keyword))
        );
      } else {
        // Check if the single keyword matches
        return techLower.some(tech => tech.includes(filterKeyword)) || 
               project.category === filterKeyword ||
               (project.description && project.description.toLowerCase().includes(filterKeyword));
      }
    });
    
    let html = `
      <div class="section-content">
        <h2 class="section-title">${categoryName} Projects</h2>
        <p class="section-description">${nodeInfo.description}</p>
        <div class="projects-grid">
    `;
    
    if (categoryProjects.length === 0) {
      html += `
        <div class="empty-state">
          <p>No ${categoryName} projects found in the data.</p>
          <p>This could be because none of the projects in projects.json have been tagged with ${categoryName}-related technologies.</p>
        </div>
      `;
    } else {
      categoryProjects.forEach(project => {
        html += `
          <div class="project-card">
            <div class="project-image">
              <img src="${project.image}" alt="${project.title}" onerror="handleImageError(event)">
            </div>
            <div class="project-details">
              <h3>${project.title}</h3>
              <p>${project.description}</p>
              <div class="technologies">
                ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
              </div>
              <div class="project-links">
                <a href="${project.liveUrl}" target="_blank" class="btn primary"><i class="fas fa-external-link-alt"></i> View Live</a>
                <a href="${project.githubUrl}" target="_blank" class="btn secondary"><i class="fab fa-github"></i> GitHub</a>
              </div>
            </div>
          </div>
        `;
      });
    }
    
    html += `</div></div>`;
    container.innerHTML = html;
  }
  
  /**
   * Render project detail for specific projects (techbr, text_to_speech, etc)
   * @param {string} nodeId - Edge node ID
   * @param {Object} nodeInfo - Node information from NetworkData
   * @param {Object} parentData - Parent category data
   * @param {HTMLElement} container - Container element
   */
  static renderProjectDetail(nodeId, nodeInfo, parentData, container) {
    const projects = parentData.projects || [];
    
    // Try multiple approaches to find the specific project
    let project = projects.find(p => p.id && p.id.toString() === nodeId) ||  // By ID
                  projects.find(p => p.title && p.title.toLowerCase().replace(/\s+/g, '_') === nodeId) || // By title as slug
                  projects.find(p => p.name && p.name.toLowerCase().replace(/\s+/g, '_') === nodeId); // By name as slug
    
    // If not found by exact match, try a partial match
    if (!project && nodeId) {
      project = projects.find(p => 
        (p.title && p.title.toLowerCase().includes(nodeId.toLowerCase())) ||
        (p.name && p.name.toLowerCase().includes(nodeId.toLowerCase()))
      );
    }
    
    // Use the nodeInfo to supplement project data if needed
    const projectTitle = project ? project.title : nodeInfo.name;
    const projectDesc = project ? project.description : nodeInfo.description;
    
    if (!project) {
      container.innerHTML = `
        <div class="section-content">
          <h2 class="section-title">${projectTitle}</h2>
          <div class="alert alert-warning">
            <p>Project details not found in the projects.json data.</p>
            <p>Looking for a project with id or name matching: "${nodeId}"</p>
          </div>
          <div class="node-info">
            <h3>About this node</h3>
            <p>${nodeInfo.description}</p>
            <p>Parent category: ${nodeInfo.parentId}</p>
          </div>
        </div>
      `;
      return;
    }
    
    const html = `
      <div class="section-content">
        <h2 class="section-title">${projectTitle}</h2>
        
        <div class="project-detail">
          <div class="project-detail-image">
            <img src="${project.image}" alt="${projectTitle}" onerror="handleImageError(event)">
          </div>
          
          <div class="project-detail-content">
            <div class="project-description">
              <h3>Overview</h3>
              <p>${projectDesc}</p>
            </div>
            
            <div class="project-technologies">
              <h3>Technologies Used</h3>
              <div class="technologies">
                ${project.technologies ? project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('') : ''}
              </div>
            </div>
            
            <div class="project-actions">
              ${project.liveUrl ? `<a href="${project.liveUrl}" target="_blank" class="btn primary"><i class="fas fa-external-link-alt"></i> View Live</a>` : ''}
              ${project.githubUrl ? `<a href="${project.githubUrl}" target="_blank" class="btn secondary"><i class="fab fa-github"></i> View Source</a>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
  }
  
  /**
   * Initialize project filters
   * @param {HTMLElement} container - Container with project filters
   */
  static initProjectFilters(container) {
    const filterButtons = container.querySelectorAll('.filter-btn');
    const projects = container.querySelectorAll('.project-card');
    
    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Update active button
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const filter = button.getAttribute('data-filter');
        
        // Filter projects
        projects.forEach(project => {
          if (filter === 'all' || project.getAttribute('data-category') === filter) {
            project.style.display = 'block';
          } else {
            project.style.display = 'none';
          }
        });
      });
    });
  }
  
  /**
   * Render personal/photography content
   * @param {Object} data - Personal data
   * @param {HTMLElement} container - Container element
   */
  static renderPersonal(data, container) {
    let html = `
      <div class="section-content">
        <h2 class="section-title">${data.title}</h2>
        <p class="section-intro">${data.intro}</p>
        <div class="photo-filters">
    `;
    
    // Add filter buttons
    data.categories.forEach((category, index) => {
      const activeClass = index === 0 ? 'active' : '';
      html += `<button class="filter-btn ${activeClass}" data-filter="${category.id}">${category.name}</button>`;
    });
    
    html += `</div><div class="gallery">`;
    
    // Add photo items
    if (data.photos && data.photos.length) {
      data.photos.forEach(photo => {
        html += `
          <div class="gallery-item" data-category="${photo.category}">
            <img src="${photo.image}" alt="${photo.title}" onerror="handleImageError(event)">
            <div class="gallery-caption">
              <h3>${photo.title}</h3>
              <p>${photo.description}</p>
            </div>
          </div>
        `;
      });
    } else {
      html += `<p class="no-content">No photos available</p>`;
    }
    
    html += `</div></div>`;
    container.innerHTML = html;
    
    // Initialize photo filters
    this.initPhotoFilters(container);
  }
  
  /**
   * Render personal subcategory detail (photography, imdb, instagram)
   * @param {string} nodeId - Edge node ID
   * @param {Object} nodeInfo - Node information from NetworkData
   * @param {Object} parentData - Parent category data
   * @param {HTMLElement} container - Container element
   */
  static renderPersonalDetail(nodeId, nodeInfo, parentData, container) {
    let html = `
      <div class="section-content">
        <h2 class="section-title">${nodeInfo.name}</h2>
        <p class="section-description">${nodeInfo.description}</p>
    `;
    
    if (nodeId === 'photography') {
      // Get photos from parent data
      const photos = parentData.photos || [];
      const categories = parentData.categories || [];
      
      // Add filter buttons if there are categories
      if (categories.length > 0) {
        html += `<div class="photo-filters">`;
        categories.forEach((category, index) => {
          const activeClass = index === 0 ? 'active' : '';
          html += `<button class="filter-btn ${activeClass}" data-filter="${category.id}">${category.name}</button>`;
        });
        html += `</div>`;
      }
      
      html += `<div class="gallery">`;
      
      if (photos.length === 0) {
        html += `<p class="empty-state">No photos available in the personal.json data.</p>`;
      } else {
        photos.forEach(photo => {
          html += `
            <div class="gallery-item" data-category="${photo.category || ''}">
              <img src="${photo.image}" alt="${photo.title || 'Photo'}" onerror="handleImageError(event)">
              <div class="gallery-caption">
                <h3>${photo.title || 'Untitled'}</h3>
                <p>${photo.description || ''}</p>
              </div>
            </div>
          `;
        });
      }
      
      html += `</div>`;
      
    } else if (nodeId === 'imdb') {
      // Try to get IMDB data from parent if available
      const imdbData = parentData.imdb || parentData.movies || [];
      
      if (Array.isArray(imdbData) && imdbData.length > 0) {
        html += `
          <div class="imdb-content">
            <div class="media-grid">
        `;
        
        imdbData.forEach(item => {
          html += `
            <div class="media-item">
              <img src="${item.image || 'assets/images/media/default-movie.jpg'}" alt="${item.title}" onerror="handleImageError(event)">
              <h3>${item.title}</h3>
              <p>Rating: ${item.rating || '★★★☆☆'}</p>
            </div>
          `;
        });
        
        html += `
            </div>
            <p class="external-link">
              <a href="https://www.imdb.com/" target="_blank" class="btn primary">
                <i class="fas fa-external-link-alt"></i> View IMDB Profile
              </a>
            </p>
          </div>
        `;
      } else {
        // Fallback to hardcoded example
        html += `
          <div class="imdb-content">
            <div class="media-grid">
              <div class="media-item">
                <img src="assets/images/media/movie1.jpg" alt="Movie" onerror="handleImageError(event)">
                <h3>Favorite Movie</h3>
                <p>Rating: ★★★★★</p>
              </div>
              <div class="media-item">
                <img src="assets/images/media/show1.jpg" alt="TV Show" onerror="handleImageError(event)">
                <h3>Current Show</h3>
                <p>Rating: ★★★★☆</p>
              </div>
              <div class="media-item">
                <img src="assets/images/media/movie2.jpg" alt="Movie" onerror="handleImageError(event)">
                <h3>Recent Watch</h3>
                <p>Rating: ★★★☆☆</p>
              </div>
            </div>
            <p class="external-link">
              <a href="https://www.imdb.com/" target="_blank" class="btn primary">
                <i class="fas fa-external-link-alt"></i> View IMDB Profile
              </a>
            </p>
          </div>
        `;
      }
    } else if (nodeId === 'instagram') {
      // Try to get Instagram data from parent if available
      const instaData = parentData.instagram || parentData.social_media || [];
      
      if (Array.isArray(instaData) && instaData.length > 0) {
        html += `
          <div class="instagram-feed">
            <div class="insta-grid">
        `;
        
        instaData.forEach(post => {
          html += `
            <div class="insta-item">
              <img src="${post.image}" alt="Instagram post" onerror="handleImageError(event)">
              ${post.caption ? `<div class="insta-caption">${post.caption}</div>` : ''}
            </div>
          `;
        });
        
        html += `
            </div>
            <p class="external-link">
              <a href="https://www.instagram.com/" target="_blank" class="btn primary">
                <i class="fab fa-instagram"></i> Follow on Instagram
              </a>
            </p>
          </div>
        `;
      } else {
        // Fallback to hardcoded example
        html += `
          <div class="instagram-feed">
            <div class="insta-grid">
              <div class="insta-item">
                <img src="assets/images/social/insta1.jpg" alt="Instagram post" onerror="handleImageError(event)">
              </div>
              <div class="insta-item">
                <img src="assets/images/social/insta2.jpg" alt="Instagram post" onerror="handleImageError(event)">
              </div>
              <div class="insta-item">
                <img src="assets/images/social/insta3.jpg" alt="Instagram post" onerror="handleImageError(event)">
              </div>
              <div class="insta-item">
                <img src="assets/images/social/insta4.jpg" alt="Instagram post" onerror="handleImageError(event)">
              </div>
            </div>
            <p class="external-link">
              <a href="https://www.instagram.com/" target="_blank" class="btn primary">
                <i class="fab fa-instagram"></i> Follow on Instagram
              </a>
            </p>
          </div>
        `;
      }
    } else {
      html += `<p>Content for ${nodeInfo.name} is not available yet.</p>`;
    }
    
    html += `</div>`;
    container.innerHTML = html;
    
    // Initialize filters if needed
    if (nodeId === 'photography') {
      this.initPhotoFilters(container);
    }
  }
  
  /**
   * Initialize photo filters
   * @param {HTMLElement} container - Container with photo filters
   */
  static initPhotoFilters(container) {
    const filterButtons = container.querySelectorAll('.filter-btn');
    const photos = container.querySelectorAll('.gallery-item');
    
    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Update active button
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const filter = button.getAttribute('data-filter');
        
        // Filter photos
        photos.forEach(photo => {
          if (filter === 'all' || photo.getAttribute('data-category') === filter) {
            photo.style.display = 'block';
          } else {
            photo.style.display = 'none';
          }
        });
      });
    });
  }
  
  /**
   * Render contact content
   * @param {Object} data - Contact data
   * @param {HTMLElement} container - Container element
   */
  static renderContact(data, container) {
    let html = `
      <div class="section-content">
        <h2 class="section-title">${data.title}</h2>
        <div class="contact-content">
          <div class="contact-info">
    `;
    
    // Add contact info items
    data.contactInfo.forEach(item => {
      html += `
        <div class="contact-item">
          <i class="${item.icon}"></i>
          <p>${item.value}</p>
        </div>
      `;
    });
    
    // Add social links
    html += `<div class="social-links">`;
    data.socialLinks.forEach(link => {
      html += `<a href="${link.url}" target="_blank"><i class="${link.icon}"></i></a>`;
    });
    
    html += `
          </div>
        </div>
        <form class="contact-form">
          <div class="form-group">
            <label for="name">Name</label>
            <input type="text" id="name" name="name" required>
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required>
          </div>
          <div class="form-group">
            <label for="message">Message</label>
            <textarea id="message" name="message" rows="5" required></textarea>
          </div>
          <button type="submit" class="btn primary">Send Message</button>
        </form>
      </div>
    </div>
    `;
    
    container.innerHTML = html;
    
    // Initialize form submission
    const form = container.querySelector('.contact-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('This is a demo form. In a real application, this would send your message.');
        form.reset();
      });
    }
  }
}

// Simple image error handler
function handleImageError(event) {
  console.warn(`Failed to load image: ${event.target.src}`);
  // Replace with placeholder image
  event.target.src = 'assets/images/placeholder.jpg';
  // Remove onerror after it's been handled to prevent loops
  event.target.onerror = null;
}

// Export the ContentLoader class
window.ContentLoader = ContentLoader;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Content Loader initialized');
});
