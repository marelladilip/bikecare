import { NavLink } from 'react-router-dom'
import { useBike } from '../../context/BikeContext'

const navItems = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/bikes', icon: '🏍️', label: 'My Bikes' },
  { to: '/fuel', icon: '⛽', label: 'Fuel Log' },
  { to: '/maintenance', icon: '🔧', label: 'Maintenance' },
  { to: '/expenses', icon: '💰', label: 'Expenses' },
  { to: '/reminders', icon: '🔔', label: 'Reminders' },
  { to: '/reports', icon: '📄', label: 'Reports' },
  { to: '/profile', icon: '⚙️', label: 'Settings' },
]

export default function Sidebar() {
  const { activeBike } = useBike()

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen shrink-0 transition-colors duration-200"
      style={{ background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' }}>

      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3 group cursor-pointer"
        style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform duration-200 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
          <span className="group-hover:animate-float inline-block">🏍️</span>
        </div>
        <div>
          <div className="font-bold text-sm tracking-tight" style={{ color: 'var(--color-text)' }}>BikeCare</div>
          <div className="text-[11px] font-medium" style={{ color: 'var(--color-muted)' }}>Expense & Care Hub</div>
        </div>
      </div>

      {/* Active Bike Badge */}
      {activeBike && (
        <div className="mx-3 mt-4 px-3 py-2.5 rounded-xl border transition-all duration-200 hover:border-blue-400"
          style={{ background: 'rgba(59,130,246,0.06)', borderColor: 'rgba(59,130,246,0.2)' }}>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[11px] font-semibold text-blue-500 uppercase tracking-wider">Active Bike</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="text-sm font-bold truncate" style={{ color: 'var(--color-text)' }}>
            {activeBike.brand} {activeBike.model}
          </div>
          <div className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
            {activeBike.registration_number || 'No Reg Number'}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 mt-4 space-y-1">
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'text-blue-500 shadow-sm translate-x-1'
                  : 'hover:translate-x-1 hover:opacity-90'
              }`
            }
            style={({ isActive }) => ({
              background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
              color: isActive ? '#3b82f6' : 'var(--color-muted)',
            })}
          >
            <span className="text-base transition-transform group-hover:scale-110">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 text-xs space-y-1" style={{ color: 'var(--color-muted)', borderTop: '1px solid var(--color-border)' }}>
        <div className="font-semibold text-slate-400">BikeCare v1.0.0</div>
        <div className="text-[11px] text-blue-500 font-medium">By Marella Dilip</div>
      </div>
    </aside>
  )
}
