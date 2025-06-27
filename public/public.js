/**
 * ===================================================================
 * SHUT UP AND TAKE MY THINGS - Public Store Application
 * ===================================================================
 */
const App = {
    // --- STATE ---
    items: [], // Full list of items from the server
    elements: {}, // Cached DOM elements for performance
    searchTimeout: null, // For debouncing search input

    // --- INITIALIZATION ---
    init() {
        // The App's entry point. Runs once the DOM is ready.
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.run());
        } else {
            this.run();
        }
    },

    run() {
        console.log('App is running...');
        this.injectStyles();
        this.cacheDOMElements();
        this.bindEventListeners();
        this.loadItems();
        this.runEnhancements();

        if (this.elements.headerLogo) {
            // Use a short timeout to ensure the browser is ready
            setTimeout(() => {
                this.elements.headerLogo.classList.add('animate-in');
            }, 100);
        }
    },
    

    cacheDOMElements() {
        // Cache all necessary elements to avoid repeated DOM queries
        this.elements = {
            headerLogo: document.querySelector('.header-logo'),
            itemsGrid: document.getElementById('itemsGrid'),
            noItemsMessage: document.getElementById('noItems'),
            searchInput: document.getElementById('searchInput'),
            categoryFilter: document.getElementById('categoryFilter'),
            statusFilter: document.getElementById('statusFilter'),
            imageModal: document.getElementById('imageModal'),
            modalImage: document.getElementById('modalImage'),
            closeModalBtn: document.querySelector('.close-modal'),
        };
    },

    bindEventListeners() {
        // All event listeners are attached here, not in the HTML
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', () => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => this.filterAndRender(), 300);
            });
        }
        if (this.elements.categoryFilter) {
            this.elements.categoryFilter.addEventListener('change', () => this.filterAndRender());
        }
        if (this.elements.statusFilter) {
            this.elements.statusFilter.addEventListener('change', () => this.filterAndRender());
        }
        this.bindModalEvents();
    },

    bindModalEvents() {
        if (!this.elements.imageModal || !this.elements.closeModalBtn) return;
        this.elements.closeModalBtn.addEventListener('click', () => this.closeImageModal());
        this.elements.imageModal.addEventListener('click', (e) => {
            if (e.target === this.elements.imageModal) this.closeImageModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === "Escape" && this.elements.imageModal.classList.contains('show')) {
                this.closeImageModal();
            }
        });
    },

    // --- DATA HANDLING & RENDERING ---
    async loadItems() {
        if (!this.elements.itemsGrid) return;
        this.elements.itemsGrid.innerHTML = '<div class="loading">Loading amazing items...</div>';
        try {
            // In a real-world scenario, the API endpoint would be here
            const response = await fetch('/api/items');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            this.items = await response.json();
            this.filterAndRender(); // Initial render after fetching
        } catch (error) {
            console.error('Error loading items:', error);
            this.showErrorMessage('Could not load items from the server.');
        }
    },

    filterAndRender() {
        // This function filters items based on UI controls and calls the render function.
        const searchTerm = this.elements.searchInput.value.toLowerCase();
        const category = this.elements.categoryFilter.value;
        const status = this.elements.statusFilter.value;

        const filteredItems = this.items.filter(item => {
            const name = item.name || '';
            const description = item.description || '';
            const itemCategory = item.category || '';
            const itemStatus = item.status || '';

            const matchesSearch = name.toLowerCase().includes(searchTerm) || description.toLowerCase().includes(searchTerm);
            const matchesCategory = !category || itemCategory === category;
            const matchesStatus = !status || itemStatus === status;
            
            return matchesSearch && matchesCategory && matchesStatus;
        });

        this.renderItems(filteredItems);
    },

    renderItems(itemsToRender) {
        if (!this.elements.itemsGrid || !this.elements.noItemsMessage) return;

        this.elements.itemsGrid.innerHTML = ''; // Clear grid

        if (itemsToRender.length === 0) {
            this.elements.itemsGrid.style.display = 'none';
            this.elements.noItemsMessage.innerHTML = `
                <div style="font-size: 3rem; margin-bottom: 20px;">🛍️</div>
                <p style="font-size: 1.2rem;">No items found matching your criteria.</p>`;
            this.elements.noItemsMessage.style.display = 'block';
        } else {
            this.elements.itemsGrid.style.display = 'grid';
            this.elements.noItemsMessage.style.display = 'none';
            itemsToRender.forEach((item, index) => {
                const itemCard = this.createItemCard(item);
                itemCard.style.animationDelay = `${index * 80}ms`;
                this.elements.itemsGrid.appendChild(itemCard);
            });
        }
    },

    createItemCard(item) {
        const card = document.createElement('div');
        card.className = 'item-card';
        
        const price = item.price ? parseFloat(item.price).toFixed(2) : '0.00';
        const statusClass = item.status === 'available' ? 'status-available' : 'status-sold';

        card.innerHTML = `
            <div class="item-image">${item.image_url ? `<img src="${item.image_url}" alt="${item.name}" loading="lazy">` : '📷'}</div>
            <div class="item-details">
                <div class="item-category">${item.category || 'Uncategorized'}</div>
                <div class="item-title">${item.name || 'No Title'}</div>
                <div class="item-price">$${price}</div>
                ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
                ${this.formatItemSpecifications(item)}
                <span class="item-status ${statusClass}">${item.status || 'unknown'}</span>
            </div>`;

        // Card Interactions
        card.addEventListener('click', (e) => this.createRippleEffect(e));
        const imageElement = card.querySelector('img');
        if (imageElement) {
            imageElement.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openImageModal(item.image_url);
            });
        }
        return card;
    },

    // --- UI HELPERS & INTERACTIONS ---
    openImageModal(imageUrl) {
        if (this.elements.imageModal && this.elements.modalImage) {
            this.elements.modalImage.src = imageUrl;
            this.elements.imageModal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    },

    closeImageModal() {
        if (this.elements.imageModal) {
            this.elements.imageModal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    },
    
    showErrorMessage(message) {
        this.elements.itemsGrid.innerHTML = '';
        this.elements.noItemsMessage.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 20px;">⚠️</div>
            <p style="font-size: 1.2rem;">${message}</p>`;
        this.elements.noItemsMessage.style.display = 'block';
    },

    formatItemSpecifications(item) {
        const specs = [];
        const dims = [];
        if (item.height) dims.push(`${item.height}cm H`);
        if (item.length) dims.push(`${item.length}cm L`);
        if (item.depth) dims.push(`${item.depth}cm D`);
        if (dims.length > 0) specs.push(`<strong>Dimensions:</strong> ${dims.join(' × ')}`);
        if (item.color) specs.push(`<strong>Color:</strong> ${item.color}`);
        if (item.material) specs.push(`<strong>Material:</strong> ${item.material}`);
        if (item.condition) specs.push(`<strong>Condition:</strong> ${item.condition.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`);
        return specs.length > 0 ? `<div class="item-specs">${specs.join('<br>')}</div>` : '';
    },
    
    // --- ENHANCEMENTS (NON-ESSENTIAL) ---
    runEnhancements() {
        this.createFloatingElements();
        this.animateSearchPlaceholder();
        this.addEasterEgg();
    },
    
    createFloatingElements() { /* ... function content from previous version ... */ },
    animateSearchPlaceholder() { /* ... function content from previous version ... */ },
    addEasterEgg() { /* ... function content from previous version ... */ },
    triggerEasterEgg() { /* ... function content from previous version, styled by injected CSS ... */ },
    
    // --- STYLE INJECTION ---
    injectStyles() {
        const styleSheet = document.createElement("style");
        styleSheet.id = 'app-runtime-styles';
        styleSheet.textContent = `
            .item-card { position: relative; overflow: hidden; }
            .ripple {
                position: absolute;
                border-radius: 50%;
                background-color: rgba(229, 72, 72, 0.4);
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            }
            @keyframes ripple { to { transform: scale(4); opacity: 0; } }
            .easter-egg-message {
                position: fixed; top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                background: var(--color-primary, #E54848); color: white;
                padding: 20px 40px; border-radius: 20px; z-index: 10000;
                font-size: 1.2rem; font-weight: bold;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                animation: bounceIn 0.5s ease;
            }
        `;
        document.head.appendChild(styleSheet);
    }
};

// --- RUN THE APP ---
App.init();

// --- We are keeping these enhancement functions outside the main App object for clarity ---
// --- but they will be called by App.runEnhancements() ---
App.createFloatingElements = function() {
    const container = document.createElement('div');
    container.className = 'floating-elements';
    document.body.insertBefore(container, document.body.firstChild);
    for (let i = 0; i < 8; i++) {
        const el = document.createElement('div'); el.className = 'floating-element';
        const size = Math.random() * 50 + 20;
        el.style.cssText = `width:${size}px; height:${size}px; left:${Math.random()*100}%; animation-delay:${Math.random()*25}s; animation-duration:${Math.random()*15+20}s;`;
        container.appendChild(el);
    }
};

App.animateSearchPlaceholder = function() {
    if (!this.elements.searchInput) return;
    const placeholders = ['Search for treasure...', 'Find a new couch...', `It's Friday afternoon in Nuremberg...`, 'Anything but work...'];
    let i = 0, j = 0, current = '', isDeleting = false;
    const type = () => {
        if (!this.elements.searchInput) return;
        current = placeholders[i];
        if (isDeleting) { j--; } else { j++; }
        this.elements.searchInput.placeholder = current.substring(0, j);
        let delay = isDeleting ? 40 : 90;
        if (!isDeleting && j === current.length) { delay = 2200; isDeleting = true; }
        if (isDeleting && j === 0) { isDeleting = false; i = (i + 1) % placeholders.length; delay = 500; }
        setTimeout(type, delay);
    };
    setTimeout(type, 1500);
};

App.addEasterEgg = function() {
    const code = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
    let index = 0;
    document.addEventListener('keydown', (e) => {
        if (e.keyCode === code[index]) {
            index++;
            if (index === code.length) {
                this.triggerEasterEgg();
                index = 0;
            }
        } else {
            index = 0;
        }
    });
};

App.triggerEasterEgg = function() {
    const existingStyle = document.getElementById('easter-egg-style');
    if(existingStyle) existingStyle.remove();
    const existingMsg = document.querySelector('.easter-egg-message');
    if(existingMsg) existingMsg.remove();
    
    const style = document.createElement('style');
    style.id = 'easter-egg-style';
    style.textContent = `.item-card { animation: rainbow 2s infinite linear !important; } @keyframes rainbow { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } }`;
    document.head.appendChild(style);

    const msg = document.createElement('div');
    msg.className = 'easter-egg-message';
    msg.textContent = '🎉 You found the secret! Enjoy the rainbow! 🌈';
    document.body.appendChild(msg);

    setTimeout(() => style.remove(), 8000);
    setTimeout(() => msg.remove(), 4000);
};

// This re-implementation of createRippleEffect is to be used by the App object.
App.createRippleEffect = function(e) {
    const card = e.currentTarget;
    if (e.target.tagName === 'IMG') return; // Do not trigger on image click
    const ripple = document.createElement('span');
    const rect = card.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    ripple.classList.add('ripple');
    card.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
};