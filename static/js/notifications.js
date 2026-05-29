// Notifications System

let allNotifications = [];
let currentFilter = 'all';
let notificationSearchTerm = '';

/**
 * Load all notifications for the user
 */
async function loadNotifications() {
    try {
        const response = await fetch('/api/notifications');
        const data = await response.json();

        if (data.success) {
            allNotifications = data.notifications;
            updateNotificationBadge(data.unread_count);
            renderNotifications();
            return true;
        } else {
            showNotification('Failed to load notifications', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
        showNotification('Failed to load notifications', 'error');
        return false;
    }
}

/**
 * Render notifications list based on current filter
 */
function renderNotifications() {
    const list = document.getElementById('notifications-list');
    const emptyState = document.getElementById('empty-state');

    if (!list) return;

    // Filter notifications
    let filtered = allNotifications;
    if (currentFilter === 'unread') {
        filtered = filtered.filter(n => !n.is_read);
    } else if (currentFilter !== 'all') {
        filtered = filtered.filter(n => n.type.includes(currentFilter));
    }

    if (notificationSearchTerm.trim()) {
        const query = notificationSearchTerm.trim().toLowerCase();
        filtered = filtered.filter(n => {
            return (
                n.title.toLowerCase().includes(query) ||
                n.message.toLowerCase().includes(query) ||
                n.type.toLowerCase().includes(query)
            );
        });
    }

    if (filtered.length === 0) {
        list.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    list.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';

    list.innerHTML = filtered.map(notif => `
        <div class="notification-card ${notif.is_read ? 'read' : 'unread'}">
            <div class="notification-content">
                <div class="notification-title">${escapeHtml(notif.title)}</div>
                <div class="notification-message">${escapeHtml(notif.message)}</div>
                <div class="notification-time">${formatDate(notif.created_at)}</div>
            </div>
            <div class="notification-actions">
                ${!notif.is_read ? `<button class="btn-icon" onclick="markAsRead(${notif.id})" title="Mark as read">✓</button>` : ''}
                <button class="btn-icon delete" onclick="deleteNotification(${notif.id})" title="Delete">✕</button>
            </div>
        </div>
    `).join('');
}

/**
 * Mark a notification as read
 */
async function markAsRead(notificationId) {
    try {
        const response = await fetch('/api/notifications/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notification_id: notificationId })
        });
        const data = await response.json();

        if (data.success) {
            const notif = allNotifications.find(n => n.id === notificationId);
            if (notif) {
                notif.is_read = 1;
            }
            loadNotifications();
            showNotification('Notification marked as read', 'success', 1500);
        } else {
            showNotification('Failed to mark as read', 'error');
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
        showNotification('Failed to mark as read', 'error');
    }
}

/**
 * Mark all notifications as read
 */
async function markAllAsRead() {
    try {
        const response = await fetch('/api/notifications/mark-all-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();

        if (data.success) {
            allNotifications.forEach(n => n.is_read = 1);
            loadNotifications();
            showNotification('All notifications marked as read', 'success', 2000);
        } else {
            showNotification('Failed to mark all as read', 'error');
        }
    } catch (error) {
        console.error('Error marking all as read:', error);
        showNotification('Failed to mark all as read', 'error');
    }
}

/**
 * Delete a notification
 */
async function deleteNotification(notificationId) {
    try {
        const response = await fetch(`/api/notifications/${notificationId}`, {
            method: 'DELETE'
        });
        const data = await response.json();

        if (data.success) {
            allNotifications = allNotifications.filter(n => n.id !== notificationId);
            renderNotifications();
            showNotification('Notification deleted', 'success', 1500);
        } else {
            showNotification('Failed to delete notification', 'error');
        }
    } catch (error) {
        console.error('Error deleting notification:', error);
        showNotification('Failed to delete notification', 'error');
    }
}

/**
 * Update notification badge count
 */
function updateNotificationBadge(count) {
    const badge = document.getElementById('notification-badge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count > 9 ? '9+' : count;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }
}

/**
 * Show a toast notification
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after 4 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

/**
 * Show a notification alert (centered modal style)
 */
function showNotificationAlert(title, message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `notification-alert ${type}`;
    alert.innerHTML = `
        <div class="alert-content">
            <div class="alert-title">${escapeHtml(title)}</div>
            <div class="alert-message">${escapeHtml(message)}</div>
            <button class="btn-primary" onclick="this.closest('.notification-alert').remove()">OK</button>
        </div>
    `;
    document.body.appendChild(alert);

    // Auto-close after 6 seconds
    setTimeout(() => {
        if (alert.parentNode) alert.remove();
    }, 6000);
}

/**
 * Initialize notification page
 */
function initNotificationsPage() {
    const page = document.querySelector('.notifications-page');
    if (!page) return;

    loadNotifications();

    // Setup filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.getAttribute('data-filter');
            renderNotifications();
        });
    });

    const searchInput = document.getElementById('notification-search');
    if (searchInput) {
        searchInput.addEventListener('input', (event) => {
            notificationSearchTerm = event.target.value;
            renderNotifications();
        });
    }

    // Setup mark all read button
    const markAllBtn = document.getElementById('mark-all-read-btn');
    if (markAllBtn) {
        markAllBtn.addEventListener('click', markAllAsRead);
    }

    // Refresh notifications every 30 seconds
    setInterval(loadNotifications, 30000);
}

/**
 * Initialize notification center (on dashboard/navbar)
 */
function initNotificationCenter() {
    const bell = document.getElementById('notification-bell');
    if (!bell) return;

    bell.addEventListener('click', () => {
        const center = document.getElementById('notification-center');
        if (center) {
            center.classList.toggle('open');
            if (center.classList.contains('open')) {
                loadNotificationsForCenter();
            }
        }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        const center = document.getElementById('notification-center');
        if (center && !center.contains(e.target) && e.target !== bell) {
            center.classList.remove('open');
        }
    });
}

/**
 * Load notifications for the notification center dropdown
 */
async function loadNotificationsForCenter() {
    try {
        const response = await fetch('/api/notifications');
        const data = await response.json();

        if (data.success) {
            renderNotificationCenter(data.notifications.slice(0, 5));
        }
    } catch (error) {
        console.error('Error loading notification center:', error);
    }
}

/**
 * Render notification center dropdown
 */
function renderNotificationCenter(notifications) {
    const content = document.getElementById('notification-center-content');
    if (!content) return;

    if (notifications.length === 0) {
        content.innerHTML = '<div class="empty-center">No new notifications</div>';
        return;
    }

    content.innerHTML = notifications.map(notif => `
        <div class="center-notification-item ${notif.is_read ? 'read' : 'unread'}">
            <div class="item-title">${escapeHtml(notif.title)}</div>
            <div class="item-message">${escapeHtml(notif.message)}</div>
            <div class="item-time">${formatDate(notif.created_at)}</div>
        </div>
    `).join('');

    // Add view all link
    content.innerHTML += '<div class="center-footer"><a href="/notifications">View All Notifications</a></div>';
}

/**
 * Format date/time for display
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initNotificationsPage();
    initNotificationCenter();
});
