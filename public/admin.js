/**
 * ===================================================================
 * Shut Up and Take My Money - ADMIN PANEL SCRIPT
 * Final, Verified, and Corrected Version by Gemini
 * ===================================================================
 */
const AdminApp = {
    state: {
        items: [],
        editingItemId: null,
    },
    elements: {},

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.run());
        } else {
            this.run();
        }
    },

    run() {
        document.querySelector('body').classList.add('admin-page'); // Use a body class for scoping
        this.cacheDOMElements();
        if (!this.auth.checkAuth()) return;
        this.bindEventListeners();
        this.loadItems();
    },

    cacheDOMElements() {
        this.elements = {
            adminItemsContainer: document.getElementById('adminItems'),
            itemForm: document.getElementById('itemForm'),
            addItemCard: document.getElementById('addItemCard'),
            addItemToggle: document.getElementById('addItemToggle'),
            imagePreview: document.getElementById('imagePreview'),
            submitBtn: document.getElementById('submitBtn'),
            clearFormBtn: document.getElementById('clearFormBtn'),
            adminSearch: document.getElementById('adminSearch'),
            adminStatusFilter: document.getElementById('adminStatusFilter'),
            logoutBtn: document.getElementById('logoutBtn'),
            passwordModal: document.getElementById('passwordModal'),
            passwordModalOpen: document.getElementById('passwordModalOpen'),
            // CORRECTED SELECTOR: Looks for the correct button class
            passwordModalClose: document.querySelectorAll('.modal-close-btn'),
            passwordForm: document.getElementById('passwordForm'),
            passwordError: document.getElementById('passwordError'),
            passwordSubmitBtn: document.getElementById('passwordSubmitBtn'),
            confirmModal: document.getElementById('confirmModal'),
            confirmModalTitle: document.getElementById('confirmModalTitle'),
            confirmModalMessage: document.getElementById('confirmModalMessage'),
            confirmModalCancel: document.getElementById('confirmModalCancel'),
            confirmModalConfirm: document.getElementById('confirmModalConfirm'),
            itemImageInput: document.getElementById('itemImage'),
        };
    },

    bindEventListeners() {
        this.elements.adminItemsContainer?.addEventListener('click', e => this.handlers.onItemAction(e));
        this.elements.itemForm?.addEventListener('submit', e => this.handlers.onFormSubmit(e));
        this.elements.addItemToggle?.addEventListener('click', () => this.ui.toggleForm());
        this.elements.clearFormBtn?.addEventListener('click', () => this.ui.clearForm());
        this.elements.adminSearch?.addEventListener('input', () => this.ui.render());
        this.elements.adminStatusFilter?.addEventListener('change', () => this.ui.render());
        this.elements.logoutBtn?.addEventListener('click', () => this.auth.logout());
        this.elements.passwordModalOpen?.addEventListener('click', () => this.ui.togglePasswordModal(true));
        this.elements.passwordModalClose?.forEach(btn => btn.addEventListener('click', () => this.ui.togglePasswordModal(false)));
        this.elements.passwordForm?.addEventListener('submit', e => this.handlers.onPasswordChange(e));
        this.elements.itemImageInput?.addEventListener('change', e => this.ui.previewImage(e.target));
    },

    async loadItems() {
        try {
            this.state.items = await this.api.getItems();
            this.ui.render();
        } catch (error) {
            this.ui.showNotification(error.message, 'error');
            if (error.message.includes('401') || error.message.includes('403')) {
                // If auth fails, don't just logout, redirect to login
                localStorage.removeItem('adminToken');
                window.location.href = '/admin-login';
            }
        }
    },

    auth: {
        getToken() { return localStorage.getItem('adminToken'); },
        getHeaders() { return { 'Authorization': `Bearer ${this.getToken()}` }; },
        checkAuth() { if (!this.getToken()) { window.location.href = '/admin-login'; return false; } return true; },
        async logout() {
            const confirmed = await AdminApp.ui.showConfirmation({
                title: 'Logout',
                message: 'Are you sure you want to logout from the admin panel?',
                confirmText: 'Logout',
                confirmClass: 'btn-danger'
            });
            if (confirmed) {
                localStorage.removeItem('adminToken');
                window.location.href = '/admin-login';
            }
        }
    },

    api: {
        async request(url, options = {}) {
            const headers = { ...AdminApp.auth.getHeaders(), ...options.headers };
            try {
                const response = await fetch(url, { ...options, headers });
                const result = await response.json().catch(() => ({ message: response.statusText }));
                if (!response.ok) throw new Error(result.error || result.message || `Request failed`);
                return result;
            } catch (error) {
                console.error("API request error:", error);
                throw new Error("A network error occurred.");
            }
        },
        getItems() { return this.request('/api/items'); },
        saveItem(method, url, formData) { return this.request(url, { method, body: formData }); },
        deleteItem(id) { return this.request(`/api/admin/items/${id}`, { method: 'DELETE' }); },
        updateStatus(id, newStatus) { return this.request(`/api/admin/items/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) }); },
        changePassword(currentPassword, newPassword) { return this.request('/api/admin/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword }) }); }
    },

    handlers: {
        async onItemAction(event) {
            const button = event.target.closest('button[data-action]');
            if (!button) return;
            const id = parseInt(button.dataset.id, 10);
            const action = button.dataset.action;

            if (action === 'edit') { AdminApp.ui.populateForm(id); } 
            else if (action === 'delete') {
                const confirmed = await AdminApp.ui.showConfirmation({ title: 'Delete Item?', message: 'This action cannot be undone. Are you absolutely sure?', confirmText: 'Yes, Delete', confirmClass: 'btn-danger' });
                if (confirmed) {
                    try {
                        await AdminApp.api.deleteItem(id);
                        AdminApp.state.items = AdminApp.state.items.filter(item => item.id !== id);
                        AdminApp.ui.render();
                        AdminApp.ui.showNotification('Item deleted!', 'success');
                    } catch (error) { AdminApp.ui.showNotification(error.message, 'error'); }
                }
            } else if (action === 'toggleStatus') {
                const item = AdminApp.state.items.find(i => i.id === id);
                if (!item) return;
                const newStatus = item.status === 'available' ? 'sold' : 'available';
                try {
                    await AdminApp.api.updateStatus(id, newStatus);
                    item.status = newStatus; // Optimistic update
                    AdminApp.ui.render();
                    AdminApp.ui.showNotification(`Item marked as ${newStatus}!`, 'success');
                } catch (error) { AdminApp.ui.showNotification(error.message, 'error'); }
            }
        },
        async onFormSubmit(event) {
            event.preventDefault();
            const { itemForm, submitBtn } = AdminApp.elements;
            if (!itemForm.checkValidity()) {
                AdminApp.ui.showNotification('Please fill out all required fields.', 'error');
                return itemForm.reportValidity();
            }
            submitBtn.disabled = true;
            const id = AdminApp.state.editingItemId;
            submitBtn.textContent = id ? 'Updating...' : 'Adding...';
            const formData = new FormData(itemForm);
            const method = id ? 'PUT' : 'POST';
            const url = id ? `/api/admin/items/${id}` : '/api/admin/items';
            try {
                await AdminApp.api.saveItem(method, url, formData);
                AdminApp.ui.showNotification(`Item ${id ? 'updated' : 'added'}!`, 'success');
                await AdminApp.loadItems();
                AdminApp.ui.toggleForm(false);
            } catch (error) {
                AdminApp.ui.showNotification(error.message, 'error');
            } finally {
                submitBtn.disabled = false;
            }
        },
        async onPasswordChange(event) {
            event.preventDefault();
            const { passwordForm, passwordSubmitBtn, passwordError } = AdminApp.elements;
            const currentPassword = passwordForm.elements.currentPassword.value;
            const newPassword = passwordForm.elements.newPassword.value;
            const confirmPassword = passwordForm.elements.confirmPassword.value;
            passwordError.style.display = 'none';
            if (newPassword.length < 6 || newPassword !== confirmPassword) {
                passwordError.textContent = 'New passwords must match and be at least 6 characters.';
                return passwordError.style.display = 'block';
            }
            passwordSubmitBtn.disabled = true;
            passwordSubmitBtn.textContent = 'Changing...';
            try {
                await AdminApp.api.changePassword(currentPassword, newPassword);
                AdminApp.ui.showNotification('Password changed successfully!', 'success');
                AdminApp.ui.togglePasswordModal(false);
            } catch (error) {
                passwordError.textContent = error.message;
                passwordError.style.display = 'block';
            } finally {
                passwordSubmitBtn.disabled = false;
                passwordSubmitBtn.textContent = 'Change Password';
            }
        }
    },

    ui: {
        render() {
            const { adminItemsContainer, adminSearch, adminStatusFilter } = AdminApp.elements;
            if (!adminItemsContainer) return;
            const searchTerm = adminSearch?.value.toLowerCase() || '';
            const statusFilter = adminStatusFilter?.value || '';
            const filtered = AdminApp.state.items
                .filter(item => (item.name.toLowerCase().includes(searchTerm)) && (!statusFilter || item.status === statusFilter))
                .sort((a, b) => new Date(b.date_added) - new Date(a.date_added));
            if (filtered.length === 0) {
                adminItemsContainer.innerHTML = '<div class="no-items" style="padding: 2rem; text-align: center; color: var(--color-text-muted);">No items found.</div>';
                return;
            }
            adminItemsContainer.innerHTML = filtered.map(this.templates.item).join('');
        },
        templates: {
            item(item) {
                const statusBtnText = item.status === 'available' ? 'Mark as Sold' : 'Mark as Available';
                const statusBtnClass = item.status === 'available' ? 'btn-warning' : 'btn-success';
                return `
                    <div class="admin-item" id="item-${item.id}">
                        <div class="admin-item-image">${item.image_url ? `<img src="${item.image_url}" alt="${item.name}">` : '📷'}</div>
                        <div class="admin-item-info">
                            <div class="admin-item-title">${item.name}</div>
                            <div class="admin-item-details">
                                <strong>$${parseFloat(item.price).toFixed(2)}</strong> • 
                                <span class="item-status ${item.status === 'available' ? 'status-available' : 'status-sold'}">${item.status}</span>
                            </div>
                        </div>
                        <div class="admin-item-actions">
                            <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${item.id}">Edit</button>
                            <button class="btn ${statusBtnClass} btn-sm" data-action="toggleStatus" data-id="${item.id}">${statusBtnText}</button>
                            <button class="btn btn-danger btn-sm" data-action="delete" data-id="${item.id}">Delete</button>
                        </div>
                    </div>`;
            }
        },
        populateForm(id) {
            const item = AdminApp.state.items.find(i => i.id === id);
            if (!item) return;
            this.toggleForm(true);
            AdminApp.state.editingItemId = id;
            const { itemForm, submitBtn } = AdminApp.elements;
            // Populate form from item data
            for (const key in item) {
                if (itemForm.elements[key]) {
                    itemForm.elements[key].value = item[key] ?? '';
                }
            }
            this.previewImage(null, item.image_url);
            submitBtn.textContent = 'Update Item';
        },
        clearForm() {
            AdminApp.elements.itemForm?.reset();
            AdminApp.elements.imagePreview.style.display = 'none';
            AdminApp.state.editingItemId = null;
            AdminApp.elements.submitBtn.textContent = 'Add Item';
        },
        toggleForm(forceShow = null) {
            const { addItemCard, addItemToggle } = AdminApp.elements;
            const isVisible = addItemCard.style.display === 'block';
            const show = forceShow !== null ? forceShow : !isVisible;
            if (show) {
                addItemCard.style.display = 'block';
                addItemToggle.textContent = AdminApp.state.editingItemId ? '✕ Cancel Edit' : '✕ Cancel';
                addItemToggle.className = 'btn btn-secondary';
                if (forceShow === true) { // only scroll if forced open (e.g., for editing)
                    addItemCard.scrollIntoView({ behavior: 'smooth' });
                }
            } else {
                addItemCard.style.display = 'none';
                addItemToggle.textContent = '+ Add New Item';
                addItemToggle.className = 'btn btn-primary';
                this.clearForm();
            }
        },
        previewImage(inputElement, existingUrl = null) {
            const { imagePreview } = AdminApp.elements;
            if (existingUrl) {
                imagePreview.src = existingUrl;
                imagePreview.style.display = 'block';
            } else if (inputElement?.files && inputElement.files[0]) {
                const reader = new FileReader();
                reader.onload = e => {
                    imagePreview.src = e.target.result;
                    imagePreview.style.display = 'block';
                };
                reader.readAsDataURL(inputElement.files[0]);
            } else if (!existingUrl) {
                imagePreview.style.display = 'none';
            }
        },
        togglePasswordModal(show) {
            const { passwordModal, passwordForm, passwordError } = AdminApp.elements;
            if (!passwordModal) return;
            if (show) {
                passwordModal.classList.add('is-visible');
                passwordForm.elements.currentPassword.focus();
            } else {
                passwordModal.classList.remove('is-visible');
                passwordForm.reset();
                if (passwordError) passwordError.style.display = 'none';
            }
        },
        showConfirmation({ title, message, confirmText = 'Confirm', confirmClass = 'btn-primary' }) {
            return new Promise(resolve => {
                const { confirmModal, confirmModalTitle, confirmModalMessage, confirmModalConfirm, confirmModalCancel } = AdminApp.elements;
                confirmModalTitle.textContent = title;
                confirmModalMessage.textContent = message;
                confirmModalConfirm.textContent = confirmText;
                confirmModalConfirm.className = `btn ${confirmClass}`;
                confirmModal.classList.add('is-visible');
                const cleanup = (result) => {
                    confirmModal.classList.remove('is-visible');
                    confirmModalConfirm.removeEventListener('click', confirmHandler);
                    confirmModalCancel.removeEventListener('click', cancelHandler);
                    resolve(result);
                };
                const confirmHandler = () => cleanup(true);
                const cancelHandler = () => cleanup(false);
                confirmModalConfirm.addEventListener('click', confirmHandler, { once: true });
                confirmModalCancel.addEventListener('click', cancelHandler, { once: true });
            });
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
            }, 4000);
        }
    }
};

// --- RUN THE APP ---
AdminApp.init();