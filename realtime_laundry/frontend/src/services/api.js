import axios from 'axios'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
}

export const dashboardAPI = {
  get: () => api.get('/dashboard/'),
}

export const bookingAPI = {
  list: () => api.get('/bookings/'),
  create: (data) => api.post('/bookings/', data),
  detail: (id) => api.get(`/bookings/${id}/`),
  updateStatus: (id, data) => api.post(`/bookings/${id}/update_status/`, data),
}

export const paymentAPI = {
  list: () => api.get('/payments/'),
}

export const notificationAPI = {
  list: () => api.get('/notifications/'),
  markAsRead: (id) => api.post(`/notifications/${id}/mark_as_read/`),
  markAllAsRead: () => api.post('/notifications/mark_all_as_read/'),
  unreadCount: () => api.get('/notifications/unread_count/'),
}

export default api
