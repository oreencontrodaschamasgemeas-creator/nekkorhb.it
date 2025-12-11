'use client'

import { VStack, Heading } from '@chakra-ui/react'
import { AuthGuard } from '@/components/layouts/AuthGuard'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { UserRole } from '@/types'
import { IncidentQueue } from '@/components/widgets/IncidentQueue'

export default function IncidentsPage() {
  return (
    <AuthGuard allowedRoles={[UserRole.GUARD]}>
      <DashboardLayout role={UserRole.GUARD}>
        <VStack spacing={6} align="stretch">
          <Heading size="lg">Incident Queue</Heading>
          <IncidentQueue limit={20} />
        </VStack>
      </DashboardLayout>
    </AuthGuard>
  )
}
