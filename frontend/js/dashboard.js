// ============================================
// FOUNDIT - DASHBOARD JAVASCRIPT
// ============================================

if (!requireAuth()) throw new Error('Not logged in');

const user = getUser();

document.getElementById('userName').textContent = user.name;
document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();
document.getElementById('userRole').textContent = user.role === 'admin' ? 'Administrator' : 'Student';

if (document.getElementById('topName')) {
    document.getElementById('topName').textContent = user.name;
    document.getElementById('topAvatar').textContent = user.name.charAt(0).toUpperCase();
    document.getElementById('topRole').textContent = user.role === 'admin' ? 'Administrator' : 'Student';
}

if (user.role === 'admin') {
    const adminSection = document.getElementById('adminSection');
    if (adminSection) adminSection.style.display = 'block';
}

document.querySelectorAll('.dash-sidebar-link').forEach(link => {
    if (link.dataset.page === 'dashboard') {
        link.classList.add('active');
    }
});

let allItems = [];
let currentFilter = 'all';
let currentCategory = 'all';

function animateCounter(el, target) {
    if (!el) return;
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 40));
    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        el.textContent = current.toLocaleString();
    }, 25);
}

async function loadStats() {
    try {
        const data = await apiRequest('/items/stats');
        const s = data.stats;

        const statsRow = document.getElementById('statsRow');
        if (!statsRow) return;

        statsRow.innerHTML = `
            <div class="dash-stat-card">
                <div class="dash-stat-icon blue">📦</div>
                <div>
                    <div class="dash-stat-value" id="stat-total">0</div>
                    <div class="dash-stat-label">Total Items</div>
                </div>
            </div>
            <div class="dash-stat-card">
                <div class="dash-stat-icon red">🔴</div>
                <div>
                    <div class="dash-stat-value" id="stat-lost">0</div>
                    <div class="dash-stat-label">Lost Items</div>
                </div>
            </div>
            <div class="dash-stat-card">
                <div class="dash-stat-icon green">🟢</div>
                <div>
                    <div class="dash-stat-value" id="stat-found">0</div>
                    <div class="dash-stat-label">Found Items</div>
                </div>
            </div>
            <div class="dash-stat-card">
                <div class="dash-stat-icon purple">✅</div>
                <div>
                    <div class="dash-stat-value" id="stat-resolved">0</div>
                    <div class="dash-stat-label">Resolved</div>
                </div>
            </div>
        `;

        setTimeout(() => {
            animateCounter(document.getElementById('stat-total'), s.totalItems || 0);
            animateCounter(document.getElementById('stat-lost'), s.totalLost || 0);
            animateCounter(document.getElementById('stat-found'), s.totalFound || 0);
            animateCounter(document.getElementById('stat-resolved'), s.resolved || 0);
        }, 100);
    } catch (error) {
        console.error('Stats error:', error);
    }
}

async function loadItems() {
    try {
        const data = await apiRequest('/items?limit=20');
        allItems = data.items || [];
        renderItems(allItems);
    } catch (error) {
        const container = document.getElementById('itemsContainer');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px; background: white; border-radius: 20px;">
                    <div style="font-size: 64px; margin-bottom: 16px;">❌</div>
                    <h3 style="font-family: 'Space Grotesk', sans-serif; font-size: 20px; margin-bottom: 8px;">Failed to load items</h3>
                    <p style="color: #64748b;">${escapeHtml(error.message)}</p>
                </div>
            `;
        }
    }
}

function getCategoryIcon(c) {
    const icons = {
        'Electronics': '📱',
        'Wallet': '👛',
        'ID Card': '🪪',
        'Books': '📚',
        'Clothing': '👕',
        'Accessories': '🕶️',
        'Other': '📦'
    };
    return icons[c] || '📦';
}

function timeAgo(date) {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + ' min ago';
    if (s < 86400) return Math.floor(s / 3600) + ' hours ago';
    if (s < 604800) return Math.floor(s / 86400) + ' days ago';
    return new Date(date).toLocaleDateString();
}

function renderItems(items) {
    const container = document.getElementById('itemsContainer');
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px; background: white; border-radius: 20px; border: 2px dashed #e2e8f0;">
                <div style="font-size: 64px; margin-bottom: 16px;">🔍</div>
                <h3 style="font-family: 'Space Grotesk', sans-serif; font-size: 20px; font-weight: 700; margin-bottom: 8px;">No items found</h3>
                <p style="color: #64748b;">Be the first one to report an item!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="dash-items-grid">
            ${items.map(item => `
                <div class="dash-item-card" onclick="viewItem('${item._id}')">
                    <div class="dash-item-image">
                        ${item.imageUrl 
                            ? `<img src="${safeUrl(item.imageUrl)}" alt="">` 
                            : `<span style="font-size: 60px;">${getCategoryIcon(item.category)}</span>`}
                        <span class="dash-item-badge ${item.type}">${item.type}</span>
                        <button class="dash-item-fav" onclick="event.stopPropagation(); toggleFav(this)">🤍</button>
                    </div>
                    <div class="dash-item-body">
                        <div class="dash-item-title">${escapeHtml(item.title)}</div>
                        <div class="dash-item-meta">
                            <div class="dash-item-meta-row">📍 ${escapeHtml(item.location)}</div>
                            <div class="dash-item-meta-row">🕐 ${timeAgo(item.createdAt)}</div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function filterItems(type, btn) {
    currentFilter = type;
    document.querySelectorAll('.dash-filter-chip').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    applyFilters();
}

function applyCategoryFilter() {
    const el = document.getElementById('categoryFilter');
    if (el) currentCategory = el.value;
    applyFilters();
}

function applyFilters() {
    const searchEl = document.getElementById('searchInput');
    const search = searchEl ? searchEl.value.toLowerCase() : '';
    let filtered = allItems;

    if (currentFilter !== 'all') {
        filtered = filtered.filter(i => i.type === currentFilter);
    }

    if (currentCategory !== 'all') {
        filtered = filtered.filter(i => i.category === currentCategory);
    }

    if (search) {
        filtered = filtered.filter(i =>
            (i.title && i.title.toLowerCase().includes(search)) ||
            (i.description && i.description.toLowerCase().includes(search)) ||
            (i.location && i.location.toLowerCase().includes(search))
        );
    }

    renderItems(filtered);
}

const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
}

function viewItem(id) {
    window.location.href = `item-details.html?id=${id}`;
}

function toggleFav(btn) {
    if (!btn) return;
    btn.textContent = btn.textContent === '🤍' ? '❤️' : '🤍';
}

loadStats();
loadItems();