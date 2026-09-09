import { useState, useEffect } from 'react'
import { useBike } from '../context/BikeContext'
import { dashboardService } from '../services/dataServices'
import { formatCurrency, formatOdometer } from '../utils/formatters'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'

export default function Reports() {
  const { activeBike } = useBike()
  const [tco, setTco] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (activeBike?.id) {
      loadReports(activeBike.id)
    }
  }, [activeBike])

  const loadReports = async (bikeId) => {
    setLoading(true)
    try {
      const data = await dashboardService.getTCO(bikeId)
      setTco(data)
    } catch {
      setTco(null)
    } finally {
      setLoading(false)
    }
  }

  const chartData = tco
    ? [
        { name: 'Vehicle Purchase', amount: Number(tco.purchase_price) },
        { name: 'Fuel', amount: Number(tco.fuel_expenses) },
        { name: 'Maintenance', amount: Number(tco.maintenance_expenses) },
        { name: 'Insurance', amount: Number(tco.insurance_expenses) },
        { name: 'Accessories', amount: Number(tco.accessories_expenses) },
        { name: 'Other', amount: Number(tco.other_expenses) },
      ]
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Financial Reports & Analytics</h1>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          Detailed breakdown of total vehicle investments, operating expenses and cost metrics
        </p>
      </div>

      {tco && (
        <div className="card p-6">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text)' }}>Cumulative Spending Overview</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} tickFormatter={(val) => `₹${val}`} />
                <Tooltip formatter={(val) => formatCurrency(val)} />
                <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tco && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="text-xs" style={{ color: 'var(--color-muted)' }}>Total Lifecycle Cost</div>
            <div className="text-2xl font-bold text-blue-500 mt-2">{formatCurrency(tco.total_ownership_cost)}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>Including bike purchase + all lifetime expenses</div>
          </div>

          <div className="card p-5">
            <div className="text-xs" style={{ color: 'var(--color-muted)' }}>Total Running Cost Rate</div>
            <div className="text-2xl font-bold text-purple-500 mt-2">
              {tco.total_cost_per_km ? `${formatCurrency(tco.total_cost_per_km)} / km` : '—'}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>Total TCO / distance traveled</div>
          </div>

          <div className="card p-5">
            <div className="text-xs" style={{ color: 'var(--color-muted)' }}>Maintenance Rate</div>
            <div className="text-2xl font-bold text-amber-500 mt-2">
              {tco.maintenance_cost_per_km ? `${formatCurrency(tco.maintenance_cost_per_km)} / km` : '—'}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>Service cost per kilometer</div>
          </div>
        </div>
      )}
    </div>
  )
}
