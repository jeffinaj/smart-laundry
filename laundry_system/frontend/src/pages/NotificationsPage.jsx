import React, { useEffect, useState } from 'react'
import { notificationService } from '../services/apiService'
import toast from 'react-hot-toast'

export default function NotificationsPage(){
  const [notifications, setNotifications] = useState([])

  const loadNotifications = async () => {
    try {
      const res = await notificationService.getNotifications()
      setNotifications(res.data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(()=>{
    loadNotifications()
  },[])

  const markRead = async (id) => {
    try {
      await notificationService.markAsRead(id)
      setNotifications((prev) => prev.map((n)=> n.id === id ? {...n, is_read:true} : n))
      toast.success('Marked as read')
    } catch (error) {
      console.error(error)
    }
  }

  const markAll = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-semibold">Notifications</h2>
          <p className="text-gray-500">Your latest booking and payment alerts appear here.</p>
        </div>
        <button className="btn-secondary" onClick={markAll}>Mark all read</button>
      </div>

      <div className="grid gap-4">
        {notifications.length ? notifications.map(n=> (
          <div key={n.id} className={`card ${n.is_read ? '' : 'border-l-4 border-primary'}`}>
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="font-semibold">{n.title}</h3>
                <p className="text-sm text-gray-500">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {!n.is_read && (
                <button className="badge badge-info" onClick={()=>markRead(n.id)}>Mark read</button>
              )}
            </div>
            <p className="mt-3 text-gray-700 dark:text-gray-200">{n.message}</p>
          </div>
        )) : (
          <div className="card text-gray-500">No notifications yet.</div>
        )}
      </div>
    </div>
  )
}
