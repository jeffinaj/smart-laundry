import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiFetch, getCsrfCookie } from '../api'

export default function Register({ setUser, setDashboard }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    await getCsrfCookie()
    const result = await apiFetch('/auth/register/', {
      method: 'POST',
      body: { username, email, password },
    })
    if (result?.success) {
      setUser(result.username)
      const dashboard = await apiFetch('/dashboard/')
      setDashboard(dashboard)
      navigate('/')
    } else {
      setError(result.error || 'Registration failed')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create Account</h1>
        {error && <div className="alert">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>Username<input value={username} onChange={(e) => setUsername(e.target.value)} required /></label>
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          <button type="submit">Create Account</button>
        </form>
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  )
}
