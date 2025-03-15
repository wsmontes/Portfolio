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
      
      // Try to render using templates first
      const useTemplateSuccess = this.renderWithTemplate(nodeId, nodeData, content, container, unifiedData);
      
      if (!useTemplateSuccess) {
        // Fallback to old rendering logic
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
      }
      
      return nodeData;
    } catch (error) {
      console.error(`Error loading content for ${nodeId}:`, error);
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
  
  /**
   * Render About Me content
   * @param {Object} data - About data
   * @param {HTMLElement} container - Container element
   */
  static renderAbout(data, container) {
    let html = `
      <div class="section-content">
        <h2 class="section-title">${data.title}</h2>
        <div class="about-content horizontal-layout">
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
    
    // Add inline styles for horizontal layout if not already in CSS
    const aboutContent = container.querySelector('.about-content.horizontal-layout');
    if (aboutContent) {
      aboutContent.style.display = 'flex';
      aboutContent.style.flexDirection = 'row';
      aboutContent.style.gap = '2rem';
      aboutContent.style.alignItems = 'flex-start';
      aboutContent.style.maxHeight = '70vh';
      aboutContent.style.overflowY = 'auto';
      
      const aboutImage = aboutContent.querySelector('.about-image');
      if (aboutImage) {
        aboutImage.style.flex = '0 0 30%';
        aboutImage.style.maxWidth = '300px';
        
        const img = aboutImage.querySelector('img');
        if (img) {
          img.style.width = '100%';
          img.style.borderRadius = '8px';
          img.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
        }
      }
      
      const aboutText = aboutContent.querySelector('.about-text');
      if (aboutText) {
        aboutText.style.flex = '1';
      }
    }
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
   * Render node content using the specified template
   * @param {string} nodeId - Node ID
   * @param {Object} nodeData - Node data
   * @param {Object} content - Node content
   * @param {HTMLElement} container - Container element
   * @param {Object} unifiedData - Complete unified data
   * @returns {boolean} - Success status
   */
  static renderWithTemplate(nodeId, nodeData, content, container, unifiedData) {
    // Check if a template is specified
    const templateName = content.template || this.getDefaultTemplate(nodeId, nodeData.group);
    
    // Check if the template exists
    if (!window.FrameTemplates || !window.FrameTemplates[templateName]) {
      console.warn(`Template "${templateName}" not found, using default rendering for ${nodeId}`);
      return false;
    }
    
    try {
      // Prepare data for the template based on template type
      const templateData = this.prepareTemplateData(templateName, nodeId, nodeData, content, unifiedData);
      
      // Apply the template
      const html = window.FrameTemplates[templateName](templateData);
      container.innerHTML = html;
      
      // Initialize interactive elements if needed
      this.initializeTemplateElements(templateName, container);
      
      return true;
    } catch (error) {
      console.error(`Error applying template "${templateName}" for ${nodeId}:`, error);
      return false;
    }
  }
  
  /**
   * Determine default template based on node ID and group
   * @param {string} nodeId - Node ID
   * @param {string} group - Node group
   * @returns {string} - Template name
   */
  static getDefaultTemplate(nodeId, group) {
    switch (nodeId) {
      case 'about': return 'aboutMe';
      case 'contact': return 'contact';
      case 'professional': return 'standard';
      case 'repositories': return 'projectList';
      case 'personal': return 'gallery';
      default:
        if (group === 'cluster' && ['javascript', 'python', 'ai_ml'].includes(nodeId)) {
          return 'projectList';
        } else if (nodeId === 'photography') {
          return 'gallery';
        }
        return 'standard';
    }
  }
  
  /**
   * Prepare data for the template based on template type
   * @param {string} templateName - Template name
   * @param {string} nodeId - Node ID
   * @param {Object} nodeData - Node data
   * @param {Object} content - Node content
   * @param {Object} unifiedData - Complete unified data
   * @returns {Object} - Template data
   */
  static prepareTemplateData(templateName, nodeId, nodeData, content, unifiedData) {
    switch (templateName) {
      case 'aboutMe':
        return {
          title: content.title || nodeData.name,
          profileImage: content.profileImage || '',
          introduction: content.introduction || '',
          bio: content.bio || '',
          skills: content.skills || [],
          contact: content.contact || {}
        };
        
      case 'gallery':
        // For subcategory nodes (photography, imdb, instagram), we need special handling
        let categories = content.categories || [];
        let items = [];
        
        // For subcategory nodes, try to get data from parent if not available here
        if (nodeData.group === 'subcategory' && nodeData.parentId === 'personal') {
          const personal = unifiedData.graphConfig.categories.find(c => c.id === 'personal');
          
          if (personal && personal.content) {
            // Use parent categories if we don't have our own
            if (categories.length === 0 && personal.content.categories) {
              categories = personal.content.categories;
            }
            
            // Get items based on node type
            if (nodeId === 'photography') {
              items = this.getGalleryItems(nodeId, content.photos ? content : personal.content, unifiedData);
            } else if (nodeId === 'imdb') {
              items = this.getGalleryItems(nodeId, content.imdb ? content : personal.content, unifiedData);
            } else if (nodeId === 'instagram') {
              items = this.getGalleryItems(nodeId, content.instagram ? content : personal.content, unifiedData);
            }
          }
        } else {
          // For regular nodes, just use the content as is
          items = this.getGalleryItems(nodeId, content, unifiedData);
        }
        
        return {
          title: content.title || nodeData.name,
          intro: content.intro || content.description || nodeData.description || '',
          categories: categories,
          items: items
        };
        
      case 'projectList':
        return {
          title: content.title || nodeData.name,
          intro: content.intro || nodeData.description || '',
          filterCategories: [
            { id: 'web', name: 'Web Apps' },
            { id: 'mobile', name: 'Mobile Apps' },
            { id: 'data', name: 'Data Projects' },
            { id: 'ai', name: 'AI Projects' }
          ],
          projects: this.getProjectsForNode(nodeId, content, unifiedData)
        };
        
      case 'contact':
        return {
          title: content.title || nodeData.name,
          contactInfo: content.contactInfo || [],
          socialLinks: content.socialLinks || []
        };
        
      case 'standard':
      default:
        return {
          title: content.title || nodeData.name,
          intro: content.intro || nodeData.description || '',
          content: this.getStandardContent(nodeId, content, unifiedData)
        };
    }
  }
  
  /**
   * Get gallery items based on node ID
   * @param {string} nodeId - Node ID
   * @param {Object} content - Node content
   * @param {Object} unifiedData - Complete unified data
   * @returns {Array} - Gallery items
   */
  static getGalleryItems(nodeId, content, unifiedData) {
    // If we already have items array in the content, use that
    if (content.items && Array.isArray(content.items)) {
      return content.items;
    }
    
    // For photography node or personal node, use photos array if available
    if ((nodeId === 'photography' || nodeId === 'personal') && content.photos && Array.isArray(content.photos)) {
      return content.photos.map(photo => ({
        title: photo.title || 'Untitled',
        description: photo.description || '',
        image: photo.image,
        category: photo.category || ''
      }));
    }
    
    // For IMDB node, convert IMDB items to gallery format if available
    if (nodeId === 'imdb') {
      // First check if we have IMDB data in this node
      if (content.imdb && Array.isArray(content.imdb)) {
        return content.imdb.map(item => ({
          title: item.title || 'Untitled',
          description: `Rating: ${item.rating || '★★★☆☆'}`,
          image: item.image || 'assets/images/media/default-movie.jpg',
          category: 'movie'
        }));
      }
      
      // Otherwise check for IMDB data in parent personal node
      const personal = unifiedData.graphConfig.categories.find(c => c.id === 'personal');
      if (personal && personal.content && Array.isArray(personal.content.imdb)) {
        return personal.content.imdb.map(item => ({
          title: item.title || 'Untitled',
          description: `Rating: ${item.rating || '★★★☆☆'}`,
          image: item.image || 'assets/images/media/default-movie.jpg',
          category: 'movie'
        }));
      }
    }
    
    // For Instagram node, convert Instagram items to gallery format if available
    if (nodeId === 'instagram') {
      // First check if we have Instagram data in this node
      if (content.instagram && Array.isArray(content.instagram)) {
        return content.instagram.map(post => ({
          title: post.caption || 'Instagram Post',
          description: '',
          image: post.image,
          category: 'instagram'
        }));
      }
      
      // Otherwise check for Instagram data in parent personal node
      const personal = unifiedData.graphConfig.categories.find(c => c.id === 'personal');
      if (personal && personal.content && Array.isArray(personal.content.instagram)) {
        return personal.content.instagram.map(post => ({
          title: post.caption || 'Instagram Post',
          description: '',
          image: post.image,
          category: 'instagram'
        }));
      }
    }
    
    // Default empty array if no suitable data found
    return [];
  }
  
  /**
   * Get projects for the given node
   * @param {string} nodeId - Node ID
   * @param {Object} content - Node content
   * @param {Object} unifiedData - Complete unified data
   * @returns {Array} - Project items
   */
  static getProjectsForNode(nodeId, content, unifiedData) {
    // If the node is repositories, return all projects
    if (nodeId === 'repositories') {
      return content.projects || [];
    }
    
    // If we have a repos category and a filterValue, filter the projects
    const reposCategory = unifiedData.graphConfig.categories.find(c => c.id === 'repositories');
    if (reposCategory && reposCategory.content && reposCategory.content.projects) {
      const allProjects = reposCategory.content.projects;
      
      // If this node has a filterValue, use it to filter projects
      if (content.filterValue) {
        const filterValue = content.filterValue;
        
        return allProjects.filter(project => {
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
      }
    }
    
    return content.projects || [];
  }
  
  /**
   * Get content HTML for standard template
   * @param {string} nodeId - Node ID
   * @param {Object} content - Node content
   * @param {Object} unifiedData - Complete unified data
   * @returns {string} - HTML content
   */
  static getStandardContent(nodeId, content, unifiedData) {
    let html = '';
    
    // Professional experience cards
    if (nodeId === 'professional' && content.experiences) {
      html = `<div class="professional-content">`;
      
      content.experiences.forEach(exp => {
        html += `
          <div class="card">
            <h3><i class="${exp.icon}"></i> ${exp.title}</h3>
            <p>${exp.description}</p>
            <div class="date-range">${exp.dateRange}</div>
            <a href="${exp.detailsLink}" class="btn primary"><i class="fas fa-external-link-alt"></i> View Details</a>
          </div>
        `;
      });
      
      html += `</div>`;
    }
    
    return html;
  }
  
  /**
   * Initialize interactive elements in templates
   * @param {string} templateName - Template name
   * @param {HTMLElement} container - Container element
   */
  static initializeTemplateElements(templateName, container) {
    switch (templateName) {
      case 'gallery':
        this.initPhotoFilters(container);
        break;
        
      case 'projectList':
        this.initProjectFilters(container);
        break;
        
      case 'contact':
        const form = container.querySelector('.contact-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('This is a demo form. In a real application, this would send your message.');
            form.reset();
          });
        }
        break;
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
