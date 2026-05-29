// Utility functions
const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
};

const formatDate = (dateString) => {
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
};

const showMessage = (element, text, isSuccess = false) => {
  if (!element) return;
  element.textContent = text;
  element.style.color = isSuccess ? "#16a34a" : "#dc2626";
};

const postForm = async (url, payload) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.json();
};

let serviceRates = {
  regular: 5.5,
  delicate: 7.0,
  heavy: 9.0,
  premium: 11.5,
};

const loadServiceOptions = async () => {
  try {
    const response = await fetch("/api/services");
    const result = await response.json();
    if (!result.success || !Array.isArray(result.services)) return;
    const select = document.getElementById("service");
    if (!select) return;
    select.innerHTML = result.services
      .map(
        (service) => `
          <option value="${service.name}">${service.name} – ${formatCurrency(Number(service.price))}</option>
        `
      )
      .join("");

    serviceRates = result.services.reduce((acc, service) => {
      acc[service.name] = Number(service.price);
      return acc;
    }, serviceRates);
  } catch (error) {
    console.warn("Could not load service catalog:", error);
  }
};

const formatCurrency = (value) => {
  return `₹${Number(value || 0).toFixed(2)}`;
};

const validateSignup = (payload) => {
  if (!payload.name || payload.name.trim().length < 2) {
    return "Please enter your full name.";
  }
  if (!payload.email || !payload.email.includes("@")) {
    return "Please enter a valid email address.";
  }
  if (!payload.phone || !/^[0-9]{8,15}$/.test(payload.phone)) {
    return "Please enter a valid phone number with 8 to 15 digits.";
  }
  if (!payload.password || payload.password.length < 6) {
    return "Password must be at least 6 characters long.";
  }
  return null;
};

const validateLogin = (payload) => {
  if (!payload.email || !payload.email.includes("@")) {
    return "Please enter a valid email address.";
  }
  if (!payload.password || payload.password.length < 6) {
    return "Please enter your password.";
  }
  return null;
};

// ========================================
// BOOKING FORM HANDLER
// ========================================

const setupBookingFormLegacy = () => {
  const bookingForm = document.getElementById('booking-form');
  if (!bookingForm) return;

  // Initialize price calculator
  const priceCalculator = new PriceCalculator({
    basePrices: {
      'Standard Wash': 250,
      'Express Wash': 400,
      'Dry Clean': 600,
      'Iron & Fold': 100
    }
  });

  // Load service options
  loadServiceOptions();

  // Handle form submission
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const button = bookingForm.querySelector('button[type="submit"]');
    LoadingState.button(button, true);

    try {
      const formData = new FormData(bookingForm);
      const priceText = document.getElementById('price-total')?.textContent || '';
      let price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
      if (!price && window.priceCalculator) {
        const calculation = window.priceCalculator.getCalculation();
        price = calculation ? Number(calculation.total) : 0;
      }

      const payload = {
        customer_name: formData.get('customer_name'),
        phone_number: formData.get('phone_number'),
        booking_type: formData.get('service') || formData.get('booking_type'),
        service: formData.get('service'),
        quantity: parseInt(formData.get('quantity') || 1, 10),
        weight: parseFloat(formData.get('weight') || 0) || 0,
        pickup_date: formData.get('pickup_date'),
        pickup_address: formData.get('pickup_address'),
        delivery_type: formData.get('delivery_type') || 'Standard',
        express: formData.get('express_delivery') === 'on' || formData.get('express_delivery') === 'true' || formData.get('express_delivery') === '1',
        discount_code: formData.get('discount_code') || null,
        special_instructions: formData.get('special_instructions') || '',
        total_amount: price,
      };

      const response = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        try {
          localStorage.setItem('smartLaundryBookingCreated', JSON.stringify({ timestamp: Date.now(), order_id: result.order_id }));
        } catch (storageError) {
          console.warn('Unable to notify other tabs of new booking', storageError);
        }
        showNotification('Order booked successfully! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = `/payment/${result.order_id}`;
        }, 1500);
      } else {
        showNotification(result.message || 'Failed to book order', 'error');
      }
    } catch (error) {
      console.error('Booking error:', error);
      showNotification('Failed to process booking', 'error');
    } finally {
      LoadingState.button(button, false);
    }
  });
};

// ========================================
// SIGNUP FORM HANDLER
// ========================================

const setupSignupFormLegacy = () => {
  const signupForm = document.getElementById('signup-form');
  if (!signupForm) return;

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(signupForm);
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      password: formData.get('password')
    };

    // Validate
    const validationError = validateSignup(payload);
    if (validationError) {
      showNotification(validationError, 'error');
      return;
    }

    const button = signupForm.querySelector('button[type="submit"]');
    LoadingState.button(button, true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        showNotification('Account created successfully! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        showNotification(result.message || 'Signup failed', 'error');
      }
    } catch (error) {
      console.error('Signup error:', error);
      showNotification('Failed to create account', 'error');
    } finally {
      LoadingState.button(button, false);
    }
  });
};

// ========================================
// LOGIN FORM HANDLER
// ========================================

const setupLoginFormLegacy = () => {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(loginForm);
    const payload = {
      email: formData.get('email'),
      password: formData.get('password')
    };

    // Validate
    const validationError = validateLogin(payload);
    if (validationError) {
      showNotification(validationError, 'error');
      return;
    }

    const button = loginForm.querySelector('button[type="submit"]');
    LoadingState.button(button, true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        showNotification('Login successful! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        showNotification(result.message || 'Invalid credentials', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showNotification('Failed to login', 'error');
    } finally {
      LoadingState.button(button, false);
    }
  });
};

// ========================================
// TRACKING PAGE HANDLER
// ========================================

const setupTrackingPageLegacy = () => {
  const trackButton = document.getElementById('track-button');
  const trackingInput = document.getElementById('tracking-id');
  const trackingResult = document.getElementById('tracking-result');

  if (!trackButton || !trackingInput) return;

  const trackOrder = async () => {
    const orderId = trackingInput.value.trim();
    if (!orderId) {
      showNotification('Please enter an order ID', 'warning');
      return;
    }

    LoadingState.button(trackButton, true);

    try {
      const response = await fetch(`/api/track/${orderId}`);
      const data = await response.json();

      if (data.success) {
        displayTrackingInfo(data.order, trackingResult);
        showNotification('Order found!', 'success');
      } else {
        showNotification(data.message || 'Order not found', 'error');
      }
    } catch (error) {
      console.error('Tracking error:', error);
      showNotification('Failed to track order', 'error');
    } finally {
      LoadingState.button(trackButton, false);
    }
  };

  trackButton.addEventListener('click', trackOrder);
  trackingInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') trackOrder();
  });
};

const displayTrackingInfo = (order, container) => {
  if (!container) return;

  const statusMap = {
    placed: { icon: '📦', label: 'Order Placed' },
    processing: { icon: '⚙️', label: 'Processing' },
    ready: { icon: '✓', label: 'Ready for Pickup' },
    delivered: { icon: '🎉', label: 'Delivered' }
  };

  const statuses = ['placed', 'processing', 'ready', 'delivered'];
  const currentIndex = statuses.indexOf(order.status);

  const progressHtml = statuses.map((status, index) => {
    const { icon, label } = statusMap[status];
    const isActive = index === currentIndex;
    const isCompleted = index < currentIndex;

    return `
      <div class="progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}">
        <div class="step-icon">${icon}</div>
        <div class="step-label">${label}</div>
      </div>
    `;
  }).join('');

  const html = `
    <div class="tracking-summary">
      <div>
        <h2>Order #${order.id}</h2>
        <p>${order.service_type}</p>
      </div>
      <div class="status-pill">${order.status.toUpperCase()}</div>
    </div>
    <div class="progress-bar-wrapper">
      <div class="progress-steps">
        ${progressHtml}
      </div>
    </div>
    <div class="tracking-details">
      <div>
        <strong>Pickup Date:</strong>
        <span>${new Date(order.pickup_date).toLocaleDateString('en-IN')}</span>
      </div>
      <div>
        <strong>Delivery Date:</strong>
        <span>${new Date(order.delivery_date).toLocaleDateString('en-IN')}</span>
      </div>
      <div>
        <strong>Amount:</strong>
        <span>₹${order.amount}</span>
      </div>
      <div>
        <strong>Items:</strong>
        <span>${order.quantity} items</span>
      </div>
    </div>
  `;

  container.innerHTML = html;
  container.style.display = 'block';
};

// ========================================
// PAYMENT HANDLER
// ========================================

const setupPaymentFormLegacy = () => {
  const paymentForm = document.getElementById('payment-form');
  if (!paymentForm) return;

  // Handle payment method selection
  const methodRadios = paymentForm.querySelectorAll('input[name="method"]');
  methodRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const upiFields = document.querySelector('.upi-fields');
      if (e.target.value === 'upi') {
        upiFields?.classList.remove('hidden');
      } else {
        upiFields?.classList.add('hidden');
      }
    });
  });

  // Form submission
  paymentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(paymentForm);
    const payload = {
      order_id: formData.get('order-id'),
      method: formData.get('method'),
      upi_id: formData.get('upi-id')
    };

    const button = paymentForm.querySelector('button[type="submit"]');
    LoadingState.button(button, true);

    try {
      const response = await fetch('/api/payment/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        showNotification('Payment processed successfully!', 'success');
        setTimeout(() => {
          window.location.href = `/invoice/${result.order_id}`;
        }, 1500);
      } else {
        showNotification(result.message || 'Payment failed', 'error');
      }
    } catch (error) {
      console.error('Payment error:', error);
      showNotification('Failed to process payment', 'error');
    } finally {
      LoadingState.button(button, false);
    }
  });
};

// ========================================
// INITIALIZATION
// ========================================

const handleAuthSubmit = async (formId, url, messageId, successRedirect) => {
  const form = document.getElementById(formId);
  const message = document.getElementById(messageId);
  if (!form || !message) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    const validator = formId === "signup-form" ? validateSignup : validateLogin;
    const error = validator(payload);
    if (error) {
      showMessage(message, error);
      return;
    }

    showMessage(message, "Processing...");
    try {
      const result = await postForm(url, payload);
      if (result.success) {
        showMessage(message, result.message, true);
        setTimeout(() => {
          window.location.href = successRedirect;
        }, 800);
      } else {
        showMessage(message, result.message || "Something went wrong.");
      }
    } catch (error) {
      showMessage(message, "Unable to connect to the server.");
      console.error(error);
    }
  });
};

const setupLogout = () => {
  const logoutButton = document.getElementById("logout-button");
  if (!logoutButton) return;
  logoutButton.addEventListener("click", async () => {
    await fetch("/logout", { method: "POST" });
    window.location.href = "/login";
  });
};

const dashboardData = {
  orders: [
    { id: "#LY-1082", customer: "Mia Park", items: 4, status: "Processing", due: "Today 4:00 PM" },
    { id: "#LY-1083", customer: "Noah Lee", items: 2, status: "Pending", due: "Tomorrow" },
    { id: "#LY-1084", customer: "Ava Green", items: 8, status: "Completed", due: "Today 12:00 PM" },
    { id: "#LY-1085", customer: "Liam Cruz", items: 6, status: "Processing", due: "Today 7:30 PM" },
  ],
  activity: [
    { text: "Order #LY-1084 marked as completed.", time: "15 minutes ago" },
    { text: "New customer profile created for Ava Green.", time: "1 hour ago" },
    { text: "Pickup scheduled for Noah Lee.", time: "2 hours ago" },
  ],
  notifications: [
    { text: "Washer maintenance due tomorrow.", time: "Just now" },
    { text: "Payment confirmation received for customer Mia Park.", time: "3 hours ago" },
    { text: "New order request submitted.", time: "Yesterday" },
  ],
  statuses: [
    { label: "Wash progress", value: "81% complete" },
    { label: "Delivery ready", value: "3 orders" },
    { label: "Priority items", value: "2 orders" },
  ],
};

/**
 * Load and update dashboard notifications
 */
const loadDashboardNotifications = async () => {
  try {
    const response = await fetch('/api/notifications');
    const data = await response.json();

    if (data.success && data.notifications) {
      const notificationList = document.getElementById('notification-list');
      const notifStat = document.getElementById('stat-notifications');

      // Get first 5 notifications
      const recentNotifications = data.notifications.slice(0, 5);

      if (notificationList) {
        notificationList.innerHTML = recentNotifications.map(notif => `
          <li class="notification-item ${notif.is_read ? '' : 'unread'}">
            <p>${escapeHtml(notif.title)}</p>
            <span>${formatDate(notif.created_at)}</span>
          </li>
        `).join('');
      }

      if (notifStat) {
        notifStat.textContent = data.unread_count;
      }

      // Update notification badge
      updateNotificationBadge(data.unread_count);
    }
  } catch (error) {
    console.error('Error loading dashboard notifications:', error);
  }
};


const renderDashboardStats = (data) => {
  const activeOrders = document.getElementById("stat-active-orders");
  const completed = document.getElementById("stat-completed");
  const pickup = document.getElementById("stat-pickup");
  const notificationsStat = document.getElementById("stat-notifications");
  const ordersList = document.getElementById("orders-list");
  const activityList = document.getElementById("activity-list");
  const notificationList = document.getElementById("notification-list");
  const statusGrid = document.getElementById("status-grid");

  if (activeOrders) activeOrders.textContent = data.active_orders;
  if (completed) completed.textContent = data.completed_orders;
  if (pickup) pickup.textContent = data.pending_pickup;
  if (notificationsStat) notificationsStat.textContent = data.unread_notifications;

  if (ordersList) {
    ordersList.innerHTML = data.recent_orders
      .map(
        (order) => `
          <tr>
            <td>#${order.id}</td>
            <td>${escapeHtml(order.booking_type)}</td>
            <td>${order.quantity}</td>
            <td><span class="order-status status-${order.status.toLowerCase().replace(/\s+/g, '-')}">${escapeHtml(order.status)}</span></td>
            <td>${escapeHtml(order.pickup_date)}</td>
          </tr>
        `
      )
      .join("");
  }

  if (activityList) {
    activityList.innerHTML = data.activity.map(
      (item) => `
        <li class="activity-item">
          <p>${escapeHtml(item.text)}</p>
          <span>${escapeHtml(item.time)}</span>
        </li>
      `
    ).join("");
  }

  if (notificationList) {
    notificationList.innerHTML = data.recent_notifications.map(
      (item) => `
        <li class="notification-item ${item.is_read ? '' : 'unread'}">
          <p>${escapeHtml(item.title)}</p>
          <small>${escapeHtml(item.message)}</small>
          <span>${formatDate(item.created_at)}</span>
        </li>
      `
    ).join("");
  }

  if (statusGrid) {
    statusGrid.innerHTML = data.status_cards
      .map(
        (status) => `
          <div class="status-item">
            <strong>${escapeHtml(status.label)}</strong>
            <span>${escapeHtml(status.value)}</span>
          </div>
        `
      )
      .join("");
  }

  updateNotificationBadge(data.unread_notifications);
};

const loadDashboardStats = async () => {
  try {
    const response = await fetch("/api/dashboard");
    const result = await response.json();
    if (result.success) {
      renderDashboardStats(result);
    }
  } catch (error) {
    console.error("Error loading dashboard stats:", error);
  }
};

const loadUserGreeting = async () => {
  const greeting = document.getElementById("user-greeting");
  const nameField = document.getElementById("profile-name");
  const emailField = document.getElementById("profile-email");
  const phoneField = document.getElementById("profile-phone");
  if (!greeting) return;
  try {
    const response = await fetch("/api/user");
    const result = await response.json();
    if (result.success) {
      const user = result.user;
      greeting.textContent = `${user.name}`;
      if (nameField) nameField.textContent = user.name;
      if (emailField) emailField.textContent = user.email;
      if (phoneField) phoneField.textContent = user.phone;
      await loadDashboardStats();
      loadDashboardNotifications();
    } else {
      window.location.href = "/login";
    }
  } catch (error) {
    window.location.href = "/login";
  }
};

const initMobileMenu = () => {
  const toggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("nav-links");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    nav.classList.toggle("open");
  });
};

const handleReveal = () => {
  const elements = document.querySelectorAll(".reveal");
  const revealOnScroll = () => {
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 80) {
        el.classList.add("visible");
      }
    });
  };
  revealOnScroll();
  window.addEventListener("scroll", revealOnScroll);
};

const calculatePrice = (type, quantity, express, discountCode = '', weight = 0, deliveryType = 'Standard') => {
  const base = serviceRates[type] || serviceRates.regular || 5.5;
  const weightFee = Math.max(0, Number(weight)) * 20;
  const subtotal = base * quantity;

  let discountAmount = 0;
  if (discountCode === 'bulk' && quantity >= 5) {
    discountAmount = subtotal * 0.10;
  } else if (discountCode === 'loyalty') {
    discountAmount = subtotal * 0.05;
  } else if (discountCode === 'seasonal') {
    discountAmount = subtotal * 0.15;
  }

  const taxableAmount = subtotal + weightFee - discountAmount;
  const tax = taxableAmount * 0.05;
  const deliveryFee = deliveryType === 'Express' ? 75 : 50;
  let total = taxableAmount + tax + deliveryFee;

  if (express) {
    total *= 1.25;
  }

  return {
    subtotal,
    weightFee,
    discountAmount,
    tax,
    deliveryFee,
    total,
  };
};

const setupBookingForm = () => {
  const form = document.getElementById("booking-form");
  const typeInput = document.getElementById("service");
  const qtyInput = document.getElementById("quantity");
  const expressInput = document.getElementById("express_delivery");
  const discountSelect = document.getElementById("discount-code");
  const weightInput = document.getElementById("weight");
  const deliverySelect = document.getElementById("delivery_type");
  const customerNameInput = document.getElementById("customer_name");
  const phoneInput = document.getElementById("phone_number");
  const specialInstructions = document.getElementById("special_instructions");
  const priceOutput = document.getElementById("price-total");
  const message = document.getElementById("booking-message");

  if (!form || !typeInput || !qtyInput || !priceOutput) return;

  const updatePrice = () => {
    const type = typeInput.value;
    const quantity = parseInt(qtyInput.value, 10) || 0;
    const express = expressInput.checked;
    const discount = discountSelect?.value || '';
    const weight = parseFloat(weightInput?.value || '0') || 0;
    const deliveryType = deliverySelect?.value || 'Standard';

    const calculation = calculatePrice(type, quantity, express, discount, weight, deliveryType);

    document.getElementById('subtotal-amount').textContent = `₹${calculation.subtotal.toFixed(2)}`;
    document.getElementById('weight-amount').textContent = `₹${calculation.weightFee.toFixed(2)}`;
    document.getElementById('discount-amount').textContent = `₹${calculation.discountAmount.toFixed(2)}`;
    document.getElementById('tax-amount').textContent = `₹${calculation.tax.toFixed(2)}`;
    document.getElementById('delivery-amount').textContent = `₹${calculation.deliveryFee.toFixed(2)}`;
    priceOutput.textContent = `₹${calculation.total.toFixed(2)}`;

    return calculation.total;
  };

  loadServiceOptions().then(() => updatePrice());

  typeInput.addEventListener("change", updatePrice);
  qtyInput.addEventListener("input", updatePrice);
  weightInput?.addEventListener("input", updatePrice);
  expressInput.addEventListener("change", updatePrice);
  discountSelect?.addEventListener("change", updatePrice);
  deliverySelect?.addEventListener("change", updatePrice);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const bookingType = formData.get("service");
    const quantity = Number(formData.get("quantity") || 0);
    const pickupDate = formData.get("pickup_date");
    const pickupAddress = formData.get("pickup_address");
    const customerName = formData.get("customer_name").trim();
    const phoneNumber = formData.get("phone_number").trim();
    const specialNotes = formData.get("special_instructions").trim();
    const discountCode = formData.get("discount_code");
    const express = formData.get("express_delivery") === "on";
    const weight = Number(formData.get("weight") || 0);
    const deliveryType = formData.get("delivery_type") || 'Standard';
    const totalAmount = updatePrice();

    if (!customerName || !phoneNumber || !bookingType || quantity < 1 || !pickupDate || !pickupAddress) {
      message.style.color = "#dc2626";
      message.textContent = "Please complete all booking fields before submitting.";
      return;
    }

    if (!/^[0-9\s\-\+\(\)]{8,20}$/.test(phoneNumber)) {
      message.style.color = "#dc2626";
      message.textContent = "Please enter a valid phone number.";
      return;
    }

    message.style.color = "#111";
    message.textContent = "Submitting booking...";
    const payload = {
      customer_name: customerName,
      phone_number: phoneNumber,
      booking_type: bookingType,
      quantity,
      weight,
      delivery_type: deliveryType,
      discount_code: discountCode,
      pickup_date: pickupDate,
      pickup_address: pickupAddress,
      express: express,
      special_instructions: specialNotes,
      total_amount: totalAmount,
    };

    try {
      const result = await postForm("/api/book-laundry", payload);
      if (result.success) {
        showNotification("Booking placed successfully. Redirecting to payment...", "success");
        // refresh My Bookings section if present
        try{ if (window.refreshMyBookings) window.refreshMyBookings(); }catch(e){}
        try{ if (window.refreshPayments) window.refreshPayments(); }catch(e){}
        try{ if (window.refreshTracking) window.refreshTracking(result.booking_id); }catch(e){}
        setTimeout(() => {
          window.location.href = `/payment/${result.booking_id}`;
        }, 1200);
      } else {
        message.style.color = "#dc2626";
        message.textContent = result.message || "Booking failed.";
      }
    } catch (error) {
      message.style.color = "#dc2626";
      message.textContent = "Unable to connect to the server.";
      console.error(error);
    }
  });
};

const renderTrackResult = (data) => {
  const resultSection = document.getElementById("tracking-result");
  const orderId = document.getElementById("track-order-id");
  const orderType = document.getElementById("track-order-type");
  const orderQty = document.getElementById("track-order-qty");
  const orderPrice = document.getElementById("track-order-price");
  const orderStatus = document.getElementById("track-order-status");
  const pickupDate = document.getElementById("track-pickup-date");
  const pickupAddress = document.getElementById("track-pickup-address");
  const express = document.getElementById("track-express");
  const progressSteps = document.getElementById("progress-steps");
  const progressLine = document.getElementById("progress-line");

  if (!resultSection || !orderId) return;

  resultSection.hidden = false;
  orderId.textContent = `#${data.order.id}`;
  orderType.textContent = `Type: ${data.order.booking_type}`;
  orderQty.textContent = `Qty: ${data.order.quantity}`;
  orderPrice.textContent = `Total: ₹${Number(data.order.price).toFixed(2)}`;
  orderStatus.textContent = data.order.status;
  pickupDate.textContent = data.order.pickup_date;
  pickupAddress.textContent = data.order.pickup_address;
  express.textContent = data.order.express_delivery ? "Yes" : "No";

  const historySection = document.getElementById("tracking-history");
  const historyList = document.getElementById("tracking-history-list");
  if (historySection && historyList) {
    if (Array.isArray(data.tracking_history) && data.tracking_history.length) {
      historySection.hidden = false;
      historyList.innerHTML = data.tracking_history
        .map(
          (entry) => `
            <li>
              <span>${escapeHtml(entry.current_status)}</span>
              <small>${formatDate(entry.updated_time)}</small>
              <p>${escapeHtml(entry.notes || "No update note available.")}</p>
            </li>
          `
        )
        .join("");
    } else {
      historySection.hidden = true;
      historyList.innerHTML = "";
    }
  }

  progressSteps.innerHTML = data.stages
    .map((stage, index) => {
      const completed = index < data.stage_index;
      const active = index === data.stage_index;
      return `<div class="progress-step ${completed ? "completed" : ""} ${active ? "active" : ""}">${stage}</div>`;
    })
    .join("");

  if (progressLine) {
    progressLine.style.background = "linear-gradient(90deg, #2563eb 0%, #2563eb " + data.progress + "%, #e2e8f0 " + data.progress + "%, #e2e8f0 100%)";
  }
};

let trackingInterval = null;

const fetchTrackOrder = async (orderId) => {
  const message = document.getElementById("track-message");
  if (!orderId) return;
  try {
    const response = await fetch("/api/track-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId }),
    });
    const result = await response.json();
    if (result.success) {
      renderTrackResult(result);
      if (message) {
        message.textContent = "";
      }
    } else {
      if (message) {
        message.style.color = "#dc2626";
        message.textContent = result.message || "Order not found.";
      }
    }
  } catch (error) {
    if (message) {
      message.style.color = "#dc2626";
      message.textContent = "Unable to connect to the tracking service.";
    }
  }
};

const setupTrackForm = () => {
  const form = document.getElementById("track-form");
  const orderInput = document.getElementById("tracking-id");
  if (!form || !orderInput) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const orderId = orderInput.value.trim();
    if (!orderId) {
      const message = document.getElementById("track-message");
      if (message) {
        message.style.color = "#dc2626";
        message.textContent = "Please enter an order ID.";
      }
      return;
    }

    fetchTrackOrder(orderId);
    if (trackingInterval) {
      clearInterval(trackingInterval);
    }
    trackingInterval = setInterval(() => fetchTrackOrder(orderId), 10000);
  });
};

const setupDashboardRefresh = () => {
  const refreshButton = document.getElementById("refresh-dashboard");
  if (!refreshButton) return;
  refreshButton.addEventListener("click", () => {
    loadUserGreeting();
  });
};

window.addEventListener("DOMContentLoaded", () => {
  handleAuthSubmit("login-form", "/api/login", "login-message", "/dashboard");
  handleAuthSubmit("signup-form", "/api/signup", "signup-message", "/login");
  setupLogout();
  loadUserGreeting();
  initMobileMenu();
  setupBookingForm();
  setupTrackForm();
  setupDashboardRefresh();
  handleReveal();
});
