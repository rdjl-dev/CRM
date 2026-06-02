/**
 * TicketCRM — Cliente HTTP (axios)
 * Desarrollado por: Raúl de Jesús Larios
 */

import axios from 'axios'

const LOCAL_API_URL = 'http://localhost:3001'
const PROD_API_URL = 'https://crm-am6w.onrender.com'

function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL?.trim()
  if (envUrl) return envUrl.replace(/\/$/, '')

  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return LOCAL_API_URL
  }

  return PROD_API_URL
}

function goToLogin() {
  if (typeof window === 'undefined') return
  const basePath = window.location.pathname.replace(/\/$/, '')
  window.location.replace(`${window.location.origin}${basePath}/#/login`)
}

const api = axios.create({
  baseURL: `${getApiBaseUrl()}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// Inyectar token JWT en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirigir al login si el token expira
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      goToLogin()
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:            (data) => api.post('/auth/login', data),
  register:         (data) => api.post('/auth/register', data),
  google:           (credential) => api.post('/auth/google', { credential }),
  forgotPassword:   (email) => api.post('/auth/forgot-password', { email }),
  resetPassword:    (data) => api.post('/auth/reset-password', data),
  me:               () => api.get('/auth/me'),
  setup2FA:         () => api.post('/auth/2fa/setup'),
  verify2FA:        (token) => api.post('/auth/2fa/verify', { token }),
  authenticate2FA:  (data) => api.post('/auth/2fa/authenticate', data),
  disable2FA:       (totpCode) => api.post('/auth/2fa/disable', { totpCode }),
}

// ── Tickets ───────────────────────────────────────────────────────────────────
export const ticketsAPI = {
  list:         (params) => api.get('/tickets', { params }),
  get:          (id) => api.get(`/tickets/${id}`),
  create:       (data) => api.post('/tickets', data),
  update:       (id, data) => api.patch(`/tickets/${id}`, data),
  delete:       (id) => api.delete(`/tickets/${id}`),
  getComments:  (id) => api.get(`/tickets/${id}/comments`),
  addComment:   (id, content) => api.post(`/tickets/${id}/comments`, { content }),
}

// ── Customers ─────────────────────────────────────────────────────────────────
export const customersAPI = {
  list: (params) => api.get('/customers', { params }),
  get:  (id) => api.get(`/customers/${id}`),
}

// ── Stats ─────────────────────────────────────────────────────────────────────
export const statsAPI = {
  get: () => api.get('/stats'),
}

export default api
