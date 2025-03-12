document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    const currentYearElement = document.getElementById('current-year');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }
    
    // Always enable dark mode
    document.body.setAttribute('data-theme', 'dark');
    
    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (menuToggle && navMenu) {
        // Make sure menu toggle is clickable with higher z-index
        menuToggle.style.zIndex = 10001;
        menuToggle.style.position = 'relative';
        
        menuToggle.addEventListener('click', function(e) {
            // Stop event propagation
            e.stopPropagation();
            
            navMenu.classList.toggle('active');
            const isOpen = navMenu.classList.contains('active');
            this.innerHTML = isOpen ? 
                '<i class="fas fa-times"></i>' : 
                '<i class="fas fa-bars"></i>';
                
            // Force a reflow to ensure the menu appears
            navMenu.offsetHeight;
        });
        
        // Close menu when clicking a link (for mobile)
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (navMenu.classList.contains('active') && 
                !navMenu.contains(e.target) && 
                e.target !== menuToggle) {
                navMenu.classList.remove('active');
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    }
});
