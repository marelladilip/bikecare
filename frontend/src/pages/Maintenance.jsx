import { useState, useEffect } from 'react'
import { useBike } from '../context/BikeContext'
import { maintenanceService } from '../services/dataServices'
import { formatCurrency, formatOdometer, formatDate, todayString } from '../utils/formatters'
import toast from 'react-hot-toast'

export default function Maintenance() {
  const { activeBike, fetchBikes } = useBike()
  const [records, setRecords] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    category_id: '',
    date: todayString(),
    odometer: '',
    cost: '',
    service_center: '',
    parts_replaced: '',
    description: '',
    next_due_date: '',
    next_due_odometer: '',
    notes: '',
  })

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    if (activeBike?.id) {
      loadRecords(activeBike.id)
    }
  }, [activeBike])

  const loadCategories = async () => {
    try {
      const cats = await maintenanceService.getCategories()
      if (cats && cats.length > 0) {
        setCategories(cats)
        setForm((f) => ({ ...f, category_id: f.category_id || cats[0].id }))
      } else {
        setCategories([])
      }
    } catch {
      setCategories([])
    }
  }

  const loadRecords = async (bikeId) => {
    setLoading(true)
    try {
      const data = await maintenanceService.getAll(bikeId)
      setRecords(data || [])
    } catch {
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleOpenModal = () => {
    loadCategories()
    setForm((f) => ({
      ...f,
      category_id: f.category_id || categories[0]?.id || '',
      odometer: activeBike?.current_odometer || '',
      date: todayString(),
    }))
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!activeBike) {
      toast.error('Please select a vehicle first')
      return
    }
    if (!form.category_id) {
      toast.error('Please select a service category')
      return
    }
    setSaving(true)
    try {
      await maintenanceService.create(activeBike.id, {
        category_id: form.category_id,
        date: form.date,
        odometer: Number(form.odometer),
        cost: Number(form.cost || 0),
        service_center: form.service_center || null,
        parts_replaced: form.parts_replaced || null,
        description: form.description || null,
        next_due_date: form.next_due_date || null,
        next_due_odometer: form.next_due_odometer ? Number(form.next_due_odometer) : null,
        notes: form.notes || null,
      })
      toast.success('Service record saved! 🔧')
      setShowModal(false)
      loadRecords(activeBike.id)
      fetchBikes()
    } catch (err) {
      toast.error('Failed to save maintenance record')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this maintenance record?')) return
    try {
      await maintenanceService.delete(id)
      toast.success('Record deleted')
      loadRecords(activeBike.id)
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Maintenance & Service</h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Track repairs, periodic service logs, and parts replacements
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-md shadow-blue-500/20"
        >
          <span>+</span> Add Service Record
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs font-semibold" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}>
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Service Type</th>
                <th className="p-4">Odometer</th>
                <th className="p-4">Service Center</th>
                <th className="p-4">Parts / Description</th>
                <th className="p-4">Cost</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
              {records.length > 0 ? (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-500/5 transition-colors">
                    <td className="p-4 font-medium">{formatDate(r.date)}</td>
                    <td className="p-4 font-semibold text-blue-500">{r.category_name}</td>
                    <td className="p-4">{formatOdometer(r.odometer)}</td>
                    <td className="p-4" style={{ color: 'var(--color-muted)' }}>{r.service_center || '—'}</td>
                    <td className="p-4 text-xs max-w-xs truncate" style={{ color: 'var(--color-muted)' }}>
                      {r.description || r.parts_replaced || '—'}
                    </td>
                    <td className="p-4 font-bold">{formatCurrency(r.cost)}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-red-400 hover:text-red-500 text-xs font-medium px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                    {loading ? 'Loading service history...' : 'No maintenance records found. Click "+ Add Service Record" to record service.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Maintenance Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-[9999] overflow-y-auto">
          <div className="card p-6 w-full max-w-lg shadow-2xl relative m-auto border"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-card, var(--color-surface))' }}>
            
            <div className="flex items-center justify-between mb-5 pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-2">
                <span className="text-xl">🔧</span>
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Record Maintenance</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>
                  Service Category *
                </label>
                <select
                  name="category_id"
                  value={form.category_id}
                  required
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  <option value="" disabled>-- Select Service Category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  {categories.length === 0 && (
                    <>
                      <option value="temp-1">General Periodic Service</option>
                      <option value="temp-2">Engine Oil & Oil Filter Change</option>
                      <option value="temp-3">Self Motor / Starter Repair</option>
                      <option value="temp-4">Brake Pads / Disc Service</option>
                    </>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    required
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>Odometer (KM) *</label>
                  <input
                    type="number"
                    name="odometer"
                    placeholder="e.g. 96679"
                    value={form.odometer}
                    required
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>Total Cost (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="cost"
                    placeholder="e.g. 1200"
                    value={form.cost}
                    required
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>Service Center</label>
                  <input
                    name="service_center"
                    placeholder="e.g. Home / Local Garage"
                    value={form.service_center}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>Parts Replaced / Work Description</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="e.g. Self Motor Replacement, Oil Change..."
                  value={form.description}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium border hover:bg-slate-500/10 transition-colors"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
