import axios from 'axios'

// Use relative /api path in both dev and production
// In development: Vite proxy handles it -> http://localhost:8000/api
// In production: nginx proxy handles it -> backend:8000/api (via docker network)
const API_URL = '/api'

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default client
