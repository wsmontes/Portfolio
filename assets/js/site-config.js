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
        console.warn('Site configuration not found');
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
    try {
      // Try to use ContentLoader's cached unified data first
      if (window.ContentLoader && window.ContentLoader.getUnifiedData) {
        const unifiedData = await window.ContentLoader.getUnifiedData();
        if (unifiedData && unifiedData.siteConfig) {
          return unifiedData.siteConfig;
        }
      }
      
      // Otherwise, fetch directly
      const response = await fetch('data/unified-data.json');
      if (!response.ok) {
        throw new Error(`Failed to load unified data: ${response.status}`);
      }
      
      const data = await response.json();
      return data.siteConfig || null;
    } catch (error) {
      console.error('Error fetching site configuration:', error);
      return null;
    }
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
    
    // Dispatch event to indicate config is applied
    window.dispatchEvent(new CustomEvent('siteConfigApplied', { 
      detail: { config } 
    }));
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize with slight delay to ensure other scripts have loaded
  setTimeout(() => {
    SiteConfigLoader.initialize();
  }, 100);
});
