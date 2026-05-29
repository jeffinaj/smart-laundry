import { NavLink } from 'react-router-dom'

export default function Sidebar({ onLogout }) {
  return (
    <aside className="sidebar">
      <div className="brand">Smart Laundry</div>
      <nav>
        <NavLink to="/">Dashboard</NavLink>
        <NavLink to="/booking">Book Laundry</NavLink>
        <NavLink to="/payments">Payments</NavLink>
      </nav>
      <button className="logout-button" onClick={onLogout}>Logout</button>
    </aside>
  )
}
