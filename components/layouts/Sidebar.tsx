'use client'

import { Box, VStack, Text, HStack, Icon, Flex } from '@chakra-ui/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserRole } from '@/types'

interface NavItem {
  label: string
  href: string
  icon?: string
}

interface SidebarProps {
  role: UserRole
}

const guardNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/guard', icon: '📊' },
  { label: 'CCTV Cameras', href: '/guard/cameras', icon: '📹' },
  { label: 'Incidents', href: '/guard/incidents', icon: '⚠️' },
]

const adminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: '📊' },
  { label: 'Analytics', href: '/admin/analytics', icon: '📈' },
  { label: 'Reports', href: '/admin/reports', icon: '📄' },
  { label: 'Settings', href: '/admin/settings', icon: '⚙️' },
]

export const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const pathname = usePathname()
  const navItems = role === UserRole.GUARD ? guardNavItems : adminNavItems

  return (
    <Box
      w="250px"
      bg="gray.800"
      h="100vh"
      position="fixed"
      left={0}
      top={0}
      borderRight="1px"
      borderColor="gray.700"
      p={4}
    >
      <Box mb={8}>
        <Text fontSize="2xl" fontWeight="bold" color="brand.400">
          {role === UserRole.GUARD ? 'Guard Portal' : 'Admin Portal'}
        </Text>
      </Box>

      <VStack spacing={2} align="stretch">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <HStack
                p={3}
                borderRadius="md"
                bg={isActive ? 'brand.600' : 'transparent'}
                _hover={{ bg: isActive ? 'brand.600' : 'gray.700' }}
                transition="all 0.2s"
              >
                <Text fontSize="xl">{item.icon}</Text>
                <Text fontWeight={isActive ? 'bold' : 'normal'}>
                  {item.label}
                </Text>
              </HStack>
            </Link>
          )
        })}
      </VStack>
    </Box>
  )
}
