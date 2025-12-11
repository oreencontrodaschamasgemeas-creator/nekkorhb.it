'use client'

import { VStack, Heading, Grid, GridItem } from '@chakra-ui/react'
import { AuthGuard } from '@/components/layouts/AuthGuard'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { UserRole } from '@/types'
import { AnalyticsCards } from '@/components/widgets/AnalyticsCards'
import { CCTVGrid } from '@/components/widgets/CCTVGrid'
import { IncidentQueue } from '@/components/widgets/IncidentQueue'

export default function GuardDashboard() {
  return (
    <AuthGuard allowedRoles={[UserRole.GUARD]}>
      <DashboardLayout role={UserRole.GUARD}>
        <VStack spacing={6} align="stretch">
          <Heading size="lg">Guard Dashboard</Heading>

          <AnalyticsCards />

          <Grid
            templateColumns={{ base: '1fr', lg: '2fr 1fr' }}
            gap={6}
          >
            <GridItem>
              <VStack spacing={4} align="stretch">
                <Heading size="md">CCTV Cameras</Heading>
                <CCTVGrid />
              </VStack>
            </GridItem>

            <GridItem>
              <IncidentQueue limit={5} />
            </GridItem>
          </Grid>
        </VStack>
      </DashboardLayout>
    </AuthGuard>
  )
}
