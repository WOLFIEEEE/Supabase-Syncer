'use client';

import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  SimpleGrid,
  Badge,
  Flex,
  Icon,
  Button,
  Code,
  Divider,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionCard = motion.create(Card);
const MotionBox = motion.create(Box);

// Icons
const ArrowRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const PlugIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v6M8 8h8M6 12h12M4 20h16v-4H4v4z"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const ZapIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const BarChartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="20" x2="12" y2="10"/>
    <line x1="18" y1="20" x2="18" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="16"/>
  </svg>
);

const HeartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const ShieldCheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);

const LockKeyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    <circle cx="12" cy="16" r="1"/>
  </svg>
);

const RadioIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4.9 4.9C3.5 6.3 3 7.8 3 10s.5 3.7 1.9 5.1M19.1 4.9C20.5 6.3 21 7.8 21 10s-.5 3.7-1.9 5.1"/>
    <path d="M12 2a8 8 0 0 0-8 8 8 8 0 0 0 8 8 8 8 0 0 0 8-8 8 8 0 0 0-8-8z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const steps = [
  {
    number: 1,
    title: 'Connect Databases',
    description: 'Add your source and target Supabase database connections. Credentials are encrypted with AES-256-GCM before storage.',
    icon: <PlugIcon />,
    details: 'We securely store your connection strings using industry-standard encryption. Your credentials never leave our servers unencrypted.'
  },
  {
    number: 2,
    title: 'Schema Analysis',
    description: 'suparbase analyzes both databases to understand table structures, columns, types, and relationships.',
    icon: <SearchIcon />,
    details: 'We compare schemas to identify differences: new tables, modified columns, missing indexes, and foreign key changes.'
  },
  {
    number: 3,
    title: 'Validation',
    description: 'Schema compatibility is validated to ensure safe synchronization. Conflicts are detected and reported.',
    icon: <CheckCircleIcon />,
    details: 'We check for incompatible changes, data type mismatches, and potential data loss scenarios before proceeding.'
  },
  {
    number: 4,
    title: 'Sync Execution',
    description: 'Changes are applied to the target database. You can preview with dry-run or execute immediately.',
    icon: <ZapIcon />,
    details: 'Schema changes are applied in the correct order, respecting dependencies. Data can be synced selectively by table.'
  },
  {
    number: 5,
    title: 'Monitoring',
    description: 'Real-time progress tracking shows sync status, completion percentage, and any errors encountered.',
    icon: <BarChartIcon />,
    details: 'Monitor sync progress in real-time. Get notifications on completion or failure. View detailed logs for troubleshooting.'
  }
];

const features = [
  {
    title: 'Keep-Alive Mechanism',
    description: 'Automatically pings your Supabase databases to prevent free tier pausing.',
    how: 'We send periodic health check requests to your database connections. This keeps them active and prevents the 7-day inactivity pause.',
    icon: <HeartIcon />
  },
  {
    title: 'Schema Validation',
    description: 'Ensures compatibility before syncing to prevent errors.',
    how: 'We compare source and target schemas, checking for incompatible changes. Type mismatches, missing columns, and constraint conflicts are detected early.',
    icon: <ShieldCheckIcon />
  },
  {
    title: 'Encrypted Storage',
    description: 'All credentials are encrypted using AES-256-GCM encryption.',
    how: 'Your database connection strings are encrypted at rest using AES-256-GCM. Only you can decrypt them with your account credentials.',
    icon: <LockKeyIcon />
  },
  {
    title: 'Real-time Monitoring',
    description: 'Track sync progress and get instant notifications.',
    how: 'We provide real-time updates on sync status, progress percentage, and completion. Email notifications keep you informed.',
    icon: <RadioIcon />
  }
];

export default function HowItWorksPageClient() {
  const router = useRouter();

  return (
    <Box minH="100vh" bg="rgba(9, 9, 11, 1)">
      <Container maxW="7xl" py={{ base: 8, md: 12 }} px={{ base: 4, md: 6 }}>
        <VStack spacing={16} align="stretch">
          {/* Header */}
          <VStack spacing={4} align="center" textAlign="center">
            <Badge colorScheme="teal" px={3} py={1} borderRadius="full" fontSize="sm">
              TECHNICAL OVERVIEW
            </Badge>
            <Heading
              as="h1"
              fontSize={{ base: '3xl', md: '5xl' }}
              fontWeight="700"
              color="white"
              fontFamily="'Outfit', sans-serif"
              letterSpacing="-0.02em"
            >
              How <Text as="span" color="teal.400">It Works</Text>
            </Heading>
            <Text
              color="surface.400"
              fontSize={{ base: 'md', md: 'lg' }}
              maxW="3xl"
              lineHeight="1.6"
            >
              A visual, step-by-step explanation of how suparbase synchronizes your databases,
              keeps them alive, and ensures your data stays in sync across environments.
            </Text>
          </VStack>

          {/* Sync Process Flow - Creative Timeline Design */}
          <Box position="relative">
            <VStack spacing={12} align="stretch">
              <VStack spacing={3} align="center">
                <Heading size="lg" color="white" textAlign="center" fontSize={{ base: '2xl', md: '3xl' }}>
                  The Sync Process
                </Heading>
                <Text color="surface.400" fontSize="sm" textAlign="center" maxW="2xl">
                  A seamless flow from connection to completion
                </Text>
              </VStack>
              
              {/* Timeline Container */}
              <Box position="relative" w="full">
                {/* Connecting Line - Desktop Only */}
                <Box
                  display={{ base: 'none', lg: 'block' }}
                  position="absolute"
                  top="80px"
                  left="10%"
                  right="10%"
                  h="2px"
                  bgGradient="linear(to-r, transparent, teal.400/30, teal.400/50, teal.400/30, transparent)"
                  zIndex={0}
                />
                
                {/* Steps Grid */}
                <SimpleGrid columns={{ base: 1, lg: 5 }} spacing={{ base: 8, lg: 4 }} position="relative" zIndex={1}>
                  {steps.map((step, index) => (
                    <MotionBox
                      key={step.number}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.5, delay: index * 0.15 }}
                    >
                      <Box position="relative" h="full">
                        <VStack spacing={4} align="stretch" h="full">
                          {/* Step Number Badge - Large and Prominent */}
                          <Flex justify="center" align="center" position="relative">
                          <Box position="relative">
                            {/* Glow Effect */}
                            <Box
                              position="absolute"
                              inset="-4px"
                              borderRadius="full"
                              bg="teal.400/20"
                              filter="blur(8px)"
                              opacity={0.6}
                            />
                            {/* Main Icon Circle */}
                            <Box
                              w={{ base: 20, md: 24 }}
                              h={{ base: 20, md: 24 }}
                              borderRadius="full"
                              bgGradient="linear(to-br, teal.400/20, teal.500/10)"
                              border="3px solid"
                              borderColor="teal.400/40"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              color="teal.400"
                              position="relative"
                              zIndex={1}
                              _hover={{
                                borderColor: 'teal.400',
                                transform: 'scale(1.1)',
                                boxShadow: '0 0 20px rgba(62, 207, 142, 0.4)',
                              }}
                              transition="all 0.3s"
                            >
                              {step.icon}
                            </Box>
                            {/* Step Number Badge */}
                            <Badge
                              position="absolute"
                              top="-8px"
                              right="-8px"
                              bgGradient="linear(to-br, teal.400, teal.500)"
                              color="white"
                              borderRadius="full"
                              w={{ base: 8, md: 10 }}
                              h={{ base: 8, md: 10 }}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              fontSize={{ base: 'xs', md: 'sm' }}
                              fontWeight="800"
                              boxShadow="0 2px 8px rgba(62, 207, 142, 0.4)"
                              zIndex={2}
                            >
                              {step.number}
                            </Badge>
                          </Box>
                        </Flex>

                        {/* Step Card - Enhanced Design */}
                        <Card
                          bg="surface.800"
                          borderColor="surface.700"
                          borderWidth="1px"
                          borderRadius="2xl"
                          w="full"
                          h="full"
                          overflow="hidden"
                          position="relative"
                          _hover={{
                            borderColor: 'teal.400/50',
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 24px rgba(62, 207, 142, 0.15)',
                          }}
                          transition="all 0.3s"
                        >
                          {/* Gradient Accent Line */}
                          <Box
                            position="absolute"
                            top={0}
                            left={0}
                            right={0}
                            h="3px"
                            bgGradient="linear(to-r, transparent, teal.400, transparent)"
                            opacity={0.6}
                          />
                          
                          <CardBody p={{ base: 5, md: 6 }}>
                            <VStack spacing={4} align="start" h="full">
                              {/* Title */}
                              <Heading 
                                size="md" 
                                color="white" 
                                fontSize={{ base: 'md', md: 'lg' }}
                                fontWeight="700"
                                lineHeight="1.2"
                              >
                                {step.title}
                              </Heading>
                              
                              {/* Description */}
                              <Text 
                                color="surface.300" 
                                fontSize={{ base: 'sm', md: 'md' }} 
                                lineHeight="1.7"
                                flex={1}
                              >
                                {step.description}
                              </Text>
                              
                              {/* Details Box - Enhanced */}
                              <Box
                                p={4}
                                bg="surface.900/80"
                                borderRadius="xl"
                                borderLeft="3px solid"
                                borderColor="teal.400/50"
                                w="full"
                                position="relative"
                                _before={{
                                  content: '""',
                                  position: 'absolute',
                                  left: 0,
                                  top: 0,
                                  bottom: 0,
                                  width: '3px',
                                  bgGradient: 'linear(to-b, teal.400, transparent)',
                                  opacity: 0.3,
                                }}
                              >
                                <Text
                                  fontSize={{ base: 'xs', md: 'sm' }}
                                  color="surface.400"
                                  lineHeight="1.6"
                                >
                                  {step.details}
                                </Text>
                              </Box>
                            </VStack>
                          </CardBody>
                        </Card>

                        {/* Connecting Arrow - Desktop Only */}
                        {index < steps.length - 1 && (
                          <Box
                            display={{ base: 'none', lg: 'flex' }}
                            position="absolute"
                            top="80px"
                            right="-20px"
                            alignItems="center"
                            justifyContent="center"
                            zIndex={2}
                          >
                            <MotionBox
                              animate={{ x: [0, 5, 0] }}
                              transition={{ 
                                duration: 2, 
                                repeat: Infinity, 
                                ease: "easeInOut" 
                              }}
                            >
                              <Box color="teal.400/60" fontSize="2xl">
                                <ArrowRightIcon />
                              </Box>
                            </MotionBox>
                          </Box>
                        )}
                        </VStack>
                      </Box>
                    </MotionBox>
                  ))}
                </SimpleGrid>
              </Box>
            </VStack>
          </Box>

          <Divider borderColor="surface.700" />

          {/* Key Features Deep Dive */}
          <Box>
            <VStack spacing={8} align="stretch">
              <Heading size="lg" color="white" textAlign="center">
                Key Features Explained
              </Heading>
              
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 4, md: 6 }}>
                {features.map((feature, index) => (
                  <MotionCard
                    key={feature.title}
                    bg="surface.800"
                    borderColor="surface.700"
                    borderWidth="1px"
                    borderRadius="xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    _hover={{
                      borderColor: 'teal.400',
                      transform: 'translateY(-2px)',
                    }}
                  >
                    <CardBody p={{ base: 4, md: 6 }}>
                      <VStack align="start" spacing={4}>
                        <HStack spacing={3}>
                          <Box fontSize={{ base: '2xl', md: '3xl' }} color="teal.400" display="flex" alignItems="center">
                            {feature.icon}
                          </Box>
                          <Heading size="md" color="white" fontSize={{ base: 'sm', md: 'md' }}>
                            {feature.title}
                          </Heading>
                        </HStack>
                        <Text color="surface.300" fontSize={{ base: 'xs', md: 'sm' }} lineHeight="1.6">
                          {feature.description}
                        </Text>
                        <Box
                          p={{ base: 3, md: 4 }}
                          bg="surface.900"
                          borderRadius="md"
                          borderLeft="3px solid"
                          borderColor="teal.400"
                          w="full"
                        >
                          <Text
                            fontSize="xs"
                            fontWeight="600"
                            color="teal.400"
                            mb={2}
                            textTransform="uppercase"
                            letterSpacing="0.05em"
                          >
                            How It Works
                          </Text>
                          <Text color="surface.400" fontSize={{ base: 'xs', md: 'sm' }} lineHeight="1.6">
                            {feature.how}
                          </Text>
                        </Box>
                      </VStack>
                    </CardBody>
                  </MotionCard>
                ))}
              </SimpleGrid>
            </VStack>
          </Box>

          <Divider borderColor="surface.700" />

          {/* Architecture Overview */}
          <Box>
            <VStack spacing={6} align="stretch">
              <Heading size="lg" color="white" textAlign="center">
                Architecture Overview
              </Heading>
              
              <Card bg="surface.800" borderColor="surface.700" borderWidth="1px" borderRadius="xl">
                <CardBody p={{ base: 6, md: 8 }}>
                  <VStack spacing={6} align="stretch">
                    <Text color="surface.300" fontSize="md" lineHeight="1.8">
                      suparbase acts as a secure intermediary between your Supabase databases.
                      We never store your actual data, only connection credentials (encrypted) and sync metadata.
                    </Text>
                    
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 3, md: 4 }}>
                      <Box
                        p={{ base: 3, md: 4 }}
                        bg="surface.900"
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor="surface.800"
                      >
                        <VStack align="start" spacing={2}>
                          <Text fontSize="xs" fontWeight="700" color="teal.400" textTransform="uppercase">
                            Your Databases
                          </Text>
                          <Text color="surface.400" fontSize={{ base: 'xs', md: 'sm' }}>
                            Source and target Supabase PostgreSQL databases. Your data stays in your control.
                          </Text>
                        </VStack>
                      </Box>
                      
                      <Box
                        p={{ base: 3, md: 4 }}
                        bg="surface.900"
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor="surface.800"
                      >
                        <VStack align="start" spacing={2}>
                          <Text fontSize="xs" fontWeight="700" color="teal.400" textTransform="uppercase">
                            suparbase Platform
                          </Text>
                          <Text color="surface.400" fontSize={{ base: 'xs', md: 'sm' }}>
                            Secure sync engine that connects to your databases, analyzes schemas, and executes syncs.
                          </Text>
                        </VStack>
                      </Box>
                      
                      <Box
                        p={{ base: 3, md: 4 }}
                        bg="surface.900"
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor="surface.800"
                      >
                        <VStack align="start" spacing={2}>
                          <Text fontSize="xs" fontWeight="700" color="teal.400" textTransform="uppercase">
                            Your Dashboard
                          </Text>
                          <Text color="surface.400" fontSize={{ base: 'xs', md: 'sm' }}>
                            Web interface to manage connections, create syncs, and monitor progress in real-time.
                          </Text>
                        </VStack>
                      </Box>
                    </SimpleGrid>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </Box>

          {/* CTA Section */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card
              bgGradient="linear(to-r, teal.500/10, brand.500/10)"
              borderColor="teal.400/20"
              borderWidth="1px"
              borderRadius="2xl"
            >
              <CardBody p={{ base: 6, md: 8 }}>
                <VStack spacing={6} align="center" textAlign="center">
                  <Heading size="lg" color="white">
                    Ready to Get Started?
                  </Heading>
                  <Text color="surface.400" fontSize="md" maxW="2xl">
                    Now that you understand how it works, create your free account and start syncing your databases.
                  </Text>
                  <HStack spacing={4} flexWrap="wrap" justify="center">
                    <Button
                      colorScheme="teal"
                      size="lg"
                      onClick={() => router.push('/signup')}
                      minH="48px"
                    >
                      Create Free Account
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => router.push('/getting-started')}
                      minH="48px"
                    >
                      View Quick Start Guide
                    </Button>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          </MotionBox>
        </VStack>
      </Container>
    </Box>
  );
}

