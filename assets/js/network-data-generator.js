/**
 * Network Data Generator
 * Dynamically generates network data from unified JSON data source
 */

class NetworkDataGenerator {
  constructor() {
    // Base network structure with empty nodes and links
    this.networkData = {
      nodes: [],
      links: []
    };
    
    // Source path for unified data
    this.unifiedDataPath = 'data/unified-data.json';
  }
  
  /**
   * Generate the network data from unified JSON file
   * @returns {Promise<Object>} - NetworkData object with nodes and links
   */
  async generate() {
    try {
      // Fetch unified data
      const response = await fetch(this.unifiedDataPath);
      if (!response.ok) {
        throw new Error(`Failed to load unified data: ${response.status}`);
      }
      
      const unifiedData = await response.json();
      
      // Process the unified data to create network nodes and links
      return this.processUnifiedData(unifiedData);
    } catch (error) {
      console.error("Failed to generate network data:", error);
      // Return fallback network data from network-data.js
      return window.NetworkData || { nodes: [], links: [] };
    }
  }
  
  /**
   * Process unified data into network nodes and links
   * @param {Object} unifiedData - Unified graph and content data
   * @returns {Object} - ProcessedNetworkData object with nodes and links
   */
  processUnifiedData(unifiedData) {
    if (!unifiedData || !unifiedData.graphConfig) {
      throw new Error("Invalid unified data format");
    }
    
    const { centerNode, categories } = unifiedData.graphConfig;
    
    // Clear existing data
    this.networkData = {
      nodes: [],
      links: []
    };
    
    // Add center node
    const centerNodeData = this.createNodeFromUnified(centerNode);
    this.networkData.nodes.push(centerNodeData);
    
    // Process each category
    categories.forEach(category => {
      // Add category node
      const categoryNode = this.createNodeFromUnified(category);
      this.networkData.nodes.push(categoryNode);
      
      // Add link from center to category
      this.networkData.links.push({
        source: centerNode.id,
        target: category.id,
        value: 5,
        type: 'connection'
      });
      
      // Process category children recursively
      if (Array.isArray(category.children)) {
        this.processChildren(category, category.children);
      }
    });
    
    return this.networkData;
  }
  
  /**
   * Recursively process child nodes of a parent
   * @param {Object} parent - Parent node data
   * @param {Array} children - Child nodes array
   */
  processChildren(parent, children) {
    children.forEach(child => {
      // Add child node
      const childNode = this.createNodeFromUnified(child);
      childNode.parentId = parent.id; // Set parent ID for reference
      this.networkData.nodes.push(childNode);
      
      // Add link from parent to child
      this.networkData.links.push({
        source: parent.id,
        target: child.id,
        value: this.getLinkValueByGroups(parent.group, child.group),
        type: 'connection'
      });
      
      // Recursively process grandchildren if any
      if (Array.isArray(child.children)) {
        this.processChildren(child, child.children);
      }
    });
  }
  
  /**
   * Create a network node object from unified data format
   * @param {Object} nodeData - Unified node data
   * @returns {Object} - Network node object format
   */
  createNodeFromUnified(nodeData) {
    // Extract visualization properties
    const visualization = nodeData.visualization || {};
    
    // Create the node object with all required properties
    const node = {
      id: nodeData.id,
      name: nodeData.name,
      description: nodeData.description,
      group: nodeData.group,
      val: visualization.val,
      mass: visualization.mass,
      size: visualization.size,
      texture: visualization.texture,
      rotationSpeed: visualization.rotationSpeed
    };
    
    // Add optional properties
    if (visualization.emissive) node.emissive = visualization.emissive;
    if (visualization.fixedPosition) {
      node.fx = 0; 
      node.fy = 0; 
      node.fz = 0;
    }
    if (nodeData.parentId) node.parentId = nodeData.parentId;
    
    return node;
  }
  
  /**
   * Determine link value based on group types
   * @param {string} sourceGroup - Source node group
   * @param {string} targetGroup - Target node group
   * @returns {number} - Link value
   */
  getLinkValueByGroups(sourceGroup, targetGroup) {
    if (sourceGroup === 'main' && targetGroup === 'category') {
      return 5;
    } else if (sourceGroup === 'category' && ['subcategory', 'cluster'].includes(targetGroup)) {
      return 4;
    } else if (['subcategory', 'cluster'].includes(sourceGroup) && targetGroup === 'item') {
      return 2;
    }
    return 3; // Default value
  }
}

// Export generator
window.NetworkDataGenerator = NetworkDataGenerator;
