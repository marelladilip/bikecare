import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('bikecare_token')
    const storedUser = localStorage.getItem('bikecare_user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = (data) => {
    const { access_token, user: userData } = data
    setToken(access_token)
    setUser(userData)
    localStorage.setItem('bikecare_token', access_token)
    localStorage.setItem('bikecare_user', JSON.stringify(userData))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('bikecare_token')
    localStorage.removeItem('bikecare_user')
    localStorage.removeItem('bikecare_active_bike')
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('bikecare_user', JSON.stringify(updatedUser))
  }

  const isAuthenticated = !!token

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
