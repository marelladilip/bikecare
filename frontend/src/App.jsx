import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { BikeProvider } from './context/BikeContext'
import { ThemeProvider } from './context/ThemeContext'
import AppLayout from './components/layout/AppLayout'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Bikes from './pages/Bikes'
import Fuel from './pages/Fuel'
import Maintenance from './pages/Maintenance'
import Expenses from './pages/Expenses'
import Reminders from './pages/Reminders'
import Reports from './pages/Reports'
import Profile from './pages/Profile'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BikeProvider>
          <BrowserRouter>
            <Toaster position="top-right" />
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected App Routes */}
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="bikes" element={<Bikes />} />
                <Route path="fuel" element={<Fuel />} />
                <Route path="maintenance" element={<Maintenance />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="reminders" element={<Reminders />} />
                <Route path="reports" element={<Reports />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </BikeProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
