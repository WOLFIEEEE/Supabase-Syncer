'use client';

import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import CommandPaletteProvider from '@/components/CommandPalette';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/lib/supabase/auth-context';

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  fonts: {
    heading: '"Outfit", system-ui, sans-serif',
    body: '"Inter", system-ui, sans-serif',
    mono: '"JetBrains Mono", monospace',
  },
  colors: {
    surface: {
      50: '#f6f7f8',
      100: '#eceef1',
      200: '#d9dde3',
      300: '#b6bfcb',
      400: '#8e9aab',
      500: '#637083',
      600: '#485264',
      700: '#2f3745',
      800: '#1a202b',
      900: '#0f131b',
      950: '#080a0f',
    },
    brand: {
      50: '#e6fff8',
      100: '#bcffeb',
      200: '#8df9db',
      300: '#5cefc9',
      400: '#34ddba',
      500: '#19c4a7',
      600: '#119987',
      700: '#0d7669',
      800: '#0b5a50',
      900: '#0b4a43',
    },
    accent: {
      50: '#e7f5ff',
      100: '#cce7ff',
      200: '#9ecfff',
      300: '#6cb3ff',
      400: '#439bff',
      500: '#1e84ff',
      600: '#0068db',
      700: '#0052ad',
      800: '#003f86',
      900: '#002f66',
    },
    success: {
      50: '#e8fff4',
      100: '#c2f7dd',
      200: '#99f0c4',
      300: '#68dea4',
      400: '#3ac887',
      500: '#17b16e',
      600: '#0f8a55',
      700: '#0b6841',
      800: '#0a4f33',
      900: '#093e29',
    },
    warning: {
      50: '#fff9e6',
      100: '#ffedbd',
      200: '#ffe08f',
      300: '#ffd25f',
      400: '#ffc633',
      500: '#e6ad19',
      600: '#b9850f',
      700: '#8d6409',
      800: '#664905',
      900: '#473304',
    },
    error: {
      50: '#ffe8e8',
      100: '#ffcaca',
      200: '#ffa1a1',
      300: '#ff7474',
      400: '#ff4d4d',
      500: '#e63333',
      600: '#ba2626',
      700: '#911c1c',
      800: '#6b1313',
      900: '#4d0d0d',
    },
  },
  semanticTokens: {
    colors: {
      'bg.canvas': 'surface.950',
      'bg.surface': 'surface.900',
      'bg.elevated': 'surface.800',
      'bg.muted': 'surface.700',
      'text.primary': '#f4f7fb',
      'text.secondary': '#d7dbe3',
      'text.tertiary': '#a8b0bf',
      'text.inverse': '#0b1220',
      'border.default': '#2a3443',
      'border.subtle': '#1d2531',
      'border.strong': '#3e4c61',
      'accent.primary': 'brand.400',
      'accent.hover': 'brand.300',
      'state.success': 'success.400',
      'state.warning': 'warning.400',
      'state.error': 'error.400',
      'state.info': 'accent.400',
      'focus.ring': 'accent.300',
    },
    shadows: {
      'elevation.soft': '0 10px 24px rgba(3, 8, 18, 0.32)',
      'elevation.medium': '0 14px 36px rgba(3, 8, 18, 0.42)',
      'elevation.accent': '0 0 0 1px rgba(25, 196, 167, 0.3), 0 14px 36px rgba(3, 8, 18, 0.5)',
    },
  },
  radii: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.25rem',
  },
  textStyles: {
    display: {
      fontSize: ['2.25rem', null, '3.5rem', '4.5rem'],
      lineHeight: [1.1, null, 1.04, 1],
      letterSpacing: '-0.04em',
      fontWeight: '700',
      fontFamily: 'heading',
    },
    h1: {
      fontSize: ['1.75rem', null, '2.4rem', '3rem'],
      lineHeight: 1.15,
      letterSpacing: '-0.03em',
      fontWeight: '700',
      fontFamily: 'heading',
    },
    h2: {
      fontSize: ['1.4rem', null, '1.8rem', '2.2rem'],
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
      fontWeight: '600',
      fontFamily: 'heading',
    },
    h3: {
      fontSize: ['1.2rem', null, '1.35rem', '1.5rem'],
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
      fontWeight: '600',
      fontFamily: 'heading',
    },
    bodyLg: {
      fontSize: ['1rem', null, '1.125rem'],
      lineHeight: 1.7,
      color: 'text.secondary',
    },
    body: {
      fontSize: '0.95rem',
      lineHeight: 1.65,
      color: 'text.secondary',
    },
    label: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
      fontWeight: '600',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'text.tertiary',
    },
  },
  layerStyles: {
    panel: {
      bg: 'bg.elevated',
      borderWidth: '1px',
      borderColor: 'border.default',
      borderRadius: 'xl',
      boxShadow: 'elevation.soft',
    },
    panelMuted: {
      bg: 'bg.surface',
      borderWidth: '1px',
      borderColor: 'border.subtle',
      borderRadius: 'lg',
    },
    strip: {
      bg: 'linear-gradient(130deg, rgba(25,196,167,0.12) 0%, rgba(30,132,255,0.08) 100%)',
      borderWidth: '1px',
      borderColor: 'rgba(147, 222, 203, 0.2)',
      borderRadius: 'xl',
    },
  },
  styles: {
    global: {
      ':focus-visible': {
        outline: '2px solid',
        outlineColor: 'focus.ring',
        outlineOffset: '2px',
      },
      '::selection': {
        bg: 'rgba(25, 196, 167, 0.3)',
        color: 'white',
      },
      body: {
        bg: 'bg.canvas',
        color: 'text.primary',
        fontFeatureSettings: '"ss01" on, "cv02" on',
      },
      a: {
        color: 'text.secondary',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: 'lg',
        _focusVisible: {
          boxShadow: '0 0 0 2px var(--chakra-colors-focus-ring)',
        },
      },
      sizes: {
        sm: { h: '2.4rem', px: 4 },
        md: { h: '2.8rem', px: 5 },
        lg: { h: '3rem', px: 6 },
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'text.inverse',
          _hover: {
            bg: 'brand.400',
            transform: 'translateY(-1px)',
            boxShadow: 'elevation.accent',
          },
          _active: {
            bg: 'brand.600',
            transform: 'translateY(0)',
            boxShadow: 'none',
          },
          _disabled: {
            opacity: 0.55,
            transform: 'none',
            boxShadow: 'none',
          },
        },
        outline: {
          borderColor: 'border.strong',
          color: 'text.secondary',
          _hover: {
            borderColor: 'accent.primary',
            color: 'text.primary',
            bg: 'rgba(25, 196, 167, 0.08)',
          },
        },
        subtle: {
          color: 'accent.primary',
          bg: 'rgba(25, 196, 167, 0.12)',
          _hover: {
            bg: 'rgba(25, 196, 167, 0.2)',
          },
        },
        ghost: {
          color: 'text.secondary',
          _hover: {
            color: 'text.primary',
            bg: 'rgba(255, 255, 255, 0.06)',
          },
        },
      },
      defaultProps: {
        variant: 'solid',
      },
    },
    Input: {
      baseStyle: {
        field: {
          borderColor: 'border.default',
          color: 'text.primary',
          bg: 'bg.surface',
          _placeholder: { color: 'text.tertiary' },
          _hover: { borderColor: 'border.strong' },
          _focusVisible: {
            borderColor: 'accent.primary',
            boxShadow: '0 0 0 2px rgba(108, 179, 255, 0.28)',
          },
        },
      },
      variants: {
        filled: {
          field: {
            bg: 'bg.surface',
          },
        },
      },
      defaultProps: {
        variant: 'filled',
      },
    },
    Select: {
      variants: {
        filled: {
          field: {
            bg: 'bg.surface',
            borderColor: 'border.default',
            color: 'text.primary',
            _focusVisible: {
              borderColor: 'accent.primary',
              boxShadow: '0 0 0 2px rgba(108, 179, 255, 0.28)',
            },
          },
        },
      },
      defaultProps: {
        variant: 'filled',
      },
    },
    Textarea: {
      variants: {
        filled: {
          bg: 'bg.surface',
          borderColor: 'border.default',
          _focusVisible: {
            borderColor: 'accent.primary',
            boxShadow: '0 0 0 2px rgba(108, 179, 255, 0.28)',
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
          bg: 'bg.elevated',
          borderRadius: 'xl',
          borderWidth: '1px',
          borderColor: 'border.default',
          boxShadow: 'elevation.soft',
        },
      },
    },
    Tabs: {
      variants: {
        line: {
          tab: {
            color: 'text.tertiary',
            _selected: {
              color: 'text.primary',
              borderColor: 'accent.primary',
            },
          },
          tablist: {
            borderColor: 'border.default',
          },
        },
      },
    },
    Menu: {
      baseStyle: {
        list: {
          bg: 'bg.elevated',
          borderColor: 'border.default',
          boxShadow: 'elevation.medium',
        },
        item: {
          color: 'text.secondary',
          _hover: {
            bg: 'rgba(255, 255, 255, 0.06)',
            color: 'text.primary',
          },
        },
      },
    },
    Table: {
      variants: {
        simple: {
          thead: {
            th: {
              color: 'text.tertiary',
              borderColor: 'border.default',
            },
          },
          tbody: {
            tr: {
              _hover: {
                bg: 'rgba(255, 255, 255, 0.02)',
              },
            },
          },
          td: {
            borderColor: 'border.subtle',
          },
        },
      },
    },
    Badge: {
      baseStyle: {
        borderRadius: 'full',
        px: 2.5,
        py: 0.5,
        fontWeight: '600',
      },
      variants: {
        subtle: {
          bg: 'rgba(255, 255, 255, 0.08)',
          color: 'text.secondary',
        },
      },
    },
    Drawer: {
      baseStyle: {
        dialog: {
          bg: 'bg.surface',
          borderColor: 'border.default',
        },
      },
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
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
