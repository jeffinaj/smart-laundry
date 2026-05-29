let dashboardSocket = null
let notificationSocket = null
let trackingSocket = null

const WS_BASE_URL = import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//localhost:8000`

export const connectDashboardSocket = (onMessage) => {
  const token = localStorage.getItem('access_token')
  dashboardSocket = new WebSocket(`${WS_BASE_URL}/ws/dashboard/?token=${token}`)
  
  dashboardSocket.onopen = () => {
    console.log('Dashboard WebSocket connected')
  }
  
  dashboardSocket.onmessage = (event) => {
    const data = JSON.parse(event.data)
    onMessage(data)
  }
  
  dashboardSocket.onerror = (error) => {
    console.error('WebSocket error:', error)
  }
  
  return dashboardSocket
}

export const connectNotificationSocket = (onMessage) => {
  const token = localStorage.getItem('access_token')
  notificationSocket = new WebSocket(`${WS_BASE_URL}/ws/notifications/?token=${token}`)
  
  notificationSocket.onopen = () => {
    console.log('Notification WebSocket connected')
  }
  
  notificationSocket.onmessage = (event) => {
    const data = JSON.parse(event.data)
    onMessage(data)
  }
  
  notificationSocket.onerror = (error) => {
    console.error('WebSocket error:', error)
  }
  
  return notificationSocket
}

export const connectOrderTrackingSocket = (bookingId, onMessage) => {
  const token = localStorage.getItem('access_token')
  trackingSocket = new WebSocket(`${WS_BASE_URL}/ws/tracking/${bookingId}/?token=${token}`)
  
  trackingSocket.onopen = () => {
    console.log(`Order tracking WebSocket connected for booking ${bookingId}`)
  }
  
  trackingSocket.onmessage = (event) => {
    const data = JSON.parse(event.data)
    onMessage(data)
  }
  
  trackingSocket.onerror = (error) => {
    console.error('WebSocket error:', error)
  }
  
  return trackingSocket
}

export const disconnectSockets = () => {
  if (dashboardSocket) dashboardSocket.close()
  if (notificationSocket) notificationSocket.close()
  if (trackingSocket) trackingSocket.close()
}
