/**
 * TicketCRM — Store de autenticación (Zustand)
 * Desarrollado por: Raúl de Jesús Larios
 */

import { create } from 'zustand'
import { authAPI } from '../utils/api'

const useAuthStore = create((set, get) => ({
  user:  JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,

  setAuth: (token, user) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ token, user, error: null })
  },

  clearAuth: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ token: null, user: null })
  },

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const { data } = await authAPI.login({ email, password })
      if (data.twoFactorRequired) {
        set({ loading: false })
        return { twoFactorRequired: true, tempToken: data.tempToken }
      }
      get().setAuth(data.token, data.user)
      set({ loading: false })
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.error || 'Error de conexión'
      set({ loading: false, error: msg })
      return { error: msg }
    }
  },

  loginWithGoogle: async (credential) => {
    set({ loading: true, error: null })
    try {
      const { data } = await authAPI.google(credential)
      get().setAuth(data.token, data.user)
      set({ loading: false })
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.error || 'Error con Google Sign-In'
      set({ loading: false, error: msg })
      return { error: msg }
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null })
    try {
      const { data } = await authAPI.register({ name, email, password })
      get().setAuth(data.token, data.user)
      set({ loading: false })
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al registrar'
      set({ loading: false, error: msg })
      return { error: msg }
    }
  },

  verify2FA: async (tempToken, totpCode) => {
    set({ loading: true, error: null })
    try {
      const { data } = await authAPI.authenticate2FA({ tempToken, totpCode })
      get().setAuth(data.token, data.user)
      set({ loading: false })
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.error || 'Código incorrecto'
      set({ loading: false, error: msg })
      return { error: msg }
    }
  },

  logout: () => {
    get().clearAuth()
  },

  isAuthenticated: () => !!get().token,
}))

export default useAuthStore
