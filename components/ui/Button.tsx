import { Button as ChakraButton, ButtonProps as ChakraButtonProps } from '@chakra-ui/react'

export interface ButtonProps extends ChakraButtonProps {
  variant?: 'solid' | 'outline' | 'ghost'
}

export const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
  return <ChakraButton {...props}>{children}</ChakraButton>
}
