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
    return `
      <div class="frame-template standard-template">
        <h2 class="section-title">${data.title}</h2>
        ${data.intro ? `<p class="section-intro">${data.intro}</p>` : ''}
        <div class="frame-content">
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
  }
};

// Add CSS for templates
document.addEventListener('DOMContentLoaded', function() {
  const styles = document.createElement('style');
  styles.textContent = `
    /* Frame Template Base Styles */
    .frame-template {
      width: 100%;
      max-height: 70vh;
      overflow-y: auto;
      padding-right: 10px;
      scrollbar-width: thin;
      scrollbar-color: var(--primary-color) rgba(0,0,0,0.1);
    }
    
    .frame-template::-webkit-scrollbar {
      width: 6px;
    }
    
    .frame-template::-webkit-scrollbar-track {
      background: rgba(0,0,0,0.1);
      border-radius: 3px;
    }
    
    .frame-template::-webkit-scrollbar-thumb {
      background-color: var(--primary-color);
      border-radius: 3px;
    }
    
    /* Two Column Template */
    .two-column-template .two-column-content {
      display: flex;
      gap: 2rem;
    }
    
    .two-column-template .left-column {
      flex: 0 0 30%;
      max-width: 300px;
    }
    
    .two-column-template .right-column {
      flex: 1;
    }
    
    /* About Template */
    .about-template .about-content {
      display: flex;
      gap: 2rem;
      align-items: flex-start;
    }
    
    .about-template .about-image {
      flex: 0 0 30%;
      max-width: 300px;
    }
    
    .about-template .about-image img {
      width: 100%;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    }
    
    .about-template .about-text {
      flex: 1;
    }
    
    /* Gallery Template */
    .gallery-template .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1.25rem;
      margin-top: 1rem;
      max-height: 60vh;
      overflow-y: auto;
      padding-right: 10px;
    }
    
    .gallery-template .gallery-grid::-webkit-scrollbar {
      width: 6px;
    }
    
    .gallery-template .gallery-grid::-webkit-scrollbar-track {
      background: rgba(0,0,0,0.1);
    }
    
    .gallery-template .gallery-grid::-webkit-scrollbar-thumb {
      background-color: var(--primary-color);
      border-radius: 3px;
    }
    
    /* Project List Template */
    .project-list-template .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-top: 1rem;
      max-height: 60vh;
      overflow-y: auto;
      padding-right: 10px;
    }
    
    .project-list-template .projects-grid::-webkit-scrollbar {
      width: 6px;
    }
    
    .project-list-template .projects-grid::-webkit-scrollbar-track {
      background: rgba(0,0,0,0.1);
    }
    
    .project-list-template .projects-grid::-webkit-scrollbar-thumb {
      background-color: var(--primary-color);
      border-radius: 3px;
    }
    
    /* Contact Template */
    .contact-template .contact-content {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 2rem;
    }
    
    /* Handle long forms with scrolling */
    .contact-template .contact-form {
      max-height: 60vh;
      overflow-y: auto;
      padding-right: 10px;
    }
    
    @media (max-width: 768px) {
      .two-column-template .two-column-content,
      .about-template .about-content {
        flex-direction: column;
      }
      
      .two-column-template .left-column,
      .about-template .about-image {
        flex: 0 0 100%;
        max-width: 100%;
      }
      
      .contact-template .contact-content {
        grid-template-columns: 1fr;
      }
      
      /* Adjust scrollable areas for mobile */
      .frame-template,
      .gallery-template .gallery-grid,
      .project-list-template .projects-grid,
      .contact-template .contact-form {
        max-height: 65vh;
      }
    }
  `;
  document.head.appendChild(styles);
});

// Expose to global scope
window.FrameTemplates = FrameTemplates;
