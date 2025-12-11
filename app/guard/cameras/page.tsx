'use client'

import { VStack, Heading } from '@chakra-ui/react'
import { AuthGuard } from '@/components/layouts/AuthGuard'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { UserRole } from '@/types'
import { CCTVGrid } from '@/components/widgets/CCTVGrid'

export default function CamerasPage() {
  return (
    <AuthGuard allowedRoles={[UserRole.GUARD]}>
      <DashboardLayout role={UserRole.GUARD}>
        <VStack spacing={6} align="stretch">
          <Heading size="lg">CCTV Cameras</Heading>
          <CCTVGrid />
        </VStack>
      </DashboardLayout>
    </AuthGuard>
  )
}
