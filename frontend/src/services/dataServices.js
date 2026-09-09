import api from './api'

export const fuelService = {
  getAll: async (bikeId, params = {}) => {
    const res = await api.get(`/bikes/${bikeId}/fuel`, { params })
    return res.data
  },
  create: async (bikeId, data) => {
    const res = await api.post(`/bikes/${bikeId}/fuel`, data)
    return res.data
  },
  update: async (id, data) => {
    const res = await api.put(`/fuel/${id}`, data)
    return res.data
  },
  delete: async (id) => {
    const res = await api.delete(`/fuel/${id}`)
    return res.data
  },
  getAnalytics: async (bikeId) => {
    const res = await api.get(`/bikes/${bikeId}/fuel/analytics`)
    return res.data
  },
}

export const maintenanceService = {
  getAll: async (bikeId, params = {}) => {
    const res = await api.get(`/bikes/${bikeId}/maintenance`, { params })
    return res.data
  },
  create: async (bikeId, data) => {
    const res = await api.post(`/bikes/${bikeId}/maintenance`, data)
    return res.data
  },
  update: async (id, data) => {
    const res = await api.put(`/maintenance/${id}`, data)
    return res.data
  },
  delete: async (id) => {
    const res = await api.delete(`/maintenance/${id}`)
    return res.data
  },
  getCategories: async () => {
    const res = await api.get('/maintenance/categories')
    return res.data
  },
  createCategory: async (data) => {
    const res = await api.post('/maintenance/categories', data)
    return res.data
  },
}

export const expenseService = {
  getAll: async (bikeId, params = {}) => {
    const res = await api.get(`/bikes/${bikeId}/expenses`, { params })
    return res.data
  },
  create: async (bikeId, data) => {
    const res = await api.post(`/bikes/${bikeId}/expenses`, data)
    return res.data
  },
  update: async (id, data) => {
    const res = await api.put(`/expenses/${id}`, data)
    return res.data
  },
  delete: async (id) => {
    const res = await api.delete(`/expenses/${id}`)
    return res.data
  },
}

export const dashboardService = {
  getSummary: async (bikeId) => {
    const res = await api.get(`/dashboard/${bikeId}`)
    return res.data
  },
  getAnalytics: async (bikeId, range = '6m') => {
    const res = await api.get(`/analytics/${bikeId}`, { params: { range } })
    return res.data
  },
  getTCO: async (bikeId) => {
    const res = await api.get(`/tco/${bikeId}`)
    return res.data
  },
}

export const reminderService = {
  getAll: async (bikeId) => {
    const res = await api.get(`/bikes/${bikeId}/reminders`)
    return res.data
  },
  create: async (bikeId, data) => {
    const res = await api.post(`/bikes/${bikeId}/reminders`, data)
    return res.data
  },
  update: async (id, data) => {
    const res = await api.put(`/reminders/${id}`, data)
    return res.data
  },
  complete: async (id, data) => {
    const res = await api.patch(`/reminders/${id}/complete`, data)
    return res.data
  },
  delete: async (id) => {
    const res = await api.delete(`/reminders/${id}`)
    return res.data
  },
}
