import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      
      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', refreshToken)
        set({ user, isAuthenticated: true })
      },
      
      updateUser: (userData) => set(state => ({ user: { ...state.user, ...userData } })),
      
      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, isAuthenticated: false })
      },
      
      isAdmin: () => get().user?.role === 'admin',
      isHR: () => get().user?.role === 'hr_officer',
      isHROrAdmin: () => ['admin', 'hr_officer'].includes(get().user?.role),
    }),
    { name: 'hrms-auth', partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }) }
  )
)
