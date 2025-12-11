import { useAuthStore } from '@/lib/stores/authStore'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { UserRole } from '@/types'

export const useAuth = (requiredRole?: UserRole) => {
  const router = useRouter()
  const { user, isAuthenticated, login, logout } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (requiredRole && user?.role !== requiredRole) {
      router.push('/unauthorized')
    }
  }, [isAuthenticated, user, requiredRole, router])

  return {
    user,
    isAuthenticated,
    login,
    logout,
  }
}

export const useRequireAuth = (requiredRole?: UserRole) => {
  return useAuth(requiredRole)
}
