'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
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
  Icon,
  SimpleGrid,
  Divider,
} from '@chakra-ui/react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';

const MotionBox = motion.create(Box);
const MotionText = motion.create(Text);
const MotionVStack = motion.create(VStack);

// Icons
const SyncIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M21 2v6h-6M3 22v-6h6M21 13A9 9 0 1 1 3 11" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const CodeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </svg>
);

const ZapIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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

const ArrowRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
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

const features = [
  {
    icon: SyncIcon,
    title: 'One-Click Sync',
    description: 'Effortless data migration between environments.',
    color: 'teal.400',
  },
  {
    icon: ShieldIcon,
    title: 'Schema Guard',
    description: 'Never break production with validation.',
    color: 'purple.400',
  },
  {
    icon: CodeIcon,
    title: 'Idempotent SQL',
    description: 'Safe, repeatable migrations generated for you.',
    color: 'cyan.400',
  },
  {
    icon: ZapIcon,
    title: 'Keep-Alive',
    description: 'Prevent free-tier pausing automatically.',
    color: 'brand.400',
  },
];

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

  return (
    <Box position="relative" bg="rgba(9, 9, 11, 1)" overflow="hidden" minH="100vh" overflowX="hidden">
      {/* Subtle Grid Background */}
      <Box 
        position="absolute" 
        inset={0} 
        style={{ 
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
        pointerEvents="none"
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
                >
              Zero-drift synchronization for Supabase. Built for teams that move fast without breaking things.
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
            spacing={6} 
            pt={4}
            gap={{ base: 4, sm: 6 }}
            align="center"
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
            
            <HStack spacing={4} flexWrap="wrap" justify="center" w={{ base: 'full', sm: 'auto' }}>
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

          {/* Minimal Features Grid */}
          <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={{ base: 3, sm: 4, md: 6 }} pt={{ base: 12, sm: 16, md: 20 }} w="full">
            {features.map((f, i) => (
                <MotionBox
                key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + (i * 0.1) }}
                whileHover={{ y: -4 }}
              >
                <Card
                  bg="rgba(255,255,255,0.02)"
                  border="1px solid"
                  borderColor="surface.800"
                  borderRadius="2xl"
                  h="full"
                  _hover={{
                    borderColor: f.color,
                    bg: 'rgba(255,255,255,0.04)',
                    transform: 'translateY(-4px)',
                  }}
                  transition="all 0.3s ease"
                >
                  <CardBody p={{ base: 4, md: 6 }}>
                    <VStack spacing={{ base: 3, md: 4 }} align="center">
                      <Box
                        p={{ base: 2, md: 3 }}
                        bg="surface.900"
                        borderRadius="xl"
                        border="1px solid"
                        borderColor="surface.800"
                        color={f.color}
                        _groupHover={{ borderColor: f.color }}
                      >
                        <f.icon />
                        </Box>
                      <VStack spacing={1} align="center">
                        <Text fontWeight="700" color="white" fontSize={{ base: 'sm', md: 'md' }} textAlign="center">
                          {f.title}
                        </Text>
                        <Text 
                          color="surface.400" 
                          fontSize="xs" 
                          textAlign="center"
                          display="block"
                          lineHeight="1.4"
                        >
                          {f.description}
                          </Text>
                        </VStack>
                    </VStack>
                    </CardBody>
                  </Card>
                </MotionBox>
              ))}
            </SimpleGrid>

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
          // AES-256-GCM ENCRYPTED
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
          >
            <HStack spacing={2}>
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
            >
              Is this for{' '}
              <Text as="span" color="teal.400">you</Text>
              ?
            </Heading>
            <Text color="surface.400" fontSize="lg" maxW="2xl">
              We built this with a specific audience in mind. Here&apos;s who will benefit the most, and who might need something else.
            </Text>
          </MotionVStack>

          {/* Two Column Layout */}
          <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={{ base: 6, lg: 8 }}>
            
            {/* Perfect For Column */}
            <MotionBox
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card
                bg="rgba(62, 207, 142, 0.03)"
                border="1px solid"
                borderColor="teal.400/20"
                borderRadius="3xl"
                overflow="hidden"
                h="full"
                position="relative"
              >
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  h="3px"
                  bgGradient="linear(to-r, teal.400, teal.300)"
                />
                <CardBody p={{ base: 4, md: 6, lg: 10 }}>
                  <VStack align="start" spacing={{ base: 6, md: 8 }}>
                    {/* Header */}
                    <HStack spacing={{ base: 3, md: 4 }}>
                      <Box
                        p={{ base: 2.5, md: 3 }}
                        bg="teal.400/10"
                        borderRadius="xl"
                        color="teal.400"
                      >
                        <Box as="svg" w={{ base: 5, md: 6 }} h={{ base: 5, md: 6 }} viewBox="0 0 24 24" fill="none">
                          <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        </Box>
                      </Box>
                      <VStack align="start" spacing={0}>
                        <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="700" color="white">Perfect For</Text>
                        <Text fontSize={{ base: 'xs', md: 'sm' }} color="teal.400">You&apos;ll love this</Text>
                      </VStack>
                    </HStack>

                    {/* Items */}
                    <VStack align="start" spacing={{ base: 3, md: 5 }} w="full">
                      {[
                        {
                          title: 'Indie Hackers & Solo Devs',
                          desc: 'Building MVPs and side projects? This saves hours of manual data migration.',
                          iconPath: 'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0 M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5'
                        },
                        {
                          title: 'Supabase Free Tier Users',
                          desc: 'Our keep-alive feature prevents your database from pausing due to inactivity.',
                          iconPath: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z'
                        },
                        {
                          title: 'Learning & Prototyping',
                          desc: 'New to databases? Safely experiment without fear of breaking production.',
                          iconPath: 'M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5'
                        },
                        {
                          title: 'Small Teams (< 10 devs)',
                          desc: 'Multiple environments to manage? Sync schemas in seconds, not hours.',
                          iconPath: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75'
                        },
                        {
                          title: 'Early-Stage Startups',
                          desc: 'Move fast and break things, but not your database. Schema validation included.',
                          iconPath: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z'
                        }
                      ].map((item, i) => (
                        <MotionBox
                          key={i}
                          p={{ base: 3, md: 4 }}
                          bg="rgba(255,255,255,0.02)"
                          borderRadius="xl"
                          border="1px solid"
                          borderColor="transparent"
                          w="full"
                          cursor="default"
                          whileHover={{ 
                            borderColor: 'rgba(62, 207, 142, 0.3)',
                            backgroundColor: 'rgba(62, 207, 142, 0.05)'
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          <HStack spacing={{ base: 3, md: 4 }} align="start">
                            <Box
                              p={{ base: 2.5, md: 2 }}
                              bg="teal.400/10"
                              borderRadius="lg"
                              color="teal.400"
                              flexShrink={0}
                              minW="44px"
                              minH="44px"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Box as="svg" w={{ base: 5, md: 5 }} h={{ base: 5, md: 5 }} viewBox="0 0 24 24" fill="none">
                                <path d={item.iconPath} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </Box>
                            </Box>
                            <VStack align="start" spacing={1} flex={1}>
                              <Text fontWeight="600" color="white" fontSize={{ base: 'sm', md: 'sm' }}>{item.title}</Text>
                              <Text color="surface.400" fontSize="xs" lineHeight={{ base: '1.5', md: 'tall' }}>{item.desc}</Text>
                            </VStack>
                          </HStack>
                        </MotionBox>
                      ))}
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>
            </MotionBox>

            {/* Not For Column */}
            <MotionBox
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card
                bg="rgba(239, 68, 68, 0.03)"
                border="1px solid"
                borderColor="red.400/20"
                borderRadius="3xl"
                overflow="hidden"
                h="full"
                position="relative"
              >
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  h="3px"
                  bgGradient="linear(to-r, red.400, orange.400)"
                />
                <CardBody p={{ base: 4, md: 6, lg: 10 }}>
                  <VStack align="start" spacing={{ base: 6, md: 8 }}>
                    {/* Header */}
                    <HStack spacing={{ base: 3, md: 4 }}>
                      <Box
                        p={{ base: 2.5, md: 3 }}
                        bg="red.400/10"
                        borderRadius="xl"
                        color="red.400"
                      >
                        <Box as="svg" w={{ base: 5, md: 6 }} h={{ base: 5, md: 6 }} viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </Box>
                      </Box>
                      <VStack align="start" spacing={0}>
                        <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="700" color="white">Not Ideal For</Text>
                        <Text fontSize={{ base: 'xs', md: 'sm' }} color="red.400">Consider alternatives</Text>
                      </VStack>
                    </HStack>

                    {/* Items */}
                    <VStack align="start" spacing={{ base: 3, md: 5 }} w="full">
                      {[
                        {
                          title: 'Large Databases (50GB+)',
                          desc: 'Syncing massive datasets can timeout or hit memory limits. Use dedicated migration tools.',
                          iconPath: 'M4 7V4h16v3 M9 20h6 M12 4v16 M8 7h8a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v0a4 4 0 0 1 4-4z'
                        },
                        {
                          title: 'Enterprise Scale',
                          desc: 'Hundreds of tables? Complex triggers? You need enterprise-grade solutions.',
                          iconPath: 'M3 21h18 M5 21V7l8-4v18 M19 21V11l-6-4 M9 9v.01 M9 12v.01 M9 15v.01 M9 18v.01'
                        },
                        {
                          title: 'High-Traffic Production',
                          desc: 'Millions of daily transactions require zero-downtime tools we don&apos;t provide.',
                          iconPath: 'M18 20V10 M12 20V4 M6 20v-6'
                        },
                        {
                          title: 'Non-Supabase Databases',
                          desc: 'Built specifically for Supabase PostgreSQL. MySQL, MongoDB? Look elsewhere.',
                          iconPath: 'M2 12h6 M22 12h-6 M12 2v6 M12 22v-6 M4.93 4.93l4.24 4.24 M14.83 14.83l4.24 4.24 M4.93 19.07l4.24-4.24 M14.83 9.17l4.24-4.24'
                        },
                        {
                          title: 'Regulated Industries',
                          desc: 'Healthcare and finance industries need compliance certifications we don&apos;t have yet.',
                          iconPath: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'
                        }
                      ].map((item, i) => (
                        <MotionBox
                          key={i}
                          p={{ base: 3, md: 4 }}
                          bg="rgba(255,255,255,0.02)"
                          borderRadius="xl"
                          border="1px solid"
                          borderColor="transparent"
                          w="full"
                          cursor="default"
                          whileHover={{ 
                            borderColor: 'rgba(239, 68, 68, 0.3)',
                            backgroundColor: 'rgba(239, 68, 68, 0.05)'
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          <HStack spacing={{ base: 3, md: 4 }} align="start">
                            <Box
                              p={{ base: 2.5, md: 2 }}
                              bg="red.400/10"
                              borderRadius="lg"
                              color="red.400"
                              flexShrink={0}
                              minW="44px"
                              minH="44px"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Box as="svg" w={{ base: 5, md: 5 }} h={{ base: 5, md: 5 }} viewBox="0 0 24 24" fill="none">
                                <path d={item.iconPath} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </Box>
                  </Box>
                            <VStack align="start" spacing={1} flex={1}>
                              <Text fontWeight="600" color="white" fontSize={{ base: 'sm', md: 'sm' }}>{item.title}</Text>
                              <Text color="surface.400" fontSize="xs" lineHeight={{ base: '1.5', md: 'tall' }}>{item.desc}</Text>
                            </VStack>
                </HStack>
                        </MotionBox>
                      ))}
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>
            </MotionBox>
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
                  <HStack spacing={3}>
                    <Box
                      p={2}
                      bg="yellow.400/10"
                      borderRadius="lg"
                      color="yellow.400"
                    >
                      <Box as="svg" w={5} h={5} viewBox="0 0 24 24" fill="none">
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </Box>
                    </Box>
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="600" color="white" fontSize="sm">Recommended Limits</Text>
                      <Text color="surface.400" fontSize="xs">For optimal performance</Text>
                    </VStack>
                  </HStack>
                  
                  <HStack spacing={8} flexWrap="wrap" justify="center">
                    {[
                      { label: 'Tables', value: '< 100' },
                      { label: 'Database Size', value: '< 10GB' },
                      { label: 'Rows per Table', value: '< 1M' },
                      { label: 'Connections', value: '< 10' }
                    ].map((stat, i) => (
                      <VStack key={i} spacing={0} align="center">
                        <Text fontFamily="mono" fontWeight="700" color="teal.400" fontSize="lg">{stat.value}</Text>
                        <Text color="surface.500" fontSize="xs">{stat.label}</Text>
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
          >
            <Text color="surface.500" fontSize="sm" fontStyle="italic">
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
              <Card bg="rgba(255,255,255,0.02)" borderColor="surface.800" borderRadius="3xl" overflow="hidden">
                <CardBody p={12}>
                  <VStack align="start" spacing={6}>
                    <Badge colorScheme="teal" variant="subtle" px={3} py={1} borderRadius="lg">DEVELOPER FIRST</Badge>
                    <Heading size="xl" color="white" fontFamily="'Outfit', sans-serif">Built for your workflow.</Heading>
                    <Text color="surface.300" fontSize="lg">
                      Tired of manual schema updates? We built suparbase to automate the boring parts of database management.
                </Text>
                    <HStack spacing={4} pt={4}>
                      <Box bg="surface.900" p={4} borderRadius="2xl" border="1px solid" borderColor="surface.800">
                        <CodeIcon />
                      </Box>
                      <Box bg="surface.900" p={4} borderRadius="2xl" border="1px solid" borderColor="surface.800">
                        <ZapIcon />
                      </Box>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
            </GridItem>
            <GridItem colSpan={1}>
              <Card bgGradient="linear(to-br, surface.900, teal.900)" borderColor="surface.800" borderRadius="3xl" h="full">
                <CardBody p={12} display="flex" flexDir="column" justifyContent="center">
                  <VStack align="start" spacing={6}>
                    <Heading size="lg" color="white">Secure.</Heading>
                    <Text color="surface.300">
                      Connection strings are encrypted using AES-256 before being stored. 
                    </Text>
                    <Divider borderColor="whiteAlpha.200" />
                    <VStack align="start" spacing={3}>
                      {['Type Safe', 'Self Hosted', 'RLS Aware'].map((t, i) => (
                        <HStack key={i} spacing={2}>
                          <Box color="teal.400"><CheckIcon /></Box>
                          <Text fontSize="sm" color="whiteAlpha.800">{t}</Text>
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
  );
}
