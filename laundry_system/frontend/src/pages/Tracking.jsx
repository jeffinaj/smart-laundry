import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { connectOrderTrackingSocket } from '../services/websocketService'
import { trackingService } from '../services/apiService'

export default function Tracking(){
  const { id } = useParams()
  const navigate = useNavigate()
  const [tracking, setTracking] = useState(null)
  const [list, setList] = useState([])

  useEffect(()=>{
    if (!id) {
      trackingService.getTracking().then((res)=>{
        setList(res.data)
      }).catch(console.error)
      return
    }

    const socket = connectOrderTrackingSocket(id, (msg)=>{
      if(msg.type === 'tracking_update'){
        setTracking(msg)
      }
    })
    return ()=> socket && socket.close()
  }, [id])

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-semibold">Order Tracking</h2>
      {!id ? (
        <div className="mt-6 grid gap-4">
          {list.length ? list.map((item)=>(
            <div key={item.id} className="card flex justify-between items-center">
              <div>
                <p className="font-semibold">{item.booking.booking_id}</p>
                <p className="text-sm text-gray-500">Status: {item.booking.status}</p>
              </div>
              <button className="btn-secondary" onClick={()=>navigate(`/tracking/${item.id}`)}>
                View details
              </button>
            </div>
          )) : (
            <div className="card text-gray-500">Waiting for your booking to appear here.</div>
          )}
        </div>
      ) : (
        <div className="card mt-6">
          <h3 className="text-xl font-semibold">Booking ID: {id}</h3>
          <p className="text-sm text-gray-500 mt-2">Current progress: {tracking?.progress_percentage ?? 0}%</p>
          <div className="mt-4">
            <p className="font-semibold">Status:</p>
            <p>{tracking?.status ?? 'Loading...'}</p>
          </div>
          <div className="mt-4">
            <p className="font-semibold">Latest update:</p>
            <p>{tracking?.stage ?? 'No updates yet'}</p>
            <p className="text-sm text-gray-500">{tracking?.timestamp ?? ''}</p>
          </div>
          <div className="mt-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
            <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
              <div className="bg-primary h-3 rounded-full" style={{ width: `${tracking?.progress_percentage ?? 0}%` }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
