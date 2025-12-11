'use client'

import { Box, Container, VStack, Heading, Text, Button } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.900">
      <Container maxW="md">
        <Card>
          <VStack spacing={4} textAlign="center">
            <Text fontSize="6xl">🚫</Text>
            <Heading size="lg">Unauthorized Access</Heading>
            <Text color="gray.400">
              You don't have permission to access this page.
            </Text>
            <Button
              colorScheme="brand"
              onClick={() => router.push('/')}
              mt={4}
            >
              Go to Dashboard
            </Button>
          </VStack>
        </Card>
      </Container>
    </Box>
  )
}
