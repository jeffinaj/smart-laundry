import { useEffect, useState } from 'react'
import { dashboardAPI } from '../services/api'
import { useDashboardStore, useNotificationStore } from '../store'
import websocket from '../services/websocket'

export default function Dashboard() {
  const { dashboard, setDashboard } = useDashboardStore()
  const { addNotification } = useNotificationStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  useEffect(() => {
    websocket.on('notification', handleNotification)
    websocket.on('status_update', handleStatusUpdate)

    return () => {
      websocket.off('notification', handleNotification)
      websocket.off('status_update', handleStatusUpdate)
    }
  }, [])

  const fetchDashboard = async () => {
    try {
      const response = await dashboardAPI.get()
      setDashboard(response.data)
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNotification = (data) => {
    addNotification({
      id: Date.now(),
      message: data.message,
      notification_type: 'booking',
      title: 'New Notification',
      is_read: false,
      created_at: new Date().toISOString(),
    })
    fetchDashboard()
  }

  const handleStatusUpdate = (data) => {
    addNotification({
      id: Date.now(),
      message: data.message,
      notification_type: 'alert',
      title: 'Order Status Updated',
      is_read: false,
      created_at: new Date().toISOString(),
    })
    fetchDashboard()
  }

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>
  }

  if (!dashboard) {
    return <div className="text-center py-12">Failed to load dashboard</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Welcome, {dashboard.username}! 👋</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Here's your laundry overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Total Bookings" value={dashboard.total_bookings} icon="📦" color="blue" />
        <StatCard label="Active Orders" value={dashboard.active_orders} icon="⚡" color="purple" />
        <StatCard label="Pending Payments" value={dashboard.pending_payments} icon="💳" color="orange" />
        <StatCard label="Unread Alerts" value={dashboard.unread_notifications} icon="🔔" color="red" />
      </div>

      {/* Recent Bookings */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Recent Bookings</h2>
        <div className="space-y-4">
          {dashboard.recent_bookings.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No bookings yet. <a href="/book" className="text-blue-600 dark:text-blue-400 font-semibold">Create one now!</a></p>
          ) : (
            dashboard.recent_bookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          )}
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Latest Notifications</h2>
        <div className="space-y-3">
          {dashboard.recent_notifications.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No notifications</p>
          ) : (
            dashboard.recent_notifications.map((notif) => (
              <NotificationItem key={notif.id} notification={notif} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
  }

  return (
    <div className={`bg-gradient-to-br ${colors[color]} text-white rounded-2xl p-6 shadow-lg`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-gray-200 text-sm font-medium">{label}</div>
      <div className="text-4xl font-bold mt-2">{value}</div>
    </div>
  )
}

function BookingCard({ booking }) {
  const statusColors = {
    confirmed: 'badge-primary',
    pickup_assigned: 'badge-primary',
    picked_up: 'badge-primary',
    washing: 'badge-warning',
    drying: 'badge-warning',
    ready: 'badge-success',
    delivered: 'badge-success',
  }

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold text-gray-900 dark:text-white">{booking.full_name}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{booking.booking_id}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{booking.laundry_type} - {booking.clothes_count} items</div>
        </div>
        <div className={`${statusColors[booking.status] || 'badge-primary'}`}>{booking.status.replace('_', ' ')}</div>
      </div>
      <div className="mt-2 text-lg font-semibold text-blue-600 dark:text-blue-400">₹{booking.total_amount}</div>
    </div>
  )
}

function NotificationItem({ notification }) {
  return (
    <div className={`p-3 rounded-lg ${notification.is_read ? 'bg-gray-50 dark:bg-gray-700' : 'bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500'}`}>
      <div className="font-semibold text-sm">{notification.title}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{notification.message}</div>
      <div className="text-xs text-gray-500 mt-1">{new Date(notification.created_at).toLocaleString()}</div>
    </div>
  )
}
