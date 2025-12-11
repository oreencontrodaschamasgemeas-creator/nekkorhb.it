import { render, screen } from '@testing-library/react'
import { Button } from '../Button'
import { ChakraProvider } from '@chakra-ui/react'

const renderWithChakra = (ui: React.ReactElement) => {
  return render(<ChakraProvider>{ui}</ChakraProvider>)
}

describe('Button', () => {
  it('renders button with text', () => {
    renderWithChakra(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('applies correct variant', () => {
    renderWithChakra(<Button variant="outline">Outline Button</Button>)
    const button = screen.getByText('Outline Button')
    expect(button).toBeInTheDocument()
  })
})
