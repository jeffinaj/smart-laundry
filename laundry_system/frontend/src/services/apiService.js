import api from './api'

export const authService = {
  register: (data) => api.post('/auth/register/', data),
  login: (username, password) => api.post('/auth/login/', { username, password }),
  logout: () => api.post('/auth/logout/'),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.put('/auth/profile/', data),
}

export const bookingService = {
  getBookings: () => api.get('/bookings/bookings/'),
  createBooking: (data) => api.post('/bookings/bookings/', data),
  getBooking: (id) => api.get(`/bookings/bookings/${id}/`),
  updateBooking: (id, data) => api.put(`/bookings/bookings/${id}/`, data),
  cancelBooking: (id) => api.post(`/bookings/bookings/${id}/cancel/`),
  getActiveOrders: () => api.get('/bookings/bookings/active_orders/'),
  getDashboardStats: () => api.get('/bookings/bookings/dashboard_stats/'),
  getLaundryTypes: () => api.get('/bookings/laundry-types/'),
  getDeliveryPreferences: () => api.get('/bookings/delivery-preferences/'),
  // Admin endpoints
  getAllBookingsAdmin: () => api.get('/bookings/admin/bookings/'),
  assignPickup: (id, staff) => api.post(`/bookings/admin/bookings/${id}/assign_pickup/`, { staff }),
  updateStatusAdmin: (id, status) => api.post(`/bookings/admin/bookings/${id}/update_status/`, { status }),
}

export const paymentService = {
  getPayments: () => api.get('/payments/payments/'),
  createPayment: (data) => api.post('/payments/payments/', data),
  getPayment: (id) => api.get(`/payments/payments/${id}/`),
  confirmPayment: (id) => api.post(`/payments/payments/${id}/confirm_payment/`),
  refund: (id) => api.post(`/payments/payments/${id}/refund/`),
  getPaymentHistory: () => api.get('/payments/payments/payment_history/'),
  getPaymentStats: () => api.get('/payments/payments/payment_stats/'),
}

export const notificationService = {
  getNotifications: () => api.get('/notifications/notifications/'),
  getUnreadCount: () => api.get('/notifications/notifications/unread_count/'),
  getUnreadNotifications: () => api.get('/notifications/notifications/list_unread/'),
  markAsRead: (id) => api.post(`/notifications/notifications/${id}/mark_as_read/`),
  markAllAsRead: () => api.post('/notifications/notifications/mark_all_as_read/'),
  getNotificationsByType: (type) => api.get(`/notifications/notifications/by_type/?type=${type}`),
  clearOldNotifications: () => api.post('/notifications/notifications/clear_old/'),
}

export const trackingService = {
  getTracking: () => api.get('/bookings/tracking/'),
  getTrackingForBooking: (bookingId) => api.get(`/bookings/tracking/${bookingId}/`),
}
