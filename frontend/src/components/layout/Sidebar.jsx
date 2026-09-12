import { NavLink } from 'react-router-dom'
import { useBike } from '../../context/BikeContext'
import { getVehicleIcon } from '../../utils/formatters'

const navItems = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/bikes', icon: '🚗', label: 'My Vehicles' },
  { to: '/fuel', icon: '⛽', label: 'Fuel / Energy Log' },
  { to: '/maintenance', icon: '🔧', label: 'Maintenance' },
  { to: '/expenses', icon: '💰', label: 'Expenses' },
  { to: '/reminders', icon: '🔔', label: 'Reminders' },
  { to: '/reports', icon: '📄', label: 'Reports' },
  { to: '/profile', icon: '⚙️', label: 'Settings' },
]

export default function Sidebar() {
  const { activeBike } = useBike()
  const vehicleIcon = activeBike ? getVehicleIcon(activeBike.vehicle_type) : '🚗'

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen shrink-0 transition-colors duration-200"
      style={{ background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' }}>

      {/* Logo & Tagline */}
      <div className="px-5 py-5 flex items-center gap-3.5 group cursor-pointer"
        style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-all duration-300 shadow-md"
          style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)' }}>
          <span className="group-hover:animate-float inline-block">🚗</span>
        </div>
        <div className="overflow-hidden">
          <div className="font-extrabold text-base tracking-tight" style={{ color: 'var(--color-text)' }}>
            Vehicle'Nest
          </div>
          <div className="text-[11px] font-medium text-blue-500 truncate">
            Care That Keeps You Moving
          </div>
        </div>
      </div>

      {/* Active Vehicle Badge */}
      {activeBike && (
        <div className="mx-3 mt-4 px-3.5 py-3 rounded-2xl border transition-all duration-200 hover:border-blue-400 shadow-sm"
          style={{ background: 'rgba(59,130,246,0.06)', borderColor: 'rgba(59,130,246,0.2)' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-blue-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>{vehicleIcon}</span>
              <span>Active Vehicle</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="text-sm font-bold truncate" style={{ color: 'var(--color-text)' }}>
            {activeBike.brand} {activeBike.model}
          </div>
          <div className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
            {activeBike.registration_number || 'No Reg Number'} • {activeBike.vehicle_type || 'BIKE'}
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
                  ? 'text-blue-500 shadow-sm translate-x-1 font-semibold'
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
        <div className="font-semibold text-slate-400">Vehicle'Nest v2.0</div>
        <div className="text-[11px] text-blue-500 font-semibold">By Marella Dilip</div>
      </div>
    </aside>
  )
}
