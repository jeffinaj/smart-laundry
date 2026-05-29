import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/apiService'
import toast, { Toaster } from 'react-hot-toast'

export default function Login(){
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    try{
      const res = await authService.login(username, password)
      const { access, refresh, user } = res.data
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      localStorage.setItem('user', JSON.stringify(user))
      toast.success('Login successful')
      navigate('/')
    }catch(err){
      toast.error(err.response?.data?.error || 'Login failed')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-24 card-glassmorphism">
      <Toaster />
      <h2 className="text-2xl mb-4">Login</h2>
      <form onSubmit={handleLogin}>
        <div className="mb-3">
          <input value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="Username" className="input-field" />
        </div>
        <div className="mb-3">
          <input value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password" type="password" className="input-field" />
        </div>
        <button className="btn-primary">Login</button>
      </form>
    </div>
  )
}
