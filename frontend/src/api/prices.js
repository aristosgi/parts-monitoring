import client from './client'

export const pricesAPI = {
  getForPart: (partId) => client.get(`/prices/part/${partId}`),
  add: (partId, data, performedBy) => client.post(`/prices/part/${partId}`, data, { params: { performed_by: performedBy } }),
  update: (priceId, data, performedBy) => client.put(`/prices/${priceId}`, data, { params: { performed_by: performedBy } }),
  delete: (priceId, performedBy) => client.delete(`/prices/${priceId}`, { params: { performed_by: performedBy } }),
}
