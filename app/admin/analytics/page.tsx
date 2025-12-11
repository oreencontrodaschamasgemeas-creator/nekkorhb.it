'use client'

import { VStack, Heading, Box, Text } from '@chakra-ui/react'
import { AuthGuard } from '@/components/layouts/AuthGuard'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { UserRole } from '@/types'
import { AdminAnalyticsCards } from '@/components/widgets/AnalyticsCards'
import { Card } from '@/components/ui/Card'

export default function AnalyticsPage() {
  return (
    <AuthGuard allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <DashboardLayout role={UserRole.ADMIN}>
        <VStack spacing={6} align="stretch">
          <Heading size="lg">Analytics & Insights</Heading>

          <AdminAnalyticsCards period="30d" />

          <Card>
            <Heading size="md" mb={4}>
              Performance Metrics
            </Heading>
            <Box h="300px" display="flex" alignItems="center" justifyContent="center">
              <Text color="gray.400">
                Chart placeholder - Analytics visualizations will be rendered here
              </Text>
            </Box>
          </Card>

          <Card>
            <Heading size="md" mb={4}>
              Trend Analysis
            </Heading>
            <Box h="300px" display="flex" alignItems="center" justifyContent="center">
              <Text color="gray.400">
                Trend chart placeholder - Historical data visualizations
              </Text>
            </Box>
          </Card>
        </VStack>
      </DashboardLayout>
    </AuthGuard>
  )
}
