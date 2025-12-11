import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
}

const theme = extendTheme({
  config,
  colors: {
    brand: {
      50: '#e3f2ff',
      100: '#b8d9ff',
      200: '#8abfff',
      300: '#5ca5ff',
      400: '#2e8bff',
      500: '#0072ff',
      600: '#0058cc',
      700: '#003e99',
      800: '#002466',
      900: '#000a33',
    },
  },
  styles: {
    global: {
      body: {
        bg: 'gray.900',
        color: 'white',
      },
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
    },
  },
})

export default theme
