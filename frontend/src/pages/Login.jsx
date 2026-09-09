import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'
import { getErrorMessage } from '../utils/formatters'
import toast from 'react-hot-toast'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await authService.login(form)
      login(data)
      toast.success(`Welcome back, ${data.user?.full_name || 'Rider'}!`)
      navigate('/dashboard')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
            <span className="text-3xl">🏍️</span>
          </div>
          <h1 className="text-3xl font-bold text-white">BikeCare</h1>
          <p className="text-slate-400 mt-1">Your bike's personal finance manager</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 shadow-2xl"
          style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(148,163,184,0.1)', backdropFilter: 'blur(10px)' }}>
          <h2 className="text-xl font-semibold text-white mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm text-red-300"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="rider@example.com"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)' }}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-slate-300">Password</label>
                <Link to="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300">Forgot password?</Link>
              </div>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: loading ? '#475569' : 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            New to BikeCare?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium">Create account</Link>
          </p>

          <div className="mt-6 pt-4 border-t border-slate-700/50 text-center text-xs text-slate-500">
            Developed with ❤️ by <span className="text-blue-400 font-semibold">Marella Dilip</span>
          </div>
        </div>
      </div>
    </div>
  )
}
