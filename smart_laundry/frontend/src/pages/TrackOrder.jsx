import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiFetch } from '../api'

const statusSteps = [
  'confirmed',
  'pickup_assigned',
  'picked_up',
  'washing',
  'ready',
  'delivered',
]

export default function TrackOrder() {
  const { id } = useParams()
  const [tracking, setTracking] = useState(null)

  useEffect(() => {
    apiFetch(`/trackings/${id}/`).then(setTracking)
  }, [id])

  if (!tracking) {
    return <div>Loading tracking...</div>
  }

  return (
    <div className="tracking-page">
      <div className="section-header">
        <h1>Track Order</h1>
        <p>Booking #{tracking.booking_id} is currently <strong>{tracking.current_status}</strong>.</p>
      </div>
      <div className="progress-steps">
        {statusSteps.map((step) => {
          const completed = tracking.tracking.some((item) => item.status === step)
          return (
            <div key={step} className={`step ${completed ? 'completed' : ''}`}>
              <div>{step.replace('_', ' ')}</div>
            </div>
          )
        })}
      </div>
      <div className="timeline">
        {tracking.tracking.map((item, index) => (
          <div key={index} className="timeline-item">
            <div className="timeline-status">{item.status.replace('_', ' ')}</div>
            <div className="timeline-time">{new Date(item.updated_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
