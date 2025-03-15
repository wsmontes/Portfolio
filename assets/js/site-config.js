/**
 * Site Configuration Loader
 * Loads site-wide configuration from unified data source and applies it to the DOM
 */

class SiteConfigLoader {
  /**
   * Initialize site configuration
   */
  static async initialize() {
    try {
      // Fetch configuration data
      const config = await this.getSiteConfig();
      if (!config) {
        console.warn('Site configuration not found in unified data');
        return;
      }
      
      // Apply configuration to the DOM
      this.applyConfig(config);
      
      console.log('Site configuration applied successfully');
    } catch (error) {
      console.error('Failed to initialize site configuration:', error);
    }
  }
  
  /**
   * Get site configuration from unified data
   * @returns {Promise<Object|null>} Site configuration object
   */
  static async getSiteConfig() {
    // Use ContentLoader to get the unified data
    const unifiedData = await window.ContentLoader.getUnifiedData();
    return unifiedData.siteConfig || null;
  }
  
  /**
   * Apply configuration to the DOM
   * @param {Object} config - Site configuration
   */
  static applyConfig(config) {
    // Set document title
    if (config.title) {
      document.title = config.title;
    }
    
    // Set favicon
    if (config.favicon) {
      const existingFavicon = document.querySelector('link[rel="icon"]');
      if (existingFavicon) {
        existingFavicon.href = config.favicon;
      } else {
        const favicon = document.createElement('link');
        favicon.rel = 'icon';
        favicon.type = 'image/png';
        favicon.href = config.favicon;
        document.head.appendChild(favicon);
      }
    }
    
    // Set meta description
    if (config.metaDescription) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.content = config.metaDescription;
      }
    }
    
    // Set logo text
    if (config.logo && config.logo.text) {
      const logoElement = document.querySelector('.logo a');
      if (logoElement) {
        logoElement.textContent = config.logo.text;
      }
    }
    
    // Set theme colors if CSS variables are used
    if (config.theme) {
      const root = document.documentElement;
      if (config.theme.primaryColor) {
        root.style.setProperty('--primary-color', config.theme.primaryColor);
      }
      if (config.theme.accentColor) {
        root.style.setProperty('--accent-color', config.theme.accentColor);
      }
    }
    
    // Apply navbar styling based on theme colors
    this.applyNavbarStyling(config);
    
    // Apply menu colors if networkData is available
    this.applyMenuColorsFromNetwork();
    
    // Dispatch event to indicate config is applied
    window.dispatchEvent(new CustomEvent('siteConfigApplied', { 
      detail: { config } 
    }));
  }
  
  /**
   * Apply navbar styling based on theme colors
   * @param {Object} config - Site configuration
   */
  static applyNavbarStyling(config) {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    
    // Keep navbar fully transparent without any borders
    if (config.theme) {
      if (config.theme.primaryColor) {
        // Remove any existing border that might be set from elsewhere
        navbar.style.borderBottom = 'none';
        
        // Add subtle text glow for menu items based on theme color
        const menuItems = navbar.querySelectorAll('.nav-menu li a');
        menuItems.forEach(item => {
          item.style.textShadow = `0 0 10px ${config.theme.primaryColor}33`;
        });
      }
    }
  }
  
  /**
   * Apply menu colors from network data
   */
  static applyMenuColorsFromNetwork() {
    // If the menu color manager and network data are available, apply colors
    if (window.applyMenuColors && window.networkData) {
      window.applyMenuColors(window.networkData);
    } else {
      // If not immediately available, wait for graph loaded event
      window.addEventListener('graphLoaded', () => {
        if (window.applyMenuColors && window.networkData) {
          window.applyMenuColors(window.networkData);
        }
      });
    }
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize with slight delay to ensure ContentLoader is available
  setTimeout(() => {
    SiteConfigLoader.initialize();
  }, 100);
});
