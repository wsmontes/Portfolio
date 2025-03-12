import React, { useState, useEffect } from 'react';

const Menu = ({ onNodeClick }) => {
  const menuNodes = [
    { title: 'Portfolio', id: 'portfolio' },
    { title: 'Professional', id: 'professional' },
    { title: 'Repositories', id: 'repositories' },
    { title: 'Personal', id: 'personal' },
    { title: 'About', id: 'about' },
    { title: 'Contact', id: 'contact' }
  ];

  // Detect mobile viewport
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`menu-container ${isMobile ? 'menu-mobile' : ''}`}>
      {menuNodes.map((node) => (
        <div 
          key={node.id}
          className={`menu-item ${node.id === 'portfolio' ? 'menu-item-disabled' : ''}`}
          onClick={() => onNodeClick(node.id)}
        >
          {node.title}
        </div>
      ))}
    </div>
  );
};

export default Menu;
