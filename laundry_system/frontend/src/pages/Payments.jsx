import React, { useEffect, useState } from 'react'
import { paymentService } from '../services/apiService'

export default function Payments(){
  const [payments, setPayments] = useState([])

  useEffect(()=>{
    paymentService.getPayments().then(res=>setPayments(res.data)).catch(console.error)
  },[])

  return (
    <div>
      <h2>Payments</h2>
      <div className="grid gap-4 mt-4">
        {payments.map(p=> (
          <div key={p.id} className="card flex justify-between">
            <div>
              <h3>{p.payment_id}</h3>
              <p>Booking: {p.booking}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">₹{p.total_amount}</p>
              <p className={`badge ${p.status === 'completed' ? 'badge-success' : p.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                {p.status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
