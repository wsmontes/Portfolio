/**
 * Menu Color Manager
 * Applies colors from network node data to menu items
 */
document.addEventListener('DOMContentLoaded', function() {
  // This function will be called once the network data is loaded
  window.applyMenuColors = function(networkData) {
    const navMenu = document.querySelector('.nav-menu');
    if (!navMenu) {
      console.log('Nav menu not found, will try again later');
      return;
    }
    
    const menuItems = navMenu.querySelectorAll('li');
    
    console.log(`Applying colors to ${menuItems.length} menu items`);
    
    menuItems.forEach(item => {
      const link = item.querySelector('a');
      if (!link) return;
      
      // Get the section name from the link's text or data attribute
      const sectionId = link.dataset.section;
      const sectionText = link.textContent.trim().toLowerCase();
      
      // Find matching node in the network data
      const matchingNode = findMatchingNode(networkData.nodes, sectionId, sectionText);
      
      // If we found a matching node, apply its color to the menu item
      if (matchingNode) {
        const nodeColor = getNodeColor(matchingNode);
        if (nodeColor) {
          // Set the custom property for this specific menu item
          link.style.setProperty('--item-color', nodeColor);
          console.log(`Set menu color for ${sectionId || sectionText}: ${nodeColor}`);
        }
      }
    });
    
    // Add debugging info
    window.debugMenuColors = function() {
      const menuColorInfo = [];
      menuItems.forEach(item => {
        const link = item.querySelector('a');
        if (!link) return;
        
        const sectionId = link.dataset.section;
        const sectionText = link.textContent.trim().toLowerCase();
        const styleColor = link.style.getPropertyValue('--item-color');
        const computedColor = window.getComputedStyle(link).color;
        
        menuColorInfo.push({
          section: sectionId || sectionText,
          customProperty: styleColor || 'Not set',
          computedColor: computedColor
        });
      });
      console.table(menuColorInfo);
      return menuColorInfo;
    };
  };
  
  /**
   * Find a matching node in the network data
   * @param {Array} nodes - Array of nodes
   * @param {string} id - Node ID to match
   * @param {string} text - Node text to match as fallback
   * @returns {Object|null} - Matching node or null
   */
  function findMatchingNode(nodes, id, text) {
    if (!nodes || !Array.isArray(nodes)) return null;
    
    // First try to find by exact ID match
    if (id) {
      const exactMatch = nodes.find(node => 
        node.id === id || 
        node.id.toLowerCase() === id.toLowerCase()
      );
      if (exactMatch) return exactMatch;
    }
    
    // Then try by name
    const nameMatch = nodes.find(node => {
      const nodeName = node.name ? node.name.toLowerCase() : '';
      return nodeName === text;
    });
    
    return nameMatch || null;
  }
  
  /**
   * Get the color of a node from various possible properties
   * @param {Object} node - Node object
   * @returns {string|null} - Color value or null
   */
  function getNodeColor(node) {
    if (!node) return null;
    
    // Check for color in various locations based on the data structure
    return node.color || 
           node.visualization?.color ||
           node.emissive || 
           node.visualization?.emissive ||
           null;
  }
  
  // If network data is already available, apply colors immediately
  if (window.networkData) {
    window.applyMenuColors(window.networkData);
  }
});
