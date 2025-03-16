/**
 * Content Loader
 * Dynamically loads content from unified JSON data source
 */

class ContentLoader {
  /**
   * Load content from the unified data source
   * @param {string|Object} nodeIdOrObject - Node ID or node object to load content for
   * @param {HTMLElement} container - Container element to populate
   * @returns {Promise} - Promise resolved when content is loaded
   */
  static async loadContent(nodeIdOrObject, container) {
    try {
      // Normalize nodeId - handle both string ID and node object
      const nodeId = typeof nodeIdOrObject === 'string' 
        ? nodeIdOrObject 
        : (nodeIdOrObject && nodeIdOrObject.id ? nodeIdOrObject.id : null);
      
      if (!nodeId) {
        console.error("Invalid node ID or object provided", nodeIdOrObject);
        container.innerHTML = `<p class="error">Invalid node data provided</p>`;
        return null;
      }
      
      // Special handling for repository nodes (which won't be in unified data)
      if (nodeId.startsWith('repo-')) {
        return await this.loadRepositoryContent(nodeId, container);
      }
      
      // Get the unified data
      const unifiedData = await this.getUnifiedData();
      
      // Find the node in the unified data structure
      const nodeData = this.findNodeInUnifiedData(unifiedData, nodeId);
      
      if (!nodeData) {
        console.warn(`Node ID "${nodeId}" not found in unified data`);
        
        // Check if it might be a dynamic repository node
        if (window.repositoryNodes && window.repositoryNodes.find(n => n.id === nodeId)) {
          return await this.loadRepositoryContent(nodeId, container);
        }
        
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
      console.error(`Error loading content for ${nodeIdOrObject}:`, error);
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
    console.log("Rendering center node with content:", content);
    
    // Ensure content has required properties
    const title = content?.title || 'Portfolio';
    const intro = content?.intro || 'Welcome to my interactive portfolio.';
    
    let html = `
      <div class="section-content">
        <h2 class="section-title">${title}</h2>
        <p class="section-intro">${intro}</p>
    `;
    
    // Add sections if available
    if (content && Array.isArray(content.sections) && content.sections.length > 0) {
      html += `<div class="navigation-help">`;
      
      content.sections.forEach(section => {
        if (section && section.title) {
          html += `
            <div class="help-section">
              <h3>${section.title}</h3>
              <p>${section.text || ''}</p>
            </div>
          `;
        }
      });
      
      html += `</div>`;
    } else {
      console.warn("Center node sections not found or empty:", content?.sections);
      // Add fallback sections if none are provided
      html += `
        <div class="navigation-help">
          <div class="help-section">
            <h3>Explore</h3>
            <p>Click on nodes to navigate through different sections of the portfolio.</p>
          </div>
          <div class="help-section">
            <h3>Controls</h3>
            <p>Use scroll to zoom, drag to rotate, and right-click to pan around.</p>
          </div>
        </div>
      `;
    }
    
    html += `</div>`;
    container.innerHTML = html;
    
    // Apply styles to ensure sections are visible
    const helpSections = container.querySelectorAll('.help-section');
    if (helpSections.length > 0) {
      helpSections.forEach(section => {
        section.style.marginBottom = '15px';
        section.style.padding = '15px';
        section.style.borderRadius = '8px';
        section.style.background = 'rgba(255, 255, 255, 0.1)';
        
        const heading = section.querySelector('h3');
        if (heading) {
          heading.style.marginTop = '0';
          heading.style.color = 'var(--primary-color, #4a6cf7)';
        }
      });
      
      const navHelp = container.querySelector('.navigation-help');
      if (navHelp) {
        navHelp.style.marginTop = '20px';
        navHelp.style.display = 'grid';
        navHelp.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
        navHelp.style.gap = '15px';
      }
    }
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
  static async renderRepositoryCluster(nodeId, nodeData, content, container) {
    // Show loading indicator
    container.innerHTML = `
      <div class="section-content">
        <h2 class="section-title">${content.title || nodeData.name}</h2>
        <p class="loading">Loading ${nodeData.name} repositories...</p>
      </div>
    `;
    
    try {
      // Load repositories from GitHub
      const allRepos = await this.getGitHubRepositories();
      
      // Determine which language(s) to filter by based on the node ID
      let filterLanguages = [];
      
      switch (nodeId) {
        case 'javascript':
          filterLanguages = ['JavaScript', 'TypeScript', 'Vue', 'React'];
          break;
        case 'python':
          filterLanguages = ['Python', 'Jupyter Notebook'];
          break;
        case 'ai_ml':
          filterLanguages = ['Python', 'Jupyter Notebook', 'R'];
          break;
        default:
          // If content has filterValue, use that
          if (content.filterValue) {
            filterLanguages = Array.isArray(content.filterValue) ? 
              content.filterValue : [content.filterValue];
          } else {
            filterLanguages = [nodeData.name];
          }
      }
      
      // Filter repositories by language
      const filteredRepos = allRepos.filter(repo => {
        const repoLang = repo.language || '';
        return filterLanguages.some(lang => 
          repoLang.toLowerCase() === lang.toLowerCase() ||
          (repo.topics && repo.topics.some(topic => 
            topic.toLowerCase() === lang.toLowerCase() ||
            topic.toLowerCase().includes(lang.toLowerCase())
          ))
        );
      });
      
      // Prepare HTML
      let html = `
        <div class="section-content">
          <h2 class="section-title">${content.title || nodeData.name}</h2>
          <p class="section-description">${content.description || nodeData.description || `${nodeData.name} projects directly from GitHub`}</p>
      `;
      
      if (filteredRepos.length > 0) {
        html += `<div class="projects-grid">`;
        
        filteredRepos.forEach(repo => {
          html += `
            <div class="project-card">
              <div class="project-header">
                <h3>${repo.name}</h3>
                <span class="language-tag" style="background: ${this.getLanguageColor(repo.language)}">
                  ${repo.language || 'Other'}
                </span>
              </div>
              <div class="project-details">
                <p>${repo.description || 'No description available'}</p>
                
                <div class="repo-meta">
                  <span><i class="fas fa-star"></i> ${repo.stargazers_count}</span>
                  <span><i class="fas fa-code-branch"></i> ${repo.forks_count}</span>
                  <span><i class="fas fa-history"></i> ${new Date(repo.updated_at).toLocaleDateString()}</span>
                </div>
                
                ${repo.topics && repo.topics.length > 0 ? `
                  <div class="technologies">
                    ${repo.topics.slice(0, 5).map(topic => 
                      `<span class="tech-tag">${topic}</span>`
                    ).join('')}
                  </div>
                ` : ''}
                
                <div class="project-links">
                  <a href="${repo.html_url}" target="_blank" class="btn secondary">
                    <i class="fab fa-github"></i> View on GitHub
                  </a>
                  ${repo.homepage ? `<a href="${repo.homepage}" target="_blank" class="btn primary">
                    <i class="fas fa-external-link-alt"></i> Live Demo
                  </a>` : ''}
                </div>
              </div>
            </div>
          `;
        });
        
        html += `</div>`;
      } else {
        html += `<p class="empty-state">No ${nodeData.name} projects available.</p>`;
      }
      
      html += `</div>`;
      container.innerHTML = html;
      
    } catch (error) {
      console.error(`Failed to load ${nodeData.name} repositories:`, error);
      container.innerHTML = `
        <div class="section-content">
          <h2 class="section-title">${content.title || nodeData.name}</h2>
          <p class="error">Failed to load repositories. Please try again later.</p>
        </div>
      `;
    }
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
   * Render projects content from GitHub repositories instead of static data
   * @param {Object} data - Projects data
   * @param {HTMLElement} container - Container element
   */
  static async renderProjects(data, container) {
    // Show loading indicator
    container.innerHTML = `
      <div class="section-content">
        <h2 class="section-title">Code Repositories</h2>
        <p class="loading">Loading GitHub repositories...</p>
      </div>
    `;
    
    try {
      // Load repositories from GitHub
      const repos = await this.getGitHubRepositories();
      
      if (!repos || repos.length === 0) {
        throw new Error("No repositories found");
      }
      
      // Use the language detector to enhance repositories with categories
      const enhancedRepos = window.RepositoryLanguageDetector ? 
        window.RepositoryLanguageDetector.enhanceRepositoryData(repos) : repos;
      
      // Group repositories by category instead of just by language
      const reposByCategory = this.groupRepositoriesByCategory(enhancedRepos);
      const reposByLanguage = this.groupRepositoriesByLanguage(enhancedRepos);
      
      // Create meaningful filter categories based on actual repository data
      const filterCategories = [
        { id: 'all', name: 'All Projects' },
        { id: 'web', name: 'Web Projects' },
        { id: 'mobile', name: 'Mobile Apps' },
        { id: 'ai-ml', name: 'AI/ML Projects' },
        { id: 'backend', name: 'Backend' }
      ];
      
      // Add language filters for languages with multiple repos
      Object.keys(reposByLanguage).forEach(lang => {
        if (reposByLanguage[lang].length >= 2 && 
            !['Other', 'HTML', 'CSS'].includes(lang)) {
          filterCategories.push({
            id: lang.toLowerCase().replace(/\s+/g, '-'),
            name: lang
          });
        }
      });
      
      // Prepare HTML
      let html = `
        <div class="section-content">
          <h2 class="section-title">Code Repositories</h2>
          <p class="section-intro">${data.intro || 'Explore my code repositories directly from GitHub.'}</p>
          <div class="repo-stats">
            <div class="stat-card">
              <span class="stat-value">${enhancedRepos.length}</span>
              <span class="stat-label">Repositories</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">${Object.keys(reposByLanguage).filter(lang => lang !== 'Other').length}</span>
              <span class="stat-label">Languages</span>
            </div>
          </div>
          <div class="project-filters">
      `;
      
      // Add filter buttons
      filterCategories.forEach((category, index) => {
        const activeClass = index === 0 ? 'active' : '';
        html += `<button class="filter-btn ${activeClass}" data-filter="${category.id}">${category.name}</button>`;
      });
      
      html += `</div><div class="projects-grid">`;
      
      // Add project cards for each repository
      enhancedRepos.forEach(repo => {
        const language = repo.language || 'Other';
        const categories = [
          'all', // Always include in "All Projects"
          language.toLowerCase().replace(/\s+/g, '-')
        ];
        
        // Add additional categories based on detected technologies
        if (repo.techCategories) {
          repo.techCategories.forEach(tech => {
            // Map technology categories to filter categories
            switch(tech) {
              case 'JavaScript':
              case 'TypeScript':
              case 'Web':
                categories.push('web');
                break;
              case 'Mobile':
                categories.push('mobile');
                break;
              case 'AI/ML':
                categories.push('ai-ml');
                break;
              case 'Backend':
                categories.push('backend');
                break;
            }
          });
        }
        
        // Add the project card with all its categories as data attributes
        html += `
          <div class="project-card" data-categories="${[...new Set(categories)].join(' ')}">
            <div class="project-header">
              <h3>${repo.name}</h3>
              <span class="language-tag" style="background: ${this.getLanguageColor(repo.language)}">
                ${repo.language || 'Other'}
              </span>
            </div>
            <div class="project-details">
              <p>${repo.description || 'No description available'}</p>
              
              <div class="repo-meta">
                <span><i class="fas fa-star"></i> ${repo.stargazers_count}</span>
                <span><i class="fas fa-code-branch"></i> ${repo.forks_count}</span>
                <span><i class="fas fa-history"></i> ${new Date(repo.updated_at).toLocaleDateString()}</span>
              </div>
              
              ${repo.topics && repo.topics.length > 0 ? `
                <div class="technologies">
                  ${repo.topics.slice(0, 5).map(topic => 
                    `<span class="tech-tag">${topic}</span>`
                  ).join('')}
                </div>
              ` : ''}
              
              <div class="project-links">
                <a href="${repo.html_url}" target="_blank" class="btn secondary">
                  <i class="fab fa-github"></i> View on GitHub
                </a>
                ${repo.homepage ? `<a href="${repo.homepage}" target="_blank" class="btn primary">
                  <i class="fas fa-external-link-alt"></i> Live Demo
                </a>` : ''}
              </div>
            </div>
          </div>
        `;
      });
      
      html += `</div></div>`;
      container.innerHTML = html;
      
      // Update project filters to work with the new categories system
      this.initProjectFilters(container);
      
    } catch (error) {
      console.error('Failed to load GitHub repositories:', error);
      container.innerHTML = `
        <div class="section-content">
          <h2 class="section-title">Code Repositories</h2>
          <p class="error">Failed to load GitHub repositories. Please try again later.</p>
          <pre class="error-details">${error.message}</pre>
        </div>
      `;
    }
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
        
        // Filter projects - look for category in space-separated list
        projects.forEach(project => {
          const categories = project.getAttribute('data-categories');
          if (filter === 'all' || categories && categories.includes(filter)) {
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

  /**
   * Load repository content for a node ID
   * @param {string|Object} nodeIdOrObject - Node ID in format "repo-{repoName}" or node object
   * @param {HTMLElement} container - Container element
   * @returns {Promise<Object>} - Repository data
   */
  static async loadRepositoryContent(nodeIdOrObject, container) {
    try {
      // Normalize nodeId - handle both string ID and node object
      const nodeId = typeof nodeIdOrObject === 'string' 
        ? nodeIdOrObject 
        : (nodeIdOrObject && nodeIdOrObject.id ? nodeIdOrObject.id : null);
      
      if (!nodeId) {
        container.innerHTML = `<div class="error-message">Invalid repository node data provided</div>`;
        return null;
      }
      
      // Extract repository name from node ID
      const repoName = nodeId.replace('repo-', '');
      
      console.log(`Loading repository content for: ${repoName}`);
      
      // Try to get repositories using different methods
      let repos = [];
      
      // 1. Try from window.repositoryNodes
      if (window.repositoryNodes && window.repositoryNodes.length) {
        const repoNode = window.repositoryNodes.find(n => n.id === nodeId);
        if (repoNode && repoNode.repoData) {
          repos = [repoNode.repoData];
        }
      }
      
      // 2. If not found, try fetching from GitHub
      if (repos.length === 0 && window.GithubRepoFetcher) {
        try {
          repos = await window.GithubRepoFetcher.getRepositories();
        } catch (err) {
          console.warn("Couldn't fetch repositories from GitHub:", err);
        }
      }
      
      // Find the repository
      const repo = repos.find(r => r.name === repoName);
      
      if (!repo) {
        container.innerHTML = `<div class="error-message">Repository ${repoName} not found</div>`;
        return null;
      }
      
      // Find parent node (language cluster)
      let parentNode = null;
      let parentId = null;
      
      // Make sure we use the global Graph reference
      if (window.Graph && window.Graph.graphData) {
        const graphData = window.Graph.graphData();
        if (graphData && graphData.nodes) {
          const repoNode = graphData.nodes.find(n => n.id === nodeId);
          if (repoNode && repoNode.parentId) {
            parentId = repoNode.parentId;
            parentNode = graphData.nodes.find(n => n.id === parentId);
          }
        }
      }
      
      // Fetch README content
      let readmeContent = `# ${repoName}\n\nNo README content available.`;
      
      if (window.GithubRepoFetcher && window.GithubRepoFetcher.fetchReadme) {
        try {
          readmeContent = await window.GithubRepoFetcher.fetchReadme(repo);
        } catch (err) {
          console.warn(`Couldn't fetch README for ${repoName}:`, err);
        }
      }
      
      // Parse creation date
      const createdDate = new Date(repo.created_at).toLocaleDateString();
      const updatedDate = new Date(repo.updated_at).toLocaleDateString();
      
      // Create repository content HTML
      const html = `
          <div class="repository-content">
              ${parentNode ? `
              <div class="breadcrumb-nav">
                  <span class="breadcrumb-item" data-node-id="repositories">Repositories</span>
                  <span class="breadcrumb-separator">/</span>
                  <span class="breadcrumb-item" data-node-id="${parentId}">${parentNode.name || 'Language'}</span>
                  <span class="breadcrumb-separator">/</span>
                  <span class="breadcrumb-active">${repo.name}</span>
              </div>
              ` : ''}
              
              <header class="repo-header">
                  <h1><a href="${repo.html_url}" target="_blank" rel="noopener">${repo.name}</a></h1>
                  <div class="repo-stats">
                      <span class="repo-language"><i class="fas fa-code"></i> ${repo.language || 'Not specified'}</span>
                      <span class="repo-stars"><i class="fas fa-star"></i> ${repo.stargazers_count}</span>
                      <span class="repo-forks"><i class="fas fa-code-branch"></i> ${repo.forks_count}</span>
                  </div>
              </header>
              
              <div class="repo-description">
                  <p>${repo.description || 'No description available'}</p>
              </div>
              
              ${repo.topics && repo.topics.length ? `
              <div class="repo-topics">
                  ${repo.topics.map(topic => `<span class="topic-tag">${topic}</span>`).join('')}
              </div>` : ''}
              
              <div class="repo-dates">
                  <span>Created: ${createdDate}</span>
                  <span>Last updated: ${updatedDate}</span>
              </div>
              
              ${repo.homepage ? `
              <div class="repo-homepage">
                  <a href="${repo.homepage}" target="_blank" rel="noopener">
                      <i class="fas fa-external-link-alt"></i> Visit project website
                  </a>
              </div>` : ''}
              
              <div class="readme-content">
                  <h2>README</h2>
                  <div class="markdown-body">
                      ${window.MarkdownParser ? window.MarkdownParser.parse(readmeContent) : readmeContent}
                  </div>
              </div>
          </div>
      `;
      
      container.innerHTML = html;
      
      // Initialize image error handlers
      const images = container.querySelectorAll('img');
      images.forEach(img => {
        if (!img.hasAttribute('onerror')) {
          img.onerror = handleImageError;
        }
      });
      
      // Add click handlers for navigation breadcrumbs with improved reliability
      const breadcrumbItems = container.querySelectorAll('.breadcrumb-item');
      breadcrumbItems.forEach(item => {
        item.addEventListener('click', e => {
          e.preventDefault();
          e.stopPropagation(); // Prevent event bubbling
          
          const targetNodeId = item.getAttribute('data-node-id');
          if (targetNodeId) {
            console.log(`Breadcrumb navigation to: ${targetNodeId}`);
            
            try {
              // First approach: use direct navigation method
              if (window.focusOnNode && typeof window.focusOnNode === 'function') {
                window.focusOnNode(targetNodeId, true);
                return;
              }
              
              // Second approach: dispatch navigation event
              const navEvent = new CustomEvent('nodeNavigation', {
                detail: { 
                  nodeId: targetNodeId, 
                  source: 'breadcrumb' 
                }
              });
              window.dispatchEvent(navEvent);
            } catch (err) {
              console.error("Error during breadcrumb navigation:", err);
            }
          }
        });
      });
      
      return repo;
    } catch (error) {
      console.error("Error loading repository content:", error);
      container.innerHTML = `
          <div class="error-message">
              <h2>Error Loading Repository Content</h2>
              <p>${error.message}</p>
          </div>
      `;
      throw error;
    }
  }

  /**
   * Group repositories by language
   * @param {Array} repositories - Array of repository objects
   * @returns {Object} - Object with languages as keys and arrays of repositories as values
   */
  static groupRepositoriesByLanguage(repositories) {
    const reposByLanguage = {};
    
    repositories.forEach(repo => {
      const language = repo.language || 'Other';
      
      if (!reposByLanguage[language]) {
        reposByLanguage[language] = [];
      }
      
      reposByLanguage[language].push(repo);
    });
    
    return reposByLanguage;
  }
  
  /**
   * Get color for a programming language
   * @param {string} language - Programming language name
   * @returns {string} - CSS color value
   */
  static getLanguageColor(language) {
    const colorMap = {
      'JavaScript': '#f1e05a',
      'TypeScript': '#2b7489',
      'HTML': '#e34c26',
      'CSS': '#563d7c',
      'Python': '#3572A5',
      'Java': '#b07219',
      'C#': '#178600',
      'Go': '#00ADD8',
      'Rust': '#dea584',
      'Ruby': '#701516',
      'PHP': '#4F5D95',
      'C++': '#f34b7d',
      'C': '#555555',
      'Shell': '#89e051',
      'Swift': '#ffac45',
      'Kotlin': '#F18E33',
      'Dart': '#00B4AB',
      'Jupyter Notebook': '#DA5B0B',
      'Other': '#8257e5'
    };
    
    return colorMap[language] || colorMap['Other'];
  }
  
  /**
   * Get GitHub repositories with caching
   * @returns {Promise<Array>} - Array of repositories
   */
  static async getGitHubRepositories() {
    // Check for cached repositories in window object
    if (window._cachedGitHubRepos) {
      return window._cachedGitHubRepos;
    }
    
    try {
      // Check if GithubRepoFetcher is available
      if (window.GithubRepoFetcher) {
        const repos = await window.GithubRepoFetcher.getRepositories();
        
        // Add categories to repositories using the language detector
        const enhancedRepos = window.RepositoryLanguageDetector ? 
          window.RepositoryLanguageDetector.enhanceRepositoryData(repos) : repos;
        
        // Cache the repositories
        window._cachedGitHubRepos = enhancedRepos;
        console.log(`Cached ${enhancedRepos.length} GitHub repositories with categories`);
        return enhancedRepos;
      } else {
        throw new Error('GitHub repository fetcher not available');
      }
    } catch (error) {
      console.error('Error fetching GitHub repositories:', error);
      
      // Try to load from fallback data
      try {
        const response = await fetch('data/repositories.json');
        const fallbackRepos = await response.json();
        
        // Cache the fallback repositories
        window._cachedGitHubRepos = fallbackRepos;
        return fallbackRepos;
      } catch (fallbackError) {
        console.error('Failed to load fallback repository data:', fallbackError);
        return []; // Return empty array as last resort
      }
    }
  }
}

// Improved image error handler with better fallback logic
function handleImageError(event) {
    console.warn(`Failed to load image: ${event.target.src}`);
    
    // Get the base URL
    const baseUrl = window.location.origin;
    const placeholderPath = '/assets/images/placeholder.jpg';
    
    try {
        // First try assets/images/placeholder.jpg
        event.target.src = `${baseUrl}/assets/images/placeholder.jpg`;
        
        // If that fails (it will trigger another error handler call), use a data URI as ultimate fallback
        event.target.onerror = function() {
            // Simple gray placeholder with text using data URI
            this.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150">
                    <rect width="100%" height="100%" fill="#cccccc" />
                    <text x="50%" y="50%" font-family="Arial" font-size="14" text-anchor="middle" fill="#666666">
                        Image not found
                    </text>
                </svg>
            `);
            // Remove any further error handlers to prevent loops
            this.onerror = null;
        };
    } catch (e) {
        // Ultimate fallback if anything goes wrong with the above
        event.target.src = '';
        event.target.alt = 'Image not available';
        event.target.style.display = 'none';
        event.target.onerror = null;
    }
}

// Export the ContentLoader class
window.ContentLoader = ContentLoader;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Content Loader initialized');
});

/**
 * Content loader and template manager for portfolio items
 */
(function() {
    // ...existing code...
    
    // Add missing templates that were mentioned in the warnings
    const templates = window.ContentTemplates = window.ContentTemplates || {};
    
    // Add publicationList template
    templates.publicationList = function(data) {
        const container = document.createElement('div');
        container.className = 'publications-container';
        
        // Create header
        const header = document.createElement('h2');
        header.textContent = 'Publications';
        container.appendChild(header);
        
        // Create introduction
        const intro = document.createElement('p');
        intro.className = 'publications-intro';
        intro.textContent = 'A collection of my published works and research papers.';
        container.appendChild(intro);
        
        // Create publications list
        const list = document.createElement('div');
        list.className = 'publications-list';
        
        // If we have actual data, use it; otherwise, use placeholder
        const publications = data.items || data.publications || [];
        
        if (publications.length > 0) {
            publications.forEach(pub => {
                const item = document.createElement('div');
                item.className = 'publication-item';
                
                const title = document.createElement('h3');
                title.textContent = pub.title || 'Untitled Publication';
                item.appendChild(title);
                
                if (pub.authors) {
                    const authors = document.createElement('p');
                    authors.className = 'pub-authors';
                    authors.textContent = pub.authors;
                    item.appendChild(authors);
                }
                
                if (pub.journal || pub.date) {
                    const details = document.createElement('p');
                    details.className = 'pub-details';
                    details.textContent = [pub.journal, pub.date].filter(Boolean).join(' - ');
                    item.appendChild(details);
                }
                
                if (pub.abstract) {
                    const abstract = document.createElement('p');
                    abstract.className = 'pub-abstract';
                    abstract.textContent = pub.abstract;
                    item.appendChild(abstract);
                }
                
                if (pub.url) {
                    const link = document.createElement('a');
                    link.href = pub.url;
                    link.className = 'pub-link';
                    link.textContent = 'Read Publication';
                    link.target = '_blank';
                    item.appendChild(link);
                }
                
                list.appendChild(item);
            });
        } else {
            // Placeholder content
            const placeholder = document.createElement('div');
            placeholder.className = 'publication-item placeholder';
            placeholder.innerHTML = `
                <h3>Academic Research on Machine Learning</h3>
                <p class="pub-authors">Wagner Montes, et al.</p>
                <p class="pub-details">Journal of AI Research - 2023</p>
                <p class="pub-abstract">This research explores novel approaches to neural network optimization for resource-constrained environments.</p>
                <a href="#" class="pub-link">Read Publication</a>
            `;
            list.appendChild(placeholder);
        }
        
        container.appendChild(list);
        return container;
    };
    
    // Add filmography template
    templates.filmography = function(data) {
        const container = document.createElement('div');
        container.className = 'filmography-container';
        
        // Create header
        const header = document.createElement('h2');
        header.textContent = 'Filmography';
        container.appendChild(header);
        
        // Create introduction
        const intro = document.createElement('p');
        intro.className = 'filmography-intro';
        intro.textContent = 'A collection of my work in film and media production.';
        container.appendChild(intro);
        
        // Create films list
        const list = document.createElement('div');
        list.className = 'films-list';
        
        // If we have actual data, use it; otherwise, use placeholder
        const films = data.items || data.films || [];
        
        if (films.length > 0) {
            films.forEach(film => {
                const item = document.createElement('div');
                item.className = 'film-item';
                
                const title = document.createElement('h3');
                title.textContent = film.title || 'Untitled Film';
                item.appendChild(title);
                
                if (film.role) {
                    const role = document.createElement('p');
                    role.className = 'film-role';
                    role.textContent = film.role;
                    item.appendChild(role);
                }
                
                if (film.year) {
                    const year = document.createElement('p');
                    year.className = 'film-year';
                    year.textContent = film.year;
                    item.appendChild(year);
                }
                
                if (film.description) {
                    const description = document.createElement('p');
                    description.className = 'film-description';
                    description.textContent = film.description;
                    item.appendChild(description);
                }
                
                if (film.url) {
                    const link = document.createElement('a');
                    link.href = film.url;
                    link.className = 'film-link';
                    link.textContent = 'Watch Trailer';
                    link.target = '_blank';
                    item.appendChild(link);
                }
                
                list.appendChild(item);
            });
        } else {
            // Placeholder content
            const placeholder = document.createElement('div');
            placeholder.className = 'film-item placeholder';
            placeholder.innerHTML = `
                <h3>The Digital Frontier</h3>
                <p class="film-role">Director / Producer</p>
                <p class="film-year">2022</p>
                <p class="film-description">A documentary exploring the intersection of technology and creativity in the modern era.</p>
                <a href="#" class="film-link">Watch Trailer</a>
            `;
            list.appendChild(placeholder);
        }
        
        container.appendChild(list);
        return container;
    };
    
    // Add assessment template
    templates.assessment = function(data) {
        const container = document.createElement('div');
        container.className = 'assessment-container';
        
        // Create header
        const header = document.createElement('h2');
        header.textContent = data.title || 'Technology Assessment';
        container.appendChild(header);
        
        // Create description
        const description = document.createElement('div');
        description.className = 'assessment-description';
        description.innerHTML = data.description || 
            '<p>A comprehensive analysis of technology requirements and solutions for optimizing business operations.</p>';
        container.appendChild(description);
        
        // Create assessment sections
        const sections = data.sections || [];
        
        if (sections.length > 0) {
            sections.forEach(section => {
                const sectionEl = document.createElement('div');
                sectionEl.className = 'assessment-section';
                
                const sectionTitle = document.createElement('h3');
                sectionTitle.textContent = section.title || 'Untitled Section';
                sectionEl.appendChild(sectionTitle);
                
                if (section.content) {
                    const content = document.createElement('div');
                    content.className = 'section-content';
                    content.innerHTML = section.content;
                    sectionEl.appendChild(content);
                }
                
                container.appendChild(sectionEl);
            });
        } else {
            // Placeholder content
            const placeholder = document.createElement('div');
            placeholder.className = 'assessment-section placeholder';
            placeholder.innerHTML = `
                <h3>Infrastructure Analysis</h3>
                <div class="section-content">
                    <p>Our assessment identified several key areas for optimization in your current infrastructure:</p>
                    <ul>
                        <li>Server virtualization opportunities</li>
                        <li>Network redundancy improvements</li>
                        <li>Cloud integration pathways</li>
                        <li>Security posture enhancements</li>
                    </ul>
                    <p>These improvements could result in a 25% reduction in operational costs while improving service reliability.</p>
                </div>
            `;
            container.appendChild(placeholder);
        }
        
        // Add call to action
        const cta = document.createElement('div');
        cta.className = 'assessment-cta';
        cta.innerHTML = `
            <h3>Request a Custom Assessment</h3>
            <p>Interested in a personalized technology evaluation for your organization?</p>
            <a href="#contact" class="cta-button">Contact Us</a>
        `;
        container.appendChild(cta);
        
        return container;
    };
    
    // ...existing code...
})();

/**
 * Content Loader
 * Handles loading and displaying content for network nodes
 * Includes repository content display
 */

// ...existing code...

// Add repository content loading functionality
ContentLoader.loadRepositoryContent = async function(nodeId, container) {
    try {
        const repoName = nodeId.replace('repo-', '');
        const repos = await GithubRepoFetcher.getRepositories();
        const repo = repos.find(r => r.name === repoName);
        
        if (!repo) {
            container.innerHTML = `<div class="error-message">Repository ${repoName} not found</div>`;
            return;
        }
        
        // Fetch README content
        const readmeContent = await GithubRepoFetcher.fetchReadme(repo);
        
        // Parse creation date
        const createdDate = new Date(repo.created_at).toLocaleDateString();
        const updatedDate = new Date(repo.updated_at).toLocaleDateString();
        
        // Create repository content HTML
        const html = `
            <div class="repository-content">
                <header class="repo-header">
                    <h1><a href="${repo.html_url}" target="_blank" rel="noopener">${repo.name}</a></h1>
                    <div class="repo-stats">
                        <span class="repo-language"><i class="fas fa-code"></i> ${repo.language || 'Not specified'}</span>
                        <span class="repo-stars"><i class="fas fa-star"></i> ${repo.stargazers_count}</span>
                        <span class="repo-forks"><i class="fas fa-code-branch"></i> ${repo.forks_count}</span>
                    </div>
                </header>
                
                <div class="repo-description">
                    <p>${repo.description || 'No description available'}</p>
                </div>
                
                ${repo.topics && repo.topics.length ? `
                <div class="repo-topics">
                    ${repo.topics.map(topic => `<span class="topic-tag">${topic}</span>`).join('')}
                </div>` : ''}
                
                <div class="repo-dates">
                    <span>Created: ${createdDate}</span>
                    <span>Last updated: ${updatedDate}</span>
                </div>
                
                ${repo.homepage ? `
                <div class="repo-homepage">
                    <a href="${repo.homepage}" target="_blank" rel="noopener">
                        <i class="fas fa-external-link-alt"></i> Visit project website
                    </a>
                </div>` : ''}
                
                <div class="readme-content">
                    <h2>README</h2>
                    <div class="markdown-body">
                        ${MarkdownParser.parse(readmeContent)}
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error("Error loading repository content:", error);
        container.innerHTML = `
            <div class="error-message">
                <h2>Error Loading Repository Content</h2>
                <p>${error.message}</p>
            </div>
        `;
    }
};

// Update the renderNodeContent function to handle repository nodes
const originalRenderNodeContent = ContentLoader.renderNodeContent;
ContentLoader.renderNodeContent = function(node, container) {
    // Check if this is a repository node
    if (node.type === 'repository') {
        this.loadRepositoryContent(node.id, container);
    } else {
        // Use the original function for other node types
        originalRenderNodeContent(node, container);
    }
};

// ...existing code...
