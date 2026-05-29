// Analytics Module

let revenueChart, ordersChart, bookingsTrendChart, servicesChart, pricingChart;

// Color palettes
const chartColors = {
  primary: '#2563eb',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  secondary: '#8b5cf6',
  light: '#f3f4f6',
};

const chartGradient = (ctx, color) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, `${color}40`);
  gradient.addColorStop(1, `${color}00`);
  return gradient;
};

/**
 * Load all analytics data
 */
async function loadAnalyticsData() {
  try {
    // Load summary stats
    const summaryRes = await fetch('/api/analytics/summary');
    const summaryData = await summaryRes.json();
    
    if (summaryData.success) {
      updateSummaryStats(summaryData.summary);
    }

    // Load revenue data
    const revenueRes = await fetch('/api/analytics/revenue');
    const revenueData = await revenueRes.json();
    
    if (revenueData.success) {
      renderRevenueChart(revenueData);
    }

    // Load orders data
    const ordersRes = await fetch('/api/analytics/orders');
    const ordersData = await ordersRes.json();
    
    if (ordersData.success) {
      renderOrdersChart(ordersData);
    }

    // Load bookings trend
    const bookingsTrendRes = await fetch('/api/analytics/bookings-trend');
    const bookingsTrendData = await bookingsTrendRes.json();
    
    if (bookingsTrendData.success) {
      renderBookingsTrendChart(bookingsTrendData);
    }

    // Load services data
    const servicesRes = await fetch('/api/analytics/services');
    const servicesData = await servicesRes.json();
    
    if (servicesData.success) {
      renderServicesChart(servicesData);
      renderPricingChart(servicesData);
    }
  } catch (error) {
    console.error('Error loading analytics data:', error);
    showAnalyticsAlert('Error loading analytics data', error.message, 'error');
  }
}

/**
 * Update summary statistics cards
 */
function updateSummaryStats(stats) {
  const elements = {
    'stat-revenue': `$${stats.total_revenue.toFixed(2)}`,
    'stat-bookings': stats.total_bookings,
    'stat-completed': stats.completed_orders,
    'stat-active': stats.active_orders,
    'stat-users': stats.total_users,
    'stat-avg-order': `$${stats.avg_order_value.toFixed(2)}`
  };

  Object.keys(elements).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = elements[id];
  });
}

/**
 * Render revenue chart
 */
function renderRevenueChart(data) {
  const ctx = document.getElementById('revenueChart').getContext('2d');
  
  if (revenueChart) {
    revenueChart.destroy();
  }

  const gradient = chartGradient(ctx, chartColors.primary);

  revenueChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.months,
      datasets: [{
        label: 'Revenue',
        data: data.revenues,
        borderColor: chartColors.primary,
        backgroundColor: gradient,
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: chartColors.primary,
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: { size: 12, weight: '600' }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleFont: { size: 13, weight: '600' },
          bodyFont: { size: 12 },
          padding: 12,
          cornerRadius: 6,
          callbacks: {
            label: (context) => `$${context.parsed.y.toFixed(2)}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => `$${value.toFixed(0)}`,
            font: { size: 11 }
          },
          grid: {
            color: 'rgba(0,0,0,0.05)',
            drawBorder: false
          }
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 } }
        }
      }
    }
  });
}

/**
 * Render orders chart
 */
function renderOrdersChart(data) {
  const ctx = document.getElementById('ordersChart').getContext('2d');
  
  if (ordersChart) {
    ordersChart.destroy();
  }

  ordersChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.months,
      datasets: [
        {
          label: 'Total Orders',
          data: data.total_orders,
          backgroundColor: chartColors.primary,
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: 'Completed',
          data: data.completed,
          backgroundColor: chartColors.success,
          borderRadius: 6,
          borderSkipped: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: { size: 12, weight: '600' }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleFont: { size: 13, weight: '600' },
          bodyFont: { size: 12 },
          padding: 12,
          cornerRadius: 6,
          callbacks: {
            label: (context) => `${context.dataset.label}: ${context.parsed.y}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            font: { size: 11 }
          },
          grid: {
            color: 'rgba(0,0,0,0.05)',
            drawBorder: false
          }
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 } }
        }
      }
    }
  });
}

/**
 * Render bookings trend chart
 */
function renderBookingsTrendChart(data) {
  const ctx = document.getElementById('bookingsTrendChart').getContext('2d');
  
  if (bookingsTrendChart) {
    bookingsTrendChart.destroy();
  }

  bookingsTrendChart = new Chart(ctx, {
    type: 'area',
    data: {
      labels: data.months,
      datasets: [
        {
          label: 'Regular Bookings',
          data: data.regular,
          borderColor: chartColors.primary,
          backgroundColor: `${chartColors.primary}20`,
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: chartColors.primary,
        },
        {
          label: 'Express Bookings',
          data: data.express,
          borderColor: chartColors.warning,
          backgroundColor: `${chartColors.warning}20`,
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: chartColors.warning,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: { size: 12, weight: '600' }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleFont: { size: 13, weight: '600' },
          bodyFont: { size: 12 },
          padding: 12,
          cornerRadius: 6,
        },
        filler: {
          propagate: true
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          stacked: false,
          ticks: { font: { size: 11 } },
          grid: {
            color: 'rgba(0,0,0,0.05)',
            drawBorder: false
          }
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 } }
        }
      }
    }
  });
}

/**
 * Render services chart (bar chart)
 */
function renderServicesChart(data) {
  const ctx = document.getElementById('servicesChart').getContext('2d');
  
  if (servicesChart) {
    servicesChart.destroy();
  }

  // Use different colors for each service
  const colors = [
    chartColors.primary,
    chartColors.secondary,
    chartColors.success,
    chartColors.warning,
    chartColors.danger,
  ];

  servicesChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.services,
      datasets: [{
        label: 'Number of Bookings',
        data: data.counts,
        backgroundColor: colors.slice(0, data.services.length),
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: { size: 12, weight: '600' }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleFont: { size: 13, weight: '600' },
          bodyFont: { size: 12 },
          padding: 12,
          cornerRadius: 6,
          callbacks: {
            label: (context) => `${context.parsed.x} bookings`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { font: { size: 11 } },
          grid: {
            color: 'rgba(0,0,0,0.05)',
            drawBorder: false
          }
        },
        y: {
          grid: { display: false },
          ticks: { font: { size: 11 } }
        }
      }
    }
  });
}

/**
 * Render pricing chart
 */
function renderPricingChart(data) {
  const ctx = document.getElementById('pricingChart').getContext('2d');
  
  if (pricingChart) {
    pricingChart.destroy();
  }

  pricingChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: data.services,
      datasets: [{
        label: 'Average Price',
        data: data.avg_prices,
        borderColor: chartColors.primary,
        backgroundColor: `${chartColors.primary}20`,
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: chartColors.primary,
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: { size: 12, weight: '600' }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleFont: { size: 13, weight: '600' },
          bodyFont: { size: 12 },
          padding: 12,
          cornerRadius: 6,
          callbacks: {
            label: (context) => `$${context.parsed.r.toFixed(2)}`
          }
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          ticks: {
            callback: (value) => `$${value.toFixed(0)}`,
            font: { size: 10 }
          },
          grid: { color: 'rgba(0,0,0,0.1)' }
        }
      }
    }
  });
}

/**
 * Export analytics report
 */
async function exportReport() {
  try {
    const button = document.getElementById('export-report');
    button.disabled = true;
    button.textContent = '⏳ Generating...';

    // Fetch all chart images
    const revenueImg = revenueChart.toBase64Image();
    const ordersImg = ordersChart.toBase64Image();
    const bookingsImg = bookingsTrendChart.toBase64Image();
    const servicesImg = servicesChart.toBase64Image();
    const pricingImg = pricingChart.toBase64Image();

    // Get summary stats
    const summaryStats = {
      revenue: document.getElementById('stat-revenue').textContent,
      bookings: document.getElementById('stat-bookings').textContent,
      completed: document.getElementById('stat-completed').textContent,
      active: document.getElementById('stat-active').textContent,
      users: document.getElementById('stat-users').textContent,
      avgOrder: document.getElementById('stat-avg-order').textContent,
    };

    // Create HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Smart Laundry - Analytics Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #333;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          h1 {
            color: #2563eb;
            margin-bottom: 10px;
          }
          .date {
            color: #999;
            margin-bottom: 30px;
            font-size: 14px;
          }
          .summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 40px;
          }
          .summary-item {
            padding: 15px;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            background: #f9f9f9;
          }
          .summary-item p {
            margin: 0 0 5px 0;
            color: #666;
            font-size: 12px;
            font-weight: bold;
          }
          .summary-item h3 {
            margin: 0;
            color: #2563eb;
            font-size: 24px;
          }
          .chart-section {
            margin-bottom: 40px;
            page-break-inside: avoid;
          }
          .chart-section h2 {
            color: #333;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 10px;
          }
          .chart-section img {
            max-width: 100%;
            height: auto;
            border-radius: 6px;
            margin-top: 15px;
          }
          @media print {
            body { margin: 0; padding: 0; }
            .container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📊 Smart Laundry Analytics Report</h1>
          <p class="date">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>

          <h2>Summary Statistics</h2>
          <div class="summary">
            <div class="summary-item">
              <p>Total Revenue</p>
              <h3>${summaryStats.revenue}</h3>
            </div>
            <div class="summary-item">
              <p>Total Bookings</p>
              <h3>${summaryStats.bookings}</h3>
            </div>
            <div class="summary-item">
              <p>Completed Orders</p>
              <h3>${summaryStats.completed}</h3>
            </div>
            <div class="summary-item">
              <p>Active Orders</p>
              <h3>${summaryStats.active}</h3>
            </div>
            <div class="summary-item">
              <p>Total Users</p>
              <h3>${summaryStats.users}</h3>
            </div>
            <div class="summary-item">
              <p>Avg Order Value</p>
              <h3>${summaryStats.avgOrder}</h3>
            </div>
          </div>

          <div class="chart-section">
            <h2>Monthly Revenue Trend</h2>
            <img src="${revenueImg}" alt="Revenue Chart">
          </div>

          <div class="chart-section">
            <h2>Monthly Orders Overview</h2>
            <img src="${ordersImg}" alt="Orders Chart">
          </div>

          <div class="chart-section">
            <h2>Bookings Trend Analysis</h2>
            <img src="${bookingsImg}" alt="Bookings Trend">
          </div>

          <div class="chart-section">
            <h2>Top Services</h2>
            <img src="${servicesImg}" alt="Services Chart">
          </div>

          <div class="chart-section">
            <h2>Service Pricing Analysis</h2>
            <img src="${pricingImg}" alt="Pricing Chart">
          </div>

          <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px;">
            <p>This is an automated report generated by Smart Laundry Analytics System.</p>
          </footer>
        </div>
      </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    showAnalyticsAlert('Report Generated', 'Analytics report has been exported successfully', 'success');

    button.disabled = false;
    button.textContent = '📥 Export Report';
  } catch (error) {
    console.error('Error exporting report:', error);
    showAnalyticsAlert('Export Error', error.message, 'error');
    document.getElementById('export-report').disabled = false;
    document.getElementById('export-report').textContent = '📥 Export Report';
  }
}

/**
 * Show alert for analytics page
 */
function showAnalyticsAlert(title, message, type = 'info') {
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

  setTimeout(() => {
    if (alert.parentNode) alert.remove();
  }, 6000);
}

/**
 * Escape HTML
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

/**
 * Initialize analytics page
 */
function initAnalytics() {
  // Load data
  loadAnalyticsData();

  // Setup export button
  const exportBtn = document.getElementById('export-report');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportReport);
  }

  // Auto-refresh every 5 minutes
  setInterval(loadAnalyticsData, 300000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initAnalytics);
