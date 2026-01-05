'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Grid,
  GridItem,
  Card,
  CardBody,
  Badge,
  Flex,
  Icon,
  SimpleGrid,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionBox = motion.div;

// Icons
const SyncIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const CodeIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </svg>
);

const ZapIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const BookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const features = [
  {
    icon: SyncIcon,
    title: 'One-Click Sync',
    description: 'Synchronize data between production and development databases with a single click.',
  },
  {
    icon: ShieldIcon,
    title: 'Schema Validation',
    description: 'Automatic schema comparison with critical issue detection before any sync.',
  },
  {
    icon: CodeIcon,
    title: 'Migration Generator',
    description: 'Generate idempotent SQL scripts to fix schema differences automatically.',
  },
  {
    icon: ZapIcon,
    title: 'Real-time Execution',
    description: 'Execute migrations directly from the UI with production safety confirmations.',
  },
];

const benefits = [
  'Works with any PostgreSQL database',
  'Supabase-optimized with RLS awareness',
  'Encrypted connection storage (AES-256-GCM)',
  'No external dependencies required',
  'Simple password-based authentication',
  'Mobile-responsive interface',
];

export default function LandingPageClient() {
  const router = useRouter();

  // Structured Data (JSON-LD)
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'suparbase',
    url: 'https://suparbase.com',
    logo: 'https://suparbase.com/logo.png',
    description: 'Open-source tool to sync Supabase databases between environments. Prevent free tier pausing with automated keep-alive.',
    sameAs: [],
  };

  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'suparbase',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: 'Open-source tool to sync Supabase databases between environments. Prevent free tier pausing with automated keep-alive. Schema validation, migration generation, and real-time sync.',
    featureList: [
      'One-Click Database Sync',
      'Schema Validation',
      'Migration Generator',
      'Real-time Execution',
      'Keep-Alive for Free Tier',
      'Encrypted Connection Storage',
    ],
  };

  return (
    <Box>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      {/* Hero Section */}
      <Box py={{ base: 12, md: 20 }}>
        <Container maxW="6xl">
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <VStack spacing={8} textAlign="center">
              <Box>
                <Image
                  src="/logo.png"
                  alt="suparbase logo"
                  width={64}
                  height={64}
                  style={{
                    width: '64px',
                    height: '64px',
                    objectFit: 'contain',
                  }}
                  priority
                />
              </Box>
              
              <VStack spacing={4}>
                <Badge colorScheme="teal" px={3} py={1} borderRadius="full" fontSize="sm">
                  Open Source • Self-Hosted
                </Badge>
                <Heading
                  as="h1"
                  size={{ base: 'xl', md: '2xl' }}
                  fontFamily="mono"
                  bgGradient="linear(to-r, brand.300, brand.500, purple.400)"
                  bgClip="text"
                  lineHeight="1.2"
                >
                  suparbase
                </Heading>
                <Text 
                  color="surface.300" 
                  fontSize={{ base: 'lg', md: 'xl' }} 
                  maxW="2xl"
                  px={4}
                >
                  Safely synchronize schemas and data between your Supabase environments.
                  Built for developers who need reliable database sync without the complexity.
                </Text>
              </VStack>

              <HStack spacing={4} flexWrap="wrap" justify="center">
                <Button
                  size="lg"
                  colorScheme="teal"
                  onClick={() => router.push('/login')}
                  px={8}
                >
                  Get Started
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  leftIcon={<BookIcon />}
                  onClick={() => router.push('/guide')}
                >
                  View Guide
                </Button>
              </HStack>
            </VStack>
          </MotionBox>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={{ base: 12, md: 16 }} bg="surface.900">
        <Container maxW="6xl">
          <VStack spacing={12}>
            <VStack spacing={3} textAlign="center">
              <Heading as="h2" size="lg" color="white">
                Everything You Need
              </Heading>
              <Text color="surface.400" maxW="lg">
                A complete toolkit for database synchronization with safety built-in
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="100%">
              {features.map((feature, idx) => (
                <MotionBox
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                >
                  <Card bg="surface.800" borderColor="surface.700" h="100%">
                    <CardBody p={6}>
                      <HStack spacing={4} align="start">
                        <Box color="brand.400" flexShrink={0}>
                          <feature.icon />
                        </Box>
                        <VStack align="start" spacing={2}>
                          <Heading as="h3" size="md" color="white">
                            {feature.title}
                          </Heading>
                          <Text color="surface.400" fontSize="sm">
                            {feature.description}
                          </Text>
                        </VStack>
                      </HStack>
                    </CardBody>
                  </Card>
                </MotionBox>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Benefits Section */}
      <Box py={{ base: 12, md: 16 }}>
        <Container maxW="4xl">
          <VStack spacing={8}>
            <Heading as="h2" size="lg" color="white" textAlign="center">
              Why suparbase?
            </Heading>
            
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} w="100%">
              {benefits.map((benefit, idx) => (
                <HStack key={idx} spacing={3} p={4} bg="surface.800" borderRadius="lg">
                  <Box color="green.400">
                    <CheckIcon />
                  </Box>
                  <Text color="surface.200">{benefit}</Text>
                </HStack>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box py={{ base: 12, md: 16 }} bg="surface.900">
        <Container maxW="4xl">
          <Card bg="surface.800" borderColor="brand.500" borderWidth="2px">
            <CardBody p={{ base: 6, md: 10 }} textAlign="center">
              <VStack spacing={6}>
                <Heading as="h2" size="lg" color="white">
                  Ready to Sync?
                </Heading>
                <Text color="surface.400" maxW="lg">
                  Set up in minutes. No credit card required. 
                  Just configure your connections and start syncing.
                </Text>
                <HStack spacing={4}>
                  <Button
                    size="lg"
                    colorScheme="teal"
                    onClick={() => router.push('/login')}
                  >
                    Start Now
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={() => router.push('/guide')}
                  >
                    Read the Docs
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </Container>
      </Box>

      {/* Footer */}
      <Box py={8} borderTopWidth="1px" borderColor="surface.700">
        <Container maxW="6xl">
          <Flex 
            justify="space-between" 
            align="center"
            direction={{ base: 'column', md: 'row' }}
            gap={4}
          >
            <HStack spacing={2}>
              <Box width="20px" height="20px" position="relative" flexShrink={0}>
                <Image
                  src="/logo.png"
                  alt="suparbase logo"
                  width={20}
                  height={20}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              </Box>
              <Text color="surface.400" fontSize="sm">
                suparbase • Open Source
              </Text>
            </HStack>
            <HStack spacing={6} flexWrap="wrap" justify="center">
              <Button variant="link" size="sm" color="surface.400" onClick={() => router.push('/guide')}>
                Documentation
              </Button>
              <Button variant="link" size="sm" color="surface.400" onClick={() => router.push('/features')}>
                Features
              </Button>
              <Button variant="link" size="sm" color="surface.400" onClick={() => router.push('/status')}>
                Status
              </Button>
              <Button variant="link" size="sm" color="surface.400" onClick={() => router.push('/privacy')}>
                Privacy
              </Button>
              <Button variant="link" size="sm" color="surface.400" onClick={() => router.push('/terms')}>
                Terms
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
}

