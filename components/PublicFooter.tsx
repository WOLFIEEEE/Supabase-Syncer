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
  Link,
} from '@chakra-ui/react';
import { SuparbaseLogo } from './Logo';
import ParticleTextAnimation from './ParticleTextAnimation';

export default function PublicFooter() {
  const router = useRouter();

  return (
    <Box 
      position="relative"
      borderTop="1px solid" 
      borderColor="rgba(255,255,255,0.05)"
      bg="rgba(0,0,0,0.3)"
      backdropFilter="blur(20px)"
      mt="auto"
    >
      <Container maxW="7xl" py={{ base: 10, md: 12 }} position="relative" px={{ base: 4, md: 6 }}>
        <VStack spacing={{ base: 8, md: 10 }} align="stretch">
          {/* Main Footer Content */}
          <Grid 
            templateColumns={{ base: '1fr', sm: '1fr', md: '2fr 1fr 1fr 1fr' }} 
            gap={{ base: 8, md: 12 }}
          >
            {/* Brand Column */}
            <VStack align={{ base: 'center', md: 'start' }} spacing={3}>
              <Box onClick={() => router.push('/')} cursor="pointer">
                <Box display={{ base: 'block', md: 'none' }}>
                  <SuparbaseLogo size="lg" showText={true} variant="full" />
                </Box>
                <Box display={{ base: 'none', md: 'block' }}>
                  <SuparbaseLogo size="2xl" showText={true} variant="full" />
                </Box>
              </Box>
              <Text 
                color="surface.500" 
                fontSize={{ base: 'xs', md: 'sm' }} 
                maxW="xs"
                textAlign={{ base: 'center', md: 'left' }}
                lineHeight="1.6"
              >
                Sync your databases safely. Built for developers who move fast.
              </Text>
            </VStack>

            {/* Product Column */}
            <VStack align={{ base: 'center', md: 'start' }} spacing={3}>
              <Text 
                fontSize="xs" 
                fontWeight="600" 
                color="surface.300" 
                letterSpacing="0.05em"
                textTransform="uppercase"
              >
                Product
              </Text>
              <VStack align={{ base: 'center', md: 'start' }} spacing={1.5}>
                {[
                  { label: 'Features', path: '/features' },
                  { label: 'Pricing', path: '/pricing' },
                  { label: 'Benefits', path: '/benefits' },
                  { label: 'Integrations', path: '/integrations' },
                  { label: 'Comparison', path: '/comparison' },
                  { label: 'Status', path: '/status' }
                ].map((link) => (
                  <Link
                    key={link.path}
                    as="button"
                    color="surface.500"
                    fontSize="sm"
                    fontWeight="400"
                    _hover={{ 
                      color: 'white',
                    }}
                    onClick={() => router.push(link.path)}
                    transition="color 0.2s"
                  >
                    {link.label}
                  </Link>
                ))}
              </VStack>
            </VStack>

            {/* Learn Column */}
            <VStack align={{ base: 'center', md: 'start' }} spacing={3}>
              <Text 
                fontSize="xs" 
                fontWeight="600" 
                color="surface.300" 
                letterSpacing="0.05em"
                textTransform="uppercase"
              >
                Learn
              </Text>
              <VStack align={{ base: 'center', md: 'start' }} spacing={1.5}>
                {[
                  { label: 'Getting Started', path: '/getting-started' },
                  { label: 'How It Works', path: '/how-it-works' },
                  { label: 'Use Cases', path: '/use-cases' },
                  { label: 'Guide', path: '/guide' },
                  { label: 'Best Practices', path: '/best-practices' },
                  { label: 'Troubleshooting', path: '/troubleshooting' },
                  { label: 'FAQ', path: '/faq' },
                  { label: 'Blog', path: '/blog' },
                  { label: 'Resources', path: '/resources' },
                  { label: 'Changelog', path: '/changelog' }
                ].map((link) => (
                  <Link
                    key={link.path}
                    as="button"
                    color="surface.500"
                    fontSize="sm"
                    fontWeight="400"
                    _hover={{ 
                      color: 'white',
                    }}
                    onClick={() => router.push(link.path)}
                    transition="color 0.2s"
                  >
                    {link.label}
                  </Link>
                ))}
              </VStack>
            </VStack>

            {/* Company & Legal Column */}
            <VStack align={{ base: 'center', md: 'start' }} spacing={3}>
              <Text 
                fontSize="xs" 
                fontWeight="600" 
                color="surface.300" 
                letterSpacing="0.05em"
                textTransform="uppercase"
              >
                Company
              </Text>
              <VStack align={{ base: 'center', md: 'start' }} spacing={1.5}>
                {[
                  { label: 'About', path: '/about' },
                  { label: 'Contact', path: '/contact' },
                  { label: 'Privacy', path: '/privacy' },
                  { label: 'Terms', path: '/terms' }
                ].map((link) => (
                  <Link
                    key={link.path}
                    as="button"
                    color="surface.500"
                    fontSize="sm"
                    fontWeight="400"
                    _hover={{ 
                      color: 'white',
                    }}
                    onClick={() => router.push(link.path)}
                    transition="color 0.2s"
                  >
                    {link.label}
                  </Link>
                ))}
              </VStack>
            </VStack>
          </Grid>

          {/* Divider */}
          <Box h="1px" bg="rgba(255,255,255,0.05)" />

          {/* Bottom Bar */}
          <Flex 
            direction={{ base: 'column', md: 'row' }}
            justify="space-between" 
            align="center"
            gap={{ base: 3, md: 4 }}
            pt={2}
          >
            <Text 
              color="surface.600" 
              fontSize={{ base: '2xs', md: 'xs' }}
              textAlign={{ base: 'center', md: 'left' }}
            >
              © {new Date().getFullYear()} Suparbase. All rights reserved.
            </Text>
            <HStack spacing={4} flexWrap="wrap" justify="center">
              <Text 
                color="surface.600" 
                fontSize={{ base: '2xs', md: 'xs' }}
              >
                v1.0.0
              </Text>
              <Box w="1px" h="10px" bg="surface.700" display={{ base: 'none', sm: 'block' }} />
              <Text 
                color="surface.600" 
                fontSize={{ base: '2xs', md: 'xs' }}
              >
                Beta
              </Text>
            </HStack>
          </Flex>
        </VStack>
      </Container>

      {/* Particle Text Animation */}
      <ParticleTextAnimation />
    </Box>
  );
}

