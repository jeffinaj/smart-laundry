import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingAPI } from '../services/api'
import { useDashboardStore } from '../store'

const PRICES = {
  normal: 10,
  premium: 20,
  dryclean: 40,
}

const GST_RATE = 0.18

export default function BookLaundry() {
  const [formData, setFormData] = useState({
    full_name: '',
    hostel_apartment: '',
    phone_number: '',
    laundry_type: 'normal',
    clothes_count: 1,
    pickup_date: '',
    pickup_time: '',
    delivery_preference: '',
    special_instructions: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { setDashboard } = useDashboardStore()

  const subtotal = useMemo(() => {
    const price = PRICES[formData.laundry_type] || 0
    return price * formData.clothes_count
  }, [formData.laundry_type, formData.clothes_count])

  const gst = useMemo(() => {
    return subtotal * GST_RATE
  }, [subtotal])

  const total = subtotal + gst

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const bookingData = {
        ...formData,
        clothes_count: parseInt(formData.clothes_count),
        subtotal: subtotal.toFixed(2),
        gst: gst.toFixed(2),
        total_amount: total.toFixed(2),
      }

      const response = await bookingAPI.create(bookingData)
      
      if (response.status === 201) {
        setFormData({
          full_name: '',
          hostel_apartment: '',
          phone_number: '',
          laundry_type: 'normal',
          clothes_count: 1,
          pickup_date: '',
          pickup_time: '',
          delivery_preference: '',
          special_instructions: '',
        })
        
        setTimeout(() => {
          navigate('/')
        }, 1500)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">📋 Book Laundry Service</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="card">
            {error && <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name *</label>
                  <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Hostel/Apartment *</label>
                  <input type="text" name="hostel_apartment" value={formData.hostel_apartment} onChange={handleChange} className="input-field" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number *</label>
                  <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Laundry Type *</label>
                  <select name="laundry_type" value={formData.laundry_type} onChange={handleChange} className="input-field">
                    <option value="normal">Normal Wash (₹{PRICES.normal}/item)</option>
                    <option value="premium">Premium Wash (₹{PRICES.premium}/item)</option>
                    <option value="dryclean">Dry Clean (₹{PRICES.dryclean}/item)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Number of Clothes *</label>
                  <input type="number" name="clothes_count" value={formData.clothes_count} onChange={handleChange} min="1" className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Pickup Date *</label>
                  <input type="date" name="pickup_date" value={formData.pickup_date} onChange={handleChange} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Pickup Time *</label>
                  <input type="time" name="pickup_time" value={formData.pickup_time} onChange={handleChange} className="input-field" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Delivery Preference</label>
                <input type="text" name="delivery_preference" value={formData.delivery_preference} onChange={handleChange} className="input-field" placeholder="e.g., Morning, Evening" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Special Instructions</label>
                <textarea name="special_instructions" value={formData.special_instructions} onChange={handleChange} className="input-field" rows="4" placeholder="Any special care instructions..."></textarea>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Processing...' : '✓ Confirm Booking'}
              </button>
            </form>
          </div>
        </div>

        {/* Price Summary */}
        <div>
          <div className="card sticky top-8">
            <h3 className="text-xl font-bold mb-6">💰 Price Summary</h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Laundry Type</span>
                <span className="font-medium capitalize">{formData.laundry_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Items</span>
                <span className="font-medium">{formData.clothes_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Price/Item</span>
                <span className="font-medium">₹{PRICES[formData.laundry_type]}</span>
              </div>

              <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
                <div className="flex justify-between mb-2">
                  <span>Subtotal</span>
                  <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-4">
                  <span>GST (18%)</span>
                  <span className="font-semibold">₹{gst.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-4">
                <div className="text-sm text-blue-100 mb-1">Total Amount</div>
                <div className="text-3xl font-bold">₹{total.toFixed(2)}</div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg text-sm">
              <div className="font-semibold mb-2">✓ What's Included:</div>
              <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                <li>✓ Free pickup from your location</li>
                <li>✓ Wash & Dry</li>
                <li>✓ Free home delivery</li>
                <li>✓ 24hr processing time</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
