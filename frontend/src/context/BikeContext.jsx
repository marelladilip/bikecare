import { createContext, useContext, useState, useEffect } from 'react'
import { bikeService } from '../services/bikeService'
import { useAuth } from './AuthContext'

const BikeContext = createContext(null)

export const BikeProvider = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const [bikes, setBikes] = useState([])
  const [activeBike, setActiveBike] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      fetchBikes()
    } else {
      setBikes([])
      setActiveBike(null)
    }
  }, [isAuthenticated])

  const fetchBikes = async () => {
    setLoading(true)
    try {
      const data = await bikeService.getAll()
      setBikes(data)
      // Restore last active bike from localStorage or default to first
      const savedId = localStorage.getItem('bikecare_active_bike')
      const found = data.find((b) => b.id === savedId)
      setActiveBike(found || data[0] || null)
    } catch {
      setBikes([])
    } finally {
      setLoading(false)
    }
  }

  const switchBike = (bike) => {
    setActiveBike(bike)
    localStorage.setItem('bikecare_active_bike', bike.id)
  }

  const addBike = (bike) => {
    setBikes((prev) => [...prev, bike])
    setActiveBike(bike)
    localStorage.setItem('bikecare_active_bike', bike.id)
  }

  const updateBike = (updatedBike) => {
    setBikes((prev) => prev.map((b) => (b.id === updatedBike.id ? updatedBike : b)))
    if (activeBike?.id === updatedBike.id) setActiveBike(updatedBike)
  }

  const removeBike = (id) => {
    const remaining = bikes.filter((b) => b.id !== id)
    setBikes(remaining)
    if (activeBike?.id === id) {
      const next = remaining[0] || null
      setActiveBike(next)
      if (next) localStorage.setItem('bikecare_active_bike', next.id)
      else localStorage.removeItem('bikecare_active_bike')
    }
  }

  return (
    <BikeContext.Provider value={{ bikes, activeBike, loading, fetchBikes, switchBike, addBike, updateBike, removeBike }}>
      {children}
    </BikeContext.Provider>
  )
}

export const useBike = () => {
  const ctx = useContext(BikeContext)
  if (!ctx) throw new Error('useBike must be used within BikeProvider')
  return ctx
}
