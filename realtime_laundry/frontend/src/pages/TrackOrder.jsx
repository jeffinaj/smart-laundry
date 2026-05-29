import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { bookingAPI } from '../services/api'
import websocket from '../services/websocket'

const STATUS_STEPS = [
  { key: 'confirmed', label: 'Booking Confirmed', icon: '✓' },
  { key: 'pickup_assigned', label: 'Pickup Assigned', icon: '📍' },
  { key: 'picked_up', label: 'Clothes Picked Up', icon: '📦' },
  { key: 'washing', label: 'Washing Started', icon: '🌊' },
  { key: 'drying', label: 'Drying Process', icon: '💨' },
  { key: 'ready', label: 'Ready for Delivery', icon: '✨' },
  { key: 'delivered', label: 'Delivered', icon: '🎉' },
]

export default function TrackOrder() {
  const { id } = useParams()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBooking()
  }, [id])

  useEffect(() => {
    const handleStatusUpdate = (data) => {
      if (data.booking_id === parseInt(id)) {
        fetchBooking()
      }
    }

    websocket.on('status_update', handleStatusUpdate)

    return () => {
      websocket.off('status_update', handleStatusUpdate)
    }
  }, [id])

  const fetchBooking = async () => {
    try {
      const response = await bookingAPI.detail(id)
      setBooking(response.data)
    } catch (error) {
      console.error('Failed to fetch booking:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading order details...</div>
  }

  if (!booking) {
    return <div className="text-center py-12">Order not found</div>
  }

  const currentStatusIndex = STATUS_STEPS.findIndex((step) => step.key === booking.status)
  const progress = ((currentStatusIndex + 1) / STATUS_STEPS.length) * 100

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">📍 Track Your Order</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Booking ID: {booking.booking_id}</p>
      </div>

      {/* Booking Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Order Details</h3>
          <div className="space-y-3">
            <InfoRow label="Name" value={booking.full_name} />
            <InfoRow label="Location" value={booking.hostel_apartment} />
            <InfoRow label="Phone" value={booking.phone_number} />
            <InfoRow label="Laundry Type" value={booking.laundry_type} />
            <InfoRow label="Items Count" value={booking.clothes_count} />
            <InfoRow label="Total Amount" value={`₹${parseFloat(booking.total_amount).toFixed(2)}`} />
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold mb-4">Payment Info</h3>
          <div className="space-y-3">
            <InfoRow label="Payment ID" value={booking.payment.payment_id} />
            <InfoRow label="Amount" value={`₹${parseFloat(booking.payment.amount).toFixed(2)}`} />
            <InfoRow label="Status" value={<span className={`badge ${booking.payment.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>{booking.payment.status}</span>} />
            <InfoRow label="Created" value={new Date(booking.payment.created_at).toLocaleString()} />
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card">
        <h3 className="text-xl font-bold mb-6">Order Status</h3>

        <div className="mb-8">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">{progress.toFixed(0)}% Complete</div>
        </div>

        {/* Status Steps */}
        <div className="space-y-4">
          {STATUS_STEPS.map((step, index) => {
            const isCompleted = index <= currentStatusIndex
            const isCurrent = index === currentStatusIndex

            return (
              <div key={step.key} className={`flex items-center gap-4 p-4 rounded-lg ${isCurrent ? 'bg-blue-50 dark:bg-blue-900' : isCompleted ? 'bg-green-50 dark:bg-green-900' : 'bg-gray-50 dark:bg-gray-700'}`}>
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${isCurrent ? 'bg-blue-500 text-white animate-pulse-glow' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white">{step.label}</div>
                  {isCurrent && <div className="text-sm text-blue-600 dark:text-blue-400">Currently at this stage</div>}
                  {isCompleted && !isCurrent && (
                    <div className="text-sm text-green-600 dark:text-green-400">
                      {(() => {
                        const tracking = booking.tracking_history.find((t) => t.status === step.key)
                        if (tracking) {
                          return new Date(tracking.timestamp).toLocaleString()
                        }
                        return 'Completed'
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="card">
        <h3 className="text-xl font-bold mb-6">Order Timeline</h3>
        <div className="space-y-4">
          {booking.tracking_history.map((track, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-blue-500 dark:bg-blue-400"></div>
                {index < booking.tracking_history.length - 1 && <div className="w-1 h-12 bg-gray-200 dark:bg-gray-700 my-1"></div>}
              </div>
              <div className="pb-4">
                <div className="font-semibold text-gray-900 dark:text-white capitalize">{track.status.replace('_', ' ')}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{new Date(track.timestamp).toLocaleString()}</div>
                {track.notes && <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{track.notes}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className="font-semibold text-gray-900 dark:text-white">{value}</span>
    </div>
  )
}
