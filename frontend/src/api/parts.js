import client from './client'

export const partsAPI = {
  list: (params = {}) => client.get('/parts', { params }),
  get: (id) => client.get(`/parts/${id}`),
  create: (data) => client.post('/parts', data),
  update: (id, data, performedBy) => client.put(`/parts/${id}`, data, { params: { performed_by: performedBy } }),
  updateStatus: (id, status, performedBy) => client.patch(`/parts/${id}/status`, { status, performed_by: performedBy }),
  delete: (id, performedBy) => client.delete(`/parts/${id}`, { params: { performed_by: performedBy } }),
}
