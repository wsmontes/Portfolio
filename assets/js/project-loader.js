document.addEventListener('DOMContentLoaded', function() {
    // Function to load projects from JSON
    async function loadProjects() {
        try {
            const response = await fetch('projects.json');
            const data = await response.json();
            displayProjects(data.projects);
        } catch (error) {
            console.error('Error loading projects:', error);
            const projectsGrid = document.querySelector('.projects-grid');
            if (projectsGrid) {
                projectsGrid.innerHTML = '<p>Error loading projects. Please try again later.</p>';
            }
        }
    }

    // Function to display projects
    function displayProjects(projects) {
        const projectsGrid = document.querySelector('.projects-grid');
        if (!projectsGrid) return;
        
        projectsGrid.innerHTML = '';

        projects.forEach(project => {
            const projectCard = document.createElement('div');
            projectCard.className = `project-card ${project.category}`;
            
            projectCard.innerHTML = `
                <div class="project-image" style="background-image: url('${project.image}')"></div>
                <div class="project-info">
                    <h3 class="project-title">${project.title}</h3>
                    <p>${project.description}</p>
                    <div class="project-tech">
                        ${project.technologies.map(tech => `<span class="project-tech-tag">${tech}</span>`).join('')}
                    </div>
                    <div class="project-links" style="margin-top: 15px">
                        <a href="${project.liveUrl}" class="btn primary" target="_blank">View Live</a>
                        <a href="${project.githubUrl}" class="btn secondary" target="_blank">GitHub</a>
                    </div>
                </div>
            `;
            
            projectsGrid.appendChild(projectCard);
        });
    }

    // Only initialize if we're on a page with projects grid
    const projectsGrid = document.querySelector('.projects-grid');
    if (projectsGrid) {
        loadProjects();
    }
});
