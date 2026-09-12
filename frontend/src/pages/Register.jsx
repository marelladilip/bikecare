import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'
import { getErrorMessage } from '../utils/formatters'
import toast from 'react-hot-toast'

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await authService.register({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
      })
      login(data)
      toast.success("Account created! Welcome to Vehicle'Nest 🚗🏍️")
      navigate('/bikes')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }}>
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg animate-float"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
            <span className="text-3xl">🚗</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Vehicle'Nest</h1>
          <p className="text-blue-400 font-medium text-sm mt-1">Care That Keeps You Moving</p>
        </div>

        <div className="rounded-2xl p-8 shadow-2xl animate-modal-pop"
          style={{ background: 'rgba(30,41,59,0.92)', border: '1px solid rgba(148,163,184,0.15)', backdropFilter: 'blur(12px)' }}>
          <h2 className="text-xl font-semibold text-white mb-6">Create your garage account</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm text-red-300 animate-fade-in"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Marella Dilip"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="owner@example.com"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Min 6 characters"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm Password</label>
              <input
                type="password"
                name="confirm"
                value={form.confirm}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-60 btn-interactive shadow-md hover:shadow-lg"
              style={{ background: loading ? '#475569' : 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign in</Link>
          </p>

          <div className="mt-6 pt-4 border-t border-slate-700/50 text-center text-xs text-slate-500">
            Developed with ❤️ by <span className="text-blue-400 font-semibold">Marella Dilip</span>
          </div>
        </div>
      </div>
    </div>
  )
}
