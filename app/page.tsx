'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { UserRole } from '@/types'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function Home() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    } else if (user) {
      if (user.role === UserRole.GUARD) {
        router.push('/guard')
      } else if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
        router.push('/admin')
      }
    }
  }, [isAuthenticated, user, router])

  return <LoadingSpinner />
}
