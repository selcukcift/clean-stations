import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { useAuthStore } from '@/stores/authStore'

// [Per Coding Prompt Chains v5 - Hybrid Backend]
// Provide two distinct Axios clients for clarity

// Plain Node.js backend (core data/auth)
export const plainNodeApiClient = axios.create({
  baseURL: 'http://localhost:3004/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// Next.js API routes (order workflow, configurator, accessories, uploads)
export const nextJsApiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach auth token to both clients
const attachAuthInterceptor = (client: AxiosInstance) => {
  client.interceptors.request.use(
    (config) => {
      const { token } = useAuthStore.getState()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error)
  )
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        const { clearAuth } = useAuthStore.getState()
        clearAuth()
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
      return Promise.reject(error)
    }
  )
}
attachAuthInterceptor(plainNodeApiClient)
attachAuthInterceptor(nextJsApiClient)

// Generic API helper functions (default to nextJsApiClient for new features)
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    nextJsApiClient.get(url, config),
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    nextJsApiClient.post(url, data, config),
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    nextJsApiClient.put(url, data, config),
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    nextJsApiClient.delete(url, config),
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    nextJsApiClient.patch(url, data, config),
}

export default api
