// Main JavaScript for AI Knowledge Base

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all features
    initializeToolsFilter();
    initializeMobileMenu();
    initializeSmoothScroll();
    
    // Add rel attribute to external links for security
    const externalLinks = document.querySelectorAll('a[target="_blank"]');
    externalLinks.forEach(link => {
        if (!link.hasAttribute('rel')) {
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });
    
    console.log('AI Knowledge Base loaded successfully');
});

/**
 * Initialize tools filtering functionality
 */
function initializeToolsFilter() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const toolCards = document.querySelectorAll('.tool-card');
    
    if (filterButtons.length === 0 || toolCards.length === 0) {
        return; // Not on tools page
    }
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filter tools
            toolCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                
                if (category === 'all' || cardCategory === category) {
                    card.style.display = 'block';
                    card.style.animation = 'fadeIn 0.3s';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

/**
 * Initialize mobile menu toggle
 */
function initializeMobileMenu() {
    // Create mobile menu button if on small screen
    const navbar = document.querySelector('.navbar .container');
    
    if (!navbar) return;
    
    // Check if we need to add mobile menu functionality
    if (window.innerWidth <= 768) {
        const navMenu = document.querySelector('.nav-menu');
        
        if (!navMenu) return;
        
        // Add click handler to toggle menu on mobile
        const navBrand = document.querySelector('.nav-brand');
        
        if (navBrand) {
            navBrand.style.cursor = 'pointer';
        }
    }
}

/**
 * Initialize smooth scrolling for anchor links
 */
function initializeSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Only handle internal anchors
            if (href === '#' || href.length <= 1) return;
            
            const target = document.querySelector(href);
            
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}



// Add CSS for fade-in animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// Handle window resize
let resizeTimer;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
        initializeMobileMenu();
    }, 250);
});
