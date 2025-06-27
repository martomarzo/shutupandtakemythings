/**
 * ===================================================================
 * Shut Up and Take My Money - LOGIN PAGE SCRIPT
 * ===================================================================
 */
const LoginApp = {
    elements: {},

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.run());
        } else {
            this.run();
        }
    },

    run() {
        console.log('Login App Initializing...');
        this.cacheDOMElements();
        this.checkExistingAuth();
        this.bindEventListeners();
    },

    cacheDOMElements() {
        this.elements = {
            loginForm: document.getElementById('loginForm'),
            errorMessage: document.getElementById('errorMessage'),
            loginBtn: document.getElementById('loginBtn'),
            loadingSpinner: document.getElementById('loadingSpinner'),
            btnText: document.getElementById('btnText'),
            usernameInput: document.getElementById('username'),
            passwordInput: document.getElementById('password'),
        };
    },

    bindEventListeners() {
        if (this.elements.loginForm) {
            this.elements.loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin();
            });
        }
    },

    async checkExistingAuth() {
        const token = localStorage.getItem('adminToken');
        if (token) {
            try {
                const response = await fetch('/api/admin/items', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    window.location.href = '/admin';
                } else {
                    localStorage.removeItem('adminToken');
                }
            } catch (error) {
                console.error('Auth check failed, token cleared.');
                localStorage.removeItem('adminToken');
            }
        }
    },
    
    async handleLogin() {
        const username = this.elements.usernameInput.value.trim();
        const password = this.elements.passwordInput.value;

        if (!username || !password) {
            this.ui.showMessage('Please enter both username and password.', 'error');
            return;
        }

        this.ui.setLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok && data.token) {
                localStorage.setItem('adminToken', data.token);
                this.ui.showMessage('Login successful! Redirecting...', 'success');
                setTimeout(() => { window.location.href = '/admin'; }, 1000);
            } else {
                this.ui.showMessage(data.error || 'Invalid username or password.', 'error');
                this.ui.shakeForm();
            }
        } catch (error) {
            this.ui.showMessage('Network error. Please try again.', 'error');
            this.ui.shakeForm();
        } finally {
            this.ui.setLoading(false);
        }
    },

    ui: {
        setLoading(isLoading) {
            const { loginBtn, loadingSpinner, btnText } = LoginApp.elements;
            if (loginBtn) loginBtn.disabled = isLoading;
            if (loadingSpinner) loadingSpinner.style.display = isLoading ? 'inline-block' : 'none';
            if (btnText) btnText.textContent = isLoading ? 'Verifying...' : 'Login';
        },
        showMessage(message, type = 'error') {
            const { errorMessage } = LoginApp.elements;
            errorMessage.textContent = message;
            errorMessage.className = `message ${type}`; // Use classes for styling
            errorMessage.style.display = 'block';
        },
        shakeForm() {
            const { loginForm } = LoginApp.elements;
            loginForm.classList.add('shake');
            setTimeout(() => loginForm.classList.remove('shake'), 500);
        }
    }
};

LoginApp.init();