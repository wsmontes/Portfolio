import React, { useState, useEffect } from 'react';
import './Menu.css';

const Menu = ({ onNodeClick, activeNode }) => {
  // State for menu nodes and UI states
  const [menuNodes, setMenuNodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [menuActive, setMenuActive] = useState(false);
  const [activeNodeData, setActiveNodeData] = useState(null);

  // Detect mobile viewport
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Get active node data when activeNode changes
  useEffect(() => {
    if (activeNode && window.ContentLoader) {
      window.ContentLoader.getUnifiedData()
        .then(unifiedData => {
          const node = window.ContentLoader.findNodeInUnifiedData(unifiedData, activeNode);
          if (node) {
            setActiveNodeData(node);
            console.log("Active node data set:", node.name);
          }
        })
        .catch(err => {
          console.error("Error fetching active node data:", err);
        });
    }
  }, [activeNode]);
  
  // Load menu items from unified data
  useEffect(() => {
    const loadMenuNodes = async () => {
      setIsLoading(true);
      
      try {
        // Check if ContentLoader is available
        if (!window.ContentLoader) {
          console.error("ContentLoader not available");
          setMenuNodes([]);
          setIsLoading(false);
          return;
        }
        
        // Get unified data
        const unifiedData = await window.ContentLoader.getUnifiedData();
        
        // Extract categories and important nodes for the menu
        const mainCategories = unifiedData.graphConfig.categories || [];
        const centerNode = unifiedData.graphConfig.centerNode;
        
        // Create an array of menu items
        const menuItems = [
          // Add center node as home
          {
            id: centerNode.id,
            name: "Home",
            description: centerNode.description,
            icon: "fas fa-home",
            priority: 0
          },
          // Add categories
          ...mainCategories.map((category, index) => ({
            id: category.id,
            name: category.name,
            description: category.description,
            icon: getCategoryIcon(category.id),
            priority: index + 1,
            color: getCategoryColor(category)
          }))
        ];
        
        // Sort by priority
        menuItems.sort((a, b) => a.priority - b.priority);
        
        setMenuNodes(menuItems);
      } catch (error) {
        console.error("Error loading menu nodes:", error);
        setMenuNodes([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMenuNodes();
    
    // Add resize listener for mobile detection
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Get appropriate icon for category
  const getCategoryIcon = (categoryId) => {
    switch(categoryId) {
      case 'professional': return 'fas fa-briefcase';
      case 'repositories': return 'fas fa-code';
      case 'personal': return 'fas fa-user';
      case 'contact': return 'fas fa-envelope';
      default: return 'fas fa-star';
    }
  };
  
  // Get color for category node
  const getCategoryColor = (category) => {
    // Try to get color from visualization properties
    if (category.visualization && category.visualization.color) {
      return category.visualization.color;
    }
    
    // Fallback colors based on category id
    switch(category.id) {
      case 'professional': return '#3a82f7';
      case 'repositories': return '#00ff00';
      case 'personal': return '#ff0000';
      case 'contact': return '#ffff00';
      default: return '#ffffff';
    }
  };
  
  // Toggle mobile menu visibility
  const toggleMenu = () => {
    setMenuActive(!menuActive);
  };
  
  // Handle menu item click
  const handleMenuItemClick = (nodeId) => {
    // Close mobile menu
    if (isMobile) {
      setMenuActive(false);
    }
    
    // Call parent handler
    if (onNodeClick) {
      onNodeClick(nodeId);
    }
  };
  
  // Determine if a menu item is active
  const isMenuItemActive = (nodeId) => {
    return activeNode === nodeId;
  };
  
  // Apply custom styling to menu item based on node data
  const getMenuItemStyle = (node) => {
    // Return empty object if node has no color or is active
    if (!node.color || isMenuItemActive(node.id)) return {};
    
    // Create a style with custom CSS variable for the color
    return {
      '--item-color': node.color
    };
  };
  
  return (
    <nav className="navbar">
      <div className="logo">
        <a href="#" onClick={(e) => {
          e.preventDefault();
          handleMenuItemClick('center');
        }}>
          Wagner Montes
        </a>
      </div>
      
      {isMobile && (
        <button className="menu-toggle" onClick={toggleMenu}>
          <i className={menuActive ? "fas fa-times" : "fas fa-bars"}></i>
        </button>
      )}
      
      <ul className={`nav-menu ${menuActive ? 'active' : ''}`}>
        {isLoading ? (
          <li><span className="loading">Loading...</span></li>
        ) : (
          menuNodes.map(node => (
            <li 
              key={node.id} 
              className={isMenuItemActive(node.id) ? 'active' : ''}
            >
              <a 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleMenuItemClick(node.id);
                }}
                title={node.description}
                data-section={node.id}
                style={getMenuItemStyle(node)}
              >
                {node.icon && <i className={node.icon}></i>} {node.name}
              </a>
            </li>
          ))
        )}
      </ul>
    </nav>
  );
};

export default Menu;
