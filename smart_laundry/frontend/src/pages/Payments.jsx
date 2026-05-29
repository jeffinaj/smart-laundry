import { useEffect, useState } from 'react'
import { apiFetch } from '../api'

export default function Payments() {
  const [payments, setPayments] = useState([])

  useEffect(() => {
    apiFetch('/payments/').then((data) => setPayments(data || []))
  }, [])

  return (
    <div className="payments-page">
      <div className="section-header">
        <h1>Payment History</h1>
        <p>Review past payments and statuses for your laundry bookings.</p>
      </div>
      <div className="payments-grid">
        {payments.map((payment, index) => (
          <div key={index} className="payment-card">
            <div>Booking #{payment.booking_id}</div>
            <div className="amount">${payment.amount.toFixed(2)}</div>
            <div>Status: {payment.status}</div>
            <div>{new Date(payment.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
