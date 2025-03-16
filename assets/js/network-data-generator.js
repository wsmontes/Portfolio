/**
 * Network Data Generator
 * Generates nodes and links for the 3D force-directed graph
 * Integrates GitHub repositories as nodes in the network
 */

const NetworkDataGenerator = (() => {
    // Base network structure with empty nodes and links
    const networkData = {
        nodes: [],
        links: []
    };

    // Source path for unified data
    const unifiedDataPath = 'data/unified-data.json';

    /**
     * Generate the network data from unified JSON file
     * @returns {Promise<Object>} - NetworkData object with nodes and links
     */
    const generate = async () => {
        try {
            // Fetch unified data
            const response = await fetch(unifiedDataPath);
            if (!response.ok) {
                throw new Error(`Failed to load unified data: ${response.status}`);
            }

            const unifiedData = await response.json();

            // Process the unified data to create network nodes and links
            return processUnifiedData(unifiedData);
        } catch (error) {
            console.error("Failed to generate network data:", error);
            throw error; // No fallback now, just throw the error
        }
    };

    /**
     * Process unified data into network nodes and links
     * @param {Object} unifiedData - Unified graph and content data
     * @returns {Object} - ProcessedNetworkData object with nodes and links
     */
    const processUnifiedData = (unifiedData) => {
        if (!unifiedData || !unifiedData.graphConfig) {
            throw new Error("Invalid unified data format");
        }

        const { centerNode, categories } = unifiedData.graphConfig;

        // Clear existing data
        networkData.nodes = [];
        networkData.links = [];

        // Add center node
        const centerNodeData = createNodeFromUnified(centerNode);
        networkData.nodes.push(centerNodeData);

        // Process each category
        categories.forEach(category => {
            // Add category node
            const categoryNode = createNodeFromUnified(category);
            networkData.nodes.push(categoryNode);

            // Add link from center to category
            networkData.links.push({
                source: centerNode.id,
                target: category.id,
                value: 5,
                type: 'connection'
            });

            // Process category children recursively
            if (Array.isArray(category.children)) {
                processChildren(category, category.children);
            }
        });

        return networkData;
    };

    /**
     * Recursively process child nodes of a parent
     * @param {Object} parent - Parent node data
     * @param {Array} children - Child nodes array
     */
    const processChildren = (parent, children) => {
        children.forEach(child => {
            // Add child node
            const childNode = createNodeFromUnified(child);
            childNode.parentId = parent.id; // Set parent ID for reference
            networkData.nodes.push(childNode);

            // Add link from parent to child
            networkData.links.push({
                source: parent.id,
                target: child.id,
                value: getLinkValueByGroups(parent.group, child.group),
                type: 'connection'
            });

            // Recursively process grandchildren if any
            if (Array.isArray(child.children)) {
                processChildren(child, child.children);
            }
        });
    };

    /**
     * Create a network node object from unified data format
     * @param {Object} nodeData - Unified node data
     * @returns {Object} - Network node object format
     */
    const createNodeFromUnified = (nodeData) => {
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
        if (visualization.emissive) {
            node.emissive = visualization.emissive;
            // Store color separately for easier access by other components
            node.color = visualization.emissive;
        }

        if (visualization.color) {
            node.color = visualization.color;
        }

        if (visualization.fixedPosition) {
            node.fx = 0;
            node.fy = 0;
            node.fz = 0;
        }

        if (nodeData.parentId) node.parentId = nodeData.parentId;

        return node;
    };

    /**
     * Determine link value based on group types
     * @param {string} sourceGroup - Source node group
     * @param {string} targetGroup - Target node group
     * @returns {number} - Link value
     */
    const getLinkValueByGroups = (sourceGroup, targetGroup) => {
        if (sourceGroup === 'main' && targetGroup === 'category') {
            return 5;
        } else if (sourceGroup === 'category' && ['subcategory', 'cluster'].includes(targetGroup)) {
            return 4;
        } else if (['subcategory', 'cluster'].includes(sourceGroup) && targetGroup === 'item') {
            return 2;
        }
        return 3; // Default value
    };

    // Function to add GitHub repositories to network data
    const addRepositoriesToNetwork = (networkData, repositories) => {
        if (!repositories || !repositories.length) return networkData;
        
        const repositoriesNode = networkData.nodes.find(node => node.id === 'repositories');
        
        if (!repositoriesNode) {
            console.error("Repositories category node not found in network data");
            return networkData;
        }

        console.log(`Adding ${repositories.length} repositories to network data`);
        
        // Group repositories by language
        const languageGroups = {};
        repositories.forEach(repo => {
            const lang = repo.language || 'Other';
            if (!languageGroups[lang]) {
                languageGroups[lang] = [];
            }
            languageGroups[lang].push(repo);
        });
        
        // Create language cluster nodes
        Object.keys(languageGroups).forEach((language, index) => {
            const langId = `lang-${language.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`;
            console.log(`Creating language node: ${langId} for ${language}`);
            
            const langNode = {
                id: langId,
                name: language,
                description: `${language} Projects`,
                group: 'cluster',
                parentId: 'repositories',
                val: 30 + (languageGroups[language].length * 2), // Size based on number of repos
                mass: 20,
                size: 5 + (languageGroups[language].length * 0.3),
                texture: getLanguageTexture(language),
                color: getLanguageColor(language),
                rotationSpeed: 0.02,
            };
            
            networkData.nodes.push(langNode);
            
            // Add link from repositories to language
            networkData.links.push({
                source: 'repositories',
                target: langId,
                value: 4,
                type: 'connection'
            });
            
            // Add repository nodes for this language
            languageGroups[language].forEach(repo => {
                // Make sure the repo name is properly sanitized for use as an ID
                const safeRepoName = repo.name.replace(/[^a-zA-Z0-9_-]/g, '_');
                const repoId = `repo-${safeRepoName}`;
                
                console.log(`Adding repository node: ${repoId} (parent: ${langId})`);
                
                const repoNode = {
                    id: repoId,
                    name: repo.name,
                    description: repo.description || `A ${language} project`,
                    group: 'item',
                    parentId: langId,
                    val: 15,
                    mass: 5,
                    size: 2.5,
                    texture: 'assets/images/textures/asteroid1.jpg',
                    color: getLanguageColor(language, 0.8),
                    rotationSpeed: 0.03,
                    repoData: repo // Store the original repo data for later use
                };
                
                networkData.nodes.push(repoNode);
                
                // Add link from language to repo
                networkData.links.push({
                    source: langId,
                    target: repoId,
                    value: 2,
                    type: 'connection'
                });
            });
        });
        
        // Store repository nodes globally for access by other components
        window.repositoryNodes = networkData.nodes.filter(node => 
            node && node.id && typeof node.id === 'string' && node.id.startsWith('repo-')
        );
        console.log(`Created ${window.repositoryNodes.length} repository nodes`);
        
        return networkData;
    };

    /**
     * Get appropriate texture for a language node
     */
    const getLanguageTexture = (language) => {
        const textures = {
            'JavaScript': 'assets/images/textures/yellow_moon.jpg',
            'TypeScript': 'assets/images/textures/blue_moon.jpg',
            'Python': 'assets/images/textures/green_moon.jpg',
            'Java': 'assets/images/textures/red_moon.jpg',
            'C#': 'assets/images/textures/purple_moon.jpg',
            'HTML': 'assets/images/textures/orange_moon.jpg',
            'CSS': 'assets/images/textures/cyan_moon.jpg',
            'Ruby': 'assets/images/textures/ruby_moon.jpg',
            'PHP': 'assets/images/textures/grey_moon.jpg',
            'Go': 'assets/images/textures/blue_grey_moon.jpg',
            'default': 'assets/images/textures/moon1.jpg'
        };
        
        return textures[language] || textures['default'];
    };

    /**
     * Get appropriate color for a language node
     */
    const getLanguageColor = (language, opacity = 1) => {
        const colors = {
            'JavaScript': `rgba(241, 224, 90, ${opacity})`,
            'TypeScript': `rgba(49, 120, 198, ${opacity})`,
            'Python': `rgba(53, 114, 165, ${opacity})`,
            'Java': `rgba(176, 114, 25, ${opacity})`,
            'C#': `rgba(104, 33, 122, ${opacity})`,
            'HTML': `rgba(227, 76, 38, ${opacity})`,
            'CSS': `rgba(86, 61, 124, ${opacity})`,
            'Ruby': `rgba(169, 36, 43, ${opacity})`,
            'PHP': `rgba(119, 123, 180, ${opacity})`,
            'Go': `rgba(0, 173, 216, ${opacity})`,
            'default': `rgba(150, 150, 150, ${opacity})`
        };
        
        return colors[language] || colors['default'];
    };
    
    /**
     * Generate a network with repositories integrated
     * @returns {Promise<Object>} - NetworkData object with nodes and links
     */
    const generateNetworkWithRepositories = async () => {
        try {
            // First generate the base network from unified data
            let networkData = await generate();
            
            // Check if GitHub repo fetcher is available
            if (window.GithubRepoFetcher && typeof window.GithubRepoFetcher.getRepositories === 'function') {
                try {
                    // Fetch repositories from GitHub
                    const repositories = await window.GithubRepoFetcher.getRepositories();
                    
                    // Add repositories to the network
                    networkData = addRepositoriesToNetwork(networkData, repositories);
                    
                    console.log('Successfully added GitHub repositories to network');
                } catch (repoError) {
                    console.warn('Failed to add GitHub repositories to network:', repoError);
                }
            } else {
                console.warn('GitHub repository fetcher not available');
            }
            
            return networkData;
        } catch (error) {
            console.error("Failed to generate network with repositories:", error);
            
            // In case of complete failure, return the minimal fallback data
            return window.NetworkData || { nodes: [], links: [] };
        }
    };

    // Public API
    return {
        generate,
        generateNetworkWithRepositories,
        addRepositoriesToNetwork,
        processUnifiedData
    };
})();

// Make the generator available globally
window.NetworkDataGenerator = NetworkDataGenerator;
