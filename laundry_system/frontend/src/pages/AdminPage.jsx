import React, { useEffect, useState } from 'react'
import { bookingService } from '../services/apiService'
import toast from 'react-hot-toast'

export default function AdminPage(){
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)

  const loadBookings = async ()=>{
    setLoading(true)
    try{
      const res = await bookingService.getAllBookingsAdmin()
      setBookings(res.data)
    }catch(err){
      console.error(err)
      toast.error('Failed to load bookings')
    }finally{setLoading(false)}
  }

  useEffect(()=>{loadBookings()}, [])

  const handleAssign = async (id)=>{
    const staff = prompt('Enter pickup staff name or ID')
    if(!staff) return
    try{
      await bookingService.assignPickup(id, staff)
      toast.success('Pickup assigned')
      loadBookings()
    }catch(err){console.error(err); toast.error('Action failed')}
  }

  const handleStatus = async (id)=>{
    const status = prompt('Enter new status (confirmed, picked_up, washing, drying, ready, delivered, cancelled)')
    if(!status) return
    try{
      await bookingService.updateStatusAdmin(id, status)
      toast.success('Status updated')
      loadBookings()
    }catch(err){console.error(err); toast.error('Action failed')}
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-semibold">Admin — Bookings</h2>
        <button className="btn-primary" onClick={loadBookings}>Refresh</button>
      </div>

      <div className="mt-4">
        {loading ? <div className="card">Loading...</div> : (
          <div className="grid gap-3">
            {bookings.map(b=> (
              <div key={b.id} className="card flex justify-between items-center">
                <div>
                  <p className="font-semibold">{b.booking_id} — {b.full_name}</p>
                  <p className="text-sm text-gray-500">{b.laundry_type_details?.name} • {b.status} • ₹{b.total_amount}</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary" onClick={()=>handleAssign(b.id)}>Assign Pickup</button>
                  <button className="btn-primary" onClick={()=>handleStatus(b.id)}>Update Status</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
