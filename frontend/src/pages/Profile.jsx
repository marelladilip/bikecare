import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [name, setName] = useState(user?.full_name || '')
  const [loading, setLoading] = useState(false)

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const updated = await authService.updateProfile({ full_name: name })
      updateUser(updated)
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Settings & Profile</h1>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Manage your account settings</p>
      </div>

      <div className="card p-6">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>Email</label>
            <input
              type="text"
              disabled
              value={user?.email || ''}
              className="w-full p-2.5 rounded-lg border text-sm opacity-60 cursor-not-allowed"
              style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 rounded-lg border text-sm"
              style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold"
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  )
}
