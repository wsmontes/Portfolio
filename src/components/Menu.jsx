import React from 'react';

const Menu = ({ onNodeClick }) => {
  const menuNodes = [
    { title: 'Portfolio', id: 'portfolio' },
    { title: 'Professional', id: 'professional' },
    { title: 'Repositories', id: 'repositories' },
    { title: 'Personal', id: 'personal' },
    { title: 'About', id: 'about' },
    { title: 'Contact', id: 'contact' }
  ];

  return (
    <div className="menu-container">
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
