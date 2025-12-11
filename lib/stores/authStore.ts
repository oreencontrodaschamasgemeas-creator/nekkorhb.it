import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthState, LoginCredentials, User } from '@/types'
import { authApi } from '@/lib/api'

const TOKEN_KEY = process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || 'auth_token'
const REFRESH_TOKEN_KEY = process.env.NEXT_PUBLIC_REFRESH_TOKEN_KEY || 'refresh_token'

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true })
        try {
          const response = await authApi.login(credentials)
          
          if (typeof window !== 'undefined') {
            localStorage.setItem(TOKEN_KEY, response.tokens.accessToken)
            localStorage.setItem(REFRESH_TOKEN_KEY, response.tokens.refreshToken)
          }

          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        try {
          await authApi.logout()
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(TOKEN_KEY)
            localStorage.removeItem(REFRESH_TOKEN_KEY)
          }
          set({ user: null, isAuthenticated: false })
        }
      },

      refreshToken: async () => {
        try {
          if (typeof window !== 'undefined') {
            const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
            if (refreshToken) {
              const response = await authApi.refreshToken(refreshToken)
              localStorage.setItem(TOKEN_KEY, response.accessToken)
            }
          }
        } catch (error) {
          get().logout()
          throw error
        }
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
