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
- Dynamic GitHub repository integration with README display

## How It Works

The portfolio presents itself as an interactive 3D network where:
- The central node represents the portfolio itself
- Main section nodes (About, Skills, Projects, Photography, Contact) connect to the central node
- Sub-nodes represent specific skills, project types, and photography categories
- Connections between nodes show relationships between different areas
- Each GitHub repository is represented as an individual node with its own data and README content

### Navigation System

There are two ways to navigate through the portfolio:

1. **Node Navigation**: Click directly on nodes in the 3D graph:
   - Click on main section nodes (About, Skills, Projects, etc.) to view section content in a modal panel
   - Click on sub-nodes (Frontend, Web Projects, Portrait, etc.) to open a fullscreen detailed view
   - Click on repository nodes to display the repository information and README content
   - Click on the central "Portfolio" node to reset the view
   
2. **Menu Navigation**: Use the top navigation menu as an alternative way to access main sections

### Data Integration

The portfolio dynamically fetches data from multiple sources:

1. **GitHub Repository Integration**:
   - Primary Method: Uses AllOrigins as a CORS proxy to fetch data directly from GitHub's API
   - Each repository appears as a node in the network visualization
   - When clicked, displays repository metadata and renders the README content
   - Fallback: Local JSON data is used when GitHub API is unavailable or rate-limited

2. **Content Management**:
   - Project information is primarily sourced from GitHub repositories
   - Additional content is loaded from local JSON files

## Technologies Used

- HTML5 & CSS3 (CSS Variables, Flexbox, Grid)
- JavaScript (ES6+)
- React for UI components
- Three.js for 3D rendering
- Force-Graph library for network visualization
- GitHub API for repository data
- AllOrigins proxy for CORS-free API requests
- Markdown parsing for README rendering
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
