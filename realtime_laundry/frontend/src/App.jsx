import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore, useThemeStore } from './store'
import websocket from './services/websocket'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import BookLaundry from './pages/BookLaundry'
import Payments from './pages/Payments'
import TrackOrder from './pages/TrackOrder'
import Layout from './components/Layout'

function App() {
  const { isAuthenticated, token } = useAuthStore()
  const { darkMode } = useThemeStore()

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    if (isAuthenticated && token) {
      websocket.connect(token)
    }
  }, [isAuthenticated, token])

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
      
      <Route element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/book" element={<BookLaundry />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/track/:id" element={<TrackOrder />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
