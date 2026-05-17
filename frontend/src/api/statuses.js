import client from './client'

export const statusesAPI = {
  list: (scope) => client.get('/statuses', { params: scope ? { scope } : {} }),
  adminList: (pwd, scope) =>
    client.get('/admin/statuses', { params: { admin_password: pwd, ...(scope ? { scope } : {}) } }),
  create: (data, pwd) =>
    client.post('/admin/statuses', data, { params: { admin_password: pwd } }),
  update: (id, data, pwd) =>
    client.put(`/admin/statuses/${id}`, data, { params: { admin_password: pwd } }),
  delete: (id, pwd) =>
    client.delete(`/admin/statuses/${id}`, { params: { admin_password: pwd } }),
}
