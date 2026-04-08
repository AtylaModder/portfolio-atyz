    // Mobile menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    
    menuToggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });
    
    // Portfolio category switching
    const categoryButtons = document.querySelectorAll('.btn-category');
    const portfolioCategories = document.querySelectorAll('.portfolio-category');
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.getAttribute('data-category');
            
            // Update active button
            categoryButtons.forEach(btn => {
                btn.classList.remove('bg-yellow-normal');
                btn.classList.add('bg-gray-200');
            });
            button.classList.remove('bg-gray-200');
            button.classList.add('bg-yellow-normal');
            
            // Show selected category
            portfolioCategories.forEach(cat => {
                cat.classList.add('hidden');
            });
            document.getElementById(category).classList.remove('hidden');
        });
    });
    
    // Counter animation
    function animateCounter(elementId, target) {
        const element = document.getElementById(elementId);
        const duration = 2000; // 2 seconds
        const frameDuration = 1000 / 60; // 60fps
        const totalFrames = Math.round(duration / frameDuration);
        let frame = 0;
        
        const counter = setInterval(() => {
            frame++;
            const progress = frame / totalFrames;
            const currentCount = Math.round(progress * target);
            
            if (frame === totalFrames) {
                clearInterval(counter);
                element.textContent = target;
            } else {
                element.textContent = currentCount;
            }
        }, frameDuration);
    }
    
    // Intersection Observer for fade-in elements
    const fadeElements = document.querySelectorAll('.fade-in');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Start counter animation if it's a counter element
                if (entry.target.querySelector('#years-counter')) {
                    animateCounter('years-counter', 5);
                    animateCounter('projects-counter', 120);
                    animateCounter('clients-counter', 45);
                    animateCounter('models-counter', 350);
                }
            }
        });
    }, { threshold: 0.1 });
    
    fadeElements.forEach(element => {
        observer.observe(element);
    });
    
    // Active navigation link based on scroll position
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').substring(1) === current) {
                link.classList.add('active');
            }
        });
    });