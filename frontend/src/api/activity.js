import client from './client'

export const activityAPI = {
  global: (params = {}) => client.get('/activity', { params }),
  forPart: (partId, limit = 100) => client.get(`/activity/part/${partId}`, { params: { limit } }),
}
