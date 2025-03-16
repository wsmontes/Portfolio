/**
 * Content Scroll Manager
 * Provides enhanced scrolling and animations for content panels
 */

const ContentScrollManager = (() => {
    // Configuration
    const config = {
        scrollbarWidth: 8,
        scrollbarColor: 'rgba(255,255,255,0.3)',
        scrollbarHoverColor: 'rgba(255,255,255,0.5)',
        animationDuration: 300, // ms
        scrollAnimationDuration: 600, // ms
        smoothScrollBehavior: 'smooth' // 'auto', 'smooth', or 'custom'
    };
    
    // Cached elements
    let contentPanel = null;
    let contentInner = null;
    let closeButton = null;
    
    // Track active scroll animations
    let activeScrollAnimation = null;
    
    /**
     * Initialize the content scroll manager
     * @param {Object} options - Configuration options
     */
    const initialize = (options = {}) => {
        // Merge configuration
        Object.assign(config, options);
        
        // Cache DOM elements
        contentPanel = document.getElementById('content-panel');
        contentInner = contentPanel ? contentPanel.querySelector('.content-inner') : null;
        closeButton = contentPanel ? contentPanel.querySelector('.close-panel') : null;
        
        if (!contentPanel || !contentInner) {
            console.warn('ContentScrollManager: Required DOM elements not found');
            return false;
        }
        
        // Apply custom scrollbar styling
        applyScrollbarStyling(contentInner);
        
        // Set up event listeners
        setupEventListeners();
        
        console.log('ContentScrollManager initialized');
        return true;
    };
    
    /**
     * Apply custom scrollbar styling to an element
     * @param {HTMLElement} element - Element to style
     */
    const applyScrollbarStyling = (element) => {
        if (!element) return;
        
        const style = document.createElement('style');
        style.textContent = `
            ${element.tagName.toLowerCase()}${element.id ? '#' + element.id : ''} {
                scrollbar-width: thin;
                scrollbar-color: ${config.scrollbarColor} transparent;
            }
            
            ${element.tagName.toLowerCase()}${element.id ? '#' + element.id : ''}::-webkit-scrollbar {
                width: ${config.scrollbarWidth}px;
            }
            
            ${element.tagName.toLowerCase()}${element.id ? '#' + element.id : ''}::-webkit-scrollbar-track {
                background: transparent;
            }
            
            ${element.tagName.toLowerCase()}${element.id ? '#' + element.id : ''}::-webkit-scrollbar-thumb {
                background-color: ${config.scrollbarColor};
                border-radius: ${config.scrollbarWidth/2}px;
                border: none;
            }
            
            ${element.tagName.toLowerCase()}${element.id ? '#' + element.id : ''}::-webkit-scrollbar-thumb:hover {
                background-color: ${config.scrollbarHoverColor};
            }
        `;
        document.head.appendChild(style);
    };
    
    /**
     * Set up event listeners for content panel
     */
    const setupEventListeners = () => {
        // Set up any event listeners for interactive content
        if (contentInner) {
            // Handle click events on links inside content
            contentInner.addEventListener('click', (e) => {
                const anchor = e.target.closest('a[data-scroll-to]');
                if (anchor) {
                    e.preventDefault();
                    const targetId = anchor.getAttribute('data-scroll-to');
                    scrollToElement(targetId);
                }
            });
            
            // Add scroll tracking for animations
            contentInner.addEventListener('scroll', () => {
                // Reveal animations for elements as they scroll into view
                revealElementsOnScroll(contentInner);
            });
        }
        
        // Handle resize events
        window.addEventListener('resize', debounce(() => {
            // Recalculate any layout-dependent features
            if (contentPanel && contentPanel.classList.contains('active')) {
                optimizeScrollableContent();
            }
        }, 100));
    };
    
    /**
     * Show content panel with animation
     * @param {string} [nodeId] - Optional node ID for tracking
     */
    const showPanel = (nodeId) => {
        if (!contentPanel) return;
        
        // Clear any existing animations
        contentPanel.style.animation = 'none';
        
        // Reset animations by forcing reflow
        void contentPanel.offsetWidth;
        
        // Add active class and animated entrance
        contentPanel.classList.remove('hidden');
        contentPanel.classList.add('active');
        contentPanel.style.animation = `contentPanelFadeIn ${config.animationDuration}ms ease-out forwards`;
        
        // Store the associated node ID if provided
        if (nodeId) {
            contentPanel.setAttribute('data-node-id', nodeId);
        }
        
        // After animation completes, remove the animation property
        setTimeout(() => {
            contentPanel.style.animation = '';
            
            // Make sure all scrollable content is optimized
            optimizeScrollableContent();
            
            // Start revealing animations once panel is visible
            revealElementsOnScroll(contentInner);
        }, config.animationDuration);
    };
    
    /**
     * Hide content panel with animation
     */
    const hidePanel = () => {
        if (!contentPanel) return;
        
        // Clear any existing animations
        contentPanel.style.animation = 'none';
        
        // Reset animations by forcing reflow
        void contentPanel.offsetWidth;
        
        // Add disappearing animation
        contentPanel.style.animation = `contentPanelFadeOut ${config.animationDuration}ms ease-in forwards`;
        
        // After animation completes, hide the panel and clear content
        setTimeout(() => {
            contentPanel.classList.remove('active');
            contentPanel.classList.add('hidden');
            contentPanel.style.animation = '';
            
            // Optional: Clear content after hiding
            // contentInner.innerHTML = '';
        }, config.animationDuration);
    };
    
    /**
     * Optimize the layout of scrollable content
     */
    const optimizeScrollableContent = () => {
        if (!contentInner) return;
        
        // Find all potential scrollable containers
        const scrollContainers = contentInner.querySelectorAll('.scrollable-container');
        
        scrollContainers.forEach(container => {
            // Set max-height based on available space
            const rect = container.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const maxAllowedHeight = viewportHeight * 0.7; // 70% of viewport height
            
            if (rect.height > maxAllowedHeight) {
                container.style.maxHeight = `${maxAllowedHeight}px`;
                container.style.overflowY = 'auto';
                applyScrollbarStyling(container);
            }
        });
        
        // Make tables horizontally scrollable if they're too wide
        const tables = contentInner.querySelectorAll('table');
        tables.forEach(table => {
            if (table.offsetWidth > contentInner.offsetWidth) {
                // Create a wrapper if not already wrapped
                if (table.parentElement.className !== 'table-scroll-wrapper') {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'table-scroll-wrapper';
                    wrapper.style.overflowX = 'auto';
                    table.parentNode.insertBefore(wrapper, table);
                    wrapper.appendChild(table);
                }
            }
        });
        
        // Find all repository readmes and make sure they're scrollable
        const readmeContents = contentInner.querySelectorAll('.readme-content');
        readmeContents.forEach(readme => {
            readme.classList.add('scrollable-container');
            readme.style.maxHeight = '400px';
            readme.style.overflowY = 'auto';
            applyScrollbarStyling(readme);
        });
    };
    
    /**
     * Scroll to a specific element inside the content
     * @param {string|Element} target - Element or selector to scroll to
     * @param {Object} options - Scroll options
     */
    const scrollToElement = (target, options = {}) => {
        if (!contentInner) return;
        
        // Determine the target element
        const targetElement = typeof target === 'string' 
            ? contentInner.querySelector(target.startsWith('#') ? target : `#${target}`)
            : target;
        
        if (!targetElement) {
            console.warn(`ScrollManager: Target element not found - ${target}`);
            return;
        }
        
        // Cancel any active scroll animations
        if (activeScrollAnimation) {
            cancelAnimationFrame(activeScrollAnimation);
            activeScrollAnimation = null;
        }
        
        // Scroll options
        const scrollOptions = {
            offsetY: options.offsetY || 20,
            duration: options.duration || config.scrollAnimationDuration,
            behavior: options.behavior || config.smoothScrollBehavior
        };
        
        // Get the scroll coordinates
        const targetRect = targetElement.getBoundingClientRect();
        const containerRect = contentInner.getBoundingClientRect();
        const targetTop = contentInner.scrollTop + (targetRect.top - containerRect.top) - scrollOptions.offsetY;
        
        // Use browser's built-in smooth scrolling if specified
        if (scrollOptions.behavior === 'smooth') {
            contentInner.scrollTo({
                top: targetTop,
                behavior: 'smooth'
            });
            return;
        }
        
        // Use custom animation for more control
        if (scrollOptions.behavior === 'custom') {
            const startPos = contentInner.scrollTop;
            const distance = targetTop - startPos;
            const startTime = performance.now();
            
            // Easing function for smoother start/stop
            const easeInOutCubic = (t) => {
                return t < 0.5
                    ? 4 * t * t * t
                    : 1 - Math.pow(-2 * t + 2, 3) / 2;
            };
            
            // Animation function
            const animateScroll = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / scrollOptions.duration, 1);
                const easedProgress = easeInOutCubic(progress);
                
                contentInner.scrollTop = startPos + distance * easedProgress;
                
                if (progress < 1) {
                    activeScrollAnimation = requestAnimationFrame(animateScroll);
                } else {
                    activeScrollAnimation = null;
                }
            };
            
            // Start animation
            activeScrollAnimation = requestAnimationFrame(animateScroll);
            return;
        }
        
        // Default to instant scrolling
        contentInner.scrollTop = targetTop;
    };
    
    /**
     * Add scroll-reveal animations to elements
     * @param {HTMLElement} container - Container to scan for elements
     */
    const revealElementsOnScroll = (container) => {
        if (!container) return;
        
        // Find all elements with scroll-reveal class
        const revealElements = container.querySelectorAll('.scroll-reveal:not(.revealed)');
        
        revealElements.forEach(element => {
            if (isElementInViewport(element, container)) {
                element.classList.add('revealed');
                element.style.animationDelay = '0s';
                
                // Add appropriate animation
                element.style.animation = 'fadeInUp 0.6s ease forwards';
            }
        });
    };
    
    /**
     * Check if an element is in the viewport of a container
     * @param {HTMLElement} element - Element to check
     * @param {HTMLElement} container - Containing scrollable element
     * @returns {boolean} - Whether element is in viewport
     */
    const isElementInViewport = (element, container) => {
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        
        return (
            elementRect.top >= containerRect.top &&
            elementRect.left >= containerRect.left &&
            elementRect.bottom <= containerRect.bottom &&
            elementRect.right <= containerRect.right
        );
    };
    
    /**
     * Simple debounce function
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in ms
     * @returns {Function} - Debounced function
     */
    const debounce = (func, delay) => {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    };
    
    // Public API
    return {
        initialize,
        showPanel,
        hidePanel,
        scrollToElement,
        optimizeScrollableContent,
        applyScrollbarStyling
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    ContentScrollManager.initialize();
    
    // Make it globally available
    window.ContentScrollManager = ContentScrollManager;
});
