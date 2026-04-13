import client from './client'

export const suppliersAPI = {
  list: () => client.get('/suppliers'),
  adminList: (pwd) => client.get('/admin/suppliers', { params: { admin_password: pwd } }),
  create: (data, pwd) => client.post('/admin/suppliers', data, { params: { admin_password: pwd } }),
  update: (id, data, pwd) => client.put(`/admin/suppliers/${id}`, data, { params: { admin_password: pwd } }),
  delete: (id, pwd) => client.delete(`/admin/suppliers/${id}`, { params: { admin_password: pwd } }),
  login: (password) => client.post('/admin/login', { password }),
}
