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
} from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionCard = motion.create(Card);
const MotionBox = motion.create(Box);

// Icons
const CodeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </svg>
);

const RocketIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
  </svg>
);

const DatabaseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M3 5V19C3 20.6569 7.02944 22 12 22C16.9706 22 21 20.6569 21 19V5"/>
    <path d="M3 12C3 13.6569 7.02944 15 12 15C16.9706 15 21 13.6569 21 12"/>
  </svg>
);

const BookIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const BriefcaseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const useCases = [
  {
    title: 'Indie Developers',
    icon: CodeIcon,
    color: 'teal',
    problem: 'Building MVPs and side projects? Managing dev, staging, and production databases manually is time-consuming and error-prone.',
    solution: 'suparbase automates database synchronization between environments. Deploy schema changes in seconds, not hours. Focus on building, not database management.',
    benefits: [
      'Save 5-10 hours per week on manual migrations',
      'Reduce deployment errors by 90%',
      'Keep databases alive automatically',
      'Sync schemas in under 2 minutes'
    ],
    scenario: 'You push a new feature with schema changes. Instead of manually running migrations on staging and production, suparbase syncs everything automatically with validation.'
  },
  {
    title: 'Startup Teams',
    icon: RocketIcon,
    color: 'purple',
    problem: 'Fast iteration requires frequent schema changes. Team members need consistent database states. Manual coordination slows down development.',
    solution: 'Enable your team to move fast without breaking things. Automated schema sync ensures everyone works with the latest database structure.',
    benefits: [
      'Faster feature deployment cycles',
      'Consistent environments across team',
      'Automatic conflict detection',
      'Real-time sync monitoring'
    ],
    scenario: 'Your team ships 3 features per week. Each requires schema changes. suparbase ensures dev → staging → prod syncs happen automatically, keeping everyone aligned.'
  },
  {
    title: 'Free Tier Users',
    icon: DatabaseIcon,
    color: 'green',
    problem: 'Supabase free tier databases pause after 7 days of inactivity. Your development databases keep going to sleep, disrupting your workflow.',
    solution: 'Our keep-alive service prevents your databases from pausing. Set it and forget it - your databases stay active automatically.',
    benefits: [
      'Never lose database access',
      'No more waiting for database wake-up',
      'Automatic connection health checks',
      'Works with any Supabase project'
    ],
    scenario: 'You work on a project sporadically. Without suparbase, your database pauses and you wait 30+ seconds every time. With keep-alive, it\'s always ready.'
  },
  {
    title: 'Learning Projects',
    icon: BookIcon,
    color: 'blue',
    problem: 'Learning database management? Experimenting with schemas? You need a safe way to test changes without breaking production data.',
    solution: 'Create isolated environments for experimentation. Sync test data safely, rollback easily, and learn database management without fear.',
    benefits: [
      'Safe experimentation environment',
      'Learn migrations hands-on',
      'No risk to production data',
      'Visual schema comparison'
    ],
    scenario: 'You\'re learning PostgreSQL and Supabase. Create a test database, experiment with schemas, and sync changes safely. Learn by doing without consequences.'
  },
  {
    title: 'Side Projects',
    icon: BriefcaseIcon,
    color: 'orange',
    problem: 'Managing multiple side projects? Each has its own database. Keeping them organized and synced is a hassle.',
    solution: 'Manage all your projects from one dashboard. Quick environment setup, organized connections, and automated syncs for all your projects.',
    benefits: [
      'Centralized project management',
      'Quick environment setup',
      'Organized connection library',
      'Multi-project dashboard'
    ],
    scenario: 'You have 5 side projects, each with dev/staging/prod. Instead of managing 15 databases manually, suparbase organizes everything in one place.'
  },
  {
    title: 'Small Agencies',
    icon: UsersIcon,
    color: 'pink',
    problem: 'Managing databases for multiple clients? Each client needs separate environments. Manual management doesn\'t scale.',
    solution: 'Scale your agency operations. Manage client databases efficiently, maintain separation, and deliver faster with automated syncs.',
    benefits: [
      'Multi-client management',
      'Environment isolation',
      'Faster client deployments',
      'Professional workflow'
    ],
    scenario: 'You manage 10 client projects. Each needs dev/staging/prod. suparbase helps you maintain professional workflows and deliver faster.'
  }
];

export default function UseCasesPageClient() {
  const router = useRouter();

  return (
    <Box minH="100vh" bg="rgba(9, 9, 11, 1)">
      <Container maxW="7xl" py={{ base: 8, md: 12 }} px={{ base: 4, md: 6 }}>
        <VStack spacing={12} align="stretch">
          {/* Header */}
          <VStack spacing={4} align="center" textAlign="center">
            <Badge colorScheme="teal" px={3} py={1} borderRadius="full" fontSize="sm">
              REAL-WORLD SCENARIOS
            </Badge>
            <Heading
              as="h1"
              fontSize={{ base: '3xl', md: '5xl' }}
              fontWeight="700"
              color="white"
              fontFamily="'Outfit', sans-serif"
              letterSpacing="-0.02em"
            >
              Use Cases &{' '}
              <Text as="span" color="teal.400">Scenarios</Text>
            </Heading>
            <Text
              color="surface.400"
              fontSize={{ base: 'md', md: 'lg' }}
              maxW="3xl"
              lineHeight="1.6"
            >
              See how suparbase solves real problems for developers, teams, and businesses.
              From indie projects to startup teams, discover scenarios where suparbase makes a difference.
            </Text>
          </VStack>

          {/* Use Cases Grid */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 4, md: 6 }}>
            {useCases.map((useCase, index) => {
              const IconComponent = useCase.icon;
              return (
                <MotionCard
                  key={useCase.title}
                  bg="surface.800"
                  borderColor="surface.700"
                  borderWidth="1px"
                  borderRadius="2xl"
                  overflow="hidden"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  _hover={{
                    borderColor: `${useCase.color}.400`,
                    transform: 'translateY(-4px)',
                  }}
                >
                  <CardBody p={{ base: 4, md: 8 }}>
                    <VStack align="start" spacing={{ base: 4, md: 6 }}>
                      {/* Icon and Title */}
                      <HStack spacing={{ base: 3, md: 4 }}>
                        <Box
                          p={{ base: 2, md: 3 }}
                          bg={`${useCase.color}.400/10`}
                          borderRadius="xl"
                          color={`${useCase.color}.400`}
                          flexShrink={0}
                        >
                          <IconComponent />
                        </Box>
                        <VStack align="start" spacing={0} flex={1}>
                          <Heading size="lg" color="white" fontSize={{ base: 'md', md: 'lg' }}>
                            {useCase.title}
                          </Heading>
                          <Badge colorScheme={useCase.color} variant="subtle" fontSize="xs">
                            {useCase.title === 'Indie Developers' && 'Most Popular'}
                            {useCase.title === 'Free Tier Users' && 'Common Use Case'}
                          </Badge>
                        </VStack>
                      </HStack>

                      {/* Problem */}
                      <Box>
                        <Text
                          fontSize="xs"
                          fontWeight="700"
                          color="red.400"
                          letterSpacing="0.05em"
                          textTransform="uppercase"
                          mb={2}
                        >
                          The Problem
                        </Text>
                        <Text color="surface.300" fontSize="sm" lineHeight="1.6">
                          {useCase.problem}
                        </Text>
                      </Box>

                      {/* Solution */}
                      <Box>
                        <Text
                          fontSize="xs"
                          fontWeight="700"
                          color="teal.400"
                          letterSpacing="0.05em"
                          textTransform="uppercase"
                          mb={2}
                        >
                          The Solution
                        </Text>
                        <Text color="surface.300" fontSize="sm" lineHeight="1.6">
                          {useCase.solution}
                        </Text>
                      </Box>

                      {/* Benefits */}
                      <Box w="full">
                        <Text
                          fontSize="xs"
                          fontWeight="700"
                          color="surface.400"
                          letterSpacing="0.05em"
                          textTransform="uppercase"
                          mb={3}
                        >
                          Key Benefits
                        </Text>
                        <VStack align="start" spacing={2}>
                          {useCase.benefits.map((benefit, i) => (
                            <HStack key={i} spacing={2} align="start">
                              <Box
                                color={`${useCase.color}.400`}
                                mt={1}
                                flexShrink={0}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              </Box>
                              <Text color="surface.400" fontSize="sm" lineHeight="1.5">
                                {benefit}
                              </Text>
                            </HStack>
                          ))}
                        </VStack>
                      </Box>

                      {/* Scenario */}
                      <Box
                        p={4}
                        bg="surface.900"
                        borderRadius="xl"
                        borderWidth="1px"
                        borderColor="surface.800"
                        w="full"
                      >
                        <Text
                          fontSize="xs"
                          fontWeight="700"
                          color="surface.500"
                          letterSpacing="0.05em"
                          textTransform="uppercase"
                          mb={2}
                        >
                          Real Scenario
                        </Text>
                        <Text color="surface.300" fontSize="sm" lineHeight="1.6" fontStyle="italic">
                          &quot;{useCase.scenario}&quot;
                        </Text>
                      </Box>
                    </VStack>
                  </CardBody>
                </MotionCard>
              );
            })}
          </SimpleGrid>

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
                    Ready to solve your database sync challenges?
                  </Heading>
                  <Text color="surface.400" fontSize="md" maxW="2xl">
                    Join developers who are saving hours every week with automated database synchronization.
                  </Text>
                  <HStack spacing={4} flexWrap="wrap" justify="center">
                    <Button
                      colorScheme="teal"
                      size="lg"
                      onClick={() => router.push('/signup')}
                      minH="48px"
                    >
                      Get Started Free
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => router.push('/how-it-works')}
                      minH="48px"
                    >
                      Learn How It Works
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

