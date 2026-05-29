import React from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Sidebar(){
  const location = useLocation()
  const navItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Book Laundry', path: '/book' },
    { label: 'Payments', path: '/payments' },
    { label: 'Tracking', path: '/tracking' },
    { label: 'Notifications', path: '/notifications' },
    { label: 'Admin', path: '/admin' },
  ]

  return (
    <aside className="w-64 p-6 bg-white dark:bg-gray-900 shadow-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Smart Laundry</h1>
        <p className="text-sm text-gray-500">Real-time laundry tracking</p>
      </div>

      <nav>
        {navItems.map((item) => (
          <Link key={item.path} to={item.path} className={`block py-2 px-3 rounded ${location.pathname === item.path ? 'bg-primary text-white' : 'text-gray-700 dark:text-gray-200'}`}>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
