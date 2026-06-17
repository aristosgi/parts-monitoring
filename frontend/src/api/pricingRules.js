import client from './client'

export const pricingRulesAPI = {
  list: () => client.get('/pricing-rules'),
  adminList: (pwd) => client.get('/admin/pricing-rules', { params: { admin_password: pwd } }),
  create: (data, pwd) =>
    client.post('/admin/pricing-rules', data, { params: { admin_password: pwd } }),
  update: (id, data, pwd) =>
    client.put(`/admin/pricing-rules/${id}`, data, { params: { admin_password: pwd } }),
  delete: (id, pwd) =>
    client.delete(`/admin/pricing-rules/${id}`, { params: { admin_password: pwd } }),
}
