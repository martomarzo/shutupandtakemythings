// Public store functionality with API integration
let items = [];

// Load items when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializePublicStore();
});

function initializePublicStore() {
    // Add floating background elements
    createFloatingElements();
    
    // Load and display items from API
    loadItems();
    
    // Initialize scroll animations
    initializeScrollAnimations();
    
    // Add loading effect
    showLoadingEffect();
    
    // Initialize enhanced features
    addParallaxEffect();
    animateSearchPlaceholder();
    optimizeAnimations();
    addEasterEgg();
}

// Create floating background elements
function createFloatingElements() {
    const floatingContainer = document.createElement('div');
    floatingContainer.className = 'floating-elements';
    document.body.appendChild(floatingContainer);
    
    // Create floating circles
    for (let i = 0; i < 6; i++) {
        const element = document.createElement('div');
        element.className = 'floating-element';
        
        // Random size and position
        const size = Math.random() * 60 + 20;
        element.style.width = size + 'px';
        element.style.height = size + 'px';
        element.style.left = Math.random() * 100 + '%';
        element.style.animationDelay = Math.random() * 20 + 's';
        element.style.animationDuration = (Math.random() * 10 + 15) + 's';
        
        floatingContainer.appendChild(element);
    }
}

// Load items from API
async function loadItems() {
    try {
        const searchTerm = document.getElementById('searchInput')?.value || '';
        const categoryFilter = document.getElementById('categoryFilter')?.value || '';
        const statusFilter = document.getElementById('statusFilter')?.value || '';

        // Build query parameters
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (categoryFilter) params.append('category', categoryFilter);
        if (statusFilter) params.append('status', statusFilter);

        const response = await fetch(`/api/items?${params.toString()}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        items = await response.json();
        
        // Animate items on load after a delay
        setTimeout(() => {
            displayItems();
            animateItemsOnLoad();
        }, 600);
        
    } catch (error) {
        console.error('Error loading items:', error);
        showErrorMessage('Unable to load items. Please try again later.');
    }
}

// Show error message
function showErrorMessage(message) {
    const container = document.getElementById('itemsGrid');
    const noItemsMsg = document.getElementById('noItems');
    
    container.style.display = 'none';
    noItemsMsg.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
            <div style="font-size: 3rem; margin-bottom: 20px;">⚠️</div>
            <p style="font-size: 1.2rem; color: rgba(255,255,255,0.9); margin-bottom: 20px;">${message}</p>
            <button onclick="loadItems()" class="btn btn-primary">Try Again</button>
        </div>
    `;
    noItemsMsg.style.display = 'block';
}

// Show loading effect
function showLoadingEffect() {
    const container = document.getElementById('itemsGrid');
    container.innerHTML = '<div class="loading">Loading amazing items...</div>';
}

// Display items in the public store with animations
function displayItems() {
    const container = document.getElementById('itemsGrid');
    const noItemsMsg = document.getElementById('noItems');

    // Clear existing content
    container.innerHTML = '';

    // Filter to show only available items by default
    const filteredItems = items.filter(item => {
        const statusFilter = document.getElementById('statusFilter')?.value || '';
        if (!statusFilter) {
            return item.status === 'available';
        }
        return statusFilter ? item.status === statusFilter : true;
    });

    if (filteredItems.length === 0) {
        container.style.display = 'none';
        noItemsMsg.style.display = 'block';
        noItemsMsg.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">🛍️</div>
                <p style="font-size: 1.2rem; color: rgba(255,255,255,0.9);">No items found matching your criteria.</p>
            </div>
        `;
        animateNoItems();
        return;
    }

    container.style.display = 'grid';
    noItemsMsg.style.display = 'none';

    // Create item cards with staggered animation
    filteredItems.forEach((item, index) => {
        const itemCard = createItemCard(item, index);
        container.appendChild(itemCard);
    });

    // Animate items in sequence
    setTimeout(() => {
        animateItemsSequentially();
    }, 100);
}

// Create individual item card
function createItemCard(item, index) {
    const card = document.createElement('div');
    card.className = 'item-card fade-in';
    card.style.animationDelay = `${index * 0.1}s`;
    
    card.innerHTML = `
        ${item.image_url ? 
            `<div class="item-image">
                <img src="${item.image_url}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy">
            </div>` : 
            `<div class="item-image">📷</div>`
        }
        <div class="item-details">
            <div class="item-category">${item.category}</div>
            <div class="item-title">${item.name}</div>
            <div class="item-price">$${parseFloat(item.price).toFixed(2)}</div>
            ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
            ${formatItemSpecifications(item)}
            <span class="item-status ${item.status === 'available' ? 'status-available' : 'status-sold'}">
                ${item.status}
            </span>
        </div>
    `;

    // Add hover effects
    addCardInteractions(card);
    
    return card;
}

// Format item specifications for public display
function formatItemSpecifications(item) {
    const specs = [];
    
    // Dimensions
    if (item.height || item.length || item.depth) {
        const dimensions = [];
        if (item.height) dimensions.push(`${item.height}cm H`);
        if (item.length) dimensions.push(`${item.length}cm L`);
        if (item.depth) dimensions.push(`${item.depth}cm D`);
        specs.push(`<strong>Dimensions:</strong> ${dimensions.join(' × ')}`);
    }
    
    // Color and material
    if (item.color) {
        specs.push(`<strong>Color:</strong> ${item.color}`);
    }
    if (item.material) {
        specs.push(`<strong>Material:</strong> ${item.material}`);
    }
    if (item.condition) {
        specs.push(`<strong>Condition:</strong> ${item.condition.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`);
    }
    
    // Additional notes
    if (item.notes) {
        specs.push(`<strong>Notes:</strong> ${item.notes}`);
    }
    
    if (specs.length > 0) {
        return `<div class="item-specs">${specs.join('<br>')}</div>`;
    }
    
    return '';
}

// Add interactive effects to cards
function addCardInteractions(card) {
    // Add magnetic hover effect
    card.addEventListener('mouseenter', function(e) {
        this.style.transform = 'translateY(-12px) scale(1.02)';
        
        // Add subtle rotation based on mouse position
        card.addEventListener('mousemove', handleCardMouseMove);
    });
    
    card.addEventListener('mouseleave', function(e) {
        this.style.transform = 'translateY(0) scale(1) rotateX(0) rotateY(0)';
        card.removeEventListener('mousemove', handleCardMouseMove);
    });
    
    // Add click ripple effect
    card.addEventListener('click', function(e) {
        createRippleEffect(e, this);
    });
}

// Handle card mouse movement for tilt effect
function handleCardMouseMove(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    
    card.style.transform = `translateY(-12px) scale(1.02) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
}

// Create ripple effect on click
function createRippleEffect(e, element) {
    const ripple = document.createElement('div');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: radial-gradient(circle, rgba(102, 126, 234, 0.3) 0%, transparent 70%);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
        z-index: 1;
    `;
    
    // Add ripple animation keyframes if not already added
    if (!document.querySelector('#ripple-styles')) {
        const style = document.createElement('style');
        style.id = 'ripple-styles';
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(2);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    element.style.position = 'relative';
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Animate items on initial load
function animateItemsOnLoad() {
    const itemCards = document.querySelectorAll('.item-card');
    itemCards.forEach((item, index) => {
        setTimeout(() => {
            item.style.transform = 'translateY(0)';
            item.style.opacity = '1';
        }, index * 150);
    });
}

// Animate items sequentially when filtering
function animateItemsSequentially() {
    const itemCards = document.querySelectorAll('.item-card');
    itemCards.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(30px) scale(0.9)';
        
        setTimeout(() => {
            item.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0) scale(1)';
        }, index * 100);
    });
}

// Animate no items message
function animateNoItems() {
    const noItemsMsg = document.getElementById('noItems');
    noItemsMsg.style.opacity = '0';
    noItemsMsg.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        noItemsMsg.style.transition = 'all 0.5s ease';
        noItemsMsg.style.opacity = '1';
        noItemsMsg.style.transform = 'translateY(0)';
    }, 200);
}

// Initialize scroll animations
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    // Observe elements that should animate on scroll
    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });
}

// Filter items with smooth transition
function filterItems() {
    // Add loading state
    const container = document.getElementById('itemsGrid');
    container.style.opacity = '0.6';
    container.style.transform = 'scale(0.98)';
    
    // Reload items with new filters
    setTimeout(() => {
        loadItems();
        
        // Restore container
        setTimeout(() => {
            container.style.transition = 'all 0.4s ease';
            container.style.opacity = '1';
            container.style.transform = 'scale(1)';
        }, 100);
    }, 200);
}

// Enhanced search with debouncing
let searchTimeout;
function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        filterItems();
    }, 300);
}

// Update search input to use debounced search
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounceSearch);
    }
});

// Add parallax effect to header
function addParallaxEffect() {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const header = document.querySelector('.header');
        if (header) {
            const speed = scrolled * 0.5;
            header.style.transform = `translateY(${speed}px)`;
        }
    });
}

// Add typing animation to search placeholder
function animateSearchPlaceholder() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const placeholders = [
        'Search items...',
        'Find furniture...',
        'Look for electronics...',
        'Discover great deals...',
        'Search by name...'
    ];
    
    let currentIndex = 0;
    let currentText = '';
    let isDeleting = false;
    
    function typeEffect() {
        const currentPlaceholder = placeholders[currentIndex];
        
        if (isDeleting) {
            currentText = currentPlaceholder.substring(0, currentText.length - 1);
        } else {
            currentText = currentPlaceholder.substring(0, currentText.length + 1);
        }
        
        searchInput.placeholder = currentText;
        
        let delay = isDeleting ? 50 : 100;
        
        if (!isDeleting && currentText === currentPlaceholder) {
            delay = 2000;
            isDeleting = true;
        } else if (isDeleting && currentText === '') {
            isDeleting = false;
            currentIndex = (currentIndex + 1) % placeholders.length;
            delay = 500;
        }
        
        setTimeout(typeEffect, delay);
    }
    
    // Start typing effect only if search input is empty
    if (searchInput.value === '') {
        setTimeout(typeEffect, 1000);
    }
}

// Optimize animations for better performance
function optimizeAnimations() {
    // Reduce animations on slower devices
    const isSlowDevice = navigator.hardwareConcurrency < 4 || 
                        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isSlowDevice) {
        document.documentElement.style.setProperty('--animation-duration', '0.3s');
        document.documentElement.style.setProperty('--transition-duration', '0.2s');
    }
    
    // Pause animations when tab is not visible
    document.addEventListener('visibilitychange', () => {
        const animations = document.querySelectorAll('.floating-element');
        animations.forEach(el => {
            if (document.hidden) {
                el.style.animationPlayState = 'paused';
            } else {
                el.style.animationPlayState = 'running';
            }
        });
    });
}

// Add Easter egg - Konami code
function addEasterEgg() {
    const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
    let konamiIndex = 0;
    
    document.addEventListener('keydown', (e) => {
        if (e.keyCode === konamiCode[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                triggerEasterEgg();
                konamiIndex = 0;
            }
        } else {
            konamiIndex = 0;
        }
    });
}

function triggerEasterEgg() {
    // Create rainbow effect
    const style = document.createElement('style');
    style.textContent = `
        .item-card {
            animation: rainbow 2s infinite !important;
        }
        @keyframes rainbow {
            0% { filter: hue-rotate(0deg); }
            100% { filter: hue-rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        document.head.removeChild(style);
    }, 10000);
    
    // Show secret message
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px 40px;
        border-radius: 20px;
        z-index: 10000;
        font-size: 1.2rem;
        font-weight: bold;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        animation: bounceIn 0.5s ease;
    `;
    message.textContent = '🎉 You found the secret! Enjoy the rainbow! 🌈';
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.style.animation = 'bounceOut 0.5s ease';
        setTimeout(() => {
            document.body.removeChild(message);
        }, 500);
    }, 3000);
}