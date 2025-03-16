/**
 * Frame Templates
 * Defines reusable layout templates for content frames
 */

const FrameTemplates = {
  /**
   * Standard template with title and content
   * @param {Object} data - Content data
   * @returns {string} HTML string
   */
  standard: function(data) {
    let sectionsHtml = '';
    
    // If the data has sections, render them
    if (Array.isArray(data.sections) && data.sections.length > 0) {
      sectionsHtml = `
        <div class="navigation-help">
          ${data.sections.map(section => `
            <div class="help-section">
              <h3>${section.title || ''}</h3>
              <p>${section.text || ''}</p>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    return `
      <div class="frame-template standard-template">
        <h2 class="section-title">${data.title}</h2>
        ${data.intro ? `<p class="section-intro">${data.intro}</p>` : ''}
        <div class="frame-content">
          ${sectionsHtml}
          ${data.content || ''}
        </div>
      </div>
    `;
  },
  
  /**
   * Two-column template with image on left, content on right
   * @param {Object} data - Content data
   * @returns {string} HTML string
   */
  twoColumn: function(data) {
    return `
      <div class="frame-template two-column-template">
        <h2 class="section-title">${data.title}</h2>
        <div class="two-column-content">
          <div class="left-column">
            ${data.leftColumn || ''}
          </div>
          <div class="right-column">
            ${data.rightColumn || ''}
          </div>
        </div>
      </div>
    `;
  },
  
  /**
   * Gallery template with filters and image grid
   * @param {Object} data - Content data 
   * @returns {string} HTML string
   */
  gallery: function(data) {
    // Construct filter buttons if categories exist
    let filterHtml = '';
    if (data.categories && data.categories.length > 0) {
      filterHtml = `
        <div class="gallery-filters">
          ${data.categories.map((category, index) => 
            `<button class="filter-btn ${index === 0 ? 'active' : ''}" 
             data-filter="${category.id}">${category.name}</button>`).join('')}
        </div>
      `;
    }
    
    // Construct gallery items
    let galleryItemsHtml = '';
    if (data.items && data.items.length > 0) {
      galleryItemsHtml = data.items.map(item => `
        <div class="gallery-item" data-category="${item.category || ''}">
          <img src="${item.image}" alt="${item.title || ''}" onerror="handleImageError(event)">
          <div class="gallery-caption">
            <h3>${item.title || 'Untitled'}</h3>
            ${item.description ? `<p>${item.description}</p>` : ''}
          </div>
        </div>
      `).join('');
    } else {
      galleryItemsHtml = '<p class="empty-state">No items available</p>';
    }
    
    return `
      <div class="frame-template gallery-template">
        <h2 class="section-title">${data.title}</h2>
        ${data.intro ? `<p class="section-intro">${data.intro}</p>` : ''}
        ${filterHtml}
        <div class="gallery-grid">
          ${galleryItemsHtml}
        </div>
      </div>
    `;
  },
  
  /**
   * Project list template with filtering
   * @param {Object} data - Content data
   * @returns {string} HTML string
   */
  projectList: function(data) {
    // Construct filter buttons
    let filterHtml = `
      <div class="project-filters">
        <button class="filter-btn active" data-filter="all">All Projects</button>
        ${data.filterCategories ? data.filterCategories.map(cat => 
          `<button class="filter-btn" data-filter="${cat.id}">${cat.name}</button>`).join('') : ''}
      </div>
    `;
    
    // Construct project items
    let projectItemsHtml = '';
    if (data.projects && data.projects.length > 0) {
      projectItemsHtml = data.projects.map(project => `
        <div class="project-card" data-category="${project.category || ''}">
          <div class="project-image">
            <img src="${project.image}" alt="${project.title}" onerror="handleImageError(event)">
          </div>
          <div class="project-details">
            <h3>${project.title}</h3>
            <p>${project.description || ''}</p>
            ${project.technologies ? `
              <div class="technologies">
                ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
              </div>` : ''}
            <div class="project-links">
              ${project.liveUrl ? `<a href="${project.liveUrl}" target="_blank" class="btn primary">
                <i class="fas fa-external-link-alt"></i> View Live</a>` : ''}
              ${project.githubUrl ? `<a href="${project.githubUrl}" target="_blank" class="btn secondary">
                <i class="fab fa-github"></i> GitHub</a>` : ''}
            </div>
          </div>
        </div>
      `).join('');
    } else {
      projectItemsHtml = '<p class="empty-state">No projects available</p>';
    }
    
    return `
      <div class="frame-template project-list-template">
        <h2 class="section-title">${data.title}</h2>
        ${data.intro ? `<p class="section-intro">${data.intro}</p>` : ''}
        ${filterHtml}
        <div class="projects-grid">
          ${projectItemsHtml}
        </div>
      </div>
    `;
  },
  
  /**
   * About me template with profile image and bio
   * @param {Object} data - Content data
   * @returns {string} HTML string
   */
  aboutMe: function(data) {
    return `
      <div class="frame-template about-template">
        <h2 class="section-title">${data.title}</h2>
        <div class="about-content">
          <div class="about-image">
            <img src="${data.profileImage || ''}" alt="Profile" onerror="handleImageError(event)">
          </div>
          <div class="about-text">
            ${data.introduction ? `<p>${data.introduction}</p>` : ''}
            ${data.bio ? `<p>${data.bio}</p>` : ''}
            ${data.skills ? `
              <h3>Skills</h3>
              <div class="skills-container">
                ${data.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
              </div>` : ''}
            ${data.contact ? `
              <div class="contact-info">
                ${data.contact.email ? `<p>Email: <a href="mailto:${data.contact.email}">${data.contact.email}</a></p>` : ''}
                ${data.contact.linkedin ? `<p>LinkedIn: <a href="${data.contact.linkedin}" target="_blank">${data.contact.linkedin}</a></p>` : ''}
              </div>` : ''}
          </div>
        </div>
      </div>
    `;
  },
  
  /**
   * Contact template with form and info
   * @param {Object} data - Content data
   * @returns {string} HTML string
   */
  contact: function(data) {
    return `
      <div class="frame-template contact-template">
        <h2 class="section-title">${data.title}</h2>
        <div class="contact-content">
          <div class="contact-info">
            ${data.contactInfo ? data.contactInfo.map(item => `
              <div class="contact-item">
                <i class="${item.icon}"></i>
                <p>${item.value}</p>
              </div>
            `).join('') : ''}
            
            ${data.socialLinks ? `
              <div class="social-links">
                ${data.socialLinks.map(link => `
                  <a href="${link.url}" target="_blank"><i class="${link.icon}"></i></a>
                `).join('')}
              </div>` : ''}
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
  },

  /**
   * Repository detail template with improved content organization
   * @param {Object} data - Repository data
   * @returns {string} HTML template
   */
  repository: function(data) {
    if (!data || !data.repoData) {
      return `
        <div class="frame-template repository-template">
          <div class="error-message">Repository data not available</div>
        </div>
      `;
    }
    
    const repo = data.repoData;
    
    // Parse dates
    const createdDate = new Date(repo.created_at).toLocaleDateString();
    const updatedDate = new Date(repo.updated_at).toLocaleDateString();
    
    return `
      <div class="frame-template repository-template">
        <header class="repo-header">
          <h1>
            <a href="${repo.html_url}" target="_blank" rel="noopener">
              ${repo.name}
              <i class="fas fa-external-link-alt" style="font-size: 0.7em; margin-left: 5px;"></i>
            </a>
          </h1>
          <div class="repo-stats">
            <span class="repo-language"><i class="fas fa-code"></i> ${repo.language || 'Not specified'}</span>
            <span class="repo-stars"><i class="fas fa-star"></i> ${repo.stargazers_count}</span>
            <span class="repo-forks"><i class="fas fa-code-branch"></i> ${repo.forks_count}</span>
            <span class="repo-issues"><i class="fas fa-exclamation-circle"></i> ${repo.open_issues_count}</span>
          </div>
        </header>
        
        <div class="repo-description scroll-reveal">
          <p>${repo.description || 'No description available'}</p>
        </div>
        
        ${repo.topics && repo.topics.length ? `
        <div class="repo-topics scroll-reveal">
          ${repo.topics.map(topic => `<span class="topic-tag">${topic}</span>`).join('')}
        </div>` : ''}
        
        <div class="repo-dates scroll-reveal">
          <span><i class="fas fa-calendar"></i> Created: ${createdDate}</span>
          <span><i class="fas fa-clock"></i> Updated: ${updatedDate}</span>
        </div>
        
        ${repo.homepage ? `
        <div class="repo-homepage scroll-reveal">
          <a href="${repo.homepage}" target="_blank" rel="noopener">
            <i class="fas fa-external-link-alt"></i> Visit project website
          </a>
        </div>` : ''}
        
        <div class="repo-tabs scroll-reveal">
          <div class="repo-tab active" data-tab="readme">README</div>
          <div class="repo-tab" data-tab="files">Files</div>
          ${repo.has_issues ? `<div class="repo-tab" data-tab="issues">Issues</div>` : ''}
          <div class="repo-tab" data-tab="stats">Stats</div>
        </div>
        
        <div class="repo-tab-content active" data-tab="readme">
          <div class="readme-content scroll-reveal scrollable-container">
            <div class="markdown-body">
              ${data.readmeContent ? 
                (window.MarkdownParser ? window.MarkdownParser.parse(data.readmeContent) : data.readmeContent) : 
                '<div class="empty-readme">No README content available.</div>'}
            </div>
            <button class="scroll-indicator" title="Scroll to top">
              <i class="fas fa-chevron-up"></i>
            </button>
          </div>
        </div>
        
        <div class="repo-tab-content" data-tab="files">
          <div class="repo-files scroll-reveal scrollable-container">
            <p class="loading-message">Loading repository files...</p>
            <!-- Files will be loaded dynamically -->
          </div>
        </div>
        
        ${repo.has_issues ? `
        <div class="repo-tab-content" data-tab="issues">
          <div class="repo-issues scroll-reveal scrollable-container">
            <p class="loading-message">Loading issues...</p>
            <!-- Issues will be loaded dynamically -->
          </div>
        </div>` : ''}
        
        <div class="repo-tab-content" data-tab="stats">
          <div class="repo-stats-detail scroll-reveal">
            <h3>Repository Statistics</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${repo.stargazers_count}</div>
                <div class="stat-label"><i class="fas fa-star"></i> Stars</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${repo.forks_count}</div>
                <div class="stat-label"><i class="fas fa-code-branch"></i> Forks</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${repo.watchers_count}</div>
                <div class="stat-label"><i class="fas fa-eye"></i> Watchers</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${repo.open_issues_count}</div>
                <div class="stat-label"><i class="fas fa-exclamation-circle"></i> Issues</div>
              </div>
            </div>
            
            <h3>Activity</h3>
            <p>Last updated: ${updatedDate}</p>
            <div class="activity-timeline">
              <div class="timeline-item">
                <div class="timeline-icon"><i class="fas fa-plus-circle"></i></div>
                <div class="timeline-content">
                  <h4>Repository created</h4>
                  <p>${createdDate}</p>
                </div>
              </div>
            </div>
            
            ${repo.language ? `
            <h3>Language</h3>
            <div class="language-stats">
              <div class="language-bar">
                <div class="language-fill" style="width: 100%; background: ${getLanguageColor(repo.language)};"></div>
              </div>
              <p>${repo.language}</p>
            </div>` : ''}
          </div>
        </div>
      </div>
    `;
  }
};

/**
 * Get color for programming language
 * @param {string} language - Programming language name
 * @returns {string} - CSS color value
 */
function getLanguageColor(language) {
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
    'Jupyter Notebook': '#DA5B0B'
  };
  
  return colorMap[language] || '#8257e5'; // Default purple color for unknown languages
}

// Add CSS for templates
document.addEventListener('DOMContentLoaded', function() {
  const styles = document.createElement('style');
  styles.textContent = `
    /* ======= Frame Template Design System ======= */
    
    /* Variables */
    :root {
      --template-spacing-xs: 0.5rem;
      --template-spacing-sm: 1rem;
      --template-spacing-md: 1.5rem;
      --template-spacing-lg: 2rem;
      --template-spacing-xl: 3rem;
      
      --template-border-radius-sm: 4px;
      --template-border-radius-md: 8px;
      --template-border-radius-lg: 12px;
      
      --template-transition-speed: 0.3s;
      
      --template-shadow-sm: 0 2px 5px rgba(0,0,0,0.1);
      --template-shadow-md: 0 4px 10px rgba(0,0,0,0.15);
      --template-shadow-lg: 0 6px 15px rgba(0,0,0,0.2);
    }
    
    /* ======= Base Styles ======= */
    .frame-template {
      width: 100%;
      max-height: 70vh;
      overflow-y: auto;
      padding: var(--template-spacing-md);
      scrollbar-width: thin;
      scrollbar-color: var(--primary-color, #4a6cf7) rgba(0,0,0,0.1);
      font-family: inherit;
      color: rgba(255, 255, 255, 0.9);
    }
    
    .frame-template::-webkit-scrollbar {
      width: 6px;
    }
    
    .frame-template::-webkit-scrollbar-track {
      background: rgba(0,0,0,0.1);
      border-radius: var(--template-border-radius-sm);
    }
    
    .frame-template::-webkit-scrollbar-thumb {
      background-color: var(--primary-color, #4a6cf7);
      border-radius: var(--template-border-radius-sm);
    }
    
    /* Typography */
    .frame-template h2.section-title {
      font-size: 1.75rem;
      margin-bottom: var(--template-spacing-md);
      color: #fff;
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    
    .frame-template h3 {
      font-size: 1.25rem;
      margin-top: var(--template-spacing-md);
      margin-bottom: var(--template-spacing-sm);
      color: var(--primary-color, #4a6cf7);
      font-weight: 500;
    }
    
    .frame-template p {
      margin-bottom: var(--template-spacing-md);
      line-height: 1.6;
    }
    
    .frame-template .section-intro {
      font-size: 1.1rem;
      margin-bottom: var(--template-spacing-lg);
      color: rgba(255, 255, 255, 0.8);
    }
    
    /* Cards & Containers */
    .frame-template .card {
      background: rgba(255, 255, 255, 0.08);
      border-radius: var(--template-border-radius-md);
      padding: var(--template-spacing-md);
      margin-bottom: var(--template-spacing-md);
      transition: transform var(--template-transition-speed), 
                  box-shadow var(--template-transition-speed);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .frame-template .card:hover {
      transform: translateY(-3px);
      box-shadow: var(--template-shadow-md);
      background: rgba(255, 255, 255, 0.1);
    }
    
    /* Common Components */
    .frame-template .btn {
      display: inline-flex;
      align-items: center;
      padding: 0.6rem 1.2rem;
      border-radius: var(--template-border-radius-sm);
      font-weight: 500;
      text-decoration: none;
      transition: all var(--template-transition-speed);
      border: none;
      cursor: pointer;
      margin-right: var(--template-spacing-sm);
      font-size: 0.95rem;
    }
    
    .frame-template .btn i {
      margin-right: 0.5rem;
    }
    
    .frame-template .btn.primary {
      background: var(--primary-color, #4a6cf7);
      color: white;
    }
    
    .frame-template .btn.primary:hover {
      background: var(--primary-color, #4a6cf7);
      opacity: 0.9;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }
    
    .frame-template .btn.secondary {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .frame-template .btn.secondary:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateY(-2px);
    }
    
    .frame-template .tag-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin: var(--template-spacing-sm) 0;
    }
    
    .frame-template .tag {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.9);
      padding: 0.3rem 0.8rem;
      border-radius: 30px;
      font-size: 0.85rem;
      display: inline-block;
    }
    
    .tech-tag, .skill-tag {
      background: rgba(74, 108, 247, 0.15);
      color: var(--primary-color, #4a6cf7);
      padding: 0.3rem 0.8rem;
      border-radius: 30px;
      font-size: 0.85rem;
      display: inline-block;
      margin-right: 0.5rem;
      margin-bottom: 0.5rem;
    }
    
    /* Form elements */
    .frame-template input,
    .frame-template textarea,
    .frame-template select {
      width: 100%;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 0.8rem 1rem;
      border-radius: var(--template-border-radius-sm);
      color: white;
      margin-bottom: var(--template-spacing-md);
      transition: all var(--template-transition-speed);
    }
    
    .frame-template input:focus,
    .frame-template textarea:focus,
    .frame-template select:focus {
      outline: none;
      border-color: var(--primary-color, #4a6cf7);
      box-shadow: 0 0 0 2px rgba(74, 108, 247, 0.2);
    }
    
    .frame-template label {
      display: block;
      margin-bottom: 0.5rem;
      color: rgba(255, 255, 255, 0.7);
    }
    
    /* ======= Template Specific Styles ======= */
    
    /* Navigation Help Sections */
    .navigation-help {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--template-spacing-md);
      margin-top: var(--template-spacing-lg);
    }
    
    .help-section {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--template-border-radius-md);
      padding: var(--template-spacing-md);
      transition: transform var(--template-transition-speed), 
                  box-shadow var(--template-transition-speed);
    }
    
    .help-section:hover {
      transform: translateY(-3px);
      box-shadow: var(--template-shadow-md);
      background: rgba(255, 255, 255, 0.1);
    }
    
    .help-section h3 {
      margin-top: 0;
      color: var(--primary-color, #4a6cf7);
    }
    
    /* Two Column Template */
    .two-column-template .two-column-content {
      display: flex;
      flex-wrap: wrap;
      gap: var(--template-spacing-lg);
    }
    
    .two-column-template .left-column {
      flex: 1;
      min-width: 250px;
      max-width: 400px;
    }
    
    .two-column-template .right-column {
      flex: 2;
      min-width: 300px;
    }
    
    /* About Template */
    .about-template .about-content {
      display: flex;
      flex-wrap: wrap;
      gap: var(--template-spacing-lg);
      align-items: flex-start;
    }
    
    .about-template .about-image {
      flex: 1;
      min-width: 200px;
      max-width: 300px;
    }
    
    .about-template .about-image img {
      width: 100%;
      border-radius: var(--template-border-radius-md);
      box-shadow: var(--template-shadow-md);
      transition: transform var(--template-transition-speed);
    }
    
    .about-template .about-image img:hover {
      transform: scale(1.02);
    }
    
    .about-template .about-text {
      flex: 2;
      min-width: 300px;
    }
    
    .about-template .skills-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: var(--template-spacing-md);
    }
    
    /* Gallery Template */
    .gallery-filters, 
    .project-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: var(--template-spacing-md);
    }
    
    .filter-btn {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.8);
      border-radius: 30px;
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all var(--template-transition-speed);
    }
    
    .filter-btn:hover {
      background: rgba(255, 255, 255, 0.12);
    }
    
    .filter-btn.active {
      background: var(--primary-color, #4a6cf7);
      color: white;
      border-color: transparent;
    }
    
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: var(--template-spacing-md);
      margin-top: var(--template-spacing-md);
    }
    
    .gallery-item {
      position: relative;
      border-radius: var(--template-border-radius-md);
      overflow: hidden;
      transition: transform var(--template-transition-speed);
      aspect-ratio: 3/2;
      background: rgba(0, 0, 0, 0.2);
    }
    
    .gallery-item:hover {
      transform: translateY(-5px);
    }
    
    .gallery-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform var(--template-transition-speed);
    }
    
    .gallery-item:hover img {
      transform: scale(1.05);
    }
    
    .gallery-caption {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: var(--template-spacing-sm);
      background: linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0));
      transition: opacity var(--template-transition-speed);
    }
    
    .gallery-caption h3 {
      margin: 0 0 5px 0;
      font-size: 1rem;
      color: white;
    }
    
    .gallery-caption p {
      margin: 0;
      font-size: 0.85rem;
      opacity: 0.8;
    }
    
    /* Project List Template */
    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--template-spacing-lg);
      margin-top: var(--template-spacing-md);
    }
    
    .project-card {
      display: flex;
      flex-direction: column;
      border-radius: var(--template-border-radius-md);
      overflow: hidden;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: transform var(--template-transition-speed), 
                  box-shadow var(--template-transition-speed);
    }
    
    .project-card:hover {
      transform: translateY(-5px);
      box-shadow: var(--template-shadow-lg);
      background: rgba(255, 255, 255, 0.08);
    }
    
    .project-image {
      width: 100%;
      height: 180px;
      overflow: hidden;
    }
    
    .project-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform var(--template-transition-speed);
    }
    
    .project-card:hover .project-image img {
      transform: scale(1.05);
    }
    
    .project-details {
      padding: var(--template-spacing-md);
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    
    .project-details h3 {
      margin-top: 0;
      color: white;
    }
    
    .project-details p {
      margin-bottom: var(--template-spacing-md);
      font-size: 0.95rem;
      flex: 1;
    }
    
    .technologies {
      margin-bottom: var(--template-spacing-md);
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    .project-links {
      margin-top: auto;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    /* Contact Template */
    .contact-template .contact-content {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: var(--template-spacing-lg);
    }
    
    .contact-info {
      display: flex;
      flex-direction: column;
      gap: var(--template-spacing-md);
    }
    
    .contact-item {
      display: flex;
      align-items: center;
      gap: var(--template-spacing-sm);
      padding: var(--template-spacing-sm);
      background: rgba(255, 255, 255, 0.05);
      border-radius: var(--template-border-radius-sm);
    }
    
    .contact-item i {
      font-size: 1.2rem;
      color: var(--primary-color, #4a6cf7);
      width: 2rem;
      text-align: center;
    }
    
    .social-links {
      display: flex;
      gap: 1rem;
      margin-top: var(--template-spacing-sm);
    }
    
    .social-links a {
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      font-size: 1.2rem;
      transition: all var(--template-transition-speed);
    }
    
    .social-links a:hover {
      background: var(--primary-color, #4a6cf7);
      transform: translateY(-3px);
    }
    
    /* Empty states and messages */
    .empty-state {
      text-align: center;
      padding: var(--template-spacing-lg);
      color: rgba(255, 255, 255, 0.6);
      font-style: italic;
      background: rgba(255, 255, 255, 0.03);
      border-radius: var(--template-border-radius-md);
      border: 1px dashed rgba(255, 255, 255, 0.1);
    }
    
    /* ======= Responsive Adjustments ======= */
    @media (max-width: 1200px) {
      .projects-grid {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      }
      
      .gallery-grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      }
    }
    
    @media (max-width: 992px) {
      .frame-template {
        padding: var(--template-spacing-sm);
      }
      
      .contact-template .contact-content {
        grid-template-columns: 1fr;
      }
      
      .social-links {
        justify-content: flex-start;
      }
    }
    
    @media (max-width: 768px) {
      .two-column-template .two-column-content,
      .about-template .about-content {
        flex-direction: column;
      }
      
      .two-column-template .left-column,
      .about-template .about-image {
        max-width: 100%;
      }
      
      .frame-template,
      .gallery-grid,
      .projects-grid {
        max-height: 65vh;
      }
      
      .gallery-filters, 
      .project-filters {
        overflow-x: auto;
        padding-bottom: var(--template-spacing-sm);
        margin-bottom: var(--template-spacing-sm);
      }
      
      .filter-btn {
        white-space: nowrap;
      }
    }
    
    @media (max-width: 576px) {
      .frame-template h2.section-title {
        font-size: 1.5rem;
      }
      
      .projects-grid,
      .gallery-grid {
        grid-template-columns: 1fr;
      }
      
      .frame-template .btn {
        width: 100%;
        justify-content: center;
        margin-bottom: var(--template-spacing-sm);
        margin-right: 0;
      }
      
      .project-links {
        flex-direction: column;
      }
    }
  `;
  document.head.appendChild(styles);
});

// Expose to global scope
window.FrameTemplates = FrameTemplates;
