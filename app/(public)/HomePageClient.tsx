'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
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
  SimpleGrid,
  Divider,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import AnimatedBlobBackground from '@/components/AnimatedBlobBackground';

const MotionBox = motion.create(Box);
const MotionText = motion.create(Text);
const MotionVStack = motion.create(VStack);

// Improved Icons
const SyncIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 2v6h-6M3 22v-6h6M21 13A9 9 0 1 1 3 11" />
    <circle cx="12" cy="12" r="1" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const SqlIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 7h16M4 12h16M4 17h16" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M8 17v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2" />
    <circle cx="6" cy="7" r="1" fill="currentColor" />
    <circle cx="6" cy="12" r="1" fill="currentColor" />
    <circle cx="6" cy="17" r="1" fill="currentColor" />
    <circle cx="18" cy="7" r="1" fill="currentColor" />
    <circle cx="18" cy="12" r="1" fill="currentColor" />
    <circle cx="18" cy="17" r="1" fill="currentColor" />
  </svg>
);

const HeartbeatIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

const ZapIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const BookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

// Additional Icons for Perfect For Section
const RocketIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const DollarSignIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const RocketLaunchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
  </svg>
);

// Professional Icons for One-Click Sync visualization
const LocalDevIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M6 8h4M6 12h4M6 16h4" />
    <path d="M14 8h4M14 12h4M14 16h4" />
  </svg>
);

const CloudProdIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    <path d="M22 10a3 3 0 0 0-3-3h-2.5a5.5 5.5 0 0 0-11 0H6a3 3 0 0 0 0 6h3" />
  </svg>
);

// Minimal Pulse Component
const PulseConnection = () => (
  <Box
    position="relative"
    w={{ base: '100%', sm: '320px' }}
    maxW={{ base: '280px', sm: '320px' }}
    h={{ base: '90px', sm: '120px' }}
    display="flex"
    alignItems="center"
    justifyContent="space-between"
    px={{ base: 2, sm: 0 }}
    mx="auto"
  >
    <VStack spacing={{ base: 2, sm: 3 }} align="center">
      <Box
        w={{ base: 12, sm: 14 }}
        h={{ base: 12, sm: 14 }}
        borderRadius="xl"
        bg="surface.900"
        border="1.5px solid"
        borderColor="teal.400/20"
        display="flex"
        alignItems="center"
        justifyContent="center"
        position="relative"
        transition="all 0.3s"
        _hover={{
          borderColor: 'teal.400/40',
          transform: 'scale(1.05)'
        }}
      >
        <MotionBox
          position="absolute"
          inset={0}
          borderRadius="xl"
          bg="transparent"
          boxShadow="0 0 0px rgba(62, 207, 142, 0)"
          animate={{
            boxShadow: [
              '0 0 0px rgba(62, 207, 142, 0)',
              '0 0 20px rgba(62, 207, 142, 0.4)',
              '0 0 0px rgba(62, 207, 142, 0)'
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <Box as="svg" w={{ base: 6, sm: 8 }} h={{ base: 6, sm: 8 }} viewBox="0 0 24 24" fill="none" color="teal.400">
          <path
            d="M4 7C4 5.89543 4.89543 5 6 5H10C11.1046 5 12 5.89543 12 7V9C12 10.1046 11.1046 11 10 11H6C4.89543 11 4 10.1046 4 9V7Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 7C14 5.89543 14.8954 5 16 5H18C19.1046 5 20 5.89543 20 7V9C20 10.1046 19.1046 11 18 11H16C14.8954 11 14 10.1046 14 9V7Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 15C4 13.8954 4.89543 13 6 13H10C11.1046 13 12 13.8954 12 15V17C12 18.1046 11.1046 19 10 19H6C4.89543 19 4 18.1046 4 17V15Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 15C14 13.8954 14.8954 13 16 13H18C19.1046 13 20 13.8954 20 15V17C20 18.1046 19.1046 19 18 19H16C14.8954 19 14 18.1046 14 17V15Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Box>
      </Box>
      <Text fontSize={{ base: '10px', sm: '11px' }} color="surface.300" fontWeight="600" letterSpacing="0.05em">DEV</Text>
    </VStack>

    <Box flex={1} mx={{ base: 4, sm: 6 }} h={{ base: '1px', sm: '2px' }} bg="surface.800" position="relative" overflow="hidden" borderRadius="full">
      <Box
        position="absolute"
        top={0}
        left={0}
        w="100%"
        h="100%"
        bg="surface.700"
        borderRadius="full"
      />
      <MotionBox
        position="absolute"
        top={0}
        left="-100%"
        w="40%"
        h="100%"
        bgGradient="linear(to-r, transparent, teal.400, teal.400, transparent)"
        borderRadius="full"
        boxShadow="0 0 8px rgba(62, 207, 142, 0.5)"
        animate={{ left: '140%' }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
      />
    </Box>

    <VStack spacing={{ base: 2, sm: 3 }} align="center">
      <Box
        w={{ base: 12, sm: 14 }}
        h={{ base: 12, sm: 14 }}
        borderRadius="xl"
        bg="surface.900"
        border="1.5px solid"
        borderColor="brand.400/20"
        display="flex"
        alignItems="center"
        justifyContent="center"
        position="relative"
        transition="all 0.3s"
        _hover={{
          borderColor: 'brand.400/40',
          transform: 'scale(1.05)'
        }}
      >
        <MotionBox
          position="absolute"
          inset={0}
          borderRadius="xl"
          bg="transparent"
          boxShadow="0 0 0px rgba(99, 102, 241, 0)"
          animate={{
            boxShadow: [
              '0 0 0px rgba(99, 102, 241, 0)',
              '0 0 20px rgba(99, 102, 241, 0.4)',
              '0 0 0px rgba(99, 102, 241, 0)'
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <Box as="svg" w={{ base: 6, sm: 8 }} h={{ base: 6, sm: 8 }} viewBox="0 0 24 24" fill="none" color="brand.400">
          <ellipse
            cx="12"
            cy="5"
            rx="9"
            ry="3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3 5V19C3 20.6569 7.02944 22 12 22C16.9706 22 21 20.6569 21 19V5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3 12C3 13.6569 7.02944 15 12 15C16.9706 15 21 13.6569 21 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Box>
      </Box>
      <Text fontSize={{ base: '10px', sm: '11px' }} color="surface.300" fontWeight="600" letterSpacing="0.05em">PROD</Text>
    </VStack>
  </Box>
);

export default function HomePageClient() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  // Structured Data (JSON-LD) for SEO
  const organizationSchema = {
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
    url: 'https://suparbase.com',
    author: {
      '@type': 'Organization',
      name: 'suparbase',
    },
    featureList: [
      'Database Synchronization',
      'Schema Validation',
      'Migration Generation',
      'Keep-Alive Service',
      'Encrypted Storage',
      'Real-time Sync',
    ],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'suparbase',
    url: 'https://suparbase.com',
    description: 'Sync Supabase databases between environments. Prevent free tier pausing with automated keep-alive.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://suparbase.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <Box position="relative" bg="rgba(9, 9, 11, 1)" overflow="hidden" minH="100vh" overflowX="hidden">
        {/* Animated Blob Background */}
        <AnimatedBlobBackground />

        {/* Subtle Grid Background */}
        <Box
          position="absolute"
          inset={0}
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
          pointerEvents="none"
          zIndex={1}
        />

        {/* Main Hero Container */}
        <Container maxW="5xl" pt={{ base: 20, md: 28 }} pb={20} px={{ base: 4, sm: 6, md: 8 }}>
          <VStack spacing={12} align="center" textAlign="center">

            {/* Minimal Badge */}
            <MotionBox
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <HStack
                px={{ base: 3, sm: 4 }}
                py={1.5}
                bg="rgba(255,255,255,0.03)"
                borderRadius="full"
                border="1px solid"
                borderColor="rgba(255,255,255,0.1)"
                spacing={2}
                flexWrap="wrap"
                justify="center"
              >
                <Box w={1.5} h={1.5} borderRadius="full" bg="teal.400" className="pulse-dot" flexShrink={0} />
                <style jsx global>{`
                @keyframes pulse-dot {
                  0% { transform: scale(1); opacity: 1; }
                  50% { transform: scale(1.5); opacity: 0.5; }
                  100% { transform: scale(1); opacity: 1; }
                }
                .pulse-dot { animation: pulse-dot 2s infinite; }
              `}</style>
                <Text
                  fontSize={{ base: '2xs', sm: 'xs' }}
                  fontWeight="600"
                  color="surface.300"
                  letterSpacing="0.05em"
                  whiteSpace="nowrap"
                >
                  DATABASE SYNC PLATFORM
                </Text>
              </HStack>
            </MotionBox>

            {/* Headline - Focus on Typography */}
            <MotionVStack
              spacing={6}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              align="center"
              w="full"
            >
              <Heading
                as="h1"
                fontSize={{ base: '3xl', sm: '4xl', md: '6xl', lg: '8xl' }}
                fontWeight="700"
                lineHeight={{ base: '1.1', md: '0.95' }}
                letterSpacing={{ base: '-0.01em', md: '-0.04em' }}
                color="white"
                fontFamily="'Outfit', sans-serif"
                px={{ base: 2, sm: 0 }}
                textAlign="center"
                w="full"
              >
                Sync your <br />
                <Box
                  as="span"
                  color="transparent"
                  sx={{
                    WebkitTextStroke: { base: '1.5px #3ECF8E', md: '2px #3ECF8E' },
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  databases
                </Box>
                {' '}safely.
              </Heading>
              <Text
                fontSize={{ base: 'md', sm: 'lg', md: '2xl' }}
                color="surface.300"
                maxW="2xl"
                lineHeight={{ base: '1.5', md: '1.4' }}
                fontWeight="400"
                px={{ base: 2, sm: 0 }}
                textAlign="center"
                w="full"
              >
                Production-grade synchronization for Supabase with automatic rollback, parallel processing, and real-time monitoring.
              </Text>
            </MotionVStack>

            {/* Creative Minimal Visual */}
            <MotionBox
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              pt={4}
              w="100%"
              display="flex"
              justifyContent="center"
              overflow="hidden"
            >
              <PulseConnection />
            </MotionBox>

            {/* Action Area */}
            <Flex
              direction={{ base: 'column', sm: 'row' }}
              pt={4}
              gap={{ base: 4, sm: 6 }}
              align="center"
              justify="center"
              w="100%"
              px={{ base: 4, sm: 0 }}
            >
              <MotionBox
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                w={{ base: 'full', sm: 'auto' }}
              >
                <Button
                  size="lg"
                  height={{ base: '56px', sm: '72px' }}
                  px={{ base: 8, sm: 12 }}
                  w={{ base: 'full', sm: 'auto' }}
                  bg="white"
                  color="black"
                  fontSize={{ base: 'md', sm: 'lg' }}
                  fontWeight="700"
                  borderRadius="2xl"
                  _hover={{ bg: 'teal.400', color: 'white' }}
                  onClick={() => router.push('/login')}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  rightIcon={
                    <MotionBox
                      animate={{ x: isHovered ? 5 : 0 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <ArrowRightIcon />
                    </MotionBox>
                  }
                >
                  Start Syncing
                </Button>
              </MotionBox>

              <HStack spacing={4} flexWrap="wrap" justify="center" w={{ base: 'full', sm: 'auto' }} align="center">
                <Button
                  size="lg"
                  variant="link"
                  color="surface.300"
                  fontSize={{ base: 'md', sm: 'lg' }}
                  fontWeight="600"
                  _hover={{ color: 'white' }}
                  onClick={() => router.push('/getting-started')}
                  minH="44px"
                >
                  Quick Start
                </Button>
                <Text color="surface.600" display={{ base: 'none', sm: 'block' }}>•</Text>
                <Button
                  size="lg"
                  variant="link"
                  color="surface.300"
                  fontSize={{ base: 'md', sm: 'lg' }}
                  fontWeight="600"
                  _hover={{ color: 'white' }}
                  onClick={() => router.push('/how-it-works')}
                  minH="44px"
                >
                  How It Works
                </Button>
              </HStack>
            </Flex>

            {/* Feature Bento Grid */}
            <Grid
              templateColumns={{ base: '1fr', md: 'repeat(12, 1fr)' }}
              templateRows={{ base: 'auto', md: 'repeat(2, 280px)' }}
              gap={{ base: 4, md: 6 }}
              pt={{ base: 12, sm: 16, md: 24 }}
              w="full"
            >
              {/* 1. One-Click Sync - Featured Large */}
              <GridItem colSpan={{ base: 1, md: 8 }} rowSpan={1}>
                <MotionBox
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  h="full"
                >
                  <Card
                    h="full"
                    bg="rgba(255,255,255,0.01)"
                    border="1px solid"
                    borderColor="rgba(255,255,255,0.05)"
                    borderRadius="3xl"
                    overflow="hidden"
                    position="relative"
                    _hover={{ borderColor: 'teal.400/30', bg: 'rgba(255,255,255,0.02)', transform: 'translateY(-2px)' }}
                    transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                    boxShadow="0 4px 20px rgba(0,0,0,0.1)"
                  >
                    <CardBody p={{ base: 6, md: 10 }} pb={{ base: 8, md: 12 }} display="flex" flexDirection={{ base: 'column', lg: 'row' }} alignItems={{ base: 'start', lg: 'center' }} gap={{ base: 6, lg: 10 }}>
                      <VStack align="start" spacing={4} flex={1.2} minW={0} w="full">
                        <Badge
                          colorScheme="teal"
                          variant="subtle"
                          px={3}
                          py={1.5}
                          borderRadius="lg"
                          fontSize="xs"
                          fontWeight="700"
                          letterSpacing="0.1em"
                          textTransform="uppercase"
                        >
                          Instant Sync
                        </Badge>
                        <VStack align="start" spacing={3} w="full">
                          <Heading size="md" color="white" fontWeight="700" fontFamily="'Outfit', sans-serif" lineHeight="1.3">One-Click Sync</Heading>
                          <Text color="surface.400" fontSize="sm" lineHeight="1.7" maxW="md" textAlign="left">
                            Effortless data migration between environments with automatic rollback protection. Push local changes to staging or production with a single click. Parallel table processing for 2-3x faster syncs.
                          </Text>
                        </VStack>
                      </VStack>

                      {/* Cool Art Visualization */}
                      <Box
                        flex={1}
                        w="full"
                        h="full"
                        minH={{ base: '160px', lg: '180px' }}
                        position="relative"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        bg="rgba(255,255,255,0.02)"
                        borderRadius="2xl"
                        border="1px solid"
                        borderColor="rgba(255,255,255,0.08)"
                        pb={6}
                        overflow="hidden"
                      >
                        {/* Geometric Art Pattern */}
                        <Box
                          as="svg"
                          position="absolute"
                          inset={0}
                          width="100%"
                          height="100%"
                          viewBox="0 0 400 300"
                          preserveAspectRatio="xMidYMid meet"
                          opacity={0.6}
                        >
                          <defs>
                            <linearGradient id="artGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#3ECF8E" stopOpacity="0.3" />
                              <stop offset="50%" stopColor="#6366F1" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#3ECF8E" stopOpacity="0.1" />
                            </linearGradient>
                            <linearGradient id="artGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.3" />
                              <stop offset="50%" stopColor="#A855F7" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.1" />
                            </linearGradient>
                            <filter id="glow">
                              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                              <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                          </defs>

                          {/* Flowing curves */}
                          <path
                            d="M 50 150 Q 100 50, 150 150 T 250 150 T 350 150"
                            stroke="url(#artGradient1)"
                            strokeWidth="3"
                            fill="none"
                            filter="url(#glow)"
                          />
                          <path
                            d="M 50 200 Q 150 100, 250 200 T 350 200"
                            stroke="url(#artGradient2)"
                            strokeWidth="2.5"
                            fill="none"
                            filter="url(#glow)"
                            opacity="0.7"
                          />

                          {/* Geometric shapes */}
                          <circle cx="100" cy="120" r="25" fill="url(#artGradient1)" opacity="0.4" filter="url(#glow)" />
                          <circle cx="300" cy="180" r="30" fill="url(#artGradient2)" opacity="0.4" filter="url(#glow)" />
                          <polygon points="200,80 220,120 180,120" fill="url(#artGradient1)" opacity="0.3" filter="url(#glow)" />
                          <polygon points="150,200 170,240 130,240" fill="url(#artGradient2)" opacity="0.3" filter="url(#glow)" />

                          {/* Connecting lines */}
                          <line x1="100" y1="120" x2="200" y2="100" stroke="#3ECF8E" strokeWidth="2" opacity="0.3" />
                          <line x1="200" y1="100" x2="300" y2="180" stroke="#6366F1" strokeWidth="2" opacity="0.3" />
                          <line x1="150" y1="220" x2="250" y2="200" stroke="#A855F7" strokeWidth="2" opacity="0.3" />
                        </Box>

                        {/* Overlay gradient */}
                        <Box
                          position="absolute"
                          inset={0}
                          bgGradient="radial(circle at center, transparent 0%, rgba(9, 9, 11, 0.3) 100%)"
                          pointerEvents="none"
                        />
                      </Box>
                    </CardBody>
                  </Card>
                </MotionBox>
              </GridItem>

              {/* 2. Schema Guard - Vertical Side */}
              <GridItem colSpan={{ base: 1, md: 4 }} rowSpan={{ base: 1, md: 2 }}>
                <MotionBox
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  h="full"
                >
                  <Card
                    h="full"
                    bg="rgba(255,255,255,0.01)"
                    border="1px solid"
                    borderColor="rgba(255,255,255,0.05)"
                    borderRadius="3xl"
                    overflow="hidden"
                    position="relative"
                    _hover={{ borderColor: 'purple.400/30', bg: 'rgba(255,255,255,0.02)', transform: 'translateY(-2px)' }}
                    transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                    boxShadow="0 4px 20px rgba(0,0,0,0.1)"
                  >
                    <CardBody p={{ base: 6, md: 8 }} display="flex" flexDirection="column" gap={6} h="full">
                      <VStack align="start" spacing={6} flex="0 0 auto" w="full">
                        <Box
                          p={4}
                          bg="purple.400/10"
                          borderRadius="2xl"
                          color="purple.400"
                          w="fit-content"
                          border="1px solid"
                          borderColor="purple.400/20"
                          boxShadow="0 0 20px rgba(168, 85, 247, 0.15)"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <ShieldIcon />
                        </Box>
                        <VStack align="start" spacing={3} w="full">
                          <Heading size="md" color="white" fontWeight="700" fontFamily="'Outfit', sans-serif" lineHeight="1.3">Schema Guard</Heading>
                          <Text color="surface.400" fontSize="sm" lineHeight="1.7" textAlign="left">
                            Automated validation checks before every sync. Backup snapshots created automatically with instant rollback on failure. Real-time metrics dashboard monitors every sync.
                          </Text>
                        </VStack>
                      </VStack>

                      {/* Terminal Mockup */}
                      <Box
                        mt="auto"
                        w="full"
                        bg="rgba(0,0,0,0.6)"
                        backdropFilter="blur(10px)"
                        borderRadius="xl"
                        border="1px solid"
                        borderColor="rgba(255,255,255,0.1)"
                        p={5}
                        boxShadow="0 8px 32px rgba(0,0,0,0.4)"
                      >
                        <HStack spacing={2} mb={4}>
                          <Box w={3} h={3} borderRadius="full" bg="red.500" opacity={0.6} />
                          <Box w={3} h={3} borderRadius="full" bg="orange.500" opacity={0.6} />
                          <Box w={3} h={3} borderRadius="full" bg="green.500" opacity={0.6} />
                        </HStack>
                        <VStack align="start" spacing={4} w="full">
                          {[
                            { text: 'Detecting conflicts...', status: 'complete' },
                            { text: 'Checking constraints...', status: 'complete' },
                            { text: 'Validating types...', status: 'loading' }
                          ].map((item, i) => (
                            <HStack key={i} w="full" justify="flex-start" align="center" spacing={3}>
                              <Text fontSize="11px" color="surface.200" fontFamily="mono" letterSpacing="0.01em">
                                <Box as="span" color="purple.400" fontWeight="600" mr={2.5}>$</Box>
                                {item.text}
                              </Text>
                              {item.status === 'complete' ? (
                                <Box color="teal.400" transform="scale(0.85)">
                                  <CheckIcon />
                                </Box>
                              ) : (
                                <Box w={2.5} h={2.5} borderRadius="full" bg="purple.400" className="pulse-dot" boxShadow="0 0 8px rgba(168, 85, 247, 0.6)" />
                              )}
                            </HStack>
                          ))}
                        </VStack>
                      </Box>
                    </CardBody>
                  </Card>
                </MotionBox>
              </GridItem>

              {/* 3. Idempotent SQL - Medium Row */}
              <GridItem colSpan={{ base: 1, md: 4 }} rowSpan={1}>
                <MotionBox
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  h="full"
                >
                  <Card
                    h="full"
                    bg="rgba(255,255,255,0.01)"
                    border="1px solid"
                    borderColor="rgba(255,255,255,0.05)"
                    borderRadius="3xl"
                    overflow="hidden"
                    position="relative"
                    _hover={{ borderColor: 'cyan.400/30', bg: 'rgba(255,255,255,0.02)', transform: 'translateY(-2px)' }}
                    transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                    boxShadow="0 4px 20px rgba(0,0,0,0.1)"
                  >
                    <CardBody p={{ base: 5, md: 6 }} display="flex" flexDirection="column" gap={4} justifyContent="center" h="full" w="full">
                      <Box
                        p={3.5}
                        bg="cyan.400/10"
                        borderRadius="2xl"
                        color="cyan.400"
                        w="fit-content"
                        border="1px solid"
                        borderColor="cyan.400/20"
                        boxShadow="0 0 20px rgba(34, 211, 238, 0.15)"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <SqlIcon />
                      </Box>
                      <VStack align="start" spacing={2.5} w="full">
                        <Heading size="md" color="white" fontWeight="700" fontFamily="'Outfit', sans-serif" lineHeight="1.3">Idempotent SQL</Heading>
                        <Text color="surface.400" fontSize="sm" lineHeight="1.6" textAlign="left">
                          Safe, repeatable migrations with idempotent retries. UPSERT operations ensure consistency with transaction isolation. Smart rate limiting prevents database overload.
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>
                </MotionBox>
              </GridItem>

              {/* 4. Keep-Alive - Medium Row */}
              <GridItem colSpan={{ base: 1, md: 4 }} rowSpan={1}>
                <MotionBox
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  h="full"
                >
                  <Card
                    h="full"
                    bg="rgba(255,255,255,0.01)"
                    border="1px solid"
                    borderColor="rgba(255,255,255,0.05)"
                    borderRadius="3xl"
                    overflow="hidden"
                    position="relative"
                    _hover={{ borderColor: 'brand.400/30', bg: 'rgba(255,255,255,0.02)', transform: 'translateY(-2px)' }}
                    transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                    boxShadow="0 4px 20px rgba(0,0,0,0.1)"
                  >
                    <CardBody p={{ base: 5, md: 6 }} display="flex" flexDirection="column" gap={4} justifyContent="center" h="full" w="full">
                      <Box
                        p={3.5}
                        bg="brand.400/10"
                        borderRadius="2xl"
                        color="brand.400"
                        w="fit-content"
                        border="1px solid"
                        borderColor="brand.400/20"
                        boxShadow="0 0 20px rgba(99, 102, 241, 0.15)"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <HeartbeatIcon />
                      </Box>
                      <VStack align="start" spacing={2.5} w="full">
                        <Heading size="md" color="white" fontWeight="700" fontFamily="'Outfit', sans-serif" lineHeight="1.3">Keep-Alive</Heading>
                        <Text color="surface.400" fontSize="sm" lineHeight="1.6" textAlign="left">
                          Prevent free-tier pausing automatically. We send subtle pulses to your database to keep it awake, active, and always ready for your users.
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>
                </MotionBox>
              </GridItem>
            </Grid>

          </VStack>
        </Container>

        {/* Decorative Side Elements - Minimal */}
        <Box position="absolute" top="20%" left="5%" display={{ base: 'none', lg: 'block' }}>
          <MotionText
            fontFamily="mono"
            fontSize="xs"
            color="surface.400"
            fontWeight="500"
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 0.8, rotate: -90 }}
            transition={{ duration: 1, delay: 1 }}
          >
            {/* AES-256-GCM ENCRYPTED */}
            AES-256-GCM
          </MotionText>
        </Box>
        <Box position="absolute" bottom="20%" right="5%" display={{ base: 'none', lg: 'block' }}>
          <MotionText
            fontFamily="mono"
            fontSize="xs"
            color="surface.600"
            initial={{ opacity: 0, rotate: 90 }}
            animate={{ opacity: 0.4, rotate: 90 }}
            transition={{ duration: 1, delay: 1 }}
          >
            v1.0.0-STABLE
          </MotionText>
        </Box>

        {/* Who's This For Section */}
        <Box py={24} position="relative" overflow="hidden">
          {/* Section Background */}
          <Box
            position="absolute"
            inset={0}
            style={{
              backgroundImage: `
              radial-gradient(ellipse 80% 50% at 50% 0%, rgba(62, 207, 142, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at 80% 100%, rgba(99, 102, 241, 0.06) 0%, transparent 50%)
            `
            }}
            pointerEvents="none"
          />

          <Container maxW="6xl" position="relative">
            {/* Section Header */}
            <MotionVStack
              spacing={4}
              textAlign="center"
              mb={16}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              align="center"
              w="full"
            >
              <HStack spacing={2} justify="center">
                <Box w={8} h="1px" bg="teal.400/50" />
                <Text
                  fontSize="xs"
                  fontWeight="700"
                  color="teal.400"
                  letterSpacing="0.15em"
                  textTransform="uppercase"
                >
                  Before You Start
                </Text>
                <Box w={8} h="1px" bg="teal.400/50" />
              </HStack>
              <Heading
                as="h2"
                fontSize={{ base: '3xl', md: '5xl' }}
                fontWeight="700"
                color="white"
                fontFamily="'Outfit', sans-serif"
                letterSpacing="-0.02em"
                textAlign="center"
                lineHeight="1.2"
              >
                Is this for{' '}
                <Text as="span" color="teal.400">you</Text>
                ?
              </Heading>
              <Text color="surface.400" fontSize="lg" maxW="2xl" textAlign="center" lineHeight="1.6">
                We built this with a specific audience in mind. Here&apos;s who will benefit the most, and who might need something else.
              </Text>
            </MotionVStack>

            {/* Audience Comparison Bento Grid */}
            <Grid
              templateColumns={{ base: '1fr', md: 'repeat(12, 1fr)' }}
              templateRows={{ base: 'auto', md: 'repeat(2, auto)' }}
              gap={{ base: 4, md: 6 }}
            >
              {/* 1. Perfect For - Large Featured Area */}
              <GridItem colSpan={{ base: 1, md: 7 }} rowSpan={{ base: 1, md: 2 }}>
                <MotionBox
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  h="full"
                >
                  <Card
                    h="full"
                    bg="rgba(62, 207, 142, 0.02)"
                    border="1px solid"
                    borderColor="teal.400/20"
                    borderRadius="3xl"
                    overflow="hidden"
                    position="relative"
                    _hover={{ borderColor: 'teal.400/40', bg: 'rgba(62, 207, 142, 0.04)' }}
                    transition="all 0.4s ease"
                  >
                    <Box
                      position="absolute"
                      top={0}
                      left={0}
                      right={0}
                      h="2px"
                      bgGradient="linear(to-r, teal.400, teal.200)"
                    />
                    <CardBody p={{ base: 6, md: 10 }}>
                      <VStack align="start" spacing={8} w="full">
                        <HStack spacing={4} align="center">
                          <Box p={3} bg="teal.400/10" borderRadius="2xl" color="teal.400" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                            <Box as="svg" w={6} h={6} viewBox="0 0 24 24" fill="none">
                              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                            </Box>
                          </Box>
                          <VStack align="start" spacing={0}>
                            <Text fontSize="xl" fontWeight="700" color="white" lineHeight="1.3">Perfect For</Text>
                            <Text fontSize="xs" color="teal.400" fontWeight="600" letterSpacing="0.05em" lineHeight="1.4">BUILDERS & HACKERS</Text>
                          </VStack>
                        </HStack>

                        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={6} w="full">
                          {[
                            {
                              title: 'Indie Hackers',
                              desc: 'Building MVPs? Save hours on manual migrations.',
                              icon: <RocketIcon />
                            },
                            {
                              title: 'Free Tier Users',
                              desc: 'Keep your database awake 24/7 automatically.',
                              icon: <ZapIcon />
                            },
                            {
                              title: 'Small Teams',
                              desc: 'Sync environments in seconds, not hours.',
                              icon: <UsersIcon />
                            },
                            {
                              title: 'Prototyping',
                              desc: 'Safely experiment without fear of breaking prod.',
                              icon: <DollarSignIcon />
                            },
                            {
                              title: 'Early Startups',
                              desc: 'Move fast with built-in schema validation.',
                              icon: <RocketLaunchIcon />
                            }
                          ].map((item, i) => (
                            <MotionBox
                              key={i}
                              whileHover={{ scale: 1.02 }}
                              p={4}
                              bg="rgba(255,255,255,0.02)"
                              borderRadius="2xl"
                              border="1px solid"
                              borderColor="rgba(255,255,255,0.05)"
                            >
                              <VStack align="start" spacing={3} w="full">
                                <Box color="teal.400" display="flex" alignItems="center" justifyContent="center" w={5} h={5} flexShrink={0}>
                                  {item.icon}
                                </Box>
                                <VStack align="start" spacing={1} w="full">
                                  <Text fontWeight="600" color="white" fontSize="sm" lineHeight="1.3">{item.title}</Text>
                                  <Text color="surface.400" fontSize="xs" lineHeight="1.6">{item.desc}</Text>
                                </VStack>
                              </VStack>
                            </MotionBox>
                          ))}
                        </SimpleGrid>
                      </VStack>
                    </CardBody>
                  </Card>
                </MotionBox>
              </GridItem>

              {/* 2. Not Ideal For - Side Warning Area */}
              <GridItem colSpan={{ base: 1, md: 5 }} rowSpan={1}>
                <MotionBox
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  h="full"
                >
                  <Card
                    h="full"
                    bgGradient="linear(to-br, rgba(127, 29, 29, 0.15), rgba(69, 10, 10, 0.25))"
                    border="1px solid"
                    borderColor="red.500/20"
                    borderRadius="3xl"
                    overflow="hidden"
                    position="relative"
                    _hover={{ borderColor: 'red.500/40', transform: 'translateY(-2px)' }}
                    transition="all 0.4s ease"
                    boxShadow="0 8px 32px rgba(220, 38, 38, 0.15)"
                  >
                    {/* Artistic Background Elements */}
                    <Box
                      position="absolute"
                      top={0}
                      right={0}
                      w="200px"
                      h="200px"
                      opacity={0.1}
                      pointerEvents="none"
                    >
                      <Box
                        as="svg"
                        w="100%"
                        h="100%"
                        viewBox="0 0 200 200"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle cx="100" cy="100" r="80" stroke="rgba(239, 68, 68, 0.3)" strokeWidth="2" strokeDasharray="4 4" />
                        <circle cx="100" cy="100" r="50" stroke="rgba(239, 68, 68, 0.2)" strokeWidth="1.5" strokeDasharray="3 3" />
                        <path d="M100 20 L100 180 M20 100 L180 100" stroke="rgba(239, 68, 68, 0.15)" strokeWidth="1" />
                      </Box>
                    </Box>

                    <Box
                      position="absolute"
                      bottom={0}
                      left={0}
                      w="150px"
                      h="150px"
                      opacity={0.08}
                      pointerEvents="none"
                    >
                      <Box
                        as="svg"
                        w="100%"
                        h="100%"
                        viewBox="0 0 150 150"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <polygon points="75,10 140,140 10,140" stroke="rgba(239, 68, 68, 0.25)" strokeWidth="2" fill="none" />
                        <polygon points="75,30 120,120 30,120" stroke="rgba(239, 68, 68, 0.15)" strokeWidth="1.5" fill="none" />
                      </Box>
                    </Box>

                    {/* Subtle grid pattern */}
                    <Box
                      position="absolute"
                      inset={0}
                      opacity={0.03}
                      style={{
                        backgroundImage: `
                        linear-gradient(rgba(239, 68, 68, 0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(239, 68, 68, 0.1) 1px, transparent 1px)
                      `,
                        backgroundSize: '20px 20px'
                      }}
                      pointerEvents="none"
                    />

                    <CardBody p={{ base: 6, md: 8 }} position="relative" zIndex={1}>
                      <VStack align="start" spacing={6} w="full">
                        <HStack spacing={3} align="center">
                          <Box
                            p={3}
                            bg="rgba(239, 68, 68, 0.15)"
                            borderRadius="xl"
                            color="red.400"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexShrink={0}
                            border="1px solid"
                            borderColor="red.500/20"
                            boxShadow="0 4px 12px rgba(239, 68, 68, 0.2)"
                          >
                            <Box as="svg" w={6} h={6} viewBox="0 0 24 24" fill="none">
                              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </Box>
                          </Box>
                          <VStack align="start" spacing={0}>
                            <Text fontSize="lg" fontWeight="700" color="white" lineHeight="1.3">Not Ideal For</Text>
                            <Text fontSize="xs" color="red.400" fontWeight="600" letterSpacing="0.1em" lineHeight="1.4">LIMITATIONS</Text>
                          </VStack>
                        </HStack>

                        <VStack align="start" spacing={3} w="full">
                          {[
                            { title: 'Large Databases', val: '50GB+', desc: 'Syncing massive datasets hits limits.' },
                            { title: 'Enterprise', val: '100+ Tables', desc: 'Complex triggers & legacy schemas.' },
                            { title: 'High Traffic', val: '1M+ Req/min', desc: 'Need zero-downtime replication.' },
                            { title: 'Other DBs', val: 'MySQL/Mongo', desc: 'Built only for Supabase PostgreSQL.' },
                            { title: 'Regulated', val: 'HIPAA/PCI', desc: 'Need compliance we don&apos;t have yet.' }
                          ].map((item, i) => (
                            <MotionBox
                              key={i}
                              w="full"
                              whileHover={{ x: -4 }}
                              transition={{ duration: 0.2 }}
                            >
                              <HStack
                                w="full"
                                justify="space-between"
                                align={{ base: 'start', sm: 'center' }}
                                p={3.5}
                                bg="rgba(0, 0, 0, 0.3)"
                                backdropFilter="blur(8px)"
                                borderRadius="xl"
                                border="1px solid"
                                borderColor="rgba(239, 68, 68, 0.15)"
                                flexWrap={{ base: 'wrap', sm: 'nowrap' }}
                                spacing={3}
                                _hover={{
                                  bg: 'rgba(0, 0, 0, 0.4)',
                                  borderColor: 'rgba(239, 68, 68, 0.3)'
                                }}
                                transition="all 0.3s"
                              >
                                <VStack align="start" spacing={0.5} flex={1} minW={0}>
                                  <Text fontWeight="600" color="white" fontSize="xs" lineHeight="1.3">{item.title}</Text>
                                  <Text color="surface.400" fontSize="2xs" lineHeight="1.5">{item.desc}</Text>
                                </VStack>
                                <Badge
                                  colorScheme="red"
                                  variant="solid"
                                  fontSize="2xs"
                                  flexShrink={0}
                                  bg="rgba(239, 68, 68, 0.2)"
                                  color="red.300"
                                  border="1px solid"
                                  borderColor="rgba(239, 68, 68, 0.3)"
                                  px={2}
                                  py={0.5}
                                  fontWeight="700"
                                  letterSpacing="0.05em"
                                >
                                  {item.val}
                                </Badge>
                              </HStack>
                            </MotionBox>
                          ))}
                        </VStack>
                      </VStack>
                    </CardBody>
                  </Card>
                </MotionBox>
              </GridItem>

              {/* 3. Honest Disclaimer Area */}
              <GridItem colSpan={{ base: 1, md: 5 }} rowSpan={1}>
                <MotionBox
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  h="full"
                >
                  <Card
                    h="full"
                    bg="rgba(255,255,255,0.01)"
                    border="1px solid"
                    borderColor="rgba(255,255,255,0.05)"
                    borderRadius="3xl"
                    overflow="hidden"
                    _hover={{ borderColor: 'surface.700', bg: 'rgba(255,255,255,0.02)' }}
                    transition="all 0.4s ease"
                  >
                    <CardBody p={{ base: 6, md: 8 }} display="flex" flexDirection="column" justifyContent="center" h="full" w="full">
                      <VStack align="start" spacing={4} w="full">
                        <Text color="surface.300" fontSize="sm" fontStyle="italic" lineHeight="1.6" textAlign="left">
                          &quot;We built suparbase specifically for the Supabase ecosystem. If you&apos;re using MySQL or MongoDB, this isn&apos;t for you (yet).&quot;
                        </Text>
                        <HStack spacing={3} align="center">
                          <Box w={8} h="2px" bg="teal.400" borderRadius="full" flexShrink={0} />
                          <Text color="teal.400" fontWeight="700" fontSize="xs" letterSpacing="0.1em" lineHeight="1.4">HONEST NOTE</Text>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                </MotionBox>
              </GridItem>
            </Grid>

            {/* Bottom Stats/Info Banner */}
            <MotionBox
              mt={12}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card
                bg="rgba(255,255,255,0.02)"
                border="1px solid"
                borderColor="surface.800"
                borderRadius="2xl"
              >
                <CardBody py={{ base: 4, md: 6 }} px={{ base: 4, md: 8 }}>
                  <Flex
                    direction={{ base: 'column', md: 'row' }}
                    justify="space-between"
                    align="center"
                    gap={{ base: 4, md: 6 }}
                  >
                    <HStack spacing={3} align="center">
                      <Box
                        p={2}
                        bg="yellow.400/10"
                        borderRadius="lg"
                        color="yellow.400"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        flexShrink={0}
                      >
                        <Box as="svg" w={5} h={5} viewBox="0 0 24 24" fill="none">
                          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </Box>
                      </Box>
                      <VStack align={{ base: 'start', md: 'start' }} spacing={0}>
                        <Text fontWeight="600" color="white" fontSize="sm" lineHeight="1.3">Recommended Limits</Text>
                        <Text color="surface.400" fontSize="xs" lineHeight="1.4">For optimal performance</Text>
                      </VStack>
                    </HStack>

                    <HStack spacing={{ base: 4, md: 8 }} flexWrap="wrap" justify={{ base: 'center', md: 'center' }} align="center">
                      {[
                        { label: 'Tables', value: '< 100' },
                        { label: 'Database Size', value: '< 10GB' },
                        { label: 'Rows per Table', value: '< 1M' },
                        { label: 'Connections', value: '< 10' }
                      ].map((stat, i) => (
                        <VStack key={i} spacing={0} align="center">
                          <Text fontFamily="mono" fontWeight="700" color="teal.400" fontSize="lg" lineHeight="1.2">{stat.value}</Text>
                          <Text color="surface.500" fontSize="xs" lineHeight="1.4" textAlign="center">{stat.label}</Text>
                        </VStack>
                      ))}
                    </HStack>
                  </Flex>
                </CardBody>
              </Card>
            </MotionBox>

            {/* Honest Note */}
            <MotionBox
              mt={8}
              textAlign="center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.8 }}
              w="full"
              px={{ base: 4, sm: 0 }}
            >
              <Text color="surface.500" fontSize="sm" fontStyle="italic" lineHeight="1.6" maxW="2xl" mx="auto">
                &quot;We&apos;d rather you know upfront than be disappointed later. If you&apos;re in the sweet spot, you&apos;ll love us.&quot;
              </Text>
            </MotionBox>
          </Container>
        </Box>

        {/* Rest of the page - Bento and Footer (Keeping them but cleaning up) */}
        <Box py={32} borderTop="1px solid" borderColor="rgba(255,255,255,0.05)">
          <Container maxW="7xl">
            <Grid
              templateColumns={{ base: '1fr', lg: 'repeat(3, 1fr)' }}
              gap={6}
            >
              <GridItem colSpan={{ base: 1, lg: 2 }}>
                <Card bg="rgba(255,255,255,0.02)" borderColor="surface.800" borderRadius="3xl" overflow="hidden" h="full">
                  <CardBody p={{ base: 6, md: 12 }} h="full" display="flex" flexDir="column" justifyContent="center">
                    <VStack align="start" spacing={6} w="full">
                      <Badge colorScheme="teal" variant="subtle" px={3} py={1} borderRadius="lg">DEVELOPER FIRST</Badge>
                      <Heading size="xl" color="white" fontFamily="'Outfit', sans-serif" lineHeight="1.3">Built for your workflow.</Heading>
                      <Text color="surface.300" fontSize="lg" lineHeight="1.6" textAlign="left">
                        Tired of manual schema updates? We built suparbase to automate the boring parts of database management.
                      </Text>
                      <HStack spacing={4} pt={4} flexWrap="wrap">
                        <Box bg="surface.900" p={4} borderRadius="2xl" border="1px solid" borderColor="surface.800" display="flex" alignItems="center" justifyContent="center">
                          <SqlIcon />
                        </Box>
                        <Box bg="surface.900" p={4} borderRadius="2xl" border="1px solid" borderColor="surface.800" display="flex" alignItems="center" justifyContent="center">
                          <ZapIcon />
                        </Box>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              </GridItem>
              <GridItem colSpan={1}>
                <Card bgGradient="linear(to-br, surface.900, teal.900)" borderColor="surface.800" borderRadius="3xl" h="full">
                  <CardBody p={{ base: 6, md: 12 }} display="flex" flexDir="column" justifyContent="center" h="full">
                    <VStack align="start" spacing={6} w="full">
                      <Heading size="lg" color="white" lineHeight="1.3">Secure.</Heading>
                      <Text color="surface.300" lineHeight="1.6" textAlign="left">
                        Connection strings are encrypted using AES-256 before being stored.
                      </Text>
                      <Divider borderColor="whiteAlpha.200" />
                      <VStack align="start" spacing={3} w="full">
                        {['Type Safe', 'Self Hosted', 'RLS Aware'].map((t, i) => (
                          <HStack key={i} spacing={2} align="center">
                            <Box color="teal.400" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                              <CheckIcon />
                            </Box>
                            <Text fontSize="sm" color="whiteAlpha.800" lineHeight="1.4">{t}</Text>
                          </HStack>
                        ))}
                      </VStack>
                    </VStack>
                  </CardBody>
                </Card>
              </GridItem>
            </Grid>
          </Container>
        </Box>
      </Box>
    </>
  );
}
