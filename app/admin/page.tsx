'use client'

import { VStack, Heading, Grid, GridItem } from '@chakra-ui/react'
import { AuthGuard } from '@/components/layouts/AuthGuard'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { UserRole } from '@/types'
import { AdminAnalyticsCards } from '@/components/widgets/AnalyticsCards'
import { IncidentQueue } from '@/components/widgets/IncidentQueue'

export default function AdminDashboard() {
  return (
    <AuthGuard allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <DashboardLayout role={UserRole.ADMIN}>
        <VStack spacing={6} align="stretch">
          <Heading size="lg">Admin Dashboard</Heading>

          <AdminAnalyticsCards />

          <Grid
            templateColumns={{ base: '1fr', lg: '1fr 1fr' }}
            gap={6}
          >
            <GridItem>
              <IncidentQueue limit={10} />
            </GridItem>
            <GridItem>
              <IncidentQueue limit={10} />
            </GridItem>
          </Grid>
        </VStack>
      </DashboardLayout>
    </AuthGuard>
  )
}
