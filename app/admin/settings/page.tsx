'use client'

import { VStack, Heading } from '@chakra-ui/react'
import { AuthGuard } from '@/components/layouts/AuthGuard'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { UserRole } from '@/types'
import { SettingsForm } from '@/components/widgets/SettingsForm'

export default function SettingsPage() {
  return (
    <AuthGuard allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <DashboardLayout role={UserRole.ADMIN}>
        <VStack spacing={6} align="stretch" maxW="800px">
          <Heading size="lg">Settings</Heading>
          <SettingsForm />
        </VStack>
      </DashboardLayout>
    </AuthGuard>
  )
}
