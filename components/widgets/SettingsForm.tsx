'use client'

import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  Text,
} from '@chakra-ui/react'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useSystemConfig } from '@/lib/hooks/useDashboard'
import { useState } from 'react'

export const SettingsForm: React.FC = () => {
  const { data: config, isLoading } = useSystemConfig()
  const [isSaving, setIsSaving] = useState(false)
  const toast = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: 'Settings saved',
        description: 'Your configuration has been updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <Card>
      <Text fontSize="xl" fontWeight="bold" mb={6}>
        System Configuration
      </Text>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          <FormControl>
            <FormLabel>Organization Name</FormLabel>
            <Input
              placeholder="Enter organization name"
              defaultValue="Security Corp"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Alert Email</FormLabel>
            <Input
              type="email"
              placeholder="alerts@example.com"
              defaultValue="alerts@example.com"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Incident Response Time (minutes)</FormLabel>
            <Input
              type="number"
              placeholder="15"
              defaultValue="15"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Auto-archive After (days)</FormLabel>
            <Input
              type="number"
              placeholder="30"
              defaultValue="30"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Camera Refresh Interval (seconds)</FormLabel>
            <Input
              type="number"
              placeholder="60"
              defaultValue="60"
            />
          </FormControl>

          <Button
            type="submit"
            colorScheme="brand"
            isLoading={isSaving}
            loadingText="Saving..."
            mt={4}
          >
            Save Settings
          </Button>
        </VStack>
      </form>
    </Card>
  )
}
