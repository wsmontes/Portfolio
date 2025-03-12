# Portfolio Data Conversion Plan

This document outlines the strategy for converting the current hardcoded data structure into a more flexible JSON-based system. The goal is to make the content and node structure easily maintainable without changing any existing functionality, visual styles, or UX/UI.

## Current Architecture

- `network-data.js`: Contains the node and link definitions for the 3D network visualization
- `projects.json`: Already contains project data in JSON format
- HTML templates: Contain hardcoded content for sections
- Static text content embedded in HTML files

## Conversion Goals

1. Move all data definitions to JSON files
2. Create a system where the 3D network structure is generated from JSON
3. Ensure menu items and content panels are populated from the same data source
4. Allow for easy updating of content without changing code
5. Maintain current visual presentation and performance

## Implementation Plan

### 1. Create JSON Data Structure Files

#### `data/network-structure.json`
- Convert the current `NetworkData` object to JSON format
- Include all node properties (id, name, description, group, etc.)
- Include all link definitions

#### `data/content/professional.json`
- Work experience items
- Education information
- Skills and expertise

#### `data/content/personal.json`
- Photography portfolio data
- Personal interests
- Social media links

#### `data/content/contact.json`
- Contact information
- Social media profiles
- Form submission settings

#### `data/navigation.json`
- Menu structure
- Section IDs and labels
- Navigation relationships

### 2. Create Data Loading and Transformation System

#### Create `assets/js/data-loader.js`:
- Centralized system to load all JSON files
- Handle caching and error states
- Transform data for different components

```javascript
// Example structure
class DataLoader {
  async loadNetworkStructure() {
    // Load network-structure.json
  }
  
  async loadSectionContent(sectionId) {
    // Load appropriate content JSON based on section ID
  }
  
  transformNetworkData(jsonData) {
    // Convert JSON format to format expected by ForceGraph
  }
}