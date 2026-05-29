/**
 * Smart Laundry System - Advanced JavaScript Utilities
 * Comprehensive functionality for form validation, notifications, dark mode, and more
 */

// ========================================
// FORM VALIDATION MODULE
// ========================================

class FormValidator {
  constructor(formElement) {
    this.form = formElement;
    this.errors = {};
    this.setupEventListeners();
  }

  setupEventListeners() {
    if (!this.form) return;

    // Real-time validation on input change
    const inputs = this.form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('change', () => this.validateField(input));
    });

    // Form submission
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  validateField(field) {
    const { name, value, type } = field;
    let error = null;

    // Required field validation
    if (field.hasAttribute('required') && !value.trim()) {
      error = `${this.getFieldLabel(field)} is required`;
    }

    // Email validation
    if (type === 'email' && value) {
      if (!this.isValidEmail(value)) {
        error = 'Please enter a valid email address';
      }
    }

    // Phone validation
    if (type === 'tel' && value) {
      if (!this.isValidPhone(value)) {
        error = 'Please enter a valid phone number';
      }
    }

    // Password validation
    if (type === 'password' && value) {
      if (value.length < 6) {
        error = 'Password must be at least 6 characters';
      }
    }

    // Password match validation
    if (field.name === 'confirm-password' && value) {
      const passwordField = this.form.querySelector('input[name="password"]');
      if (passwordField && passwordField.value !== value) {
        error = 'Passwords do not match';
      }
    }

    // Min/Max validation
    if (type === 'number') {
      const min = field.getAttribute('min');
      const max = field.getAttribute('max');
      const numValue = parseFloat(value);
      if (min && numValue < parseFloat(min)) {
        error = `Value must be at least ${min}`;
      }
      if (max && numValue > parseFloat(max)) {
        error = `Value must be at most ${max}`;
      }
    }

    // Update error display
    this.setFieldError(field, error);
    return !error;
  }

  validateAll() {
    const inputs = this.form.querySelectorAll('input, textarea, select');
    let isValid = true;

    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });

    return isValid;
  }

  setFieldError(field, error) {
    const fieldGroup = field.closest('.form-group');
    if (!fieldGroup) return;

    // Remove existing error message
    const existingError = fieldGroup.querySelector('.form-error');
    if (existingError) {
      existingError.remove();
    }

    if (error) {
      fieldGroup.classList.add('has-error');
      field.classList.add('is-invalid');
      field.classList.remove('is-valid');

      const errorElement = document.createElement('span');
      errorElement.className = 'form-error';
      errorElement.textContent = error;
      fieldGroup.appendChild(errorElement);

      this.errors[field.name] = error;
    } else {
      fieldGroup.classList.remove('has-error');
      fieldGroup.classList.add('has-success');
      field.classList.remove('is-invalid');
      field.classList.add('is-valid');
      delete this.errors[field.name];
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhone(phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]{8,15}$/;
    return phoneRegex.test(phone);
  }

  getFieldLabel(field) {
    const label = this.form.querySelector(`label[for="${field.id}"]`);
    return label ? label.textContent.trim() : field.name;
  }

  handleSubmit(e) {
    if (!this.validateAll()) {
      e.preventDefault();
      showNotification('Please fix the errors above', 'error');
    }
  }

  clearErrors() {
    this.errors = {};
    const fieldGroups = this.form.querySelectorAll('.form-group');
    fieldGroups.forEach(group => {
      group.classList.remove('has-error', 'has-success');
      const input = group.querySelector('input, textarea, select');
      if (input) {
        input.classList.remove('is-invalid', 'is-valid');
      }
      const errorMsg = group.querySelector('.form-error');
      if (errorMsg) {
        errorMsg.remove();
      }
    });
  }
}

// ========================================
// NOTIFICATION SYSTEM
// ========================================

const NotificationQueue = {
  queue: [],
  timeout: null,

  show(message, type = 'info', duration = 3000) {
    const id = Date.now();
    const notification = document.createElement('div');
    notification.className = `notification-toast show ${type}`;
    notification.id = `toast-${id}`;
    notification.textContent = this.getIcon(type) + ' ' + message;
    
    document.body.appendChild(notification);
    this.queue.push(id);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }

    return id;
  },

  remove(id) {
    const element = document.getElementById(`toast-${id}`);
    if (element) {
      element.classList.remove('show');
      setTimeout(() => element.remove(), 300);
      this.queue = this.queue.filter(i => i !== id);
    }
  },

  getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || 'ℹ';
  }
};

function showNotification(message, type = 'info', duration = 3000) {
  return NotificationQueue.show(message, type, duration);
}

// ========================================
// PRICE CALCULATION MODULE
// ========================================

class PriceCalculator {
  constructor(config = {}) {
    this.basePrices = {
      standard: 250,
      express: 400,
      premium: 600,
      dryclean: 750,
      iron: 100,
      ...config.basePrices
    };

    this.discounts = {
      bulk: 0.10,      // 10% for 5+ items
      loyalty: 0.05,   // 5% loyalty discount
      seasonal: 0.15,  // 15% seasonal offer
      ...config.discounts
    };

    this.taxes = 0.05; // 5% tax
    this.deliveryFee = 50;

    this.setupListeners();
  }

  setupListeners() {
    const serviceSelect = document.getElementById('service');
    const quantityInput = document.getElementById('quantity');
    const discountSelect = document.getElementById('discount-code');
    const expressCheckbox = document.getElementById('express_delivery');

    if (serviceSelect) {
      serviceSelect.addEventListener('change', () => this.calculate());
    }
    if (quantityInput) {
      quantityInput.addEventListener('change', () => this.calculate());
      quantityInput.addEventListener('input', () => this.calculate());
    }
    if (discountSelect) {
      discountSelect.addEventListener('change', () => this.calculate());
    }
    if (expressCheckbox) {
      expressCheckbox.addEventListener('change', () => this.calculate());
    }
  }

  calculate() {
    const serviceSelect = document.getElementById('service');
    const quantityInput = document.getElementById('quantity');
    const discountSelect = document.getElementById('discount-code');
    const expressCheckbox = document.getElementById('express_delivery');

    if (!serviceSelect) return;

    const service = serviceSelect.value;
    const quantity = parseInt(quantityInput?.value || 1);
    const discountCode = discountSelect?.value || null;
    const express = expressCheckbox?.checked || false;

    let subtotal = (this.basePrices[service] || 250) * quantity;
    let discountAmount = 0;

    if (discountCode && this.discounts[discountCode]) {
      discountAmount = subtotal * this.discounts[discountCode];
    }

    if (!discountAmount && quantity >= 5) {
      discountAmount = subtotal * this.discounts.bulk;
    }

    const taxableAmount = subtotal - discountAmount;
    const tax = taxableAmount * this.taxes;
    let total = taxableAmount + tax + this.deliveryFee;

    if (express) {
      total *= 1.25;
    }

    this.updateDisplay({
      subtotal: subtotal.toFixed(2),
      discount: discountAmount.toFixed(2),
      tax: tax.toFixed(2),
      delivery: this.deliveryFee.toFixed(2),
      total: total.toFixed(2)
    });

    return { subtotal, discountAmount, tax, total };
  }

  updateDisplay(prices) {
    const elements = {
      subtotal: 'subtotal-amount',
      discount: 'discount-amount',
      tax: 'tax-amount',
      delivery: 'delivery-amount',
      total: 'price-total'
    };

    Object.entries(elements).forEach(([key, id]) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = `₹${prices[key]}`;
      }
    });

    const totalAmount = document.getElementById('total-amount');
    if (totalAmount) {
      totalAmount.textContent = `₹${prices.total}`;
    }
  }

  getCalculation() {
    return this.calculate();
  }
}

// ========================================
// SIDEBAR TOGGLE MODULE
// ========================================

class SidebarToggle {
  constructor() {
    this.sidebar = document.querySelector('.sidebar');
    this.overlay = document.querySelector('[data-sidebar-overlay]');
    this.toggleButton = document.querySelector('[data-sidebar-toggle]');
    this.closeButton = document.querySelector('[data-sidebar-close]');

    this.setupEventListeners();
    this.loadState();
  }

  setupEventListeners() {
    if (this.toggleButton) {
      this.toggleButton.addEventListener('click', () => this.toggle());
    }

    if (this.closeButton) {
      this.closeButton.addEventListener('click', () => this.close());
    }

    if (this.overlay) {
      this.overlay.addEventListener('click', () => this.close());
    }

    // Close on small screens when a link is clicked
    if (this.sidebar) {
      const links = this.sidebar.querySelectorAll('a');
      links.forEach(link => {
        link.addEventListener('click', () => {
          if (window.innerWidth < 768) {
            this.close();
          }
        });
      });
    }

    // Handle window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768) {
        this.open();
      }
    });
  }

  toggle() {
    if (this.sidebar?.classList.contains('active')) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (this.sidebar) {
      this.sidebar.classList.add('active');
      if (this.overlay) {
        this.overlay.style.display = 'block';
        this.overlay.style.opacity = '1';
        this.overlay.style.visibility = 'visible';
      }
      localStorage.setItem('sidebar-open', 'true');
    }
  }

  close() {
    if (this.sidebar) {
      this.sidebar.classList.remove('active');
      if (this.overlay) {
        this.overlay.style.opacity = '0';
        this.overlay.style.visibility = 'hidden';
        this.overlay.style.display = 'none';
      }
      localStorage.setItem('sidebar-open', 'false');
    }
  }

  loadState() {
    const isOpen = localStorage.getItem('sidebar-open') !== 'false';
    if (isOpen && window.innerWidth >= 768) {
      this.open();
    } else {
      this.close();
    }
  }
}

// ========================================
// DARK MODE MODULE
// ========================================

class DarkMode {
  constructor() {
    this.htmlElement = document.documentElement;
    this.toggleButton = document.querySelector('[data-dark-mode-toggle]');
    this.currentTheme = this.getTheme();

    this.setupEventListeners();
    this.apply();
  }

  setupEventListeners() {
    if (this.toggleButton) {
      this.toggleButton.addEventListener('click', () => this.toggle());
    }

    // Listen for system theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
          this.currentTheme = e.matches ? 'dark' : 'light';
          this.apply();
        }
      });
    }
  }

  getTheme() {
    // Check localStorage first
    const stored = localStorage.getItem('theme');
    if (stored) return stored;

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }

  toggle() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.apply();
  }

  apply() {
    if (this.currentTheme === 'dark') {
      this.htmlElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark-mode');
    } else {
      this.htmlElement.setAttribute('data-theme', 'light');
      document.body.classList.remove('dark-mode');
    }

    localStorage.setItem('theme', this.currentTheme);
    this.updateToggleButton();
  }

  updateToggleButton() {
    if (this.toggleButton) {
      const icon = this.currentTheme === 'dark' ? '☀️' : '🌙';
      this.toggleButton.textContent = icon;
      this.toggleButton.setAttribute('aria-label', `Switch to ${this.currentTheme === 'dark' ? 'light' : 'dark'} mode`);
    }
  }
}

// ========================================
// LOADING ANIMATIONS MODULE
// ========================================

class LoadingState {
  static show(element, message = 'Loading...') {
    if (!element) return;

    const loader = document.createElement('div');
    loader.className = 'loader-overlay';
    loader.innerHTML = `
      <div class="loader-content">
        <div class="loader lg"></div>
        <p class="loader-text">${message}</p>
      </div>
    `;

    element.style.position = 'relative';
    element.appendChild(loader);
    return loader;
  }

  static hide(element) {
    if (!element) return;
    const loader = element.querySelector('.loader-overlay');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => loader.remove(), 300);
    }
  }

  static hideAll() {
    document.querySelectorAll('.loader-overlay').forEach(loader => {
      loader.style.opacity = '0';
      setTimeout(() => loader.remove(), 300);
    });
  }

  static button(button, loading = true) {
    if (!button) return;

    if (loading) {
      button.disabled = true;
      button.classList.add('btn-loading');
      button.dataset.originalText = button.textContent;
      button.textContent = 'Loading...';
    } else {
      button.disabled = false;
      button.classList.remove('btn-loading');
      button.textContent = button.dataset.originalText || 'Submit';
    }
  }
}

// ========================================
// SEARCH & FILTER MODULE
// ========================================

class SearchFilter {
  constructor(config) {
    this.config = {
      searchInput: null,
      resultsList: null,
      filterButtons: null,
      debounceDelay: 300,
      minChars: 2,
      ...config
    };

    this.debounceTimer = null;
    this.allItems = [];
    this.filteredItems = [];
    this.currentFilter = 'all';

    this.setupEventListeners();
  }

  setupEventListeners() {
    const searchInput = document.querySelector(this.config.searchInput);
    const filterButtons = document.querySelectorAll(this.config.filterButtons);

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          this.search(e.target.value);
        }, this.config.debounceDelay);
      });
    }

    if (filterButtons.length) {
      filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.filter(btn.dataset.filter);
          this.updateActiveFilter(btn);
        });
      });
    }
  }

  setItems(items) {
    this.allItems = items;
    this.filteredItems = items;
  }

  search(query) {
    if (query.length < this.config.minChars) {
      this.filteredItems = this.allItems;
    } else {
      const lowerQuery = query.toLowerCase();
      this.filteredItems = this.allItems.filter(item => {
        return JSON.stringify(item).toLowerCase().includes(lowerQuery);
      });
    }

    this.render();
  }

  filter(filterType) {
    this.currentFilter = filterType;
    if (filterType === 'all') {
      this.filteredItems = this.allItems;
    } else {
      this.filteredItems = this.allItems.filter(item => {
        return item.type === filterType || item.category === filterType;
      });
    }
    this.render();
  }

  updateActiveFilter(button) {
    document.querySelectorAll(this.config.filterButtons).forEach(btn => {
      btn.classList.remove('active');
    });
    button.classList.add('active');
  }

  render() {
    const container = document.querySelector(this.config.resultsList);
    if (!container) return;

    if (this.filteredItems.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No items found</p></div>';
      return;
    }

    container.innerHTML = this.filteredItems.map(item => this.renderItem(item)).join('');
  }

  renderItem(item) {
    // Override this method in subclasses
    return `<div class="item">${item.name}</div>`;
  }
}

// ========================================
// ORDER TRACKING MODULE
// ========================================

class OrderTracker {
  constructor() {
    this.trackButton = document.querySelector('[data-track-order]');
    this.trackingInput = document.getElementById('tracking-id');
    this.trackingResult = document.getElementById('tracking-result');

    this.setupEventListeners();
  }

  setupEventListeners() {
    if (this.trackButton) {
      this.trackButton.addEventListener('click', () => this.trackOrder());
    }

    if (this.trackingInput) {
      this.trackingInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.trackOrder();
        }
      });
    }
  }

  async trackOrder() {
    const orderId = this.trackingInput?.value.trim();
    if (!orderId) {
      showNotification('Please enter an order ID', 'warning');
      return;
    }

    LoadingState.button(this.trackButton, true);

    try {
      const response = await fetch(`/api/track/${orderId}`);
      const data = await response.json();

      if (data.success) {
        this.displayTracking(data.order, data.stages, data.stage_index, data.tracking_history);
        showNotification('Order found!', 'success');
        this.trackMessage('', 'success');
      } else {
        this.trackResult(false);
        this.trackMessage(data.message || 'Order Not Found', 'error');
      }
    } catch (error) {
      console.error('Tracking error:', error);
      showNotification('Failed to track order', 'error');
      this.trackResult(false);
      this.trackMessage('Failed to track order', 'error');
    } finally {
      LoadingState.button(this.trackButton, false);
    }
  }

  trackMessage(message, type = 'info') {
    const messageNode = document.getElementById('track-message');
    if (!messageNode) return;
    messageNode.textContent = message;
    messageNode.className = `booking-message ${type}`;
  }

  trackResult(show) {
    if (!this.trackingResult) return;
    this.trackingResult.hidden = !show;
  }

  displayTracking(order, stages = [], stageIndex = 0, trackingHistory = []) {
    if (!this.trackingResult) return;

    const statusSteps = this.getStatusSteps(order.status || 'Pending');
    const stepsHtml = statusSteps.map((step, index) => `
      <div class="progress-step ${step.active ? 'active' : ''} ${step.completed ? 'completed' : ''}">
        <div class="step-icon">${step.icon}</div>
        <div class="step-label">${step.label}</div>
        <div class="step-date">${step.date || ''}</div>
      </div>
    `).join('');

    const historyItems = (trackingHistory || [])
      .map((item) => `<li><strong>${item.current_status}</strong> — ${item.notes || 'Updated'} <span>${new Date(item.updated_time).toLocaleString()}</span></li>`)
      .join('');

    const html = `
      <div class="tracking-summary">
        <div>
          <p class="eyebrow">Order details</p>
          <h2 id="track-order-id">#${order.order_id || order.id}</h2>
        </div>
        <div class="tracking-info">
          <span id="track-order-type">Type: ${order.booking_type || order.laundry_type || 'N/A'}</span>
          <span id="track-order-qty">Qty: ${order.quantity ?? 'N/A'}</span>
          <span id="track-order-price">Total: ₹${Number(order.price || order.total_amount || 0).toFixed(2)}</span>
        </div>
      </div>

      <div class="progress-bar-wrapper">
        <div class="progress-steps">
          ${stepsHtml}
        </div>
      </div>

      <div class="tracking-details">
        <div><strong>Status:</strong> <span id="track-order-status">${(order.status || 'Pending').toUpperCase()}</span></div>
        <div><strong>Pickup date:</strong> <span id="track-pickup-date">${order.pickup_date || 'N/A'}</span></div>
        <div><strong>Address:</strong> <span id="track-pickup-address">${order.pickup_address || 'N/A'}</span></div>
        <div><strong>Express:</strong> <span id="track-express">${order.express_delivery ? 'Yes' : 'No'}</span></div>
      </div>
      <div class="tracking-history" id="tracking-history" ${historyItems ? '' : 'hidden'}>
        <h3>Tracking history</h3>
        <ul id="tracking-history-list" class="tracking-history-list">
          ${historyItems || '<li>No history available yet.</li>'}
        </ul>
      </div>
    `;

    this.trackingResult.innerHTML = html;
    this.trackingResult.style.display = 'block';
    this.trackingResult.hidden = false;
  }

  getStatusSteps(currentStatus) {
    const statuses = ['Pending', 'Pickup Scheduled', 'Washing', 'Drying', 'Ironing', 'Out for Delivery', 'Delivered'];
    const statusIcons = {
      'Pending': '⏳',
      'Pickup Scheduled': '🛻',
      'Washing': '🧼',
      'Drying': '💨',
      'Ironing': '👔',
      'Out for Delivery': '🚚',
      'Delivered': '✅'
    };

    return statuses.map((status) => ({
      label: status,
      icon: statusIcons[status] || '•',
      active: status === currentStatus,
      completed: statuses.indexOf(status) < statuses.indexOf(currentStatus),
      date: null
    }));
  }
}

// ========================================
// DYNAMIC ORDER UPDATES MODULE
// ========================================

class OrderUpdater {
  constructor() {
    this.ordersContainer = document.querySelector('[data-orders-container]');
    this.refreshButton = document.querySelector('[data-refresh-orders]');
    this.autoRefreshInterval = null;

    this.setupEventListeners();
    this.startAutoRefresh();
  }

  setupEventListeners() {
    if (this.refreshButton) {
      this.refreshButton.addEventListener('click', () => this.refresh());
    }
  }

  startAutoRefresh(interval = 30000) {
    this.autoRefreshInterval = setInterval(() => {
      this.refresh();
    }, interval);
  }

  stopAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
  }

  async refresh() {
    if (!this.ordersContainer) return;

    LoadingState.show(this.ordersContainer, 'Updating orders...');

    try {
      const response = await fetch('/api/orders');
      const data = await response.json();

      if (data.success) {
        this.updateOrders(data.orders);
      }
    } catch (error) {
      console.error('Failed to refresh orders:', error);
    } finally {
      LoadingState.hide(this.ordersContainer);
    }
  }

  updateOrders(orders) {
    if (!this.ordersContainer) return;

    const html = orders.map(order => `
      <tr>
        <td>#${order.id}</td>
        <td>${order.service}</td>
        <td>${this.formatDate(order.date)}</td>
        <td>₹${order.amount}</td>
        <td>
          <span class="order-status status-${order.status}">
            ${order.status.toUpperCase()}
          </span>
        </td>
      </tr>
    `).join('');

    this.ordersContainer.innerHTML = html;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

// ========================================
// MODAL & DIALOG MODULE
// ========================================

class Modal {
  constructor(selector) {
    this.modal = document.querySelector(selector);
    this.overlay = this.modal?.querySelector('.modal-overlay');
    this.closeButton = this.modal?.querySelector('.modal-close');
    this.backdrop = this.modal?.querySelector('[role="dialog"]');

    this.setupEventListeners();
  }

  setupEventListeners() {
    if (this.closeButton) {
      this.closeButton.addEventListener('click', () => this.close());
    }

    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) {
          this.close();
        }
      });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });
  }

  open() {
    if (this.modal) {
      this.modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  close() {
    if (this.modal) {
      this.modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  isOpen() {
    return this.modal?.classList.contains('open') || false;
  }

  toggle() {
    this.isOpen() ? this.close() : this.open();
  }
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize dark mode
  window.darkMode = new DarkMode();

  // Initialize sidebar toggle
  window.sidebarToggle = new SidebarToggle();

  // Initialize form validators
  document.querySelectorAll('form').forEach(form => {
    if (!form.classList.contains('no-validation')) {
      new FormValidator(form);
    }
  });

  // Initialize price calculator
  if (document.getElementById('service')) {
    window.priceCalculator = new PriceCalculator();
  }

  // Initialize order tracker
  if (document.getElementById('tracking-id')) {
    window.orderTracker = new OrderTracker();
  }

  // Initialize order updater
  if (document.querySelector('[data-orders-container]')) {
    window.orderUpdater = new OrderUpdater();
  }

  console.log('✓ Advanced JavaScript modules initialized');
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FormValidator,
    NotificationQueue,
    showNotification,
    PriceCalculator,
    SidebarToggle,
    DarkMode,
    LoadingState,
    SearchFilter,
    OrderTracker,
    OrderUpdater,
    Modal
  };
}
