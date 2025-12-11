import { Box, BoxProps } from '@chakra-ui/react'
import { cn } from '@/lib/utils/cn'

export interface CardProps extends BoxProps {
  children: React.ReactNode
}

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <Box
      bg="gray.800"
      borderRadius="lg"
      p={6}
      boxShadow="md"
      className={cn(className)}
      {...props}
    >
      {children}
    </Box>
  )
}
