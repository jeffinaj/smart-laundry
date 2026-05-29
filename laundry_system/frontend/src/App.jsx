import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import BookLaundry from './pages/BookLaundry'
import Payments from './pages/Payments'
import Tracking from './pages/Tracking'
import NotificationsPage from './pages/NotificationsPage'
import AdminPage from './pages/AdminPage'
import Sidebar from './components/Sidebar'
import { Toaster } from 'react-hot-toast'

export default function App() {
  const isAuthenticated = !!localStorage.getItem('access_token')

  return (
    <Router>
      <div className="min-h-screen flex bg-light dark:bg-dark">
        {isAuthenticated && <Sidebar />}
        <main className={`flex-1 p-6 ${!isAuthenticated ? 'max-w-3xl mx-auto w-full' : ''}`}>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/book" element={isAuthenticated ? <BookLaundry /> : <Navigate to="/login" />} />
            <Route path="/payments" element={isAuthenticated ? <Payments /> : <Navigate to="/login" />} />
            <Route path="/tracking" element={isAuthenticated ? <Tracking /> : <Navigate to="/login" />} />
            <Route path="/tracking/:id" element={isAuthenticated ? <Tracking /> : <Navigate to="/login" />} />
            <Route path="/notifications" element={isAuthenticated ? <NotificationsPage /> : <Navigate to="/login" />} />
            <Route path="/admin" element={isAuthenticated ? <AdminPage /> : <Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}
