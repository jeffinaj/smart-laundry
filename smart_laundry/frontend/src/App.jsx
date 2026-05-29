import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { apiFetch, getCsrfCookie } from './api'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Booking from './pages/Booking'
import Payments from './pages/Payments'
import TrackOrder from './pages/TrackOrder'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  const [user, setUser] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function init() {
      await getCsrfCookie()
      const response = await apiFetch('/dashboard/')
      if (response?.user) {
        setUser(response.user)
        setDashboard(response)
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleLogout = async () => {
    await apiFetch('/auth/logout/', { method: 'POST' })
    setUser(null)
    setDashboard(null)
    navigate('/login')
  }

  if (loading) {
    return <div className="loader">Loading...</div>
  }

  return (
    <div className="app-shell">
      {user && <Sidebar onLogout={handleLogout} />}
      <main className="app-content">
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/" /> : <Login setUser={setUser} setDashboard={setDashboard} />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to="/" /> : <Register setUser={setUser} setDashboard={setDashboard} />}
          />
          <Route
            path="/"
            element={user ? <Dashboard dashboard={dashboard} refresh={() => apiFetch('/dashboard/').then(setDashboard)} /> : <Navigate to="/login" />}
          />
          <Route
            path="/booking"
            element={user ? <Booking /> : <Navigate to="/login" />}
          />
          <Route
            path="/payments"
            element={user ? <Payments /> : <Navigate to="/login" />}
          />
          <Route
            path="/track/:id"
            element={user ? <TrackOrder /> : <Navigate to="/login" />}
          />
          <Route path="*" element={<Navigate to={user ? '/' : '/login'} />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
