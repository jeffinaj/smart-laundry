import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('access_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  
  login: (user, token, refresh) => {
    localStorage.setItem('access_token', token)
    localStorage.setItem('refresh_token', refresh)
    set({ user, token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ user: null, token: null, isAuthenticated: false })
  },

  setUser: (user) => set({ user }),
}))

export const useDashboardStore = create((set) => ({
  dashboard: null,
  loading: false,

  setDashboard: (dashboard) => set({ dashboard }),
  setLoading: (loading) => set({ loading }),
  
  updateBooking: (bookingId, updates) => set((state) => ({
    dashboard: {
      ...state.dashboard,
      recent_bookings: state.dashboard.recent_bookings.map((b) =>
        b.id === bookingId ? { ...b, ...updates } : b
      ),
    },
  })),
}))

export const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,
  
  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (count) => set({ unreadCount: count }),
  
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + 1,
  })),
  
  markAsRead: (notificationId) => set((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === notificationId ? { ...n, is_read: true } : n
    ),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })),
}))

export const useThemeStore = create((set) => ({
  darkMode: localStorage.getItem('darkMode') === 'true',
  
  toggleDarkMode: () => set((state) => {
    const newValue = !state.darkMode
    localStorage.setItem('darkMode', newValue)
    return { darkMode: newValue }
  }),
}))
