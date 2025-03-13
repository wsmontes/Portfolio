# Interactive 3D Portfolio Network

This repository contains the source code for my interactive 3D portfolio website, hosted using GitHub Pages. The portfolio visualizes my professional skills and work as an interconnected network that visitors can explore and interact with.

## Features

- Interactive 3D force-directed graph visualization
- Navigate through different sections by clicking on nodes
- Zoom and pan controls for exploring the network
- Responsive design that works on desktop, tablet, and mobile
- Dark/light mode toggle
- Dynamically loaded content for projects and photography
- Filtering capabilities for projects and photography work

## How It Works

The portfolio presents itself as an interactive 3D network where:
- The central node represents the portfolio itself
- Main section nodes (About, Skills, Projects, Photography, Contact) connect to the central node
- Sub-nodes represent specific skills, project types, and photography categories
- Connections between nodes show relationships between different areas

### Navigation System

There are two ways to navigate through the portfolio:

1. **Node Navigation**: Click directly on nodes in the 3D graph:
   - Click on main section nodes (About, Skills, Projects, etc.) to view section content in a modal panel
   - Click on sub-nodes (Frontend, Web Projects, Portrait, etc.) to open a fullscreen detailed view
   - Click on the central "Portfolio" node to reset the view
   
2. **Menu Navigation**: Use the top navigation menu as an alternative way to access main sections

## Technologies Used

- HTML5 & CSS3 (CSS Variables, Flexbox, Grid)
- JavaScript (ES6+)
- React for UI components
- Three.js for 3D rendering
- Force-Graph library for network visualization
- Responsive design for all device sizes
- Dynamic content loading with fetch API
- GitHub Pages for hosting

## Setup

1. Clone this repository
2. Navigate to the project directory
3. Open index.html in your browser to view locally
4. Push changes to the main branch to deploy to GitHub Pages

## Customization

To customize this portfolio:
1. Update the personal information in the templates in index.html
2. Modify the network structure in network-data.js
3. Add your projects to data/projects.json
4. Replace placeholder images in the assets/images directory

## Performance Considerations

The 3D visualization requires WebGL and may be resource-intensive on some devices. The portfolio includes:
- Loading screen to indicate initialization
- Optimized rendering settings
- Fallbacks for critical content

## License

[MIT License](LICENSE)
