import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api'

const pricing = {
  normal: 20,
  premium: 35,
  dryclean: 45,
}

export default function Booking() {
  const [form, setForm] = useState({
    name: '',
    room_number: '',
    phone_number: '',
    clothes_type: '',
    clothes_count: 1,
    wash_type: 'normal',
    pickup_date: '',
    pickup_time: '',
    special_instructions: '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const total = useMemo(() => {
    const count = Number(form.clothes_count || 0)
    const rate = pricing[form.wash_type] || 0
    return count * rate
  }, [form.clothes_count, form.wash_type])

  useEffect(() => {
    setForm((prev) => ({ ...prev, total_amount: total }))
  }, [total])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const submitBooking = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const result = await apiFetch('/bookings/', {
        method: 'POST',
        body: { ...form, total_amount: total },
      })
      if (result.error) {
        setError(result.error)
      } else {
        setMessage('Booking created successfully!')
      }
    } catch (err) {
      setError('Unable to submit booking.')
    }
  }

  return (
    <div className="booking-page">
      <div className="page-header">
        <div>
          <h1>Book Laundry</h1>
          <p>Complete the form to schedule a pick-up and track your order.</p>
        </div>
        <div className="price-summary">
          <strong>Price Summary</strong>
          <p>Wash type: {form.wash_type}</p>
          <p>Items: {form.clothes_count}</p>
          <p>Total: ${total.toFixed(2)}</p>
        </div>
      </div>
      {message && <div className="success-box">{message}</div>}
      {error && <div className="alert">{error}</div>}
      <form className="booking-form" onSubmit={submitBooking}>
        <label>Name<input name="name" value={form.name} onChange={handleChange} required /></label>
        <label>Hostel / Room Number<input name="room_number" value={form.room_number} onChange={handleChange} required /></label>
        <label>Phone Number<input name="phone_number" value={form.phone_number} onChange={handleChange} required /></label>
        <label>Clothes Type<input name="clothes_type" value={form.clothes_type} onChange={handleChange} required /></label>
        <label>Number of Clothes<input type="number" min="1" name="clothes_count" value={form.clothes_count} onChange={handleChange} required /></label>
        <label>Wash Type<select name="wash_type" value={form.wash_type} onChange={handleChange}>
          <option value="normal">Normal</option>
          <option value="premium">Premium</option>
          <option value="dryclean">Dry Clean</option>
        </select></label>
        <label>Pickup Date<input type="date" name="pickup_date" value={form.pickup_date} onChange={handleChange} required /></label>
        <label>Pickup Time<input type="time" name="pickup_time" value={form.pickup_time} onChange={handleChange} required /></label>
        <label>Special Instructions<textarea name="special_instructions" value={form.special_instructions} onChange={handleChange} /></label>
        <button type="submit">Submit Booking</button>
      </form>
    </div>
  )
}
