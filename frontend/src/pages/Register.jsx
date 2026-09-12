import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'
import { getErrorMessage } from '../utils/formatters'
import toast from 'react-hot-toast'

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  
  // Step 1: Account Details, Step 2: Email OTP Verification
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm: '',
    otp_code: '',
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [otpMeta, setOtpMeta] = useState(null)

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval = null
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
    } else if (timer === 0) {
      setCanResend(true)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [step, timer])

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  // Step 1: Send OTP to email
  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!form.email) {
      setError('Please provide a valid email address')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await authService.sendOtp({
        email: form.email,
        full_name: form.full_name,
      })
      setOtpMeta(res)
      if (res?.smtp_configured) {
        toast.success(`Verification code sent to ${form.email} ✉️`)
      } else {
        toast.success("Verification code generated! (SMTP not configured on Render)")
      }
      setStep(2)
      setTimer(60)
      setCanResend(false)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend || loading) return
    setLoading(true)
    setError('')
    try {
      const res = await authService.sendOtp({
        email: form.email,
        full_name: form.full_name,
      })
      setOtpMeta(res)
      toast.success(`New code generated! ✉️`)
      setTimer(60)
      setCanResend(false)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify OTP and complete registration
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault()
    if (!form.otp_code || form.otp_code.trim().length !== 6) {
      setError('Please enter the 6-digit verification code')
      return
    }

    setLoading(true)
    setError('')
    try {
      const data = await authService.register({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        otp_code: form.otp_code.trim(),
      })
      login(data)
      toast.success("Account verified! Welcome to Vehicle'Nest 🚗🏍️⚡")
      navigate('/bikes')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }}
    >
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg animate-float"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}
          >
            <span className="text-3xl">🚗</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Vehicle'Nest</h1>
          <p className="text-blue-400 font-medium text-sm mt-1">Care That Keeps You Moving</p>
        </div>

        <div
          className="rounded-2xl p-8 shadow-2xl animate-modal-pop"
          style={{
            background: 'rgba(30,41,59,0.92)',
            border: '1px solid rgba(148,163,184,0.15)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
            <div className="flex items-center space-x-2">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 1 ? 'bg-blue-600 text-white ring-4 ring-blue-500/20' : 'bg-green-600 text-white'
                }`}
              >
                {step === 1 ? '1' : '✓'}
              </span>
              <span className={`text-xs font-medium ${step === 1 ? 'text-white' : 'text-slate-400'}`}>
                Account Details
              </span>
            </div>
            <div className="w-8 h-0.5 bg-slate-700"></div>
            <div className="flex items-center space-x-2">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 2 ? 'bg-blue-600 text-white ring-4 ring-blue-500/20' : 'bg-slate-700 text-slate-400'
                }`}
              >
                2
              </span>
              <span className={`text-xs font-medium ${step === 2 ? 'text-white' : 'text-slate-400'}`}>
                Email Verification
              </span>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-white mb-2">
            {step === 1 ? 'Create your garage account' : 'Verify your email'}
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            {step === 1
              ? 'Enter your credentials to receive an activation code'
              : `We sent a 6-digit OTP code to ${form.email}`}
          </p>

          {error && (
            <div
              className="mb-4 p-3 rounded-lg text-sm text-red-300 animate-fade-in"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              {error}
            </div>
          )}

          {step === 1 ? (
            /* STEP 1: Registration Form */
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="e.g. Marella Dilip"
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
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
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
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
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
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
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-60 btn-interactive shadow-md hover:shadow-lg mt-2 flex items-center justify-center space-x-2"
                style={{ background: loading ? '#475569' : 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}
              >
                {loading ? (
                  <span>Sending code…</span>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <span>✉️</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: OTP Verification Form */
            <form onSubmit={handleVerifyAndRegister} className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Sending verification code to:</div>
                  <div className="text-sm font-semibold text-white truncate max-w-[200px]">{form.email}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1)
                    setError('')
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                >
                  Edit Email
                </button>
              </div>

              {/* Email helper / Fallback code box */}
              {otpMeta?.debug_otp && (
                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-blue-500/30 text-slate-200 text-xs animate-fade-in shadow-inner">
                  <div className="flex items-center justify-between font-semibold mb-1 text-blue-300">
                    <span className="flex items-center space-x-1.5">
                      <span>✉️</span>
                      <span>Verification Code</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setForm((f) => ({ ...f, otp_code: otpMeta.debug_otp }))
                        toast.success("Code auto-filled!")
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-white font-mono text-[11px] font-semibold transition-colors cursor-pointer border border-blue-500/30"
                    >
                      ⚡ Auto-Fill Code
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                    If email delivery is delayed or in your spam folder, your active code is:
                    <strong className="block text-center text-xl font-mono tracking-[0.3em] text-blue-400 my-1.5 bg-slate-900/90 py-1.5 rounded-lg border border-slate-700/60 font-bold">
                      {otpMeta.debug_otp}
                    </strong>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 text-center">
                  Enter 6-Digit Verification Code
                </label>
                <input
                  type="text"
                  name="otp_code"
                  maxLength={6}
                  value={form.otp_code}
                  onChange={(e) => {
                    // Only allow numbers
                    const val = e.target.value.replace(/[^0-9]/g, '')
                    setForm((f) => ({ ...f, otp_code: val }))
                    setError('')
                  }}
                  autoFocus
                  placeholder="123456"
                  className="w-full px-4 py-3.5 rounded-xl text-center text-2xl font-bold tracking-[0.4em] text-blue-400 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                  style={{ background: 'rgba(15,23,42,0.9)', border: '2px solid rgba(59,130,246,0.4)' }}
                />
              </div>

              {/* Timer and Resend Action */}
              <div className="text-center text-xs text-slate-400">
                {!canResend ? (
                  <span>
                    Resend code in <strong className="text-blue-400 font-mono">{timer}s</strong>
                  </span>
                ) : (
                  <div className="flex items-center justify-center space-x-1">
                    <span>Didn't receive the email?</span>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-blue-400 hover:text-blue-300 font-semibold underline disabled:opacity-50"
                    >
                      Resend Code
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || form.otp_code.length !== 6}
                  className="w-full py-3.5 px-4 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-50 btn-interactive shadow-lg hover:shadow-xl"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  {loading ? 'Verifying & Creating Account…' : 'Verify & Create Account 🚀'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  ← Back to Account Details
                </button>
              </div>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
              Sign in
            </Link>
          </p>

          <div className="mt-6 pt-4 border-t border-slate-700/50 text-center text-xs text-slate-500">
            Developed with ❤️ by <span className="text-blue-400 font-semibold">Marella Dilip</span>
          </div>
        </div>
      </div>
    </div>
  )
}
