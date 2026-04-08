// Model data by category - usando caminhos de imagens em vez de ícones
const modelsData = {
    all: [
        { id: 1, title: "Abstract Model 1", category: "characters", src: "assets/wardrobe.png" },
        { id: 2, title: "Modern Block", category: "blocks", src: "assets/modelo2.gif" },
        { id: 3, title: "Special Item", category: "items", src: "assets/modelo3.png" },
        { id: 4, title: "Creative Mob", category: "mobs", src: "assets/modelo4.gif" },
        { id: 5, title: "Hero Character", category: "characters", src: "assets/modelo5.png" },
        { id: 6, title: "Futuristic Block", category: "blocks", src: "assets/modelo6.gif" },
        { id: 7, title: "Rare Item", category: "items", src: "assets/modelo7.png" },
        { id: 8, title: "Fantastic Mob", category: "mobs", src: "assets/modelo8.gif" },
        { id: 9, title: "Wizard Character", category: "characters", src: "assets/modelo9.png" },
        { id: 10, title: "Crystal Block", category: "blocks", src: "assets/modelo10.gif" },
        { id: 11, title: "Magic Sword", category: "items", src: "assets/modelo11.png" },
        { id: 12, title: "Fire Dragon", category: "mobs", src: "assets/modelo12.gif" }
    ],
    characters: [
        { id: 1, title: "Abstract Model 1", category: "characters", src: "assets/modelo1.png" },
        { id: 5, title: "Hero Character", category: "characters", src: "assets/modelo5.png" },
        { id: 9, title: "Wizard Character", category: "characters", src: "assets/modelo9.png" }
    ],
    blocks: [
        { id: 2, title: "Modern Block", category: "blocks", src: "assets/modelo2.gif" },
        { id: 6, title: "Futuristic Block", category: "blocks", src: "assets/modelo6.gif" },
        { id: 10, title: "Crystal Block", category: "blocks", src: "assets/modelo10.gif" }
    ],
    items: [
        { id: 3, title: "Special Item", category: "items", src: "assets/modelo3.png" },
        { id: 7, title: "Rare Item", category: "items", src: "assets/modelo7.png" },
        { id: 11, title: "Magic Sword", category: "items", src: "assets/modelo11.png" }
    ],
    mobs: [
        { id: 4, title: "Creative Mob", category: "mobs", src: "assets/modelo4.gif" },
        { id: 8, title: "Fantastic Mob", category: "mobs", src: "assets/modelo8.gif" },
        { id: 12, title: "Fire Dragon", category: "mobs", src: "assets/modelo12.gif" }
    ]
};

// Global variables
let currentCategory = 'all';
let carouselInterval;
let currentTranslateX = 0;
let isCarouselPaused = false;
let isDragging = false;
let startX = 0;
let currentX = 0;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Loading animation
    initLoadingAnimation();
    
    // Initialize carousel
    initCarousel();
    
    // Initialize filters
    initFilters();
    
    // Initialize modal
    initModal();
    
    // Initialize header scroll
    initHeaderScroll();
    
    // Initialize smooth scroll
    initSmoothScroll();
    
    // Initialize contact form
    initContactForm();
    
    // Initialize carousel navigation
    initCarouselNavigation();
});

// Loading animation
function initLoadingAnimation() {
    const loadingScreen = document.getElementById('loading-screen');
    const mainLogo = document.getElementById('main-logo');
    
    // After 3 seconds, start transition
    setTimeout(() => {
        // Stop spinning animation
        const spinningLogo = document.querySelector('.logo-symbol.spinning');
        if (spinningLogo) {
            spinningLogo.classList.remove('spinning');
        }
        
        // Fade out loading screen
        loadingScreen.classList.add('hidden');
        
        // Animate logo to final position
        setTimeout(() => {
            if (mainLogo) {
                mainLogo.style.transform = 'scale(1)';
                mainLogo.style.transition = 'transform 0.5s ease';
            }
        }, 500);
    }, 3000);
}

// Initialize carousel
function initCarousel() {
    renderModels(currentCategory);
    startCarousel();
}

// Render models in carousel - usando imagens em vez de ícones
function renderModels(category) {
    const carousel = document.getElementById('models-carousel');
    const models = modelsData[category] || modelsData.all;
    
    // Duplicate models for infinite loop effect
    const duplicatedModels = [...models, ...models, ...models];
    
    carousel.innerHTML = duplicatedModels.map(model => `
        <div class="model-card" data-model-id="${model.id}" data-model-src="${model.src}">
            <div class="model-preview">
                <img src="${model.src}" alt="${model.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="model-fallback" style="display: none; width: 100%; height: 100%; background: linear-gradient(135deg, var(--primary), var(--secondary)); align-items: center; justify-content: center;">
                    <i class="fas fa-image" style="font-size: 4rem; color: rgba(18, 18, 18, 0.3);"></i>
                </div>
            </div>
        </div>
    `).join('');
    
    // Reset carousel position
    currentTranslateX = 0;
    carousel.style.transform = `translateX(${currentTranslateX}px)`;
    
    // Add event listeners for cards
    addCarouselEventListeners();
}

// Add carousel event listeners
function addCarouselEventListeners() {
    const carousel = document.getElementById('models-carousel');
    const modelCards = carousel.querySelectorAll('.model-card');
    
    // Pause carousel on mouse enter (only if not dragging)
    carousel.addEventListener('mouseenter', () => {
        if (!isDragging) {
            pauseCarousel();
        }
    });
    carousel.addEventListener('mouseleave', () => {
        if (!isDragging) {
            resumeCarousel();
        }
    });
    
    // Add click listeners to open modal
    modelCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Only open modal if not dragging
            if (!isDragging) {
                const modelSrc = card.dataset.modelSrc;
                const modelId = card.dataset.modelId;
                openModal(modelId, modelSrc);
            }
        });
    });
    
    // Add drag functionality
    carousel.addEventListener('mousedown', startDrag);
    carousel.addEventListener('mousemove', drag);
    carousel.addEventListener('mouseup', endDrag);
    carousel.addEventListener('mouseleave', endDrag);
    
    // Touch events for mobile
    carousel.addEventListener('touchstart', startDrag);
    carousel.addEventListener('touchmove', drag);
    carousel.addEventListener('touchend', endDrag);
}

// Drag functionality
function startDrag(e) {
    e.preventDefault();
    isDragging = true;
    startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
    currentX = currentTranslateX;
    
    // Immediately pause carousel when starting drag
    pauseCarousel();
    
    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
}

function drag(e) {
    if (!isDragging) return;
    
    e.preventDefault();
    const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
    const deltaX = clientX - startX;
    const carousel = document.getElementById('models-carousel');
    
    // Update position in real time
    currentTranslateX = currentX + deltaX;
    carousel.style.transform = `translateX(${currentTranslateX}px)`;
}

function endDrag(e) {
    if (!isDragging) return;
    
    isDragging = false;
    
    // Restore text selection
    document.body.style.userSelect = '';
    
    const clientX = e.type === 'mouseup' ? e.clientX : e.changedTouches[0].clientX;
    const deltaX = clientX - startX;
    
    // Snap to nearest card if drag was significant
    if (Math.abs(deltaX) > 50) {
        const cardWidth = 370; // 350px + 20px gap
        currentTranslateX = Math.round(currentTranslateX / cardWidth) * cardWidth;
        
        const carousel = document.getElementById('models-carousel');
        carousel.style.transform = `translateX(${currentTranslateX}px)`;
    }
    
    // Resume carousel after a short delay
    setTimeout(() => {
        resumeCarousel();
    }, 500);
}

// Start automatic carousel
function startCarousel() {
    carouselInterval = setInterval(() => {
        if (!isCarouselPaused && !isDragging) {
            moveCarousel();
        }
    }, 3000);
}

// Move carousel
function moveCarousel() {
    const carousel = document.getElementById('models-carousel');
    const cardWidth = 370; // 350px + 20px gap
    
    currentTranslateX -= cardWidth;
    carousel.style.transform = `translateX(${currentTranslateX}px)`;
    
    // Reset when reaching the end
    const totalCards = carousel.children.length;
    const visibleCards = Math.floor(carousel.parentElement.offsetWidth / cardWidth);
    const maxTranslate = -(cardWidth * (totalCards - visibleCards));
    
    if (currentTranslateX <= maxTranslate) {
        setTimeout(() => {
            currentTranslateX = 0;
            carousel.style.transition = 'none';
            carousel.style.transform = `translateX(${currentTranslateX}px)`;
            
            setTimeout(() => {
                carousel.style.transition = 'transform 0.5s ease';
            }, 50);
        }, 500);
    }
}

// Pause carousel
function pauseCarousel() {
    isCarouselPaused = true;
}

// Resume carousel
function resumeCarousel() {
    isCarouselPaused = false;
}

// Stop carousel
function stopCarousel() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
    }
}

// Initialize carousel navigation buttons
function initCarouselNavigation() {
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    
    if (prevBtn) {
        // Pausar carrossel ao passar mouse sobre as setas
        prevBtn.addEventListener('mouseenter', pauseCarousel);
        prevBtn.addEventListener('mouseleave', resumeCarousel);
        
        prevBtn.addEventListener('click', () => {
            moveCarouselManually('prev');
        });
    }
    
    if (nextBtn) {
        // Pausar carrossel ao passar mouse sobre as setas
        nextBtn.addEventListener('mouseenter', pauseCarousel);
        nextBtn.addEventListener('mouseleave', resumeCarousel);
        
        nextBtn.addEventListener('click', () => {
            moveCarouselManually('next');
        });
    }
}

// Manual carousel movement
function moveCarouselManually(direction) {
    const carousel = document.getElementById('models-carousel');
    const cardWidth = 370; // 350px + 20px gap
    
    pauseCarousel();
    
    if (direction === 'next') {
        currentTranslateX -= cardWidth;
    } else {
        currentTranslateX += cardWidth;
    }
    
    // Boundary checks
    const totalCards = carousel.children.length;
    const containerWidth = carousel.parentElement.offsetWidth;
    const visibleCards = Math.floor(containerWidth / cardWidth);
    const maxTranslate = -(cardWidth * (totalCards - visibleCards));
    
    if (currentTranslateX > 0) {
        currentTranslateX = maxTranslate;
    } else if (currentTranslateX < maxTranslate) {
        currentTranslateX = 0;
    }
    
    carousel.style.transform = `translateX(${currentTranslateX}px)`;
    
    // Resume after a delay
    setTimeout(() => {
        resumeCarousel();
    }, 1000);
}

// Initialize category filters
function initFilters() {
    const filters = document.querySelectorAll('.model-filter');
    
    filters.forEach(filter => {
        filter.addEventListener('click', () => {
            // Remove active class from all filters
            filters.forEach(f => f.classList.remove('active'));
            
            // Add active class to clicked filter
            filter.classList.add('active');
            
            // Get selected category
            const category = filter.dataset.category;
            currentCategory = category;
            
            // Stop current carousel
            stopCarousel();
            
            // Render new models
            renderModels(category);
            
            // Restart carousel
            startCarousel();
        });
    });
}

// Initialize modal - sem botão X, fecha ao clicar em qualquer lugar
function initModal() {
    const modal = document.getElementById('model-modal');
    
    // Close modal on any click (inside or outside)
    modal.addEventListener('click', closeModal);
    
    // Close modal with ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}

// Open modal - fullscreen com tamanho máximo possível
function openModal(modelId, modelSrc) {
    const modal = document.getElementById('model-modal');
    const modalImg = document.getElementById('modal-img');
    
    if (modelSrc) {
        // Update modal content with image
        modalImg.src = modelSrc;
        modalImg.alt = `Model ${modelId}`;
        modalImg.style.display = 'block';
        
        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Close modal with smooth animation
function closeModal() {
    const modal = document.getElementById('model-modal');
    const modalContent = modal.querySelector('.modal-content');
    
    // Add exit animation
    modalContent.style.animation = 'fadeOut 0.3s ease forwards';
    
    setTimeout(() => {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        modalContent.style.animation = '';
    }, 300);
}

// Add fadeOut animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.8); }
    }
`;
document.head.appendChild(style);

// Initialize header scroll
function initHeaderScroll() {
    const header = document.getElementById('header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// Initialize smooth scroll
function initSmoothScroll() {
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const headerHeight = document.getElementById('header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Initialize contact form
function initContactForm() {
    const form = document.querySelector('.contact-form');
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Simulate form submission
            const submitBtn = form.querySelector('.btn');
            const originalText = submitBtn.textContent;
            
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                submitBtn.textContent = 'Message Sent!';
                
                setTimeout(() => {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    form.reset();
                }, 2000);
            }, 1500);
        });
    }
}

// Window resize handler
window.addEventListener('resize', () => {
    // Readjust carousel if necessary
    const carousel = document.getElementById('models-carousel');
    if (carousel) {
        currentTranslateX = 0;
        carousel.style.transform = `translateX(${currentTranslateX}px)`;
    }
});

// Intersection Observer for entrance animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.section-title, .section-subtitle, .project-item, .model-card, .contact-item');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Mobile menu (for future responsiveness)
function initMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
        });
    }
}

