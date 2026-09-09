import api from './api'

export const bikeService = {
  getAll: async () => {
    const res = await api.get('/bikes')
    return res.data
  },
  create: async (data) => {
    const res = await api.post('/bikes', data)
    return res.data
  },
  getById: async (id) => {
    const res = await api.get(`/bikes/${id}`)
    return res.data
  },
  update: async (id, data) => {
    const res = await api.put(`/bikes/${id}`, data)
    return res.data
  },
  delete: async (id) => {
    const res = await api.delete(`/bikes/${id}`)
    return res.data
  },
}
