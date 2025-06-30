/**
 * ===================================================================
 * SHUT UP AND TAKE MY THINGS - Public Store Application
 * ===================================================================
 */
const App = {
    // --- STATE ---
    items: [], // Full list of items from the server
    config: {}, // To store config from the server
    elements: {}, // Cached DOM elements for performance
    searchTimeout: null, // For debouncing search input

    // --- INITIALIZATION ---
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.run());
        } else {
            this.run();
        }
    },

    async run() {
        console.log('App is running...');
        await this.loadConfig(); // Load config first
        this.cacheDOMElements();
        this.bindEventListeners();
        this.loadItems();
        this.runEnhancements();

       if (this.elements.header) {
            setTimeout(() => {
                this.elements.header.classList.add('is-visible');
            }, 100);
        }
        if (this.elements.headerLogo) {
            setTimeout(() => {
                this.elements.headerLogo.classList.add('animate-in');
            }, 100);
        }
    },
    
    async loadConfig() {
        try {
            const response = await fetch('/api/config');
            if (!response.ok) throw new Error('Could not load server configuration.');
            this.config = await response.json();
        } catch (error) {
            console.error('Error loading config:', error);
            this.showNotification(error.message, 'error');
        }
    },

    cacheDOMElements() {
        this.elements = {
            header: document.querySelector('.header'),
            headerLogo: document.querySelector('.header-logo'),
            itemsGrid: document.getElementById('itemsGrid'),
            noItemsMessage: document.getElementById('noItems'),
            searchInput: document.getElementById('searchInput'),
            categoryFilter: document.getElementById('categoryFilter'),
            statusFilter: document.getElementById('statusFilter'),
            imageModal: document.getElementById('imageModal'),
            modalImage: document.getElementById('modalImage'),
            closeModalBtn: document.querySelector('#imageModal .close-modal'),
            contactModal: document.getElementById('contactModal'),
            contactForm: document.getElementById('contactForm'),
            contactItemId: document.getElementById('contactItemId'),
            closeContactModalBtn: document.querySelector('#contactModal .close-modal'),
        };
    },

    bindEventListeners() {
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
        // Image Modal
        if (this.elements.imageModal && this.elements.closeModalBtn) {
            this.elements.closeModalBtn.addEventListener('click', () => this.closeImageModal());
            this.elements.imageModal.addEventListener('click', (e) => {
                if (e.target === this.elements.imageModal) this.closeImageModal();
            });
        }

        // Contact Modal
        if (this.elements.contactModal && this.elements.closeContactModalBtn) {
            this.elements.closeContactModalBtn.addEventListener('click', () => this.closeContactModal());
            this.elements.contactModal.addEventListener('click', (e) => {
                if (e.target === this.elements.contactModal) this.closeContactModal();
            });
        }
        
        // Use event delegation for the contact form buttons
        if (this.elements.contactForm) {
            this.elements.contactForm.addEventListener('click', (event) => {
                const button = event.target.closest('button');
                if (!button) return;

                event.preventDefault();

                if (button.id === 'sendWhatsAppBtn') {
                    this.handleContact('whatsapp');
                } else if (button.id === 'sendEmailBtn') {
                    this.handleContact('ntfy');
                }
            });
        }

        // Global keydown listener
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
            const response = await fetch('/api/items');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            this.items = await response.json();
            this.filterAndRender();
        } catch (error) {
            console.error('Error loading items:', error);
            this.showErrorMessage('Could not load items from the server.');
        }
    },

    filterAndRender() {
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

        this.elements.itemsGrid.innerHTML = '';

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
                itemCard.classList.add('is-visible')
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
                <div class="item-price">€${price}</div>
                ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
                ${this.formatItemSpecifications(item)}
                <span class="item-status ${statusClass}">${item.status || 'unknown'}</span>
                <div class="item-actions">
                    <button class="btn btn-primary interested-btn" data-id="${item.id}">I'm Interested</button>
                </div>
            </div>`;

        card.addEventListener('click', (e) => this.createRippleEffect(e));
        const imageElement = card.querySelector('img');
        if (imageElement) {
            imageElement.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openImageModal(item.image_url);
            });
        }

        const interestedBtn = card.querySelector('.interested-btn');
        interestedBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openContactModal(item.id);
        });

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
    
    openContactModal(itemId) {
        if (this.elements.contactModal) {
            this.elements.contactItemId.value = itemId;
            this.elements.contactModal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    },

    closeContactModal() {
        if (this.elements.contactModal) {
            this.elements.contactModal.classList.remove('show');
            document.body.style.overflow = 'auto';
            this.elements.contactForm.reset();
        }
    },
    
    async handleContact(method) {
        const name = document.getElementById('contactName').value;
        const email = document.getElementById('contactEmail').value;

        // Manual validation
        if (!name || !email) {
            this.showNotification('Please fill out your name and email.', 'error');
            return;
        }

        const { whatsappNumber, ntfyUrl } = this.config;
        const itemId = this.elements.contactItemId.value;
        const comment = document.getElementById('contactComment').value;
        const item = this.items.find(i => i.id == itemId);

        if (!item) {
            this.showNotification('Error: Item not found.', 'error');
            return;
        }

        if (method === 'whatsapp') {
            if (!whatsappNumber) {
                this.showNotification('Configuration error: WhatsApp number not set.', 'error');
                return;
            }
            const messageParts = [
                `Hello! My name is: ${name}. I'm interested in this item: *${item.name}*`,
                 
            ];
            if (comment) {
                messageParts.push(`\nMy comment: ${comment}`);
            }
            const encodedMessage = encodeURIComponent(messageParts.join('\n'));
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
            
            window.open(whatsappUrl, '_blank');
            this.closeContactModal();
            this.showNotification('Opening WhatsApp...', 'success');

        } else if (method === 'ntfy') { // This logic now sends to our backend for Gotify
        const title = `New inquiry for ${item.name}`;
        const message = `
        New message about: ${item.name}
        From: ${name}
        Email: ${email}
        Comment: ${comment}
        `;
        
        try {
            const response = await fetch('/api/send-notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, message })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to send message.');
            }

            this.closeContactModal();
            this.showNotification('Message sent successfully!', 'success');
        } catch (error) {
            console.error('Error sending message:', error);
            this.showNotification(error.message, 'error');
        }
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
    
    showNotification(message, type = 'info') {
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 10000);
    },

    // --- ENHANCEMENTS (NON-ESSENTIAL) ---
    runEnhancements() {
        this.createFloatingElements();
        this.addEasterEgg();
    }
};

// --- RUN THE APP ---
App.init();

// --- Helper Functions ---
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

App.createRippleEffect = function(e) {
    const card = e.currentTarget;
    if (e.target.tagName === 'IMG' || e.target.classList.contains('interested-btn')) return;
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