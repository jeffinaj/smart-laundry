import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiFetch, getCsrfCookie } from '../api'

export default function Login({ setUser, setDashboard }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    await getCsrfCookie()
    const result = await apiFetch('/auth/login/', {
      method: 'POST',
      body: { username, password },
    })
    if (result?.success) {
      setUser(result.username)
      const dashboard = await apiFetch('/dashboard/')
      setDashboard(dashboard)
      navigate('/')
    } else {
      setError(result.error || 'Login failed')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Login</h1>
        {error && <div className="alert">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>Username<input value={username} onChange={(e) => setUsername(e.target.value)} required /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          <button type="submit">Login</button>
        </form>
        <p>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  )
}
