import React, { useEffect, useState } from 'react'
import { bookingService } from '../services/apiService'
import toast from 'react-hot-toast'

export default function BookLaundry(){
  const [types, setTypes] = useState([])
  const [deliveryPrefs, setDeliveryPrefs] = useState([])
  const [form, setForm] = useState({
    full_name: '',
    hostel_apartment: '',
    phone_number: '',
    laundry_type: null,
    num_clothes: 1,
    pickup_date: '',
    delivery_preference: null,
    special_instructions: '',
  })
  const [pricing, setPricing] = useState({subtotal:0, gst:0, total:0})

  useEffect(()=>{
    bookingService.getLaundryTypes().then(res=>setTypes(res.data)).catch(console.error)
    bookingService.getDeliveryPreferences().then(res=>setDeliveryPrefs(res.data)).catch(console.error)
  },[])

  useEffect(()=>{
    // Calculate pricing
    const selectedType = types.find(t=>t.id === Number(form.laundry_type))
    const selectedDelivery = deliveryPrefs.find(d=>d.id === Number(form.delivery_preference))
    const num = Number(form.num_clothes)
    if(selectedType){
      let subtotal = (selectedType.price_per_item * num) + (selectedDelivery?.extra_charge || 0)
      let gst = subtotal * 0.18
      let total = subtotal + gst
      setPricing({subtotal, gst, total})
    }
  },[form.laundry_type, form.num_clothes, form.delivery_preference, types, deliveryPrefs])

  const handleChange = (e)=>{
    setForm({...form, [e.target.name]: e.target.value})
  }

  const handleSubmit = async(e)=>{
    e.preventDefault()
    try{
      const res = await bookingService.createBooking(form)
      toast.success('Booking created: '+res.data.booking_id)
    }catch(err){
      console.error(err)
      toast.error('Booking failed')
    }
  }

  return (
    <div className="max-w-3xl mx-auto card-glassmorphism">
      <h2>Book Laundry</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mt-4">
        <input name="full_name" placeholder="Full Name" className="input-field" value={form.full_name} onChange={handleChange} />
        <input name="hostel_apartment" placeholder="Hostel/Apartment" className="input-field" value={form.hostel_apartment} onChange={handleChange} />
        <input name="phone_number" placeholder="Phone Number" className="input-field" value={form.phone_number} onChange={handleChange} />
        <select name="laundry_type" className="input-field" value={form.laundry_type || ''} onChange={handleChange}>
          <option value="">Select Laundry Type</option>
          {types.map(t=> <option key={t.id} value={t.id}>{t.name} - ₹{t.price_per_item}</option>)}
        </select>
        <input name="num_clothes" type="number" min={1} className="input-field" value={form.num_clothes} onChange={handleChange} />
        <select name="delivery_preference" className="input-field" value={form.delivery_preference || ''} onChange={handleChange}>
          <option value="">Delivery Preference</option>
          {deliveryPrefs.map(d=> <option key={d.id} value={d.id}>{d.name} - Extra ₹{d.extra_charge}</option>)}
        </select>
        <input name="pickup_date" type="datetime-local" className="input-field col-span-2" value={form.pickup_date} onChange={handleChange} />
        <textarea name="special_instructions" placeholder="Special Instructions" className="input-field col-span-2" value={form.special_instructions} onChange={handleChange}></textarea>
        <div className="col-span-2">
          <div className="card">
            <h3>Price Summary</h3>
            <p>Subtotal: ₹{pricing.subtotal.toFixed(2)}</p>
            <p>GST (18%): ₹{pricing.gst.toFixed(2)}</p>
            <p className="text-xl font-bold">Total: ₹{pricing.total.toFixed(2)}</p>
          </div>
        </div>
        <button className="btn-primary col-span-2">Submit Booking</button>
      </form>
    </div>
  )
}
