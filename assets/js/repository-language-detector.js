/**
 * Repository Language Detector
 * 
 * Helper utility to detect and categorize repositories by languages and technologies
 * Uses topics, name patterns, and primary language to categorize repositories
 */

const RepositoryLanguageDetector = (function() {
  // Technology categories and their associated keywords/topics
  const TECHNOLOGY_CATEGORIES = {
    'JavaScript': ['javascript', 'js', 'node', 'nodejs', 'react', 'vue', 'angular', 'svelte', 'nextjs', 'nuxt'],
    'TypeScript': ['typescript', 'ts', 'tsx'],
    'Python': ['python', 'py', 'django', 'flask', 'fastapi', 'pandas', 'numpy', 'scipy', 'jupyter'],
    'AI/ML': ['ai', 'ml', 'machine-learning', 'deep-learning', 'tensorflow', 'pytorch', 'keras', 'opencv', 'nlp'],
    'Web': ['web', 'frontend', 'website', 'spa', 'pwa', 'html', 'css', 'scss', 'sass'],
    'Mobile': ['mobile', 'ios', 'android', 'react-native', 'flutter', 'ionic', 'swift', 'kotlin'],
    'Backend': ['backend', 'api', 'server', 'serverless', 'microservice', 'rest', 'graphql'],
    'DevOps': ['devops', 'docker', 'kubernetes', 'cicd', 'aws', 'azure', 'gcp', 'terraform', 'ansible']
  };
  
  /**
   * Detect technologies used in a repository
   * @param {Object} repo - Repository object
   * @returns {Object} Technology categories found in the repository
   */
  function detectTechnologies(repo) {
    const result = {};
    
    if (!repo) return result;
    
    // Check primary language
    if (repo.language) {
      const langKey = Object.keys(TECHNOLOGY_CATEGORIES).find(tech => 
        tech.toLowerCase() === repo.language.toLowerCase()
      );
      
      if (langKey) {
        result[langKey] = true;
      }
    }
    
    // Check repository name for technology indicators
    Object.entries(TECHNOLOGY_CATEGORIES).forEach(([category, keywords]) => {
      if (keywords.some(keyword => 
        repo.name.toLowerCase().includes(keyword.toLowerCase())
      )) {
        result[category] = true;
      }
    });
    
    // Check topics for technology indicators
    if (repo.topics && Array.isArray(repo.topics)) {
      Object.entries(TECHNOLOGY_CATEGORIES).forEach(([category, keywords]) => {
        if (repo.topics.some(topic => 
          keywords.includes(topic.toLowerCase())
        )) {
          result[category] = true;
        }
      });
    }
    
    // If no specific categories found, use the primary language
    if (Object.keys(result).length === 0 && repo.language) {
      result[repo.language] = true;
    }
    
    return result;
  }
  
  /**
   * Get primary category for a repository
   * @param {Object} repo - Repository object
   * @returns {string} Primary technology category
   */
  function getPrimaryCategory(repo) {
    const technologies = detectTechnologies(repo);
    
    // Priority order for categories
    const priorityCategories = [
      'AI/ML', 'JavaScript', 'TypeScript', 'Python', 
      'Mobile', 'Web', 'Backend', 'DevOps'
    ];
    
    for (const category of priorityCategories) {
      if (technologies[category]) {
        return category;
      }
    }
    
    // Fall back to the repo's primary language
    return repo.language || 'Other';
  }
  
  /**
   * Categorize repositories by technology
   * @param {Array} repositories - Array of repository objects
   * @returns {Object} Repositories grouped by category
   */
  function categorizeRepositories(repositories) {
    const categorized = {};
    
    repositories.forEach(repo => {
      const primaryCategory = getPrimaryCategory(repo);
      
      if (!categorized[primaryCategory]) {
        categorized[primaryCategory] = [];
      }
      
      categorized[primaryCategory].push(repo);
    });
    
    return categorized;
  }
  
  /**
   * Enhance repository objects with detected technologies
   * @param {Array} repositories - Array of repository objects
   * @returns {Array} Repositories with added technology information
   */
  function enhanceRepositoryData(repositories) {
    return repositories.map(repo => {
      const detectedTech = detectTechnologies(repo);
      const primaryCategory = getPrimaryCategory(repo);
      
      return {
        ...repo,
        detectedTechnologies: detectedTech,
        primaryCategory: primaryCategory,
        techCategories: Object.keys(detectedTech)
      };
    });
  }
  
  // Public API
  return {
    detectTechnologies,
    getPrimaryCategory,
    categorizeRepositories,
    enhanceRepositoryData,
    TECHNOLOGY_CATEGORIES
  };
})();

// Make it globally available
window.RepositoryLanguageDetector = RepositoryLanguageDetector;
