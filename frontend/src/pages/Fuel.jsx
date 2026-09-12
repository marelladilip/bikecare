import { useState, useEffect } from 'react'
import { useBike } from '../context/BikeContext'
import { fuelService } from '../services/dataServices'
import { formatCurrency, formatOdometer, formatDate, formatNumber, todayString, getErrorMessage } from '../utils/formatters'
import toast from 'react-hot-toast'

export default function Fuel() {
  const { activeBike, fetchBikes } = useBike()
  const [records, setRecords] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    date: todayString(),
    odometer: '',
    litres: '',
    price_per_litre: '',
    petrol_station: '',
    is_full_tank: true,
    notes: '',
  })

  useEffect(() => {
    if (activeBike?.id) {
      loadData(activeBike.id)
    }
  }, [activeBike])

  const loadData = async (bikeId) => {
    setLoading(true)
    try {
      const [logs, stats] = await Promise.all([
        fuelService.getAll(bikeId),
        fuelService.getAnalytics(bikeId),
      ])
      setRecords(logs || [])
      setAnalytics(stats)
    } catch {
      setRecords([])
      setAnalytics(null)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const calculatedTotal =
    form.litres && form.price_per_litre
      ? (Number(form.litres) * Number(form.price_per_litre)).toFixed(2)
      : '0.00'

  const openAddModal = () => {
    setEditingRecord(null)
    setForm({
      date: todayString(),
      odometer: activeBike?.current_odometer || '',
      litres: '',
      price_per_litre: '105.00',
      petrol_station: '',
      is_full_tank: true,
      notes: '',
    })
    setShowModal(true)
  }

  const openEditModal = (record) => {
    setEditingRecord(record)
    setForm({
      date: record.date ? record.date.split('T')[0] : todayString(),
      odometer: record.odometer,
      litres: record.litres,
      price_per_litre: record.price_per_litre,
      petrol_station: record.petrol_station || '',
      is_full_tank: record.is_full_tank ?? true,
      notes: record.notes || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!activeBike) {
      toast.error('Please select an active bike')
      return
    }
    setSaving(true)
    try {
      const payload = {
        date: form.date,
        odometer: Number(form.odometer),
        litres: Number(form.litres),
        price_per_litre: Number(form.price_per_litre),
        total_amount: Number(calculatedTotal),
        petrol_station: form.petrol_station || null,
        is_full_tank: form.is_full_tank,
        notes: form.notes || null,
      }

      if (editingRecord) {
        await fuelService.update(editingRecord.id, payload)
        toast.success('Fuel log updated! ⛽')
      } else {
        await fuelService.create(activeBike.id, payload)
        toast.success('Fuel log added! Mileage updated ⛽')
      }

      setShowModal(false)
      setEditingRecord(null)
      loadData(activeBike.id)
      fetchBikes()
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Failed to save fuel log')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this fuel record?')) return
    try {
      await fuelService.delete(id)
      toast.success('Record deleted')
      loadData(activeBike.id)
      fetchBikes()
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Failed to delete')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Fuel Logs</h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Track mileage, fuel consumption, and petrol costs
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5"
        >
          <span>+</span> Add Refill
        </button>
      </div>

      {/* Analytics Summary Banner */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="text-xs" style={{ color: 'var(--color-muted)' }}>Average Mileage</div>
            <div className="text-xl font-bold text-emerald-500 mt-1">
              {analytics.average_mileage ? `${formatNumber(analytics.average_mileage)} km/L` : '—'}
            </div>
          </div>
          <div className="card p-4">
            <div className="text-xs" style={{ color: 'var(--color-muted)' }}>Best Mileage</div>
            <div className="text-xl font-bold text-blue-500 mt-1">
              {analytics.best_mileage ? `${formatNumber(analytics.best_mileage)} km/L` : '—'}
            </div>
          </div>
          <div className="card p-4">
            <div className="text-xs" style={{ color: 'var(--color-muted)' }}>Fuel Cost / KM</div>
            <div className="text-xl font-bold text-purple-500 mt-1">
              {analytics.average_fuel_cost_per_km ? `${formatCurrency(analytics.average_fuel_cost_per_km)}/km` : '—'}
            </div>
          </div>
          <div className="card p-4">
            <div className="text-xs" style={{ color: 'var(--color-muted)' }}>Total Fuel Spent</div>
            <div className="text-xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>
              {formatCurrency(analytics.total_fuel_spent)}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs font-semibold" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}>
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Odometer</th>
                <th className="p-4">Quantity</th>
                <th className="p-4">Rate / L</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Calculated Mileage</th>
                <th className="p-4">Cost / KM</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
              {records.length > 0 ? (
                records.map((r) => (
                  <tr key={r.id}>
                    <td className="p-4 font-medium">{formatDate(r.date)}</td>
                    <td className="p-4 font-semibold">{formatOdometer(r.odometer)}</td>
                    <td className="p-4">{formatNumber(r.litres)} L</td>
                    <td className="p-4">{formatCurrency(r.price_per_litre)}</td>
                    <td className="p-4 font-semibold">{formatCurrency(r.total_amount)}</td>
                    <td className="p-4 font-medium">
                      {r.mileage != null ? (
                        <span className="text-emerald-500 font-semibold">{formatNumber(r.mileage)} km/L</span>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Initial / N/A</span>
                      )}
                    </td>
                    <td className="p-4">
                      {r.fuel_cost_per_km != null ? `${formatCurrency(r.fuel_cost_per_km)}/km` : '—'}
                    </td>
                    <td className="p-4 text-right space-x-3">
                      <button
                        onClick={() => openEditModal(r)}
                        className="text-blue-500 hover:text-blue-600 text-xs font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-red-400 hover:text-red-500 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                    {loading ? 'Loading fuel records...' : 'No fuel logs yet. Click "+ Add Refill" to record your first fill-up.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Fuel Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="card animate-modal-pop p-6 w-full max-w-md shadow-2xl relative">
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
              {editingRecord ? 'Edit Fuel Refill' : 'Add Fuel Refill'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    required
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-lg border text-sm"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>Odometer Reading *</label>
                  <input
                    type="number"
                    name="odometer"
                    placeholder="e.g. 96600"
                    value={form.odometer}
                    required
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-lg border text-sm"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>Fuel Quantity (L) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="litres"
                    placeholder="e.g. 1.28"
                    value={form.litres}
                    required
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-lg border text-sm"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>Price per Litre (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price_per_litre"
                    placeholder="e.g. 117.20"
                    value={form.price_per_litre}
                    required
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-lg border text-sm"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg border flex justify-between items-center" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
                <span className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Total Cost:</span>
                <span className="text-base font-bold text-blue-500">₹{calculatedTotal}</span>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>Petrol Pump / Location</label>
                <input
                  name="petrol_station"
                  placeholder="e.g. Indian Oil, HP Pump, Shell"
                  value={form.petrol_station}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-lg border text-sm"
                  style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingRecord(null)
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium border"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  {saving ? 'Saving...' : editingRecord ? 'Update Record' : 'Save Fuel Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
