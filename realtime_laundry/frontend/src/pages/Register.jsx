import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import { useAuthStore } from '../store'

export default function Register() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', password2: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.password2) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const response = await authAPI.register(formData)
      login(response.data.user, response.data.access, response.data.refresh)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center p-4">
      <div className="card w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">Create Account</h1>

        {error && <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} className="input-field" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} className="input-field" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Confirm Password</label>
            <input type="password" name="password2" value={formData.password2} onChange={handleChange} className="input-field" required />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600 dark:text-gray-400">
          Already have an account? <Link to="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Login</Link>
        </p>
      </div>
    </div>
  )
}
