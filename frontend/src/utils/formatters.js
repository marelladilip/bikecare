// Format currency with symbol
export const formatCurrency = (amount, symbol = '₹') => {
  if (amount == null || isNaN(amount)) return `${symbol}0`
  return `${symbol}${Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

// Format odometer reading
export const formatOdometer = (value, unit = 'KM') => {
  if (value == null) return '—'
  return `${Number(value).toLocaleString('en-IN')} ${unit}`
}

// Format decimal number
export const formatNumber = (value, decimals = 2) => {
  if (value == null || isNaN(value)) return '—'
  return Number(value).toFixed(decimals)
}

// Format date as "Sep 5, 2026"
export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Format date as input value "2026-09-05"
export const toInputDate = (dateStr) => {
  if (!dateStr) return ''
  return dateStr.split('T')[0]
}

// Return today's date as "YYYY-MM-DD"
export const todayString = () => {
  return new Date().toISOString().split('T')[0]
}

// Days until expiry (negative means overdue)
export const daysUntil = (dateStr) => {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24))
  return diff
}

// Expiry badge helper: returns { label, color }
export const expiryStatus = (dateStr) => {
  const days = daysUntil(dateStr)
  if (days === null) return null
  if (days < 0) return { label: `Overdue by ${Math.abs(days)}d`, color: 'red' }
  if (days === 0) return { label: 'Due Today', color: 'orange' }
  if (days <= 30) return { label: `Due in ${days}d`, color: 'yellow' }
  return { label: `${days}d left`, color: 'green' }
}

// Truncate long text
export const truncate = (str, n = 50) => {
  if (!str) return ''
  return str.length > n ? `${str.slice(0, n)}…` : str
}

// Get error message from Axios error
export const getErrorMessage = (error) => {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    'An unexpected error occurred'
  )
}
