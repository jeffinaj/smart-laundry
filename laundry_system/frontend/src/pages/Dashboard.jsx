import React, { useEffect, useState } from 'react'
import { bookingService } from '../services/apiService'
import { connectDashboardSocket, connectNotificationSocket } from '../services/websocketService'
import toast from 'react-hot-toast'

export default function Dashboard(){
  const [stats, setStats] = useState(null)
  const [activeOrders, setActiveOrders] = useState([])
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    let dashboardSocket
    let notifSocket

    const loadStats = async () => {
      try{
        const [statsRes, ordersRes] = await Promise.all([
          bookingService.getDashboardStats(),
          bookingService.getActiveOrders(),
        ])
        setStats(statsRes.data)
        setActiveOrders(ordersRes.data)
      }catch(err){
        console.error(err)
      }
    }

    loadStats()

    dashboardSocket = connectDashboardSocket((msg)=>{
      if(msg.type === 'stats_update'){
        setStats(msg.data)
      }
      if(msg.type === 'booking_update'){
        toast.success(msg.message)
        loadStats()
      }
      if(msg.type === 'payment_update'){
        toast.success(msg.message)
      }
    })

    notifSocket = connectNotificationSocket((msg)=>{
      if(msg.type === 'notification'){
        toast(msg.title + ' - ' + msg.message)
      }
    })

    return ()=>{
      if(dashboardSocket) dashboardSocket.close()
      if(notifSocket) notifSocket.close()
    }
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold">Welcome back, {user.first_name || user.username || 'User'}</h2>
          <p className="text-gray-600 dark:text-gray-300">Your laundry dashboard is live and updating in real time.</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm uppercase text-gray-500">Total bookings</p>
          <p className="text-4xl font-bold mt-3">{stats?.total_bookings ?? 0}</p>
        </div>
        <div className="card">
          <p className="text-sm uppercase text-gray-500">Active orders</p>
          <p className="text-4xl font-bold mt-3">{stats?.active_orders ?? 0}</p>
        </div>
        <div className="card">
          <p className="text-sm uppercase text-gray-500">Completed deliveries</p>
          <p className="text-4xl font-bold mt-3">{stats?.completed ?? 0}</p>
        </div>
        <div className="card">
          <p className="text-sm uppercase text-gray-500">Total revenue</p>
          <p className="text-4xl font-bold mt-3">₹{stats?.total_spent?.toFixed(2) ?? '0.00'}</p>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Active orders</h3>
          <span className="text-sm text-gray-500">Auto-refreshing</span>
        </div>
        <div className="grid gap-4">
          {activeOrders.length ? activeOrders.map((order)=>(
            <div key={order.id} className="card flex justify-between items-center">
              <div>
                <p className="font-semibold">{order.booking_id}</p>
                <p className="text-sm text-gray-500">{order.laundry_type_details?.name} • {order.status}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">₹{order.total_amount}</p>
                <p className="text-xs text-gray-500">Pickup: {new Date(order.pickup_date).toLocaleString()}</p>
              </div>
            </div>
          )) : (
            <div className="card text-center text-gray-500">No active laundry orders yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}
