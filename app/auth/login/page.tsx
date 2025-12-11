'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  VStack,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  useToast,
  FormErrorMessage,
} from '@chakra-ui/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card } from '@/components/ui/Card'
import { useAuthStore } from '@/lib/stores/authStore'
import { loginSchema, LoginFormData } from '@/lib/validators/auth'
import { UserRole } from '@/types'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      await login(data)
      
      const user = useAuthStore.getState().user
      
      toast({
        title: 'Login successful',
        status: 'success',
        duration: 2000,
      })

      if (user?.role === UserRole.GUARD) {
        router.push('/guard')
      } else {
        router.push('/admin')
      }
    } catch (error) {
      toast({
        title: 'Login failed',
        description: 'Invalid email or password',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.900">
      <Container maxW="md">
        <Card>
          <VStack spacing={6} align="stretch">
            <Box textAlign="center">
              <Heading size="lg" mb={2}>
                Security Dashboard
              </Heading>
              <Text color="gray.400">Sign in to your account</Text>
            </Box>

            <form onSubmit={handleSubmit(onSubmit)}>
              <VStack spacing={4}>
                <FormControl isInvalid={!!errors.email}>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    {...register('email')}
                  />
                  <FormErrorMessage>
                    {errors.email?.message}
                  </FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.password}>
                  <FormLabel>Password</FormLabel>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    {...register('password')}
                  />
                  <FormErrorMessage>
                    {errors.password?.message}
                  </FormErrorMessage>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="brand"
                  width="full"
                  isLoading={isLoading}
                  loadingText="Signing in..."
                >
                  Sign In
                </Button>
              </VStack>
            </form>

            <Box pt={4} borderTop="1px" borderColor="gray.700">
              <Text fontSize="sm" color="gray.400" textAlign="center">
                Demo credentials:
              </Text>
              <Text fontSize="xs" color="gray.500" textAlign="center" mt={2}>
                Guard: guard@example.com / password123
              </Text>
              <Text fontSize="xs" color="gray.500" textAlign="center">
                Admin: admin@example.com / password123
              </Text>
            </Box>
          </VStack>
        </Card>
      </Container>
    </Box>
  )
}
