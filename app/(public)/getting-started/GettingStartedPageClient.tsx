'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Card,
  CardBody,
  Badge,
  Button,
  Checkbox,
  Code,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  SimpleGrid,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionCard = motion.create(Card);
const MotionBox = motion.create(Box);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const WarningIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const steps = [
  {
    number: 1,
    title: 'Create Your Account',
    description: 'Sign up for a free suparbase account. No credit card required.',
    details: [
      'Go to the signup page',
      'Enter your email and create a password',
      'Verify your email address',
      'You\'re ready to go!'
    ],
    code: null,
    tip: 'Use a strong password and enable 2FA when available for better security.'
  },
  {
    number: 2,
    title: 'Add Your First Connection',
    description: 'Connect your Supabase database to suparbase.',
    details: [
      'Click "Add Connection" in the dashboard',
      'Enter a name for your connection (e.g., "Production DB")',
      'Select environment type (development, staging, or production)',
      'Paste your Supabase connection string',
      'Click "Test Connection" to verify'
    ],
    code: 'postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres',
    tip: 'Find your connection string in Supabase Dashboard → Settings → Database → Connection string.'
  },
  {
    number: 3,
    title: 'Test the Connection',
    description: 'Verify that suparbase can connect to your database.',
    details: [
      'After adding a connection, click "Test Connection"',
      'Wait for the connection test to complete',
      'Green checkmark means you\'re good to go!',
      'If it fails, check your connection string and network settings'
    ],
    code: null,
    tip: 'Connection tests verify database accessibility and basic permissions.'
  },
  {
    number: 4,
    title: 'Create Your First Sync',
    description: 'Set up a sync job between two databases.',
    details: [
      'Navigate to "Sync Jobs" → "Create New Sync"',
      'Select your source database (where data comes from)',
      'Select your target database (where data goes to)',
      'Choose tables to sync (or sync all)',
      'Review the schema comparison',
      'Click "Create Sync"'
    ],
    code: null,
    tip: 'Start with a small table or use dry-run mode to preview changes safely.'
  },
  {
    number: 5,
    title: 'Monitor and Manage',
    description: 'Track sync progress and manage your databases.',
    details: [
      'View sync status in real-time',
      'Check sync history and logs',
      'Set up email notifications',
      'Manage your connections',
      'Explore your database schema'
    ],
    code: null,
    tip: 'Enable email notifications to stay informed about sync completions and failures.'
  }
];

const prerequisites = [
  'A Supabase account with at least one database',
  'Database connection string from Supabase',
  'Basic understanding of databases (helpful but not required)',
  'A modern web browser (Chrome, Firefox, Safari, or Edge)'
];

const commonPitfalls = [
  {
    issue: 'Connection string format',
    solution: 'Make sure your connection string includes the password and uses the correct port (5432).'
  },
  {
    issue: 'Network/firewall restrictions',
    solution: 'Ensure your database allows connections from suparbase servers. Check Supabase network settings.'
  },
  {
    issue: 'Schema incompatibilities',
    solution: 'Use schema validation before syncing. Fix incompatible changes in your source database first.'
  },
  {
    issue: 'Large table syncs',
    solution: 'For large tables, sync in smaller batches or during off-peak hours to avoid timeouts.'
  }
];

export default function GettingStartedPageClient() {
  const router = useRouter();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps(prev =>
      prev.includes(stepNumber)
        ? prev.filter(s => s !== stepNumber)
        : [...prev, stepNumber]
    );
  };

  return (
    <Box minH="100vh" bg="rgba(9, 9, 11, 1)">
      <Container maxW="6xl" py={{ base: 8, md: 12 }} px={{ base: 4, md: 6 }}>
        <VStack spacing={12} align="stretch">
          {/* Header */}
          <VStack spacing={4} align="center" textAlign="center">
            <Badge colorScheme="teal" px={3} py={1} borderRadius="full" fontSize="sm">
              QUICK START GUIDE
            </Badge>
            <Heading
              as="h1"
              fontSize={{ base: '3xl', md: '5xl' }}
              fontWeight="700"
              color="white"
              fontFamily="'Outfit', sans-serif"
              letterSpacing="-0.02em"
            >
              Getting <Text as="span" color="teal.400">Started</Text>
            </Heading>
            <Text
              color="surface.400"
              fontSize={{ base: 'md', md: 'lg' }}
              maxW="3xl"
              lineHeight="1.6"
            >
              Follow this step-by-step guide to set up suparbase and sync your first database.
              You'll be up and running in under 5 minutes.
            </Text>
          </VStack>

          {/* Prerequisites */}
          <Card bg="surface.800" borderColor="surface.700" borderWidth="1px" borderRadius="xl">
            <CardBody p={6}>
              <VStack align="start" spacing={4}>
                <Heading size="md" color="white">
                  Prerequisites
                </Heading>
                <Text color="surface.400" fontSize="sm">
                  Before you begin, make sure you have:
                </Text>
                <VStack align="start" spacing={2} w="full">
                  {prerequisites.map((item, index) => (
                    <HStack key={index} spacing={3}>
                      <Box color="teal.400" flexShrink={0}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </Box>
                      <Text color="surface.300" fontSize="sm">
                        {item}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Steps */}
          <VStack spacing={6} align="stretch">
            {steps.map((step, index) => (
              <MotionCard
                key={step.number}
                bg="surface.800"
                borderColor={completedSteps.includes(step.number) ? 'teal.400' : 'surface.700'}
                borderWidth="2px"
                borderRadius="xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <CardBody p={{ base: 4, md: 8 }}>
                  <VStack align="start" spacing={{ base: 4, md: 6 }}>
                    {/* Step Header */}
                    <Flex direction={{ base: 'column', sm: 'row' }} w="full" justify="space-between" gap={4}>
                      <HStack spacing={{ base: 3, md: 4 }} flex={1}>
                        <Box
                          w={{ base: 10, md: 12 }}
                          h={{ base: 10, md: 12 }}
                          borderRadius="full"
                          bg={completedSteps.includes(step.number) ? 'teal.400' : 'teal.400/10'}
                          border="2px solid"
                          borderColor={completedSteps.includes(step.number) ? 'teal.400' : 'teal.400/30'}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          color={completedSteps.includes(step.number) ? 'white' : 'teal.400'}
                          fontWeight="700"
                          fontSize={{ base: 'md', md: 'lg' }}
                          flexShrink={0}
                        >
                          {completedSteps.includes(step.number) ? <CheckIcon /> : step.number}
                        </Box>
                        <VStack align="start" spacing={0} flex={1}>
                          <Heading size="md" color="white" fontSize={{ base: 'sm', md: 'md' }}>
                            {step.title}
                          </Heading>
                          <Text color="surface.400" fontSize={{ base: 'xs', md: 'sm' }}>
                            {step.description}
                          </Text>
                        </VStack>
                      </HStack>
                      <Checkbox
                        isChecked={completedSteps.includes(step.number)}
                        onChange={() => toggleStep(step.number)}
                        colorScheme="teal"
                        size={{ base: 'md', md: 'lg' }}
                        alignSelf={{ base: 'flex-start', sm: 'center' }}
                      >
                        <Text fontSize="xs" color="surface.500" display={{ base: 'none', md: 'block' }}>
                          Done
                        </Text>
                      </Checkbox>
                    </Flex>

                    {/* Step Details */}
                    <Box w="full" pl={{ base: 0, md: 16 }}>
                      <VStack align="start" spacing={4}>
                        <Text
                          fontSize="xs"
                          fontWeight="700"
                          color="surface.500"
                          textTransform="uppercase"
                          letterSpacing="0.05em"
                        >
                          Steps to Follow
                        </Text>
                        <VStack align="start" spacing={2} w="full">
                          {step.details.map((detail, i) => (
                            <HStack key={i} spacing={3} align="start">
                              <Box
                                w={5}
                                h={5}
                                borderRadius="sm"
                                bg="teal.400/20"
                                color="teal.400"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                fontSize="xs"
                                fontWeight="700"
                                flexShrink={0}
                                mt={0.5}
                              >
                                {i + 1}
                              </Box>
                              <Text color="surface.300" fontSize="sm" lineHeight="1.6">
                                {detail}
                              </Text>
                            </HStack>
                          ))}
                        </VStack>

                        {/* Code Example */}
                        {step.code && (
                          <Box w="full">
                            <Text
                              fontSize="xs"
                              fontWeight="700"
                              color="surface.500"
                              textTransform="uppercase"
                              letterSpacing="0.05em"
                              mb={2}
                            >
                              Example
                            </Text>
                            <Code
                              p={{ base: 3, md: 4 }}
                              bg="surface.900"
                              color="surface.200"
                              borderRadius="md"
                              fontSize={{ base: '2xs', md: 'xs' }}
                              display="block"
                              whiteSpace="pre-wrap"
                              w="full"
                              overflowX="auto"
                            >
                              {step.code}
                            </Code>
                          </Box>
                        )}

                        {/* Pro Tip */}
                        <Alert
                          status="info"
                          variant="subtle"
                          bg="teal.400/10"
                          borderColor="teal.400/20"
                          borderWidth="1px"
                          borderRadius="md"
                        >
                          <AlertIcon color="teal.400" />
                          <Box>
                            <AlertTitle fontSize="xs" color="teal.400" mb={1}>
                              Pro Tip
                            </AlertTitle>
                            <AlertDescription fontSize="xs" color="surface.400">
                              {step.tip}
                            </AlertDescription>
                          </Box>
                        </Alert>
                      </VStack>
                    </Box>
                  </VStack>
                </CardBody>
              </MotionCard>
            ))}
          </VStack>

          <Divider borderColor="surface.700" />

          {/* Common Pitfalls */}
          <Box>
            <VStack spacing={6} align="stretch">
              <Heading size="lg" color="white">
                Common Pitfalls & Solutions
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 3, md: 4 }}>
                {commonPitfalls.map((pitfall, index) => (
                  <Card
                    key={index}
                    bg="surface.800"
                    borderColor="surface.700"
                    borderWidth="1px"
                    borderRadius="xl"
                  >
                    <CardBody p={{ base: 4, md: 6 }}>
                      <VStack align="start" spacing={3}>
                        <HStack spacing={2}>
                          <Box color="red.400" fontSize={{ base: 'lg', md: 'xl' }} display="flex" alignItems="center">
                            <WarningIcon />
                          </Box>
                          <Text fontWeight="600" color="white" fontSize={{ base: 'xs', md: 'sm' }}>
                            {pitfall.issue}
                          </Text>
                        </HStack>
                        <Text color="surface.400" fontSize={{ base: 'xs', md: 'sm' }} lineHeight="1.6">
                          {pitfall.solution}
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </VStack>
          </Box>

          {/* Next Steps */}
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
                    What's Next?
                  </Heading>
                  <Text color="surface.400" fontSize="md" maxW="2xl">
                    Now that you've set up your first sync, explore advanced features like schema synchronization,
                    keep-alive configuration, and usage monitoring.
                  </Text>
                  <HStack spacing={4} flexWrap="wrap" justify="center">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => router.push('/guide')}
                      minH="48px"
                    >
                      Read Full Documentation
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => router.push('/best-practices')}
                      minH="48px"
                    >
                      Learn Best Practices
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

