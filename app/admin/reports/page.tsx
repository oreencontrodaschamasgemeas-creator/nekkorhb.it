'use client'

import { VStack, Heading, SimpleGrid, Text, Button, HStack } from '@chakra-ui/react'
import { AuthGuard } from '@/components/layouts/AuthGuard'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { UserRole } from '@/types'
import { Card } from '@/components/ui/Card'

const reportTypes = [
  {
    title: 'Incident Summary Report',
    description: 'Comprehensive overview of all incidents for the selected period',
    icon: '📊',
  },
  {
    title: 'Guard Performance Report',
    description: 'Analysis of guard response times and incident handling',
    icon: '👮',
  },
  {
    title: 'Camera Status Report',
    description: 'Status and uptime analysis of all CCTV cameras',
    icon: '📹',
  },
  {
    title: 'Security Metrics Report',
    description: 'Key security metrics and trends over time',
    icon: '📈',
  },
]

export default function ReportsPage() {
  return (
    <AuthGuard allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <DashboardLayout role={UserRole.ADMIN}>
        <VStack spacing={6} align="stretch">
          <Heading size="lg">Reports</Heading>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            {reportTypes.map((report) => (
              <Card key={report.title}>
                <VStack align="stretch" spacing={3}>
                  <HStack>
                    <Text fontSize="3xl">{report.icon}</Text>
                    <Heading size="md">{report.title}</Heading>
                  </HStack>
                  <Text color="gray.400" fontSize="sm">
                    {report.description}
                  </Text>
                  <HStack spacing={2} pt={2}>
                    <Button size="sm" colorScheme="brand">
                      Generate
                    </Button>
                    <Button size="sm" variant="outline">
                      Schedule
                    </Button>
                  </HStack>
                </VStack>
              </Card>
            ))}
          </SimpleGrid>

          <Card>
            <Heading size="md" mb={4}>
              Recent Reports
            </Heading>
            <Text color="gray.400">
              No reports generated yet. Click "Generate" above to create a new report.
            </Text>
          </Card>
        </VStack>
      </DashboardLayout>
    </AuthGuard>
  )
}
