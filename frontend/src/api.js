import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE,
  headers: { 'ngrok-skip-browser-warning': 'true' },
})

export const predict      = (payload)           => api.post('/predict',        payload)
export const simulate     = (payload)           => api.post('/simulate',       payload)
export const getEvents    = (limit=100,offset=0)=> api.get(`/events?limit=${limit}&offset=${offset}`)
export const getRisk      = ()                  => api.get('/corridors/risk')
export const getInsights  = ()                  => api.get('/insights')
export const getHealth    = ()                  => api.get('/health')

export default api