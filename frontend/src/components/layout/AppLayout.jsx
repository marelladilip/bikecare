import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function AppLayout() {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-bg)' }}>
        <div className="text-center animate-fade-in">
          <div className="text-4xl mb-3 animate-float">🚗</div>
          <div className="text-base font-bold" style={{ color: 'var(--color-text)' }}>Vehicle'Nest</div>
          <div className="text-xs text-blue-500 mt-0.5">Care That Keeps You Moving</div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-4 md:p-6 overflow-auto flex flex-col justify-between">
          <div key={location.pathname} className="animate-fade-in">
            <Outlet />
          </div>
          <footer className="mt-12 pt-4 pb-2 border-t text-center text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}>
            <span>Vehicle'Nest • </span>
            <span className="italic text-slate-400">"Care That Keeps You Moving"</span>
            <span> • Crafted with ❤️ </span>
            <span className="font-semibold text-blue-500">By Marella Dilip</span>
          </footer>
        </main>
      </div>
    </div>
  )
}
