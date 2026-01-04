'use client';

import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import CommandPaletteProvider from '@/components/CommandPalette';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/lib/supabase/auth-context';

// Custom theme with a unique aesthetic
const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  fonts: {
    heading: '"JetBrains Mono", monospace',
    body: '"Inter", system-ui, sans-serif',
  },
  colors: {
    brand: {
      50: '#e6fffa',
      100: '#b2f5ea',
      200: '#81e6d9',
      300: '#4fd1c5',
      400: '#38b2ac',
      500: '#319795',
      600: '#2c7a7b',
      700: '#285e61',
      800: '#234e52',
      900: '#1d4044',
    },
    surface: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#27272a',
      800: '#18181b',
      900: '#09090b',
    },
  },
  styles: {
    global: {
      body: {
        bg: 'surface.900',
        color: 'white',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: 'lg',
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.400',
          },
        },
        outline: {
          borderColor: 'brand.500',
          color: 'brand.400',
          _hover: {
            bg: 'brand.900',
          },
        },
        ghost: {
          color: 'surface.300',
          _hover: {
            bg: 'surface.800',
          },
        },
      },
    },
    Input: {
      variants: {
        filled: {
          field: {
            bg: 'surface.800',
            borderColor: 'surface.700',
            _hover: {
              bg: 'surface.700',
            },
            _focus: {
              bg: 'surface.800',
              borderColor: 'brand.500',
            },
          },
        },
      },
      defaultProps: {
        variant: 'filled',
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'surface.800',
          borderRadius: 'xl',
          borderWidth: '1px',
          borderColor: 'surface.700',
        },
      },
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by rendering children only after mount
  if (!mounted) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#09090b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #27272a',
          borderTopColor: '#38b2ac',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <ChakraProvider theme={theme} resetCSS>
      <ErrorBoundary>
        <AuthProvider>
          <CommandPaletteProvider>
            {children}
          </CommandPaletteProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ChakraProvider>
  );
}
