// ============================================
// FOUNDIT - API HELPER (env-aware)
// ============================================

// ============ ENVIRONMENT DETECTION ============
const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'file:';

// ⚠️ AFTER DEPLOYMENT: change the URL below to your Render backend URL
const PROD_API_HOST = 'https://foundit-backend-tpoo.onrender.com';  // ← CHANGE THIS

const API_HOST = isLocalhost ? 'http://localhost:5001' : PROD_API_HOST;
const API_URL = `${API_HOST}/api`;
const SOCKET_URL = API_HOST;

// ============ XSS PROTECTION ============
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

// Sanitize URL (only allow http/https/data:image)
function safeUrl(url) {
    if (!url) return '';
    if (/^(https?:|data:image\/)/i.test(url)) return url;
    return '';
}

// ============ AUTH HELPERS ============
const getToken = () => localStorage.getItem('token');

const getUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

const saveAuth = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
};

const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
};

const requireAuth = () => {
    if (!getToken()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
};

// ============ API REQUEST ============
async function apiRequest(endpoint, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };

    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = { method, headers };
    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
    }

    return data;
}

// ============ TOAST NOTIFICATION ============
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}