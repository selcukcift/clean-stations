import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

export interface User {
  id: string
  username: string
  email: string
  fullName: string
  role: 'ADMIN' | 'PRODUCTION_COORDINATOR' | 'PROCUREMENT_SPECIALIST' | 'QC_PERSON' | 'ASSEMBLER'
  initials: string
  isActive: boolean
  createdAt: string
}

interface AuthState {
  // State
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Actions
  login: (token: string, user: User) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  updateUser: (user: Partial<User>) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      login: (token: string, user: User) => {
        set((state) => {
          state.token = token
          state.user = user
          state.isAuthenticated = true
          state.isLoading = false
        })
      },

      logout: () => {
        set((state) => {
          state.token = null
          state.user = null
          state.isAuthenticated = false
          state.isLoading = false
        })
      },

      setLoading: (loading: boolean) => {
        set((state) => {
          state.isLoading = loading
        })
      },

      updateUser: (updates: Partial<User>) => {
        set((state) => {
          if (state.user) {
            state.user = { ...state.user, ...updates }
          }
        })
      },

      clearAuth: () => {
        set((state) => {
          state.token = null
          state.user = null
          state.isAuthenticated = false
          state.isLoading = false
        })
      },
    })),
    {
      name: 'torvan-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// Computed selectors
export const useAuth = () => {
  const { user, token, isAuthenticated, isLoading } = useAuthStore()
  return { user, token, isAuthenticated, isLoading }
}

export const useAuthActions = () => {
  const { login, logout, setLoading, updateUser, clearAuth } = useAuthStore()
  return { login, logout, setLoading, updateUser, clearAuth }
}
