'use client'

import {
  Box,
  Flex,
  HStack,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Button,
} from '@chakra-ui/react'
import { useAuthStore } from '@/lib/stores/authStore'
import { useRouter } from 'next/navigation'

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  return (
    <Box
      h="64px"
      bg="gray.800"
      borderBottom="1px"
      borderColor="gray.700"
      px={6}
      position="fixed"
      top={0}
      left="250px"
      right={0}
      zIndex={10}
    >
      <Flex h="full" justify="space-between" align="center">
        <Text fontSize="lg" fontWeight="semibold">
          Security Dashboard
        </Text>

        <HStack spacing={4}>
          <Text fontSize="sm" color="gray.400">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>

          <Menu>
            <MenuButton>
              <HStack>
                <Avatar
                  size="sm"
                  name={user ? `${user.firstName} ${user.lastName}` : 'User'}
                  src={user?.avatar}
                />
                <Box textAlign="left">
                  <Text fontSize="sm" fontWeight="medium">
                    {user?.firstName} {user?.lastName}
                  </Text>
                  <Text fontSize="xs" color="gray.400">
                    {user?.role}
                  </Text>
                </Box>
              </HStack>
            </MenuButton>
            <MenuList>
              <MenuItem>Profile</MenuItem>
              <MenuItem>Preferences</MenuItem>
              <MenuItem onClick={handleLogout} color="red.400">
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </Box>
  )
}
