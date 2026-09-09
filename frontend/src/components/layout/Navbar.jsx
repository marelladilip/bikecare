import { useAuth } from '../../context/AuthContext'
import { useBike } from '../../context/BikeContext'
import { useTheme } from '../../context/ThemeContext'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { bikes, activeBike, switchBike } = useBike()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="h-16 px-4 md:px-6 flex items-center justify-between border-b"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      {/* Bike Selector dropdown */}
      <div className="flex items-center gap-3">
        {bikes.length > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-xl">🏍️</span>
            <select
              value={activeBike?.id || ''}
              onChange={(e) => {
                const selected = bikes.find((b) => b.id === e.target.value)
                if (selected) switchBike(selected)
              }}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold cursor-pointer border focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                background: 'var(--color-bg)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              {bikes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.brand} {b.model} ({b.registration_number || 'No Reg'})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <Link
            to="/bikes"
            className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            + Add Your First Bike
          </Link>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title="Toggle Dark/Light Mode"
          className="p-2 rounded-lg border text-sm transition-colors"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
          }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* User Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium"
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
            }}
          >
            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="hidden sm:inline">{user?.full_name || 'Rider'}</span>
            <span className="text-xs">▼</span>
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-48 rounded-xl shadow-xl border py-1 z-50"
              style={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="px-4 py-2 text-xs border-b" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}>
                {user?.email}
              </div>
              <Link
                to="/profile"
                onClick={() => setDropdownOpen(false)}
                className="block px-4 py-2 text-sm hover:opacity-80"
                style={{ color: 'var(--color-text)' }}
              >
                ⚙️ Profile & Settings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:opacity-80"
              >
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
