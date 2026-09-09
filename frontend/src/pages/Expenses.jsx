import { useState, useEffect } from 'react'
import { useBike } from '../context/BikeContext'
import { expenseService } from '../services/dataServices'
import { formatCurrency, formatDate, todayString } from '../utils/formatters'
import toast from 'react-hot-toast'

const EXPENSE_CATEGORIES = [
  'INSURANCE',
  'PUC',
  'ACCESSORIES',
  'PARKING',
  'TOLL',
  'CHALLAN',
  'WASH',
  'MODIFICATION',
  'OTHER',
]

export default function Expenses() {
  const { activeBike } = useBike()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    category: 'INSURANCE',
    amount: '',
    date: todayString(),
    payment_method: 'UPI',
    description: '',
  })

  useEffect(() => {
    if (activeBike?.id) {
      loadExpenses(activeBike.id)
    }
  }, [activeBike])

  const loadExpenses = async (bikeId) => {
    setLoading(true)
    try {
      const data = await expenseService.getAll(bikeId)
      setExpenses(data || [])
    } catch {
      setExpenses([])
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
      await expenseService.create(activeBike.id, {
        category: form.category,
        amount: Number(form.amount),
        date: form.date,
        payment_method: form.payment_method,
        description: form.description || null,
      })
      toast.success('Expense recorded! 💰')
      setShowModal(false)
      setForm({
        category: 'INSURANCE',
        amount: '',
        date: todayString(),
        payment_method: 'UPI',
        description: '',
      })
      loadExpenses(activeBike.id)
    } catch {
      toast.error('Failed to save expense')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return
    try {
      await expenseService.delete(id)
      toast.success('Expense deleted')
      loadExpenses(activeBike.id)
    } catch {
      toast.error('Failed to delete')
    }
  }

  const totalExpense = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>General Expenses</h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Record insurance, accessories, PUC, tolls, challans, and modifications
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5"
        >
          <span>+</span> Add Expense
        </button>
      </div>

      <div className="card p-4 flex justify-between items-center">
        <span className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>Total Recorded Other Expenses:</span>
        <span className="text-xl font-bold text-blue-500">{formatCurrency(totalExpense)}</span>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs font-semibold" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}>
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Category</th>
                <th className="p-4">Description</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4">Amount</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
              {expenses.length > 0 ? (
                expenses.map((e) => (
                  <tr key={e.id}>
                    <td className="p-4 font-medium">{formatDate(e.date)}</td>
                    <td className="p-4">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
                        {e.category}
                      </span>
                    </td>
                    <td className="p-4" style={{ color: 'var(--color-muted)' }}>{e.description || '—'}</td>
                    <td className="p-4 text-xs font-medium">{e.payment_method}</td>
                    <td className="p-4 font-bold">{formatCurrency(e.amount)}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="text-red-400 hover:text-red-500 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                    {loading ? 'Loading expenses...' : 'No expenses recorded yet. Click "+ Add Expense" to log one.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="card p-6 w-full max-w-md shadow-2xl relative">
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>Add Expense</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>Category *</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-lg border text-sm"
                  style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="amount"
                    placeholder="e.g. 2500"
                    value={form.amount}
                    required
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-lg border text-sm"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
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
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>Payment Method</label>
                <select
                  name="payment_method"
                  value={form.payment_method}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-lg border text-sm"
                  style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  <option value="UPI">UPI</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="DEBIT_CARD">Debit Card</option>
                  <option value="CASH">Cash</option>
                  <option value="NET_BANKING">Net Banking</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>Description</label>
                <input
                  name="description"
                  placeholder="e.g. Comprehensive insurance renewal, helmet..."
                  value={form.description}
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
                  {saving ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
