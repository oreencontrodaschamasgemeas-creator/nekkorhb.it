'use client'

import { SimpleGrid, Box, Text, HStack, Icon } from '@chakra-ui/react'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAnalytics, useDashboardStats } from '@/lib/hooks/useDashboard'
import { formatNumber } from '@/lib/utils/formatters'

interface StatCardProps {
  title: string
  value: number | string
  icon?: React.ReactNode
  color?: string
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = 'brand.500' }) => {
  return (
    <Card>
      <HStack spacing={4} justify="space-between">
        <Box>
          <Text fontSize="sm" color="gray.400" mb={2}>
            {title}
          </Text>
          <Text fontSize="3xl" fontWeight="bold" color={color}>
            {typeof value === 'number' ? formatNumber(value) : value}
          </Text>
        </Box>
        {icon && (
          <Box fontSize="3xl" color={color}>
            {icon}
          </Box>
        )}
      </HStack>
    </Card>
  )
}

export const AnalyticsCards: React.FC<{ period?: string }> = ({ period = '7d' }) => {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics(period)

  if (statsLoading || analyticsLoading) return <LoadingSpinner />

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
      <StatCard
        title="Active Guards"
        value={stats?.activeGuards || 0}
        color="green.400"
      />
      <StatCard
        title="Total Cameras"
        value={stats?.totalCameras || 0}
        color="blue.400"
      />
      <StatCard
        title="Active Incidents"
        value={stats?.todayIncidents || 0}
        color="orange.400"
      />
      <StatCard
        title="Response Time"
        value={analytics?.averageResponseTime ? `${analytics.averageResponseTime}m` : '0m'}
        color="purple.400"
      />
    </SimpleGrid>
  )
}

export const AdminAnalyticsCards: React.FC<{ period?: string }> = ({ period = '7d' }) => {
  const { data: analytics, isLoading } = useAnalytics(period)

  if (isLoading) return <LoadingSpinner />

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
      <StatCard
        title="Total Incidents"
        value={analytics?.totalIncidents || 0}
        color="blue.400"
      />
      <StatCard
        title="Active Incidents"
        value={analytics?.activeIncidents || 0}
        color="orange.400"
      />
      <StatCard
        title="Resolved"
        value={analytics?.resolvedIncidents || 0}
        color="green.400"
      />
      <StatCard
        title="Avg Response Time"
        value={analytics?.averageResponseTime ? `${analytics.averageResponseTime}m` : '0m'}
        color="purple.400"
      />
    </SimpleGrid>
  )
}
