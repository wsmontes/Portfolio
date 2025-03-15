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
    const loadMenuItems = async () => {
      if (!window.ContentLoader) {
        console.error("ContentLoader not available for menu items");
        // Fallback to some basic items if ContentLoader is not available
        setMenuNodes([
          { title: 'Home', id: 'center' },
          { title: 'Professional', id: 'professional' },
          { title: 'Repositories', id: 'repositories' },
          { title: 'Personal', id: 'personal' },
          { title: 'About', id: 'about' }
        ]);
        setIsLoading(false);
        return;
      }
      
      try {
        // Get the unified data
        const unifiedData = await window.ContentLoader.getUnifiedData();
        
        if (!unifiedData || !unifiedData.graphConfig) {
          throw new Error("Invalid unified data format");
        }
        
        // Start with the portfolio/center node
        const items = [
          {
            title: unifiedData.graphConfig.centerNode.name || 'Home',
            id: unifiedData.graphConfig.centerNode.id || 'center',
            color: unifiedData.graphConfig.centerNode.visualization?.color,
            description: unifiedData.graphConfig.centerNode.description
          }
        ];
        
        // Add category nodes
        if (Array.isArray(unifiedData.graphConfig.categories)) {
          unifiedData.graphConfig.categories.forEach(category => {
            // Skip adding duplicates or center node (already added)
            if (category.id !== 'center' && items.findIndex(item => item.id === category.id) === -1) {
              items.push({
                title: category.name,
                id: category.id,
                color: category.visualization?.color,
                description: category.description,
                disabled: false
              });
            }
          });
        }
        
        setMenuNodes(items);
      } catch (error) {
        console.error("Error loading menu items:", error);
        // Fallback to some basic items
        setMenuNodes([
          { title: 'Home', id: 'center' },
          { title: 'Professional', id: 'professional' },
          { title: 'Repositories', id: 'repositories' },
          { title: 'Personal', id: 'personal' },
          { title: 'About', id: 'about' }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMenuItems();
    
    // Handle window resize to update mobile status
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Handle menu toggle for mobile
  const toggleMenu = () => {
    setMenuActive(!menuActive);
  };
  
  // Handle menu item click
  const handleMenuClick = (nodeId) => {
    if (onNodeClick) {
      console.log("Menu click: navigating to node", nodeId);
      
      // Trigger node navigation event for better compatibility
      const event = new CustomEvent('nodeNavigation', {
        detail: { 
          nodeId: nodeId, 
          source: 'menu'
        }
      });
      window.dispatchEvent(event);
      
      // Also call the direct handler
      onNodeClick(nodeId);
      
      // Close menu on mobile after click
      if (isMobile) {
        setMenuActive(false);
      }
    }
  };
  
  // Get logo text - use active node name if available, otherwise "Portfolio"
  const getLogoText = () => {
    // For center node or no active node, show "Portfolio"
    if (!activeNode || activeNode === 'center') {
      return "Portfolio";
    }
    
    // For active node, first check if we have its data
    if (activeNodeData) {
      return activeNodeData.name;
    }
    
    // If no active node data yet, check menuNodes
    const matchingNode = menuNodes.find(node => node.id === activeNode);
    if (matchingNode) {
      return matchingNode.title;
    }
    
    // Fallback
    return "Portfolio";
  };
  
  return (
    <nav className="navbar">
      <div className="logo">
        <a href="#" onClick={(e) => {
          e.preventDefault();
          handleMenuClick('center');
        }}>
          {getLogoText()}
        </a>
      </div>
      
      <button 
        className="menu-toggle" 
        aria-label="Toggle Menu"
        onClick={toggleMenu}
      >
        <i className={`fas ${menuActive ? 'fa-times' : 'fa-bars'}`}></i>
      </button>
      
      <ul className={`nav-menu ${menuActive ? 'active' : ''}`}>
        {!isLoading && menuNodes.map((node, index) => (
          <li 
            key={node.id} 
            className={activeNode === node.id ? 'active' : ''}
            style={node.color ? {'--item-color': node.color} : {}}
            title={node.description || node.title}
          >
            <a 
              href="#"
              data-section={node.id}
              onClick={(e) => {
                e.preventDefault();
                if (!node.disabled) {
                  handleMenuClick(node.id);
                }
              }}
              className={node.disabled ? 'menu-item-disabled' : ''}
            >
              {node.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Menu;
