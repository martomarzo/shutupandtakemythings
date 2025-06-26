// Admin panel functionality
let items = [];
let editingItemId = null;

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    // Mark as admin container for styling
    document.querySelector('.container').classList.add('admin-container');
    
    // Check authentication
    checkAuth();
    
    loadItems();
    setupFormHandler();
        initializeAdminAnimations();
    });

// Show password error in modal
function showPasswordError(message) {
    const errorDiv = document.getElementById('passwordError');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
};

// Toggle add item form visibility
function toggleAddForm() {
    const addCard = document.getElementById('addItemCard');
    const toggleBtn = document.getElementById('addItemToggle');
    
    if (!addCard || !toggleBtn) {
        console.error('Elements not found:', {addCard, toggleBtn});
        return;
    }
    
    if (addCard.style.display === 'none' || addCard.style.display === '') {
        addCard.style.display = 'block';
        toggleBtn.textContent = '✕ Cancel';
        toggleBtn.className = 'btn btn-secondary';
        
        // Scroll to form
        addCard.scrollIntoView({ behavior: 'smooth' });
        
        // If editing, update button text
        if (editingItemId) {
            toggleBtn.textContent = '✕ Cancel Edit';
        }
    } else {
        addCard.style.display = 'none';
        toggleBtn.textContent = '+ Add New Item';
        toggleBtn.className = 'btn btn-primary';
        
        // Clear form if canceling
        clearForm();
    }
}

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/admin-login';
        return;
    }
    
    // Verify token is still valid
    fetch('/api/admin/items', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            localStorage.removeItem('adminToken');
            window.location.href = '/admin-login';
        }
    })
    .catch(error => {
        console.error('Auth check failed:', error);
        localStorage.removeItem('adminToken');
        window.location.href = '/admin-login';
    });
}

// Get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('adminToken');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// Load items from API
async function loadItems() {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/items', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            items = await response.json();
            displayAdminItems();
        } else {
            showNotification('Error loading items. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error loading items:', error);
        showNotification('Error loading items. Please try again.', 'error');
    }
}

// Initialize admin animations
function initializeAdminAnimations() {
    // Add smooth transitions to form elements
    const formElements = document.querySelectorAll('input, textarea, select');
    formElements.forEach(element => {
        element.addEventListener('focus', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
        });
        
        element.addEventListener('blur', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    });
}

// Setup form submission handler
function setupFormHandler() {
    document.getElementById('itemForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        const formData = new FormData();
        
        // Add text fields
        formData.append('name', document.getElementById('itemName').value.trim());
        formData.append('price', document.getElementById('itemPrice').value);
        formData.append('category', document.getElementById('itemCategory').value);
        formData.append('description', document.getElementById('itemDescription').value.trim());
        formData.append('height', document.getElementById('itemHeight').value || '');
        formData.append('length', document.getElementById('itemLength').value || '');
        formData.append('depth', document.getElementById('itemDepth').value || '');
        formData.append('color', document.getElementById('itemColor').value.trim());
        formData.append('material', document.getElementById('itemMaterial').value.trim());
        formData.append('condition', document.getElementById('itemCondition').value);
        formData.append('notes', document.getElementById('itemNotes').value.trim());
        
        // Add image if present
        const imageFile = document.getElementById('itemImage').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }
        
        // Add status if editing
        if (editingItemId) {
            const existingItem = items.find(item => item.id === editingItemId);
            if (existingItem) {
                formData.append('status', existingItem.status);
            }
        }

        try {
            const url = editingItemId ? `/api/admin/items/${editingItemId}` : '/api/admin/items';
            const method = editingItemId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                showNotification(editingItemId ? 'Item updated successfully!' : 'Item added successfully!', 'success');
                clearForm();
                loadItems();
                editingItemId = null;
                
                // Hide the add form after successful submission
                const addCard = document.getElementById('addItemCard');
                addCard.style.display = 'none';
            } else {
                showNotification(result.error || 'Error saving item', 'error');
            }
        } catch (error) {
            console.error('Error saving item:', error);
            showNotification('Network error. Please try again.', 'error');
        }
    });
}

// Form validation
function validateForm() {
    const name = document.getElementById('itemName').value.trim();
    const price = document.getElementById('itemPrice').value;
    
    if (!name) {
        showNotification('Item name is required', 'error');
        return false;
    }
    
    if (!price || parseFloat(price) < 0) {
        showNotification('Valid price is required', 'error');
        return false;
    }
    
    return true;
}

// Clear form
function clearForm() {
    document.getElementById('itemForm').reset();
    document.getElementById('imagePreview').style.display = 'none';
    editingItemId = null;
    document.getElementById('submitBtn').textContent = 'Add Item';
    
    // Reset toggle button
    const toggleBtn = document.getElementById('addItemToggle');
    toggleBtn.textContent = '+ Add New Item';
    toggleBtn.className = 'btn btn-primary';
}

// Preview uploaded image
function previewImage() {
    const fileInput = document.getElementById('itemImage');
    const preview = document.getElementById('imagePreview');
    
    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(fileInput.files[0]);
    }
}

// Edit item
function editItem(id) {
    const item = items.find(item => item.id === id);
    if (!item) return;

    // Show the add form
    const addCard = document.getElementById('addItemCard');
    const toggleBtn = document.getElementById('addItemToggle');
    addCard.style.display = 'block';
    toggleBtn.textContent = '✕ Cancel Edit';
    toggleBtn.className = 'btn btn-secondary';

    // Fill form with item data
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemPrice').value = item.price;
    document.getElementById('itemCategory').value = item.category;
    document.getElementById('itemDescription').value = item.description || '';
    
    // Fill specification fields
    document.getElementById('itemHeight').value = item.height || '';
    document.getElementById('itemLength').value = item.length || '';
    document.getElementById('itemDepth').value = item.depth || '';
    document.getElementById('itemColor').value = item.color || '';
    document.getElementById('itemMaterial').value = item.material || '';
    document.getElementById('itemCondition').value = item.condition || 'excellent';
    document.getElementById('itemNotes').value = item.notes || '';
    
    if (item.image_url) {
        document.getElementById('imagePreview').src = item.image_url;
        document.getElementById('imagePreview').style.display = 'block';
    }

    editingItemId = id;
    document.getElementById('submitBtn').textContent = 'Update Item';
    
    // Scroll to form
    addCard.scrollIntoView({ behavior: 'smooth' });
}

// Delete item
async function deleteItem(id) {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`/api/admin/items/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const result = await response.json();

        if (response.ok) {
            showNotification('Item deleted successfully!', 'success');
            loadItems();
        } else {
            showNotification(result.error || 'Error deleting item', 'error');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

// Toggle item status
async function toggleStatus(id) {
    const item = items.find(item => item.id === id);
    if (!item) return;

    const newStatus = item.status === 'available' ? 'sold' : 'available';

    try {
        const response = await fetch(`/api/admin/items/${id}/status`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: newStatus })
        });

        const result = await response.json();

        if (response.ok) {
            showNotification(`Item marked as ${newStatus}!`, 'success');
            loadItems();
        } else {
            showNotification(result.error || 'Error updating item status', 'error');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

// Display items in admin panel
function displayAdminItems() {
    const container = document.getElementById('adminItems');
    const searchTerm = document.getElementById('adminSearch') ? document.getElementById('adminSearch').value.toLowerCase() : '';
    const statusFilter = document.getElementById('adminStatusFilter') ? document.getElementById('adminStatusFilter').value : '';

    let filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm) || 
                            (item.description && item.description.toLowerCase().includes(searchTerm));
        const matchesStatus = !statusFilter || item.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    if (filteredItems.length === 0) {
        container.innerHTML = '<div class="no-items"><p>No items found. Add your first item above!</p></div>';
        return;
    }

    // Sort by date added (newest first)
    filteredItems.sort((a, b) => new Date(b.date_added) - new Date(a.date_added));

    container.innerHTML = filteredItems.map(item => `
        <div class="admin-item">
            ${item.image_url ? 
                `<img src="${item.image_url}" alt="${item.name}" class="admin-item-image">` : 
                `<div class="admin-item-image">📷</div>`
            }
            <div class="admin-item-info">
                <div class="admin-item-title">${item.name}</div>
                <div class="admin-item-details">
                    <strong>$${parseFloat(item.price).toFixed(2)}</strong> • 
                    <span style="text-transform: capitalize;">${item.category}</span> • 
                    <span class="item-status ${item.status === 'available' ? 'status-available' : 'status-sold'}">
                        ${item.status}
                    </span><br>
                    ${formatSpecifications(item)} • 
                    Added: ${new Date(item.date_added).toLocaleDateString()}
                </div>
            </div>
            <div class="admin-item-actions">
                <button class="btn btn-secondary" onclick="editItem(${item.id})">Edit</button>
                <button class="btn ${item.status === 'available' ? 'btn-danger' : 'btn-success'}" 
                        onclick="toggleStatus(${item.id})">
                    Mark as ${item.status === 'available' ? 'Sold' : 'Available'}
                </button>
                <button class="btn btn-danger" onclick="deleteItem(${item.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// Format specifications for display
function formatSpecifications(item) {
    const specs = [];
    
    // Dimensions
    if (item.height || item.length || item.depth) {
        const dimensions = [];
        if (item.height) dimensions.push(`H: ${item.height}cm`);
        if (item.length) dimensions.push(`L: ${item.length}cm`);
        if (item.depth) dimensions.push(`D: ${item.depth}cm`);
        specs.push(dimensions.join(' × '));
    }
    
    // Color and material
    if (item.color) specs.push(item.color);
    if (item.material) specs.push(item.material);
    if (item.condition) specs.push(`Condition: ${item.condition.replace('-', ' ')}`);
    
    return specs.length > 0 ? specs.join(' • ') : 'No specifications';
}

// Filter admin items
function filterAdminItems() {
    displayAdminItems();
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin-login';
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin-login';
    }
}

// Open password change modal
function openPasswordModal() {
    document.getElementById('passwordModal').style.display = 'flex';
    document.getElementById('currentPassword').focus();
    
    // Clear any previous errors
    document.getElementById('passwordError').style.display = 'none';
    document.getElementById('passwordForm').reset();
}

// Close password change modal
function closePasswordModal() {
    document.getElementById('passwordModal').style.display = 'none';
    document.getElementById('passwordForm').reset();
    document.getElementById('passwordError').style.display = 'none';
}

// Setup password form handler
document.addEventListener('DOMContentLoaded', function() {
    // ... existing DOMContentLoaded code ...
    
    // Setup password form submission
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const errorDiv = document.getElementById('passwordError');
            const submitBtn = document.getElementById('passwordSubmitBtn');
            
            // Hide previous errors
            errorDiv.style.display = 'none';
            
            // Validation
            if (newPassword.length < 6) {
                showPasswordError('New password must be at least 6 characters long');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                showPasswordError('New passwords do not match');
                return;
            }
            
            if (currentPassword === newPassword) {
                showPasswordError('New password must be different from current password');
                return;
            }
            
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.textContent = 'Changing Password...';
            
            try {
                const response = await fetch('/api/admin/change-password', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        currentPassword: currentPassword,
                        newPassword: newPassword
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showNotification('Password changed successfully!', 'success');
                    closePasswordModal();
                } else {
                    showPasswordError(data.error || 'Error changing password');
                }
            } catch (error) {
                console.error('Error changing password:', error);
                showPasswordError('Network error. Please try again.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Change Password';
            }
        });
    }
    
    // Close modal when clicking outside
    document.getElementById('passwordModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closePasswordModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.getElementById('passwordModal').style.display === 'flex') {
            closePasswordModal();
        }
    });
});

// Setup password modal functionality
function setupPasswordModal() {
    // Setup password form submission
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const errorDiv = document.getElementById('passwordError');
            const submitBtn = document.getElementById('passwordSubmitBtn');
            
            // Hide previous errors
            errorDiv.style.display = 'none';
            
            // Validation
            if (newPassword.length < 6) {
                showPasswordError('New password must be at least 6 characters long');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                showPasswordError('New passwords do not match');
                return;
            }
            
            if (currentPassword === newPassword) {
                showPasswordError('New password must be different from current password');
                return;
            }
            
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.textContent = 'Changing Password...';
            
            try {
                const response = await fetch('/api/admin/change-password', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        currentPassword: currentPassword,
                        newPassword: newPassword
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showNotification('Password changed successfully!', 'success');
                    closePasswordModal();
                } else {
                    showPasswordError(data.error || 'Error changing password');
                }
            } catch (error) {
                console.error('Error changing password:', error);
                showPasswordError('Network error. Please try again.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Change Password';
            }
        });
    }
    
    // Close modal when clicking outside
    const passwordModal = document.getElementById('passwordModal');
    if (passwordModal) {
        passwordModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closePasswordModal();
            }
        });
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        document.body.removeChild(notification);
    });

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 1000;
        font-weight: 500;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 4 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }
    }, 4000);
}

// Auto-refresh items every 30 seconds
setInterval(() => {
    // Only refresh if not currently editing
    if (!editingItemId) {
        loadItems();
    }
}, 30000);

// Handle network status
window.addEventListener('online', () => {
    showNotification('Connection restored. Refreshing data...', 'success');
    loadItems();
});

window.addEventListener('offline', () => {
    showNotification('Connection lost. Some features may not work.', 'error');
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + S to save form
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const form = document.getElementById('itemForm');
        if (form) {
            form.dispatchEvent(new Event('submit'));
        }
    }
    
    // Escape to clear form or close modal
    if (e.key === 'Escape') {
        const passwordModal = document.getElementById('passwordModal');
        if (passwordModal && passwordModal.style.display === 'flex') {
            closePasswordModal();
        } else {
            clearForm();
        }
    }
});