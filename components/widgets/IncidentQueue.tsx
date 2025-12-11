'use client'

import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Divider,
  Button,
  Flex,
} from '@chakra-ui/react'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useIncidents, useUpdateIncident } from '@/lib/hooks/useDashboard'
import { Incident, IncidentStatus, IncidentPriority } from '@/types'
import { formatRelativeTime } from '@/lib/utils/formatters'

const priorityColors = {
  [IncidentPriority.LOW]: 'blue',
  [IncidentPriority.MEDIUM]: 'yellow',
  [IncidentPriority.HIGH]: 'orange',
  [IncidentPriority.CRITICAL]: 'red',
}

const statusColors = {
  [IncidentStatus.PENDING]: 'gray',
  [IncidentStatus.IN_PROGRESS]: 'blue',
  [IncidentStatus.RESOLVED]: 'green',
  [IncidentStatus.CLOSED]: 'gray',
}

const IncidentItem: React.FC<{ incident: Incident }> = ({ incident }) => {
  const { mutate: updateIncident, isPending } = useUpdateIncident()

  const handleStatusChange = () => {
    const newStatus =
      incident.status === IncidentStatus.PENDING
        ? IncidentStatus.IN_PROGRESS
        : IncidentStatus.RESOLVED

    updateIncident({
      id: incident.id,
      data: { status: newStatus },
    })
  }

  return (
    <Box>
      <VStack align="stretch" spacing={2}>
        <Flex justify="space-between" align="start">
          <Box flex={1}>
            <Text fontWeight="bold" mb={1}>
              {incident.title}
            </Text>
            <Text fontSize="sm" color="gray.400" noOfLines={2} mb={2}>
              {incident.description}
            </Text>
          </Box>
        </Flex>
        <HStack spacing={2}>
          <Badge colorScheme={priorityColors[incident.priority]}>
            {incident.priority}
          </Badge>
          <Badge colorScheme={statusColors[incident.status]}>
            {incident.status.replace('_', ' ')}
          </Badge>
          <Text fontSize="xs" color="gray.500">
            {incident.location}
          </Text>
          <Text fontSize="xs" color="gray.500" ml="auto">
            {formatRelativeTime(incident.createdAt)}
          </Text>
        </HStack>
        {incident.status !== IncidentStatus.RESOLVED && (
          <Button
            size="xs"
            onClick={handleStatusChange}
            isLoading={isPending}
          >
            {incident.status === IncidentStatus.PENDING
              ? 'Start'
              : 'Mark Resolved'}
          </Button>
        )}
      </VStack>
      <Divider mt={4} borderColor="gray.700" />
    </Box>
  )
}

export const IncidentQueue: React.FC<{ limit?: number }> = ({ limit = 10 }) => {
  const { data: incidents, isLoading, error } = useIncidents({ limit })

  if (isLoading) return <LoadingSpinner />
  if (error) return <Text color="red.400">Error loading incidents</Text>

  return (
    <Card>
      <Text fontSize="xl" fontWeight="bold" mb={4}>
        Recent Incidents
      </Text>
      {!incidents || incidents.length === 0 ? (
        <Text color="gray.400">No incidents to display</Text>
      ) : (
        <VStack spacing={4} align="stretch">
          {incidents.map((incident) => (
            <IncidentItem key={incident.id} incident={incident} />
          ))}
        </VStack>
      )}
    </Card>
  )
}
