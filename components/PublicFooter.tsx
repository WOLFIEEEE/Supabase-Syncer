'use client';

import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Grid,
  Flex,
  Image,
} from '@chakra-ui/react';

export default function PublicFooter() {
  const router = useRouter();

  return (
    <Box 
      position="relative"
      borderTop="1px solid" 
      borderColor="rgba(255,255,255,0.05)"
      bg="rgba(0,0,0,0.2)"
      backdropFilter="blur(10px)"
      mt="auto"
    >
      {/* Subtle gradient overlay */}
      <Box
        position="absolute"
        inset={0}
        bgGradient="linear(to-t, rgba(62, 207, 142, 0.02), transparent)"
        pointerEvents="none"
      />
      
      <Container maxW="7xl" py={{ base: 12, md: 16 }} position="relative" px={{ base: 4, md: 6 }}>
        <VStack spacing={{ base: 8, md: 12 }} align="stretch">
          {/* Main Footer Content */}
          <Grid 
            templateColumns={{ base: '1fr', sm: '1fr', md: '2fr 1fr 1fr 1fr' }} 
            gap={{ base: 8, md: 8 }}
          >
            {/* Brand Column */}
            <VStack align={{ base: 'center', md: 'start' }} spacing={4}>
              <HStack spacing={3}>
                <Box position="relative">
                  <Image src="/logo.png" alt="logo" width={32} height={32} />
                  <Box
                    position="absolute"
                    inset={0}
                    borderRadius="full"
                    bg="teal.400/20"
                    filter="blur(8px)"
                    zIndex={-1}
                  />
                </Box>
                <Text 
                  color="white" 
                  fontWeight="800" 
                  letterSpacing="0.15em" 
                  fontSize="sm"
                  fontFamily="'Outfit', sans-serif"
                >
                  SUPARBASE
                </Text>
              </HStack>
              <Text 
                color="surface.500" 
                fontSize="sm" 
                maxW="xs"
                textAlign={{ base: 'center', md: 'left' }}
                lineHeight="tall"
              >
                Sync your databases safely. Built for developers who move fast.
              </Text>
            </VStack>

            {/* Product Column */}
            <VStack align={{ base: 'center', md: 'start' }} spacing={3}>
              <Text 
                fontSize="xs" 
                fontWeight="700" 
                color="surface.400" 
                letterSpacing="0.1em"
                textTransform="uppercase"
              >
                Product
              </Text>
              <VStack align={{ base: 'center', md: 'start' }} spacing={2}>
                {[
                  { label: 'Features', path: '/features' },
                  { label: 'Pricing', path: '/pricing' },
                  { label: 'Benefits', path: '/benefits' },
                  { label: 'Status', path: '/status' }
                ].map((link) => (
                  <Button
                    key={link.path}
                    variant="ghost"
                    size="sm"
                    color="surface.400"
                    fontSize="sm"
                    fontWeight="400"
                    _hover={{ 
                      color: 'white',
                      bg: 'rgba(255,255,255,0.05)'
                    }}
                    onClick={() => router.push(link.path)}
                    px={0}
                    minH="32px"
                  >
                    {link.label}
                  </Button>
                ))}
              </VStack>
            </VStack>

            {/* Learn Column */}
            <VStack align={{ base: 'center', md: 'start' }} spacing={3}>
              <Text 
                fontSize="xs" 
                fontWeight="700" 
                color="surface.400" 
                letterSpacing="0.1em"
                textTransform="uppercase"
              >
                Learn
              </Text>
              <VStack align={{ base: 'center', md: 'start' }} spacing={2}>
                {[
                  { label: 'Getting Started', path: '/getting-started' },
                  { label: 'How It Works', path: '/how-it-works' },
                  { label: 'Use Cases', path: '/use-cases' },
                  { label: 'Guide', path: '/guide' },
                  { label: 'Best Practices', path: '/best-practices' },
                  { label: 'Troubleshooting', path: '/troubleshooting' },
                  { label: 'FAQ', path: '/faq' }
                ].map((link) => (
                  <Button
                    key={link.path}
                    variant="ghost"
                    size="sm"
                    color="surface.400"
                    fontSize="sm"
                    fontWeight="400"
                    _hover={{ 
                      color: 'white',
                      bg: 'rgba(255,255,255,0.05)'
                    }}
                    onClick={() => router.push(link.path)}
                    px={0}
                    minH="32px"
                  >
                    {link.label}
                  </Button>
                ))}
              </VStack>
            </VStack>

            {/* Company & Legal Column */}
            <VStack align={{ base: 'center', md: 'start' }} spacing={3}>
              <Text 
                fontSize="xs" 
                fontWeight="700" 
                color="surface.400" 
                letterSpacing="0.1em"
                textTransform="uppercase"
              >
                Company
              </Text>
              <VStack align={{ base: 'center', md: 'start' }} spacing={2}>
                {[
                  { label: 'About', path: '/about' },
                  { label: 'Contact', path: '/contact' },
                  { label: 'Privacy', path: '/privacy' },
                  { label: 'Terms', path: '/terms' }
                ].map((link) => (
                  <Button
                    key={link.path}
                    variant="ghost"
                    size="sm"
                    color="surface.400"
                    fontSize="sm"
                    fontWeight="400"
                    _hover={{ 
                      color: 'white',
                      bg: 'rgba(255,255,255,0.05)'
                    }}
                    onClick={() => router.push(link.path)}
                    px={0}
                    minH="32px"
                  >
                    {link.label}
                  </Button>
                ))}
              </VStack>
            </VStack>
          </Grid>

          {/* Divider */}
          <Box h="1px" bgGradient="linear(to-r, transparent, rgba(255,255,255,0.1), transparent)" />

          {/* Bottom Bar */}
          <Flex 
            direction={{ base: 'column', md: 'row' }}
            justify="space-between" 
            align="center"
            gap={{ base: 2, md: 4 }}
          >
            <Text 
              color="surface.600" 
              fontSize="xs"
              fontFamily="mono"
              textAlign={{ base: 'center', md: 'left' }}
            >
              © {new Date().getFullYear()} Suparbase. All rights reserved.
            </Text>
            <HStack spacing={6} flexWrap="wrap" justify="center">
              <Text 
                color="surface.600" 
                fontSize="xs"
                fontFamily="mono"
              >
                v1.0.0
              </Text>
              <Box w="1px" h="12px" bg="surface.800" display={{ base: 'none', sm: 'block' }} />
              <Text 
                color="surface.600" 
                fontSize="xs"
                fontFamily="mono"
              >
                Beta
              </Text>
            </HStack>
          </Flex>
        </VStack>
      </Container>
    </Box>
  );
}

