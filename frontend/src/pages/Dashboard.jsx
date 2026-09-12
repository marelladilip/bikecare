import { useState, useEffect } from 'react'
import { useBike } from '../context/BikeContext'
import { dashboardService } from '../services/dataServices'
import { formatCurrency, formatOdometer, formatDate, formatNumber } from '../utils/formatters'
import { Link } from 'react-router-dom'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']

export default function Dashboard() {
  const { activeBike, bikes } = useBike()
  const [data, setData] = useState(null)
  const [tco, setTco] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (activeBike?.id) {
      loadDashboard(activeBike.id)
    }
  }, [activeBike])

  const loadDashboard = async (bikeId) => {
    setLoading(true)
    try {
      const [dashRes, tcoRes] = await Promise.all([
        dashboardService.getSummary(bikeId),
        dashboardService.getTCO(bikeId),
      ])
      setData(dashRes)
      setTco(tcoRes)
    } catch {
      setData(null)
      setTco(null)
    } finally {
      setLoading(false)
    }
  }

  if (bikes.length === 0) {
    return (
      <div className="card p-12 text-center max-w-lg mx-auto mt-10">
        <div className="text-5xl mb-4">🚗🏍️⚡</div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Welcome to Vehicle'Nest</h2>
        <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mt-1">Care That Keeps You Moving</p>
        <p className="text-sm mt-3 mb-6" style={{ color: 'var(--color-muted)' }}>
          To start tracking expenses, fuel/battery efficiency, and maintenance, add your first vehicle to the garage.
        </p>
        <Link
          to="/bikes"
          className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-500/25"
        >
          + Add Your First Vehicle
        </Link>
      </div>
    )
  }

  const kpis = data?.kpis

  const pieData = tco
    ? [
        { name: 'Fuel', value: Number(tco.fuel_expenses) },
        { name: 'Maintenance', value: Number(tco.maintenance_expenses) },
        { name: 'Insurance', value: Number(tco.insurance_expenses) },
        { name: 'Accessories', value: Number(tco.accessories_expenses) },
        { name: 'Other', value: Number(tco.other_expenses) },
      ].filter((item) => item.value > 0)
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Dashboard</h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            {activeBike ? `Analytics & Overview for ${activeBike.brand} ${activeBike.model}` : 'Select a bike to view insights'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/fuel"
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold btn-interactive shadow-sm hover:shadow-md"
          >
            + Log Fuel
          </Link>
          <Link
            to="/expenses"
            className="px-3.5 py-2 border rounded-xl text-xs font-semibold hover:opacity-80 btn-interactive"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          >
            + Add Expense
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card card-hover p-5">
          <div className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Total Running Expenses</div>
          <div className="text-2xl font-bold mt-2" style={{ color: 'var(--color-text)' }}>
            {formatCurrency(kpis?.total_expenses || 0)}
          </div>
          <div className="text-xs text-blue-500 mt-1">Fuel + Service + Spares</div>
        </div>

        <div className="card card-hover p-5">
          <div className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Average Fuel Economy</div>
          <div className="text-2xl font-bold mt-2" style={{ color: 'var(--color-text)' }}>
            {kpis?.average_mileage ? `${formatNumber(kpis.average_mileage)} km/L` : '—'}
          </div>
          <div className="text-xs text-emerald-500 mt-1">Calculated efficiency</div>
        </div>

        <div className="card card-hover p-5">
          <div className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Cost Per KM</div>
          <div className="text-2xl font-bold mt-2" style={{ color: 'var(--color-text)' }}>
            {kpis?.cost_per_km ? `${formatCurrency(kpis.cost_per_km)} / km` : '—'}
          </div>
          <div className="text-xs text-purple-500 mt-1">Running cost rate</div>
        </div>

        <div className="card card-hover p-5">
          <div className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Current Odometer</div>
          <div className="text-2xl font-bold mt-2" style={{ color: 'var(--color-text)' }}>
            {formatOdometer(activeBike?.current_odometer || 0)}
          </div>
          <div className="text-xs text-amber-500 mt-1">
            Distance: {formatOdometer(kpis?.total_distance || 0)}
          </div>
        </div>
      </div>

      {/* Charts & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Breakdown */}
        <div className="card p-5 lg:col-span-1">
          <h3 className="text-base font-bold mb-1" style={{ color: 'var(--color-text)' }}>Expense Distribution</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--color-muted)' }}>Breakdown by category</p>
          {pieData.length > 0 ? (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => formatCurrency(val)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2 text-xs">
                {pieData.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span style={{ color: 'var(--color-muted)' }}>{item.name}: {formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs" style={{ color: 'var(--color-muted)' }}>
              No expenses recorded yet
            </div>
          )}
        </div>

        {/* Total Cost of Ownership Overview */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-base font-bold mb-1" style={{ color: 'var(--color-text)' }}>Total Cost of Ownership (TCO)</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--color-muted)' }}>Purchase cost vs cumulative operating expenses</p>
          {tco ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border flex justify-between items-center" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
                <div>
                  <div className="text-xs" style={{ color: 'var(--color-muted)' }}>Total Ownership Cost (Vehicle + All Expenses)</div>
                  <div className="text-2xl font-bold text-blue-500 mt-1">{formatCurrency(tco.total_ownership_cost)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs" style={{ color: 'var(--color-muted)' }}>Effective Cost / KM</div>
                  <div className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                    {tco.total_cost_per_km ? `${formatCurrency(tco.total_cost_per_km)} / km` : '—'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="text-xs" style={{ color: 'var(--color-muted)' }}>Purchase Price</div>
                  <div className="font-semibold text-sm mt-1" style={{ color: 'var(--color-text)' }}>{formatCurrency(tco.purchase_price)}</div>
                </div>
                <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="text-xs" style={{ color: 'var(--color-muted)' }}>Total Fuel</div>
                  <div className="font-semibold text-sm mt-1 text-emerald-500">{formatCurrency(tco.fuel_expenses)}</div>
                </div>
                <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="text-xs" style={{ color: 'var(--color-muted)' }}>Maintenance</div>
                  <div className="font-semibold text-sm mt-1 text-amber-500">{formatCurrency(tco.maintenance_expenses)}</div>
                </div>
                <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="text-xs" style={{ color: 'var(--color-muted)' }}>Insurance & Other</div>
                  <div className="font-semibold text-sm mt-1 text-purple-500">
                    {formatCurrency(Number(tco.insurance_expenses) + Number(tco.accessories_expenses) + Number(tco.other_expenses))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs" style={{ color: 'var(--color-muted)' }}>
              Loading TCO metrics...
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity & Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card p-5">
          <h3 className="text-base font-bold mb-1" style={{ color: 'var(--color-text)' }}>Recent Activity</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--color-muted)' }}>Latest logs and records</p>
          {data?.recent_activity && data.recent_activity.length > 0 ? (
            <div className="divide-y text-sm" style={{ borderColor: 'var(--color-border)' }}>
              {data.recent_activity.map((act) => (
                <div key={act.id} className="py-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {act.type === 'FUEL' ? '⛽' : act.type === 'MAINTENANCE' ? '🔧' : '💰'}
                    </span>
                    <div>
                      <div className="font-medium" style={{ color: 'var(--color-text)' }}>{act.title}</div>
                      <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        {formatDate(act.date)} {act.odometer ? `• ${formatOdometer(act.odometer)}` : ''}
                      </div>
                    </div>
                  </div>
                  {act.amount != null && (
                    <div className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                      {formatCurrency(act.amount)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs" style={{ color: 'var(--color-muted)' }}>
              No recent activity recorded yet.
            </div>
          )}
        </div>

        {/* Reminders List */}
        <div className="card p-5">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>Upcoming Reminders</h3>
            <Link to="/reminders" className="text-xs text-blue-500 hover:underline">View All</Link>
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--color-muted)' }}>Services and renewals due soon</p>
          {data?.upcoming_reminders && data.upcoming_reminders.length > 0 ? (
            <div className="space-y-2.5">
              {data.upcoming_reminders.map((r) => (
                <div key={r.id} className="p-3 rounded-xl border flex justify-between items-center" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
                  <div className="flex items-center gap-2.5">
                    <span>🔔</span>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{r.title}</div>
                      <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        {r.due_date ? `Due on ${formatDate(r.due_date)}` : ''}
                        {r.due_odometer ? ` • at ${formatOdometer(r.due_odometer)}` : ''}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs" style={{ color: 'var(--color-muted)' }}>
              All caught up! No pending reminders.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
