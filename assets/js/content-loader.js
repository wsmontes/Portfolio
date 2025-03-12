/**
 * Content Loader
 * Dynamically loads content from JSON files and populates templates
 */

// Class for handling content loading and rendering
class ContentLoader {
  /**
   * Load content from a JSON file and populate the template
   * @param {string} contentType - Type of content (professional, repositories, personal, contact)
   * @param {HTMLElement} container - Container element to populate
   * @returns {Promise} - Promise resolved when content is loaded
   */
  static async loadContent(contentType, container) {
    try {
      const data = await this.fetchContentData(contentType);
      
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
          this.renderAbout(container);
          break;
        case 'contact':
          this.renderContact(data, container);
          break;
        default:
          console.error(`Unknown content type: ${contentType}`);
      }
      
      return data;
    } catch (error) {
      console.error(`Error loading ${contentType} content:`, error);
      container.innerHTML = `<p class="error">Failed to load content. Please try again.</p>`;
      throw error;
    }
  }
  
  /**
   * Fetch content data from JSON file
   * @param {string} contentType - Type of content
   * @returns {Promise<Object>} - Promise resolved with content data
   */
  static async fetchContentData(contentType) {
    try {
      // Map contentType to correct file path
      let path;
      
      switch (contentType) {
        case 'repositories':
          path = 'data/projects.json';
          break;
        case 'about':
          // About doesn't need external data
          return {};
        default:
          path = `data/${contentType}.json`;
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
   * @param {HTMLElement} container - Container element
   */
  static renderAbout(container) {
    let html = `
      <div class="section-content">
        <h2 class="section-title">About Me</h2>
        <div class="about-content">
          <div class="about-image">
            <img src="assets/images/profile.jpg" alt="Profile Picture">
          </div>
          <div class="about-text">
            <p>Hello! I'm a full-stack developer passionate about creating interactive, engaging web applications. With experience in both front-end and back-end development, I enjoy bringing ideas to life through code.</p>
            <p>I specialize in JavaScript frameworks like React and Vue, building responsive interfaces, and developing scalable back-end solutions with Node.js.</p>
            <h3>Skills</h3>
            <div class="skills-container">
              <span class="skill-tag">JavaScript</span>
              <span class="skill-tag">React</span>
              <span class="skill-tag">Node.js</span>
              <span class="skill-tag">Vue.js</span>
              <span class="skill-tag">HTML5/CSS3</span>
              <span class="skill-tag">MongoDB</span>
              <span class="skill-tag">SQL</span>
              <span class="skill-tag">Git</span>
              <span class="skill-tag">AWS</span>
              <span class="skill-tag">Docker</span>
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
            <img src="${project.image}" alt="${project.title}">
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
            <img src="${photo.image}" alt="${photo.title}">
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

// Export the ContentLoader class
window.ContentLoader = ContentLoader;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Content Loader initialized');
});
