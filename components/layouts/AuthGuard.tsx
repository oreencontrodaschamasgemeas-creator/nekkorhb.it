'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { UserRole } from '@/types'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Box } from '@chakra-ui/react'

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  allowedRoles,
}) => {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (
      !isLoading &&
      isAuthenticated &&
      allowedRoles &&
      user &&
      !allowedRoles.includes(user.role)
    ) {
      router.push('/unauthorized')
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, router])

  if (isLoading || !isAuthenticated) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <LoadingSpinner />
      </Box>
    )
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}
