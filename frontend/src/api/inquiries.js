import client from './client'

export const inquiriesAPI = {
  list: (params = {}) => client.get('/inquiries', { params }),
  get: (id) => client.get(`/inquiries/${id}`),
  create: (data) => client.post('/inquiries', data),
  update: (id, data, performedBy) =>
    client.put(`/inquiries/${id}`, data, { params: { performed_by: performedBy } }),
  updateStatus: (id, status, performedBy) =>
    client.patch(`/inquiries/${id}/status`, { status, performed_by: performedBy }),
  delete: (id, performedBy) =>
    client.delete(`/inquiries/${id}`, { params: { performed_by: performedBy } }),
}

export const partsAPI = {
  get: (id) => client.get(`/parts/${id}`),
  addToInquiry: (inquiryId, data, performedBy) =>
    client.post(`/inquiries/${inquiryId}/parts`, data, { params: { performed_by: performedBy } }),
  update: (id, data, performedBy) =>
    client.put(`/parts/${id}`, data, { params: { performed_by: performedBy } }),
  updateStatus: (id, status, performedBy) =>
    client.patch(`/parts/${id}/status`, { status, performed_by: performedBy }),
  delete: (id, performedBy) =>
    client.delete(`/parts/${id}`, { params: { performed_by: performedBy } }),
}
