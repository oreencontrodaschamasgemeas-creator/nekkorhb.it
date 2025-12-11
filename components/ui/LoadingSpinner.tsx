import { Spinner, SpinnerProps, Flex } from '@chakra-ui/react'

export const LoadingSpinner: React.FC<SpinnerProps> = (props) => {
  return (
    <Flex justify="center" align="center" minH="200px" w="full">
      <Spinner size="xl" color="brand.500" thickness="4px" {...props} />
    </Flex>
  )
}
