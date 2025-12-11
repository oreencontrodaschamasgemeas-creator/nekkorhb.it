'use client'

import { Box, Grid, Text, Badge, Flex } from '@chakra-ui/react'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useCameras } from '@/lib/hooks/useDashboard'
import { CCTVCamera } from '@/types'

const CCTVCameraCard: React.FC<{ camera: CCTVCamera }> = ({ camera }) => {
  return (
    <Card p={0} overflow="hidden">
      <Box
        bg="gray.700"
        h="160px"
        position="relative"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {camera.thumbnail ? (
          <Box
            as="img"
            src={camera.thumbnail}
            alt={camera.name}
            w="full"
            h="full"
            objectFit="cover"
          />
        ) : (
          <Text color="gray.500" fontSize="sm">
            No Preview
          </Text>
        )}
        <Badge
          position="absolute"
          top={2}
          right={2}
          colorScheme={camera.status === 'online' ? 'green' : 'red'}
        >
          {camera.status}
        </Badge>
      </Box>
      <Box p={3}>
        <Text fontWeight="bold" fontSize="sm" mb={1}>
          {camera.name}
        </Text>
        <Text fontSize="xs" color="gray.400">
          {camera.location}
        </Text>
      </Box>
    </Card>
  )
}

export const CCTVGrid: React.FC = () => {
  const { data: cameras, isLoading, error } = useCameras()

  if (isLoading) return <LoadingSpinner />
  if (error) return <Text color="red.400">Error loading cameras</Text>
  if (!cameras || cameras.length === 0) {
    return (
      <Card>
        <Text color="gray.400">No cameras available</Text>
      </Card>
    )
  }

  return (
    <Grid
      templateColumns={{
        base: '1fr',
        md: 'repeat(2, 1fr)',
        lg: 'repeat(3, 1fr)',
        xl: 'repeat(4, 1fr)',
      }}
      gap={4}
    >
      {cameras.map((camera) => (
        <CCTVCameraCard key={camera.id} camera={camera} />
      ))}
    </Grid>
  )
}
