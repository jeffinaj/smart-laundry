const MyBookings = (() => {
  // Fallback helpers if globals are not present
  const formatCurrency = (v)=>{ try { if(window.formatCurrency) return window.formatCurrency(v); } catch(e){} return (typeof v==='number'?('₹'+v.toFixed(2)):('₹'+Number(v||0).toFixed(2))); };
  const showNotification = (msg, type='info', timeout=3000)=>{ if(window.showNotification){ return window.showNotification(msg,type,timeout);} try{ alert(msg); }catch(e){} };

  const state = { bookings: [], originalBookings: [], searchQuery: '', statusFilter: '' };

  const el = (id) => document.getElementById(id);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      if (data.success) {
        state.originalBookings = data.bookings || [];
        applyFilters();
        renderAll();
      }
    } catch (err) {
      console.error('Failed to load bookings', err);
    }
  };

  const renderCards = () => {
    const container = el('bookings-cards');
    if (!container) return;
    container.innerHTML = state.bookings
      .map(b => `
        <article class="card booking-card">
          <div class="card-row">
            <div><strong>${b.order_id || '#'+b.booking_id}</strong> <div class="muted">${b.created_at ? new Date(b.created_at).toLocaleString() : 'Unknown date'}</div></div>
            <div>
              <div><strong>${b.customer_name}</strong></div>
              <div>${b.phone}</div>
              <div>${b.pickup_address || ''}</div>
            </div>
            <div>${b.laundry_type}</div>
            <div>${b.quantity} items</div>
            <div>${b.weight} kg</div>
            <div>${b.pickup_date}</div>
            <div>${b.delivery_type}</div>
            <div>${b.discount ? 'Discount: '+formatCurrency(b.discount) : 'No discount'}</div>
            <div>${formatCurrency(b.total_amount)}</div>
            <div>${formatCurrency(b.final_amount)}</div>
            <div>${b.payment_status}</div>
            <div><span class="status-pill">${b.order_status}</span></div>
            <div>
              <button class="button" data-edit="${b.booking_id}">Edit</button>
              <button class="button button-secondary" data-cancel="${b.booking_id}">Cancel</button>
              <button class="button button-danger" data-delete="${b.booking_id}">Delete</button>
            </div>
          </div>
        </article>
      `).join('');
  };

  const renderTable = () => {
    const tbody = el('bookings-table-body');
    if (!tbody) return;
    tbody.innerHTML = state.bookings.map(b => `
      <tr>
        <td>${b.order_id || '#'+b.booking_id}</td>
        <td>${b.customer_name}</td>
        <td>${b.phone}</td>
        <td>${b.laundry_type}</td>
        <td>${b.quantity}</td>
        <td>${b.weight}</td>
        <td>${b.pickup_address || ''}</td>
        <td>${b.pickup_date}</td>
        <td>${b.delivery_type}</td>
        <td>${b.discount ? formatCurrency(b.discount) : '—'}</td>
        <td>${formatCurrency(b.total_amount)}</td>
        <td>${b.payment_status}</td>
        <td><span class="status-badge">${b.order_status}</span></td>
        <td>${b.created_at ? new Date(b.created_at).toLocaleString() : '—'}</td>
        <td>
          <button class="button" data-edit="${b.booking_id}">Edit</button>
          <button class="button button-secondary" data-cancel="${b.booking_id}">Cancel</button>
          <button class="button button-danger" data-delete="${b.booking_id}">Delete</button>
        </td>
      </tr>
    `).join('');
  };

  const renderAll = () => {
    renderCards();
    renderTable();
    attachHandlers();
  };

  const attachHandlers = () => {
    document.querySelectorAll('[data-edit]').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.getAttribute('data-edit');
        openEditModal(parseInt(id, 10));
      };
    });
    document.querySelectorAll('[data-cancel]').forEach(btn => {
      btn.onclick = async (e) => {
        const id = e.currentTarget.getAttribute('data-cancel');
        if (!confirm('Cancel this booking?')) return;
        await cancelBooking(parseInt(id, 10));
      };
    });
    document.querySelectorAll('[data-delete]').forEach(btn => {
      btn.onclick = async (e) => {
        const id = e.currentTarget.getAttribute('data-delete');
        if (!confirm('Delete this booking? This cannot be undone.')) return;
        await cancelBooking(parseInt(id, 10));
      };
    });
  };

  const openEditModal = (bookingId) => {
    const booking = state.bookings.find(b => b.booking_id === bookingId);
    if (!booking) return;
    el('edit-booking-id').textContent = `#${bookingId}`;
    el('edit-pickup-date').value = booking.pickup_date ? booking.pickup_date.split('T')[0] : '';
    el('edit-pickup-address').value = booking.pickup_address || '';
    el('edit-laundry-type').value = booking.laundry_type || '';
    el('edit-quantity').value = booking.quantity || 1;
    el('booking-edit-modal').style.display = 'block';
    el('booking-edit-modal').dataset.current = bookingId;
  };

  const closeEditModal = () => {
    el('booking-edit-modal').style.display = 'none';
    delete el('booking-edit-modal').dataset.current;
  };

  const applyFilters = () => {
    let filtered = state.originalBookings;
    if (state.searchQuery) {
      filtered = filtered.filter(b => {
        const orderId = (b.order_id || `#${b.booking_id}` || '').toString().toLowerCase();
        return orderId.includes(state.searchQuery);
      });
    }
    if (state.statusFilter) {
      filtered = filtered.filter(b => (b.order_status || '').toLowerCase() === state.statusFilter.toLowerCase());
    }
    state.bookings = filtered;
  };

  const updateBooking = async (bookingId, payload) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        await fetchBookings();
        showNotification(data.message || 'Booking updated', 'success');
        closeEditModal();
      } else {
        showNotification(data.message || 'Update failed', 'error');
      }
    } catch (err) {
      console.error('Update failed', err);
      showNotification('Unable to update booking', 'error');
    }
  };

  const cancelBooking = async (bookingId) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await fetchBookings();
        showNotification(data.message || 'Booking cancelled', 'success');
      } else {
        showNotification(data.message || 'Cancel failed', 'error');
      }
    } catch (err) {
      console.error('Cancel failed', err);
      showNotification('Unable to cancel booking', 'error');
    }
  };

  const init = () => {
    el('refresh-bookings')?.addEventListener('click', fetchBookings);
    el('booking-search')?.addEventListener('input', (e) => {
      state.searchQuery = (e.target.value || '').toLowerCase().trim();
      applyFilters();
      renderAll();
    });

    el('booking-filter-status')?.addEventListener('change', (e) => {
      state.statusFilter = e.target.value;
      applyFilters();
      renderAll();
    });

    window.addEventListener('storage', (event) => {
      if (event.key === 'smartLaundryBookingCreated' && event.newValue) {
        fetchBookings();
      }
    });

    el('booking-cancel-edit')?.addEventListener('click', closeEditModal);
    el('booking-edit-form')?.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const bid = parseInt(el('booking-edit-modal').dataset.current, 10);
      const payload = {
        pickup_date: el('edit-pickup-date').value,
        pickup_address: el('edit-pickup-address').value,
        laundry_type: el('edit-laundry-type').value,
        quantity: el('edit-quantity').value,
      };
      updateBooking(bid, payload);
    });

    // allow external refresh trigger
    window.refreshMyBookings = fetchBookings;

    fetchBookings();
    // poll for updates every 30s
    setInterval(fetchBookings, 30000);
  };

  return { init };
})();

window.addEventListener('DOMContentLoaded', () => {
  try { MyBookings.init(); } catch (e) { console.error(e); }
});
