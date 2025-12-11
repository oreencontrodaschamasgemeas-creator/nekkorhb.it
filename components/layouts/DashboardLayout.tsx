'use client'

import { Box } from '@chakra-ui/react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAuthStore } from '@/lib/stores/authStore'
import { UserRole } from '@/types'

interface DashboardLayoutProps {
  children: React.ReactNode
  role: UserRole
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  role,
}) => {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return null
  }

  return (
    <Box minH="100vh" bg="gray.900">
      <Sidebar role={role} />
      <Box ml="250px">
        <Header />
        <Box pt="64px" p={6}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}
