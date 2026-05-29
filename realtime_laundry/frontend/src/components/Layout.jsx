import { useState } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore, useNotificationStore, useThemeStore } from '../store'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { logout } = useAuthStore()
  const { unreadCount } = useNotificationStore()
  const { darkMode, toggleDarkMode } = useThemeStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-blue-600 to-purple-600 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-6 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-2xl font-bold">Laundry</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg">
            ☰
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <NavLink to="/" label="Dashboard" icon="📊" open={sidebarOpen} />
          <NavLink to="/book" label="Book Laundry" icon="📝" open={sidebarOpen} />
          <NavLink to="/payments" label="Payments" icon="💳" open={sidebarOpen} />
        </nav>

        <div className="p-4 space-y-2 border-t border-white border-opacity-20">
          <button onClick={toggleDarkMode} className="w-full p-2 hover:bg-white hover:bg-opacity-10 rounded-lg flex items-center gap-2 text-sm">
            {darkMode ? '☀️' : '🌙'}
            {sidebarOpen && <span>{darkMode ? 'Light' : 'Dark'}</span>}
          </button>
          <button onClick={handleLogout} className="w-full p-2 hover:bg-white hover:bg-opacity-10 rounded-lg flex items-center gap-2 text-sm">
            🚪
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-8 py-4 flex items-center justify-between">
          <div className="text-gray-600 dark:text-gray-400">Welcome back!</div>
          <div className="flex items-center gap-6">
            <Link to="/notifications" className="relative">
              <span className="text-2xl">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

function NavLink({ to, label, icon, open }) {
  return (
    <Link to={to} className="flex items-center gap-3 p-3 hover:bg-white hover:bg-opacity-10 rounded-lg transition">
      <span className="text-xl">{icon}</span>
      {open && <span>{label}</span>}
    </Link>
  )
}
