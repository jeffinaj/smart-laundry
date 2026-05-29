class WebSocketService {
  constructor() {
    this.socket = null
    this.listeners = {}
  }

  connect(token) {
    return new Promise((resolve, reject) => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const url = `${protocol}//${window.location.host}/api/ws/notifications/`
      
      this.socket = new WebSocket(url)

      this.socket.onopen = () => {
        console.log('WebSocket connected')
        resolve()
      }

      this.socket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        this.emit(data.type, data)
      }

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error)
        reject(error)
      }

      this.socket.onclose = () => {
        console.log('WebSocket disconnected')
        // Attempt to reconnect after 5 seconds
        setTimeout(() => this.connect(token), 5000)
      }
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.close()
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback)
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => callback(data))
    }
  }

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data))
    }
  }
}

export default new WebSocketService()
