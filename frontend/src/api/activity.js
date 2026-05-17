import client from './client'

export const activityAPI = {
  global: (params = {}) => client.get('/activity', { params }),
  forInquiry: (inquiryId, limit = 100) =>
    client.get(`/activity/inquiry/${inquiryId}`, { params: { limit } }),
}
