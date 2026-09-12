import { useState, useEffect } from 'react'
import { useBike } from '../context/BikeContext'
import { reminderService } from '../services/dataServices'
import { formatDate, formatOdometer, todayString } from '../utils/formatters'
import toast from 'react-hot-toast'

export default function Reminders() {
  const { activeBike } = useBike()
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    title: '',
    reminder_type: 'DATE',
    due_date: '',
    due_odometer: '',
    notes: '',
  })

  useEffect(() => {
    if (activeBike?.id) {
      loadReminders(activeBike.id)
    }
  }, [activeBike])

  const loadReminders = async (bikeId) => {
    setLoading(true)
    try {
      const data = await reminderService.getAll(bikeId)
      setReminders(data || [])
    } catch {
      setReminders([])
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!activeBike) {
      toast.error('Please select a bike')
      return
    }
    setSaving(true)
    try {
      await reminderService.create(activeBike.id, {
        title: form.title,
        reminder_type: form.reminder_type,
        due_date: form.due_date || null,
        due_odometer: form.due_odometer ? Number(form.due_odometer) : null,
        notes: form.notes || null,
      })
      toast.success('Reminder added! 🔔')
      setShowModal(false)
      setForm({ title: '', reminder_type: 'DATE', due_date: '', due_odometer: '', notes: '' })
      loadReminders(activeBike.id)
    } catch {
      toast.error('Failed to create reminder')
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = async (id) => {
    try {
      await reminderService.complete(id, {})
      toast.success('Marked as completed! ✅')
      loadReminders(activeBike.id)
    } catch {
      toast.error('Failed to complete reminder')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this reminder?')) return
    try {
      await reminderService.delete(id)
      toast.success('Reminder deleted')
      loadReminders(activeBike.id)
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Service & Expiry Reminders</h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Never miss an engine oil change, PUC renewal, or insurance expiry
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5"
        >
          <span>+</span> Add Reminder
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reminders.map((r) => {
          const isCompleted = r.status === 'COMPLETED'
          return (
            <div key={r.id} className="card card-hover p-5 relative border flex flex-col justify-between" style={{ borderColor: 'var(--color-border)' }}>
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-2xl">🔔</span>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    isCompleted ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {r.status}
                  </span>
                </div>
                <h3 className="text-base font-bold mt-3" style={{ color: 'var(--color-text)' }}>{r.title}</h3>
                <div className="text-xs mt-2 space-y-1" style={{ color: 'var(--color-muted)' }}>
                  {r.due_date && <div>📅 Due Date: <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{formatDate(r.due_date)}</span></div>}
                  {r.due_odometer && <div>🏍️ Due Odometer: <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{formatOdometer(r.due_odometer)}</span></div>}
                  {r.notes && <div className="mt-2 italic">"{r.notes}"</div>}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
                {!isCompleted ? (
                  <button
                    onClick={() => handleComplete(r.id)}
                    className="text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium btn-interactive"
                  >
                    ✓ Mark Done
                  </button>
                ) : (
                  <span className="text-xs text-emerald-500 font-semibold">Done</span>
                )}
                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-red-400 hover:text-red-500 text-xs font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="card animate-modal-pop p-6 w-full max-w-md shadow-2xl relative">
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>Add Reminder</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>Title *</label>
                <input
                  name="title"
                  placeholder="e.g. Engine Oil Change, PUC Renewal, Brake Pad Check"
                  value={form.title}
                  required
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-lg border text-sm"
                  style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>Due Date</label>
                  <input
                    type="date"
                    name="due_date"
                    value={form.due_date}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-lg border text-sm"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>Due Odometer (KM)</label>
                  <input
                    type="number"
                    name="due_odometer"
                    placeholder="e.g. 8000"
                    value={form.due_odometer}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-lg border text-sm"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>Notes</label>
                <input
                  name="notes"
                  placeholder="e.g. Recommended Motul 7100 10W50 oil"
                  value={form.notes}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-lg border text-sm"
                  style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold"
                >
                  {saving ? 'Saving...' : 'Save Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
