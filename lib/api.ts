import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { useAuthStore } from '@/stores/authStore'

// Create axios instance
const createApiClient = (): AxiosInstance => {  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004/api'
  const client = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Request interceptor to add auth token
  client.interceptors.request.use(
    (config) => {
      const { token } = useAuthStore.getState()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor to handle auth errors
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token is invalid or expired
        const { clearAuth } = useAuthStore.getState()
        clearAuth()
        
        // Redirect to login if not already there
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
      return Promise.reject(error)
    }
  )

  return client
}

// Create the API client instance
export const apiClient = createApiClient()

// API response types
export interface ApiResponse<T = any> {
  data?: T
  message?: string
  error?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: {
    id: string
    username: string
    email: string
    fullName: string
    role: string
    initials: string
  }
  message: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  fullName: string
  role: string
  initials: string
}

// Auth API functions
export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials)
    return response.data
  },

  register: async (userData: RegisterRequest): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>('/auth/register', userData)
    return response.data
  },

  getCurrentUser: async (): Promise<ApiResponse> => {
    const response = await apiClient.get<ApiResponse>('/auth/me')
    return response.data
  },

  logout: async (): Promise<void> => {
    // For now, just clear local storage
    // In the future, you might want to invalidate the token on the server
    const { clearAuth } = useAuthStore.getState()
    clearAuth()
  },
}

// Generic API helper functions
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.get(url, config),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.post(url, data, config),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.put(url, data, config),

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.delete(url, config),

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.patch(url, data, config),
}

export default api
