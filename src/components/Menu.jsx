import React, { useState, useEffect } from 'react';

const Menu = ({ onNodeClick }) => {
  // Replace hardcoded menu nodes with state
  const [menuNodes, setMenuNodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Detect mobile viewport
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Load menu items from unified data
  useEffect(() => {
    const loadMenuItems = async () => {
      if (!window.ContentLoader) {
        console.error("ContentLoader not available for menu items");
        // Fallback to some basic items if ContentLoader is not available
        setMenuNodes([
          { title: 'Portfolio', id: 'portfolio' },
          { title: 'About', id: 'about' },
          { title: 'Contact', id: 'contact' }
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
            title: unifiedData.graphConfig.centerNode.name || 'Portfolio',
            id: unifiedData.graphConfig.centerNode.id || 'portfolio'
          }
        ];
        
        // Add category nodes
        if (Array.isArray(unifiedData.graphConfig.categories)) {
          unifiedData.graphConfig.categories.forEach(category => {
            items.push({
              title: category.name,
              id: category.id,
              color: category.visualization?.color,
              disabled: false
            });
          });
        }
        
        setMenuNodes(items);
      } catch (error) {
        console.error("Error loading menu items:", error);
        // Fallback to some basic items
        setMenuNodes([
          { title: 'Portfolio', id: 'portfolio' },
          { title: 'About', id: 'about' },
          { title: 'Contact', id: 'contact' }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMenuItems();
  }, []);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return <div className="menu-container menu-loading"></div>;
  }

  return (
    <div className={`menu-container ${isMobile ? 'menu-mobile' : ''}`}>
      {menuNodes.map((node) => (
        <div 
          key={node.id}
          className={`menu-item ${node.disabled ? 'menu-item-disabled' : ''}`}
          style={node.color ? { '--item-color': node.color } : {}}
          onClick={() => !node.disabled && onNodeClick(node.id)}
        >
          {node.title}
        </div>
      ))}
    </div>
  );
};

export default Menu;
