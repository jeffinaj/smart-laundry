const adminShowMessage = (element, text, isSuccess = false) => {
  if (!element) return;
  element.textContent = text;
  element.style.color = isSuccess ? "#16a34a" : "#dc2626";
};

const adminFetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  return response.json();
};

const formatCurrency = (value) => {
  return `₹${Number(value || 0).toFixed(2)}`;
};

const setupAdminLogin = () => {
  const form = document.getElementById("admin-login-form");
  if (!form) return;

  // Initialize form validator
  const validator = new FormValidator(form);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const payload = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const button = form.querySelector("button[type='submit']");
    LoadingState.button(button, true);

    try {
      const result = await adminFetchJson("/admin/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (result.success) {
        if (result.admin_name) {
          sessionStorage.setItem("admin_name", result.admin_name);
        }
        showNotification("Login successful! Redirecting...", "success", 2000);
        setTimeout(() => (window.location.href = "/admin/dashboard"), 1500);
      } else {
        showNotification(result.message || "Invalid credentials", "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      showNotification("Unable to connect to server", "error");
    } finally {
      LoadingState.button(button, false);
    }
  });
};

const updateAdminCounters = (summary) => {
  document.getElementById("stat-revenue").textContent = formatCurrency(summary.total_revenue);
  document.getElementById("stat-orders").textContent = summary.total_orders;
  document.getElementById("stat-users").textContent = summary.total_users;
  const pending = summary.status_counts.find((item) => item.status === "Pickup Scheduled") || { count: 0 };
  document.getElementById("stat-pending").textContent = pending.count;
};

const renderAdminUsers = (users) => {
  const body = document.getElementById("users-table-body");
  if (!body) return;
  body.innerHTML = users
    .map(
      (user) => `
        <tr>
          <td>${user.id}</td>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>${user.phone}</td>
          <td>${new Date(user.created_at).toLocaleDateString()}</td>
          <td><button class="button button-secondary" type="button" onclick="deleteAdminUser(${user.id})">Delete</button></td>
        </tr>
      `
    )
    .join("");
};

const renderAdminOrders = (orders, statuses) => {
  const body = document.getElementById("orders-table-body");
  if (!body) return;
  body.innerHTML = orders
    .map((order) => {
      const options = statuses
        .map((status) => `<option value="${status}" ${status === order.status ? "selected" : ""}>${status}</option>`)
        .join("");
      return `
        <tr>
          <td>${order.id}</td>
          <td>${order.customer_name}</td>
          <td>${order.booking_type}</td>
          <td>${order.quantity}</td>
          <td>${formatCurrency(order.price)}</td>
          <td>
            <select id="order-status-${order.id}" class="form-control">
              ${options}
            </select>
          </td>
          <td>${new Date(order.created_at).toLocaleString()}</td>
          <td><button class="button button-secondary" type="button" onclick="updateOrderStatus(${order.id})">Update</button></td>
        </tr>
      `;
    })
    .join("");
};

const renderAdminServices = (services) => {
  const body = document.getElementById("services-table-body");
  if (!body) return;
  body.innerHTML = services
    .map(
      (service) => `
        <tr>
          <td>${service.name}</td>
          <td>${formatCurrency(service.price)}</td>
          <td>${service.express_multiplier.toFixed(2)}x</td>
          <td>
            <button class="button button-secondary" type="button" onclick="editService(${service.id}, '${service.name.replace(/'/g, "\\'")}', '${(service.description || "").replace(/'/g, "\\'")}', ${service.price}, ${service.express_multiplier})">Edit</button>
            <button class="button" type="button" onclick="deleteService(${service.id})">Delete</button>
          </td>
        </tr>
      `
    )
    .join("");
};

const renderAdminPayments = (payments) => {
  const body = document.getElementById("payments-table-body");
  if (!body) return;
  body.innerHTML = payments
    .slice(0, 10)
    .map(
      (payment) => `
        <tr>
          <td>#${payment.order_id}</td>
          <td>${payment.name}</td>
          <td>${formatCurrency(payment.amount)}</td>
          <td>${payment.payment_method.toUpperCase()}</td>
          <td><span class="status-${payment.payment_status}">${payment.payment_status}</span></td>
          <td>${new Date(payment.created_at).toLocaleDateString()}</td>
        </tr>
      `
    )
    .join("");
};

const loadAdminDashboard = async () => {
  const dashboard = document.getElementById("admin-dashboard");
  if (dashboard) {
    LoadingState.show(dashboard, "Loading dashboard data...");
  }

  try {
    const [summaryRes, usersRes, ordersRes, servicesRes, paymentsRes] = await Promise.all([
      adminFetchJson("/admin/api/summary"),
      adminFetchJson("/admin/api/users"),
      adminFetchJson("/admin/api/orders"),
      adminFetchJson("/admin/api/services"),
      adminFetchJson("/admin/api/payments"),
    ]);

    if (dashboard) {
      LoadingState.hide(dashboard);
    }

    if (summaryRes.success) {
      updateAdminCounters(summaryRes.summary);
      const adminName = summaryRes.admin_name || sessionStorage.getItem("admin_name") || "Administrator";
      const adminNameElement = document.getElementById("admin-name");
      if (adminNameElement) {
        adminNameElement.textContent = adminName;
      }
    }

    if (usersRes.success) {
      renderAdminUsers(usersRes.users);
    }

    if (ordersRes.success) {
      renderAdminOrders(ordersRes.orders, ordersRes.statuses || []);
    }

    if (servicesRes.success) {
      renderAdminServices(servicesRes.services);
    }

    if (paymentsRes.success) {
      renderAdminPayments(paymentsRes.payments);
      const totalPaymentsElement = document.getElementById("admin-total-payments");
      const totalCollectedElement = document.getElementById("admin-total-collected");
      if (totalPaymentsElement) {
        totalPaymentsElement.textContent = paymentsRes.summary.total_payments;
      }
      if (totalCollectedElement) {
        totalCollectedElement.textContent = formatCurrency(paymentsRes.summary.total_collected);
      }
    }

    showNotification("Dashboard updated successfully", "success", 2000);

  } catch (error) {
    console.error("Unable to load admin dashboard:", error);
    if (dashboard) {
      LoadingState.hide(dashboard);
    }
    showNotification("Failed to load dashboard", "error");
  }
};

const deleteAdminUser = async (userId) => {
  if (!window.confirm("Delete this user and all their orders?")) return;

  LoadingState.button(event?.target, true);

  try {
    const result = await adminFetchJson("/admin/api/users/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });

    if (result.success) {
      showNotification(result.message || "User deleted successfully", "success");
      await loadAdminDashboard();
    } else {
      showNotification(result.message || "Failed to delete user", "error");
    }
  } catch (error) {
    console.error("Delete user error:", error);
    showNotification("Unable to delete user", "error");
  } finally {
    LoadingState.button(event?.target, false);
  }
};

const updateOrderStatus = async (orderId) => {
  const select = document.getElementById(`order-status-${orderId}`);
  if (!select) return;

  LoadingState.button(event?.target, true);

  try {
    const result = await adminFetchJson("/admin/api/order-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId, status: select.value }),
    });

    if (result.success) {
      showNotification(result.message || "Order status updated", "success");
      await loadAdminDashboard();
    } else {
      showNotification(result.message || "Failed to update order", "error");
    }
  } catch (error) {
    console.error("Update order error:", error);
    showNotification("Unable to update order status", "error");
  } finally {
    LoadingState.button(event?.target, false);
  }
};

const deleteService = async (serviceId) => {
  if (!window.confirm("Delete this service?")) return;

  LoadingState.button(event?.target, true);

  try {
    const result = await adminFetchJson(`/admin/api/services/${serviceId}`, {
      method: "DELETE",
    });

    if (result.success) {
      showNotification(result.message || "Service deleted successfully", "success");
      await loadAdminDashboard();
      resetServiceForm();
    } else {
      showNotification(result.message || "Failed to delete service", "error");
    }
  } catch (error) {
    console.error("Delete service error:", error);
    showNotification("Unable to delete service", "error");
  } finally {
    LoadingState.button(event?.target, false);
  }
};

const editService = (id, name, description, price, expressMultiplier) => {
  const titleElement = document.getElementById("service-form-title");
  if (titleElement) {
    titleElement.textContent = "Edit Service";
  }

  document.getElementById("service-id").value = id;
  document.getElementById("service-name").value = name;
  document.getElementById("service-description").value = description;
  document.getElementById("service-price").value = price;
  document.getElementById("service-multiplier").value = expressMultiplier;

  // Scroll to form
  document.getElementById("service-form")?.scrollIntoView({ behavior: "smooth" });
};

const resetServiceForm = () => {
  const form = document.getElementById("service-form");
  if (form) {
    form.reset();
  }

  document.getElementById("service-id").value = "";
  document.getElementById("service-name").value = "";
  document.getElementById("service-description").value = "";
  document.getElementById("service-price").value = "";
  document.getElementById("service-multiplier").value = "1.25";

  const titleElement = document.getElementById("service-form-title");
  if (titleElement) {
    titleElement.textContent = "Add New Service";
  }
};

const setupServiceForm = () => {
  const form = document.getElementById("service-form");
  const resetButton = document.getElementById("service-reset");
  if (!form) return;

  // Initialize form validator
  const validator = new FormValidator(form);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const id = document.getElementById("service-id").value;
    const name = document.getElementById("service-name").value.trim();
    const description = document.getElementById("service-description").value.trim();
    const price = document.getElementById("service-price").value;
    const expressMultiplier = document.getElementById("service-multiplier").value;

    if (!name || !price) {
      showNotification("Service name and price are required", "error");
      return;
    }

    const button = form.querySelector("button[type='submit']");
    LoadingState.button(button, true);

    const url = id ? `/admin/api/services/${id}` : "/admin/api/services";
    const method = id ? "PUT" : "POST";

    try {
      const result = await adminFetchJson(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          price,
          express_multiplier: expressMultiplier
        }),
      });

      if (result.success) {
        showNotification(result.message || "Service saved successfully", "success");
        resetServiceForm();
        await loadAdminDashboard();
      } else {
        showNotification(result.message || "Failed to save service", "error");
      }
    } catch (error) {
      console.error("Service form error:", error);
      showNotification("Unable to save service", "error");
    } finally {
      LoadingState.button(button, false);
    }
  });

  if (resetButton) {
    resetButton.addEventListener("click", resetServiceForm);
  }
};

window.deleteAdminUser = deleteAdminUser;
window.updateOrderStatus = updateOrderStatus;
window.editService = editService;
window.deleteService = deleteService;

window.addEventListener("DOMContentLoaded", () => {
  setupAdminLogin();
  setupServiceForm();

  const refreshButton = document.getElementById("refresh-dashboard");
  if (refreshButton) {
    refreshButton.addEventListener("click", async () => {
      await loadAdminDashboard();
    });
  }

  // Load dashboard on admin pages
  if (document.getElementById("admin-name")) {
    loadAdminDashboard();

    // Auto-refresh every 60 seconds
    setInterval(loadAdminDashboard, 60000);
  }

  console.log('✓ Admin handlers initialized');
});
