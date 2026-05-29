import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  isLoggedIn: false,
  loading: false,
  
  setUser: (user) => set({ user, isLoggedIn: !!user }),
  setLoading: (loading) => set({ loading }),
  logout: () => set({ user: null, isLoggedIn: false }),
}))

export const useBookingStore = create((set) => ({
  bookings: [],
  activeOrders: [],
  selectedBooking: null,
  stats: {
    total_bookings: 0,
    active_orders: 0,
    completed: 0,
    total_spent: 0,
  },
  loading: false,
  
  setBookings: (bookings) => set({ bookings }),
  setActiveOrders: (orders) => set({ activeOrders: orders }),
  setSelectedBooking: (booking) => set({ selectedBooking: booking }),
  setStats: (stats) => set({ stats }),
  setLoading: (loading) => set({ loading }),
  addBooking: (booking) => set((state) => ({ bookings: [booking, ...state.bookings] })),
  updateBooking: (id, updates) =>
    set((state) => ({
      bookings: state.bookings.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    })),
}))

export const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,
  
  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (count) => set({ unreadCount: count }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
}))

export const usePaymentStore = create((set) => ({
  payments: [],
  selectedPayment: null,
  loading: false,
  
  setPayments: (payments) => set({ payments }),
  setSelectedPayment: (payment) => set({ selectedPayment: payment }),
  setLoading: (loading) => set({ loading }),
  addPayment: (payment) =>
    set((state) => ({ payments: [payment, ...state.payments] })),
  updatePayment: (id, updates) =>
    set((state) => ({
      payments: state.payments.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
}))

export const useUIStore = create((set) => ({
  darkMode: localStorage.getItem('darkMode') === 'true',
  sidebarOpen: true,
  
  toggleDarkMode: () =>
    set((state) => {
      const newDarkMode = !state.darkMode
      localStorage.setItem('darkMode', newDarkMode)
      return { darkMode: newDarkMode }
    }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
