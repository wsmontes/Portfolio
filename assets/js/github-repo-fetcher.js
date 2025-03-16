/**
 * GitHub Repository Fetcher
 * Fetches repository data from GitHub using CORS proxies
 * Falls back to local JSON data if GitHub API is unavailable or rate-limited
 */

const GithubRepoFetcher = (() => {
    // Configuration
    const config = {
        username: 'wsmontes', // GitHub username
        baseApiUrl: 'https://api.github.com',
        proxies: [
            {
                name: 'allOrigins',
                url: 'https://api.allorigins.win/get?url=',
                active: true,
                responseParser: (data) => JSON.parse(data.contents)
            },
            {
                name: 'corsproxy.io',
                url: 'https://corsproxy.io/?',
                active: true,
                responseParser: (data) => data
            },
            {
                name: 'cors-anywhere (local)',
                url: '/cors-proxy?url=',  // If you have a local proxy endpoint
                active: false,
                responseParser: (data) => data
            }
        ],
        localFallbackPath: 'data/repositories.json',
        excludeRepos: ['Portfolio'], // Repositories to exclude (optional)
        maxRetries: 3,
        retryDelay: 1000, // ms
        preloadReadmes: true, // Whether to preload READMEs on page load
        preloadDelay: 1500, // ms - delay before starting preload to not block initial page load
    };

    // Cache repositories once loaded
    let cachedRepositories = null;
    
    // Cache for README files
    const readmeCache = new Map();
    
    // Track in-progress README fetches to avoid duplicate requests
    const readmeFetchPromises = new Map();
    
    // Track which proxy is currently working best
    let lastWorkingProxyIndex = 0;
    
    /**
     * Encode URL for proxy services
     */
    const encodeUrl = (url) => {
        return encodeURIComponent(url);
    };
    
    /**
     * Try to fetch data using each configured proxy until one succeeds
     */
    const fetchWithProxy = async (url) => {
        // Start with the last working proxy for efficiency
        const proxies = [...config.proxies];
        const activeProxies = proxies.filter(p => p.active);
        
        if (activeProxies.length === 0) {
            throw new Error('No active proxy services configured');
        }
        
        // Rotate the proxies array so we start with the last working one
        const rotatedProxies = [
            ...activeProxies.slice(lastWorkingProxyIndex),
            ...activeProxies.slice(0, lastWorkingProxyIndex)
        ];
        
        // Try each proxy in sequence until one works
        let lastError = null;
        
        for (let i = 0; i < rotatedProxies.length; i++) {
            const proxy = rotatedProxies[i];
            const proxyUrl = `${proxy.url}${encodeUrl(url)}`;
            
            try {
                console.log(`Trying proxy: ${proxy.name} for ${url}`);
                
                const response = await fetch(proxyUrl, {
                    headers: {
                        'Accept': 'application/json'
                    },
                    // Some proxies require no-cors mode
                    mode: proxy.mode || 'cors'
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                // Update the last working proxy index
                lastWorkingProxyIndex = rotatedProxies.indexOf(proxy);
                
                console.log(`Successfully fetched data using ${proxy.name} proxy`);
                
                // Parse the response using the proxy's custom parser if provided
                return proxy.responseParser ? proxy.responseParser(data) : data;
            } catch (error) {
                console.warn(`Failed to fetch with proxy ${proxy.name}:`, error);
                lastError = error;
                // Continue to the next proxy
            }
        }
        
        // If we get here, all proxies failed
        throw new Error(`All proxies failed. Last error: ${lastError?.message}`);
    };
    
    /**
     * Fetch repository data with retry logic
     */
    const fetchWithRetry = async (url, retries = config.maxRetries) => {
        try {
            return await fetchWithProxy(url);
        } catch (error) {
            if (retries > 0) {
                console.log(`Retrying... (${retries} attempts left)`);
                await new Promise(resolve => setTimeout(resolve, config.retryDelay));
                return fetchWithRetry(url, retries - 1);
            } else {
                throw error;
            }
        }
    };
    
    /**
     * Fetch README content for a repository
     */
    const fetchReadme = async (repo) => {
        // If we already have this README cached, return it immediately
        const cacheKey = repo.name;
        if (readmeCache.has(cacheKey)) {
            return readmeCache.get(cacheKey);
        }
        
        // If there's already a fetch in progress for this README, return that promise
        if (readmeFetchPromises.has(cacheKey)) {
            return readmeFetchPromises.get(cacheKey);
        }
        
        // Start a new fetch and track the promise
        const fetchPromise = fetchReadmeFromSource(repo);
        readmeFetchPromises.set(cacheKey, fetchPromise);
        
        try {
            // Wait for the fetch to complete
            const readmeContent = await fetchPromise;
            
            // Cache the result
            readmeCache.set(cacheKey, readmeContent);
            
            // Remove from in-progress tracking
            readmeFetchPromises.delete(cacheKey);
            
            return readmeContent;
        } catch (error) {
            // Clean up on error
            readmeFetchPromises.delete(cacheKey);
            throw error;
        }
    };
    
    /**
     * Internal function to fetch README from GitHub API
     */
    const fetchReadmeFromSource = async (repo) => {
        try {
            // FIXED URL structure: correct format is /repos/{owner}/{repo}/readme
            const readmeUrl = `${config.baseApiUrl}/repos/${config.username}/${repo.name}/readme`;
            
            // Attempt to fetch README using proxy
            const readmeData = await fetchWithRetry(readmeUrl);
            
            // Decode the content (it's base64 encoded)
            if (readmeData && readmeData.content) {
                return atob(readmeData.content);
            } else {
                // Instead of throwing an error, return a more detailed fallback README
                return generateFallbackReadme(repo);
            }
        } catch (error) {
            console.warn(`Error fetching README for ${repo.name}:`, error);
            
            // Check if this is a 404 error (README not found)
            const isNotFoundError = 
                error.message && (
                    error.message.includes('404') || 
                    error.message.includes('Not Found') || 
                    error.message.toLowerCase().includes('not found')
                );
                
            if (isNotFoundError) {
                console.log(`No README found for ${repo.name}, generating fallback content`);
            }
            
            // Return custom generated README based on repository information
            return generateFallbackReadme(repo);
        }
    };
    
    /**
     * Generate fallback README content when none is found
     * @param {Object} repo - Repository data
     * @returns {string} - Markdown README content
     */
    const generateFallbackReadme = (repo) => {
        const createdDate = new Date(repo.created_at).toLocaleDateString();
        const updatedDate = new Date(repo.updated_at).toLocaleDateString();
        
        let content = `# ${repo.name}\n\n`;
        
        if (repo.description) {
            content += `${repo.description}\n\n`;
        } else {
            content += `No description available for this repository.\n\n`;
        }
        
        content += `## Repository Information\n\n`;
        content += `- **Created on:** ${createdDate}\n`;
        content += `- **Last updated:** ${updatedDate}\n`;
        content += `- **Primary language:** ${repo.language || 'Not specified'}\n`;
        
        if (repo.topics && repo.topics.length > 0) {
            content += `\n## Topics\n\n`;
            repo.topics.forEach(topic => {
                content += `- ${topic}\n`;
            });
        }
        
        content += `\n## Note\n\n`;
        content += `This repository does not contain a standard README file. `;
        content += `The information above was generated automatically based on repository metadata.\n\n`;
        
        // Add links
        content += `## Links\n\n`;
        content += `- [View repository on GitHub](${repo.html_url})\n`;
        
        if (repo.homepage) {
            content += `- [Project homepage](${repo.homepage})\n`;
        }
        
        return content;
    };
    
    /**
     * Get repositories from GitHub
     * @returns {Promise<Array>} - Array of repository objects
     */
    const getRepositories = async () => {
        // Check if we have cached repositories
        if (cachedRepositories) {
            return cachedRepositories;
        }
        
        try {
            console.log(`Fetching GitHub repositories for ${config.username}...`);
            
            // FIXED URL structure: correct format is /users/{username}/repos
            const reposUrl = `${config.baseApiUrl}/users/${config.username}/repos?sort=updated&per_page=100`;
            const repos = await fetchWithRetry(reposUrl);
            
            // Filter out excluded repos and process data
            const filteredRepos = repos
                .filter(repo => !config.excludeRepos.includes(repo.name))
                .map(repo => ({
                    id: repo.id,
                    name: repo.name,
                    description: repo.description,
                    html_url: repo.html_url,
                    homepage: repo.homepage || '',
                    language: repo.language || 'Other',
                    stargazers_count: repo.stargazers_count,
                    forks_count: repo.forks_count,
                    open_issues_count: repo.open_issues_count || 0,
                    watchers_count: repo.watchers_count || 0,
                    topics: repo.topics || [],
                    created_at: repo.created_at,
                    updated_at: repo.updated_at,
                    has_issues: repo.has_issues || false
                }));
            
            console.log(`Successfully fetched ${filteredRepos.length} repositories`);
            
            // Cache the repositories
            cachedRepositories = filteredRepos;
            return filteredRepos;
        } catch (error) {
            console.error('Error fetching repositories from GitHub:', error);
            
            // Fall back to local JSON file
            return loadFromFallback();
        }
    };
    
    /**
     * Load repositories from local fallback JSON
     */
    const loadFromFallback = async () => {
        try {
            console.log('Falling back to local repository data...');
            const response = await fetch(config.localFallbackPath);
            
            if (!response.ok) {
                throw new Error(`Failed to load fallback data: ${response.status}`);
            }
            
            const localRepos = await response.json();
            
            // Cache and return the local data
            cachedRepositories = localRepos;
            return localRepos;
        } catch (fallbackError) {
            console.error('Failed to load fallback repository data:', fallbackError);
            return []; // Return empty array as last resort
        }
    };
    
    /**
     * Try direct fetch without proxy (for local development)
     * @param {String} url - API endpoint URL
     * @returns {Promise} - Response promise
     */
    const fetchDirect = async (url) => {
        try {
            // Try direct fetch first (works in development without CORS issues)
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.warn('Direct fetch failed, will try proxies:', error);
            throw error;
        }
    };
    
    /**
     * Test proxies and set the best working one as default
     */
    const testProxies = async () => {
        const testUrl = `${config.baseApiUrl}/users/${config.username}`;
        
        // Test each proxy
        for (let i = 0; i < config.proxies.length; i++) {
            const proxy = config.proxies[i];
            if (!proxy.active) continue;
            
            try {
                const proxyUrl = `${proxy.url}${encodeUrl(testUrl)}`;
                console.log(`Testing proxy: ${proxy.name}`);
                
                const startTime = performance.now();
                const response = await fetch(proxyUrl);
                const endTime = performance.now();
                
                if (response.ok) {
                    const responseTime = endTime - startTime;
                    console.log(`Proxy ${proxy.name} working. Response time: ${responseTime.toFixed(2)}ms`);
                    
                    // Set this as the preferred proxy
                    lastWorkingProxyIndex = i;
                    break;
                }
            } catch (error) {
                console.warn(`Proxy ${proxy.name} failed:`, error);
            }
        }
    };

    /**
     * Enhance repository data with README content
     */
    const getEnhancedRepositories = async () => {
        const repos = await getRepositories();
        
        // For each repo, fetch its README
        const enhancedRepos = await Promise.all(repos.map(async (repo) => {
            try {
                const readme = await fetchReadme(repo);
                return {
                    ...repo,
                    readme
                };
            } catch (error) {
                return {
                    ...repo,
                    readme: `# ${repo.name}\n\nError loading README.`
                };
            }
        }));
        
        return enhancedRepos;
    };
    
    /**
     * Preload all README files to improve performance
     * @returns {Promise<void>}
     */
    const preloadAllReadmes = async () => {
        try {
            console.log('Preloading README files for all repositories...');
            
            // Get all repositories
            const repositories = await getRepositories();
            
            // Create an array of promises for fetching READMEs
            const readmePromises = repositories.map(async (repo) => {
                try {
                    const readme = await fetchReadmeFromSource(repo);
                    readmeCache.set(repo.name, readme);
                    return { name: repo.name, success: true };
                } catch (error) {
                    console.warn(`Failed to preload README for ${repo.name}:`, error);
                    return { name: repo.name, success: false };
                }
            });
            
            // Wait for all fetches to complete
            const results = await Promise.allSettled(readmePromises);
            
            // Count successes
            const successCount = results.filter(result => 
                result.status === 'fulfilled' && result.value.success
            ).length;
            
            console.log(`Finished preloading READMEs: ${successCount} of ${repositories.length} loaded successfully`);
        } catch (error) {
            console.error('Error during README preloading:', error);
        }
    };
    
    /**
     * Clear the README cache
     */
    const clearReadmeCache = () => {
        readmeCache.clear();
        console.log('README cache cleared');
    };
    
    // Initialize with proxy testing
    testProxies().catch(err => console.warn("Proxy testing failed:", err));
    
    // Initialize preloading if enabled
    if (config.preloadReadmes) {
        // Delay preloading slightly to not block initial page load
        setTimeout(() => {
            preloadAllReadmes();
        }, config.preloadDelay);
    }
    
    // Public API
    return {
        getRepositories,
        getEnhancedRepositories,
        fetchReadme,
        preloadAllReadmes,
        clearReadmeCache
    };
})();

// Make fetcher available globally
window.GithubRepoFetcher = GithubRepoFetcher;
