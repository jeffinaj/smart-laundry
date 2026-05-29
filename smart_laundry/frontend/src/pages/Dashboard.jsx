import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../api'

export default function Dashboard({ dashboard, refresh }) {
  const [summary, setSummary] = useState(dashboard)

  useEffect(() => {
    setSummary(dashboard)
  }, [dashboard])

  const reload = async () => {
    const updated = await apiFetch('/dashboard/')
    setSummary(updated)
    if (refresh) refresh()
  }

  if (!summary) {
    return <div>Loading your dashboard...</div>
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-hero">
        <div>
          <h1>Hello, {summary.user}</h1>
          <p>Manage bookings, payments, and order tracking in one place.</p>
        </div>
        <button onClick={reload}>Refresh</button>
      </div>
      <div className="cards-grid">
        <div className="card primary">Total Bookings<div>{summary.total_bookings}</div></div>
        <div className="card accent">Pending Orders<div>{summary.pending_orders}</div></div>
        <div className="card accent">Completed Orders<div>{summary.completed_orders}</div></div>
        <div className="card primary">Total Paid<div>${summary.payment_summary.total_paid.toFixed(2)}</div></div>
      </div>
      <section className="section">
        <h2>Recent Notifications</h2>
        <ul className="list-box">
          {summary.recent_notifications.map((note, index) => (
            <li key={index} className={note.is_read ? '' : 'unread'}>
              {note.message} <span>{new Date(note.created_at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="section">
        <h2>Recent Bookings</h2>
        <ul className="list-box">
          {summary.recent_bookings.map((booking) => (
            <li key={booking.id}>
              <div>{booking.name} — {booking.wash_type}</div>
              <div className="meta">Status: {booking.status}</div>
              <Link to={`/track/${booking.id}`} className="link-button">Track</Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
