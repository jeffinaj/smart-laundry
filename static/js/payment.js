const formatCurrency = (value) => {
  return `₹${Number(value || 0).toFixed(2)}`;
};

const getOrderIdFromPage = () => {
  const inputValue = document.getElementById("order-id")?.value;
  if (inputValue) return inputValue.trim();

  const path = window.location.pathname;
  const match = path.match(/\/payment\/([^\/\?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

let paymentRefreshTimer = null;
const startPaymentRefresh = (orderId) => {
  if (paymentRefreshTimer) {
    clearInterval(paymentRefreshTimer);
  }
  paymentRefreshTimer = setInterval(() => {
    loadTrackingDetails(orderId);
    loadLatestNotification();
  }, 10000);
};

const renderOrderSummary = (order) => {
  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };

  setText("order-id-value", order.order_id || `#${order.id}`);
  setText("order-type", order.type || "N/A");
  setText("order-quantity", order.quantity ?? "N/A");
  setText("order-weight", `${order.weight ?? 0} kg`);
  setText("order-delivery", order.delivery_type || "N/A");
  setText("total-amount", formatCurrency(order.amount));
  setText("order-discount", formatCurrency(order.discount ?? 0));
  setText("order-final-amount", formatCurrency(order.final_amount ?? order.amount));

  const statusText = document.getElementById("order-payment-status");
  if (statusText) {
    statusText.textContent = getStatusLabel(order.payment_status);
    statusText.className = `status-${order.payment_status}`;
  }

  const orderIdInput = document.getElementById("order-id");
  if (orderIdInput) {
    orderIdInput.value = order.order_id || order.id;
  }
};

const clearOrderSummary = () => {
  [
    "order-id-value",
    "order-type",
    "order-quantity",
    "order-weight",
    "order-delivery",
    "total-amount",
    "order-discount",
    "order-final-amount",
    "order-payment-status",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = "-";
  });
};

const loadOrderSummary = async () => {
  const orderId = getOrderIdFromPage();
  const payload = orderId ? { order_id: orderId } : {};

  try {
    const response = await fetch("/api/payment/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (result.success && result.order) {
      renderOrderSummary(result.order);
      updateActionState(result.order.payment_status);
      await loadTrackingDetails(result.order.id);
      await loadLatestNotification();
      startPaymentRefresh(result.order.id);
    } else {
      clearOrderSummary();
      const message = result.message || "Unable to find the latest unpaid order.";
      showNotification(message, "error");
    }
  } catch (error) {
    console.error("Error loading order summary:", error);
    clearOrderSummary();
    showNotification("Unable to load order summary. Please refresh.", "error");
  }
};

const setupPaymentMethodToggle = () => {
  const cardRadio = document.getElementById("card-option");
  const upiRadio = document.getElementById("upi-option");
  const codRadio = document.getElementById("cod-option");
  const upiFields = document.getElementById("upi-fields");

  if (!cardRadio || !upiRadio || !codRadio || !upiFields) return;

  const updateFields = () => {
    if (upiRadio.checked) {
      upiFields.classList.remove("hidden");
    } else {
      upiFields.classList.add("hidden");
    }
  };

  cardRadio.addEventListener("change", updateFields);
  upiRadio.addEventListener("change", updateFields);
  codRadio.addEventListener("change", updateFields);
  updateFields();
};

const simulateUpiPayment = async (upiId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(Math.random() < 0.95);
    }, 1500);
  });
};

const setupPaymentForm = () => {
  const form = document.getElementById("payment-form");
  const message = document.getElementById("payment-message");

  if (!form) return;

  const validator = new FormValidator(form);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const orderId = document.getElementById("order-id").value;
    const paymentMethod = document.querySelector("input[name='payment_method']:checked")?.value;
    const upiId = document.getElementById("upi-id")?.value.trim() || null;

    if (!orderId) {
      showNotification("Unable to process payment until the latest order is loaded.", "error");
      return;
    }

    if (!paymentMethod) {
      showNotification("Please select a payment method", "error");
      return;
    }

    if (paymentMethod === "upi" && !upiId) {
      showNotification("Please enter a valid UPI ID", "error");
      return;
    }

    const submitButton = form.querySelector("button[type='submit']");
    LoadingState.button(submitButton, true);

    try {
      if (paymentMethod === "upi") {
        const success = await simulateUpiPayment(upiId);
        if (!success) {
          throw new Error("UPI payment simulation failed. Please try again.");
        }
      }

      const response = await fetch("/api/payment/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          payment_method: paymentMethod,
          upi_id: paymentMethod === "upi" ? upiId : null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showNotification(result.message || "Payment processed successfully!", "success", 3000);
        updateActionState(result.payment_status || "paid");
        await loadTrackingDetails(orderId);
        await loadLatestNotification();
        setTimeout(() => {
          window.location.href = `/invoice/${orderId}`;
        }, 1400);
      } else {
        showNotification(result.message || "Payment processing failed", "error");
      }
    } catch (error) {
      console.error("Payment error:", error);
      showNotification(error.message || "Unable to process payment", "error");
    } finally {
      LoadingState.button(submitButton, false);
    }
  });
};

const loadPaymentHistory = async () => {
  const container = document.getElementById("payments-container");
  if (!container) return;

  LoadingState.show(container, "Loading payment history...");

  try {
    const response = await fetch("/api/payment/history");
    const result = await response.json();

    LoadingState.hide(container);

    if (!result.success || !Array.isArray(result.payments)) {
      showNotification("Failed to load payment history", "error");
      return;
    }

    const tbody = document.getElementById("payments-table-body");
    if (!tbody) return;

    if (result.payments.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center">
            <div class="empty-state">
              <p>No payments yet</p>
              <a href="/book" class="button btn-sm" style="margin-top: 1rem;">Book a Service</a>
            </div>
          </td>
        </tr>
      `;
      updatePaymentStats(0, 0, 0);
      return;
    }

    let totalPaid = 0;
    let completedCount = 0;
    let pendingCount = 0;

    tbody.innerHTML = result.payments
      .map((payment) => {
        const createdDate = new Date(payment.created_at).toLocaleDateString('en-IN');
        const statusClass = `status-${payment.payment_status}`;

        if (payment.payment_status === "completed") {
          totalPaid += Number(payment.amount);
          completedCount++;
        } else {
          pendingCount++;
        }

        return `
          <tr>
            <td>#${payment.order_id}</td>
            <td>${payment.booking_type}</td>
            <td>${formatCurrency(payment.amount)}</td>
            <td>
              <span class="badge badge-primary">${payment.payment_method.toUpperCase()}</span>
            </td>
            <td>
              <span class="order-status ${statusClass}">
                ${payment.payment_status.toUpperCase()}
              </span>
            </td>
            <td>${createdDate}</td>
            <td>
              <a href="/invoice/${payment.order_id}" class="link-button">View Invoice</a>
            </td>
          </tr>
        `;
      })
      .join("");

    updatePaymentStats(totalPaid, completedCount, pendingCount);
    showNotification("Payment history loaded", "success", 2000);

  } catch (error) {
    console.error("Error loading payment history:", error);
    LoadingState.hide(container);
    showNotification("Failed to load payment history", "error");
  }
};

const updatePaymentStats = (totalPaid, completed, pending) => {
  const totalElement = document.getElementById("stat-total-paid");
  const completedElement = document.getElementById("stat-completed");
  const pendingElement = document.getElementById("stat-pending");

  if (totalElement) totalElement.textContent = formatCurrency(totalPaid);
  if (completedElement) completedElement.textContent = completed;
  if (pendingElement) pendingElement.textContent = pending;
};

const getStatusLabel = (status) => {
  if (!status) return "Pending";
  return status.toUpperCase();
};

const updateActionState = (paymentStatus) => {
  const payButton = document.querySelector("#payment-form button[type='submit']");
  const statusText = document.getElementById("order-payment-status");

  if (statusText) {
    statusText.textContent = getStatusLabel(paymentStatus);
    statusText.className = `status-${paymentStatus}`;
  }

  if (paymentStatus === "paid" || paymentStatus === "completed") {
    if (payButton) {
      payButton.disabled = true;
      payButton.textContent = "Payment Completed";
      payButton.classList.add("button-disabled");
    }
  } else {
    if (payButton) {
      payButton.disabled = false;
      payButton.textContent = "Pay Now";
      payButton.classList.remove("button-disabled");
    }
  }
};

const fetchTrackingData = async (orderId) => {
  try {
    const response = await fetch(`/api/track/${orderId}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching tracking details:", error);
    return null;
  }
};

const loadTrackingDetails = async (orderId) => {
  const container = document.getElementById("tracking-status");
  const historySection = document.getElementById("tracking-history");
  const historyList = document.getElementById("tracking-history-list");

  if (!container) return;

  container.innerHTML = `<p>Loading tracking updates...</p>`;

  const data = await fetchTrackingData(orderId);
  if (!data || !data.success) {
    container.innerHTML = `<p>Unable to load tracking details.</p>`;
    if (historySection) historySection.classList.add("hidden");
    return;
  }

  const lastUpdate = data.tracking_history?.[data.tracking_history.length - 1];
  container.innerHTML = `
    <div class="tracking-summary-line">
      <span>Status</span>
      <strong>${data.order.status}</strong>
    </div>
    <div class="tracking-summary-line">
      <span>Payment</span>
      <strong>${getStatusLabel(data.order.payment_status)}</strong>
    </div>
    <div class="tracking-summary-line">
      <span>Latest</span>
      <strong>${lastUpdate ? lastUpdate.notes : "Awaiting confirmation"}</strong>
    </div>
  `;

  if (historySection && Array.isArray(data.tracking_history) && data.tracking_history.length) {
    historySection.classList.remove("hidden");
    historyList.innerHTML = data.tracking_history
      .slice(-4)
      .reverse()
      .map((item) => `<li><strong>${item.current_status}</strong> — ${item.notes || "Updated"} <span>${new Date(item.updated_time).toLocaleString()}</span></li>`)
      .join("");
  }
};

const loadLatestNotification = async () => {
  const panel = document.getElementById("notification-panel");
  const message = document.getElementById("notification-message");
  if (!panel || !message) return;

  try {
    const response = await fetch("/api/notifications");
    const data = await response.json();
    if (!data.success || !Array.isArray(data.notifications) || data.notifications.length === 0) {
      panel.classList.add("hidden");
      return;
    }

    const latest = data.notifications[0];
    panel.classList.remove("hidden");
    message.textContent = `${latest.title} — ${latest.message}`;
  } catch (error) {
    console.error("Error loading notification panel:", error);
    panel.classList.add("hidden");
  }
};

// ========================================
// INVOICE FUNCTIONALITY
// ========================================

const setupInvoicePage = () => {
  const printButton = document.getElementById('print-invoice');
  const downloadButton = document.getElementById('download-invoice');

  if (printButton) {
    printButton.addEventListener('click', () => {
      window.print();
    });
  }

  if (downloadButton) {
    downloadButton.addEventListener('click', () => {
      const orderId = window.location.pathname.split('/').pop();
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `invoice-${orderId}-${timestamp}.pdf`;
      
      // This would typically trigger a backend PDF generation endpoint
      fetch(`/api/invoice/${orderId}/download`)
        .then(response => {
          if (response.ok) {
            return response.blob();
          }
          throw new Error('Failed to download');
        })
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          showNotification('Invoice downloaded successfully', 'success');
        })
        .catch(error => {
          console.error('Download error:', error);
          showNotification('Failed to download invoice', 'error');
        });
    });
  }
};

window.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("/payment/")) {
    loadOrderSummary();
    setupPaymentMethodToggle();
    setupPaymentForm();
  } else if (window.location.pathname === "/payment-history") {
    loadPaymentHistory();
  } else if (window.location.pathname.includes("/invoice/")) {
    setupInvoicePage();
  }

  console.log('✓ Payment handlers initialized');
});
