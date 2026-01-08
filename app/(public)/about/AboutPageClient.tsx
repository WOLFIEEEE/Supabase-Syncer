'use client';

import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  SimpleGrid,
  Divider,
  Badge,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { ScrollReveal, ParallaxBox, GlassCard } from '@/components/animations';

const MotionBox = motion(Box);
const MotionVStack = motion(VStack);

const DatabaseIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);

const CodeIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const RocketIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
);

const timelineEvents = [
  {
    year: '2024',
    title: 'The Problem',
    description: 'Developers struggling with Supabase database synchronization between environments. Free tier databases pausing due to inactivity.',
    icon: DatabaseIcon,
    color: 'teal',
  },
  {
    year: '2024',
    title: 'The Solution',
    description: 'Built suparbase to solve real developer pain points. Started with core sync functionality and keep-alive service.',
    icon: RocketIcon,
    color: 'purple',
  },
  {
    year: '2024',
    title: 'Production Ready',
    description: 'Added automatic rollback, schema validation, migration generation, and comprehensive safety features for production use.',
    icon: ShieldIcon,
    color: 'blue',
  },
  {
    year: '2024',
    title: 'Developer First',
    description: 'Every feature designed with developer workflow in mind. Open feedback loop and continuous improvements based on user needs.',
    icon: CodeIcon,
    color: 'teal',
  },
];

const values = [
  {
    icon: DatabaseIcon,
    title: 'Database-First',
    description: 'Built specifically for Supabase and PostgreSQL databases, understanding their unique requirements.',
  },
  {
    icon: ShieldIcon,
    title: 'Security & Privacy',
    description: 'Your database credentials are encrypted with AES-256-GCM. We never store your actual data.',
  },
  {
    icon: CodeIcon,
    title: 'Developer-Focused',
    description: 'Built by developers, for developers. Every feature is designed with your workflow in mind.',
  },
];

export default function AboutPageClient() {
  const router = useRouter();

  return (
    <Box 
      minH="100vh" 
      bg="rgba(9, 9, 11, 1)" 
      position="relative" 
      overflow="hidden"
    >
      {/* Animated Background Particles */}
      <MotionBox
        position="absolute"
        top="20%"
        left="10%"
        w="300px"
        h="300px"
        bgGradient="radial(circle, rgba(62, 207, 142, 0.1) 0%, transparent 70%)"
        borderRadius="full"
        filter="blur(60px)"
        pointerEvents="none"
        zIndex={0}
        animate={{
          scale: [1, 1.5, 1],
          x: [0, 100, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <MotionBox
        position="absolute"
        bottom="20%"
        right="10%"
        w="400px"
        h="400px"
        bgGradient="radial(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)"
        borderRadius="full"
        filter="blur(60px)"
        pointerEvents="none"
        zIndex={0}
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -100, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 5,
        }}
      />

      <Container maxW="6xl" py={{ base: 12, md: 20 }} px={{ base: 4, md: 6 }} position="relative" zIndex={1}>
        <VStack spacing={16} align="stretch">
          {/* Header */}
          <ScrollReveal direction="fade" delay={0.2}>
            <VStack spacing={6} align="center" textAlign="center">
              <Heading
                fontSize={{ base: '4xl', md: '6xl', lg: '7xl' }}
                fontWeight="800"
                color="white"
                fontFamily="mono"
                letterSpacing="-0.03em"
                lineHeight="1.1"
              >
                <Text
                  as="span"
                  bgGradient="linear(to-r, teal.400, purple.400)"
                  bgClip="text"
                  sx={{
                    WebkitTextFillColor: 'transparent',
                    WebkitBackgroundClip: 'text',
                  }}
                >
                  About suparbase
                </Text>
              </Heading>
              <Text 
                color="surface.400" 
                fontSize={{ base: 'lg', md: 'xl' }} 
                maxW="3xl"
                lineHeight="1.7"
              >
                We're building tools to make Supabase database management easier, safer, and more efficient.
              </Text>
            </VStack>
          </ScrollReveal>

          {/* Mission */}
          <ScrollReveal direction="up" delay={0.3}>
            <GlassCard p={{ base: 6, md: 8 }}>
              <VStack spacing={4} align="stretch">
                <Heading size="lg" color="white">
                  Our Mission
                </Heading>
                <Text color="surface.300" fontSize="md" lineHeight="tall">
                  suparbase was created to solve real problems faced by developers working with Supabase databases. 
                  Whether you're syncing data between environments, preventing free tier pausing, or managing schema 
                  migrations, we provide the tools you need to work confidently with your databases.
                </Text>
                <Text color="surface.300" fontSize="md" lineHeight="tall">
                  We believe in transparency and putting developers first. Every feature we 
                  build is designed with your workflow in mind, ensuring that database management doesn't get in the 
                  way of building great applications.
                </Text>
              </VStack>
            </GlassCard>
          </ScrollReveal>

          {/* Timeline */}
          <VStack spacing={0} align="stretch" position="relative">
            <ScrollReveal direction="fade" delay={0.4}>
              <Heading size="lg" color="white" mb={8} textAlign="center">
                Our Journey
              </Heading>
            </ScrollReveal>
            
            {/* Timeline Line */}
            <Box
              position="absolute"
              left={{ base: '24px', md: '50%' }}
              top={0}
              bottom={0}
              w="2px"
              bgGradient="linear(to-b, teal.500, purple.500)"
              opacity={0.3}
              transform={{ base: 'none', md: 'translateX(-50%)' }}
            />

            {timelineEvents.map((event, index) => {
              const IconComponent = event.icon;
              const isEven = index % 2 === 0;
              
              return (
                <ScrollReveal
                  key={index}
                  direction={isEven ? 'left' : 'right'}
                  delay={0.5 + index * 0.1}
                >
                  <HStack
                    spacing={0}
                    align="start"
                    position="relative"
                    pb={12}
                    flexDirection={{ base: 'row', md: isEven ? 'row' : 'row-reverse' }}
                  >
                    {/* Timeline Dot */}
                    <Box
                      position="relative"
                      zIndex={2}
                      left={{ base: '12px', md: '50%' }}
                      transform={{ base: 'translateX(-50%)', md: 'translateX(-50%)' }}
                      w="48px"
                      h="48px"
                      borderRadius="full"
                      bgGradient={`linear(to-br, ${event.color}.400, ${event.color}.600)`}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      boxShadow={`0 0 20px ${event.color}.400/50`}
                      border="4px solid"
                      borderColor="rgba(9, 9, 11, 1)"
                    >
                      <IconComponent />
                    </Box>

                    {/* Content Card */}
                    <Box
                      flex={1}
                      ml={{ base: 8, md: isEven ? 8 : 0 }}
                      mr={{ base: 0, md: isEven ? 0 : 8 }}
                      maxW={{ base: '100%', md: '45%' }}
                    >
                      <GlassCard
                        p={6}
                        bgGradient={`linear(to-br, ${event.color}.500/10, ${event.color}.400/5)`}
                        borderColor={`${event.color}.400/30`}
                        borderWidth="2px"
                      >
                        <VStack spacing={3} align="start">
                          <HStack spacing={3}>
                            <Badge
                              colorScheme={event.color}
                              fontSize="xs"
                              px={3}
                              py={1}
                              borderRadius="full"
                              bgGradient={`linear(to-r, ${event.color}.500/30, ${event.color}.400/30)`}
                              borderWidth="1px"
                              borderColor={`${event.color}.400/40`}
                            >
                              {event.year}
                            </Badge>
                            <Heading size="md" color="white" fontWeight="700">
                              {event.title}
                            </Heading>
                          </HStack>
                          <Text color="surface.300" fontSize="sm" lineHeight="1.7">
                            {event.description}
                          </Text>
                        </VStack>
                      </GlassCard>
                    </Box>
                  </HStack>
                </ScrollReveal>
              );
            })}
          </VStack>

          {/* Values */}
          <ScrollReveal direction="up" delay={0.6}>
            <VStack spacing={6} align="stretch">
              <Heading size="lg" color="white" textAlign="center">
                Our Values
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                {values.map((value, index) => (
                  <ScrollReveal
                    key={index}
                    delay={0.7 + index * 0.1}
                    direction="up"
                  >
                    <GlassCard p={6} h="100%">
                      <VStack spacing={4} align="start">
                        <motion.div
                          whileHover={{ 
                            rotate: [0, -10, 10, -10, 0],
                            scale: 1.1,
                          }}
                          transition={{ duration: 0.5 }}
                        >
                          <Box 
                            color="teal.400"
                            p={3}
                            bgGradient="linear(to-br, teal.400/20, teal.500/10)"
                            borderRadius="xl"
                            borderWidth="1px"
                            borderColor="teal.400/30"
                          >
                            <value.icon />
                          </Box>
                        </motion.div>
                        <Heading size="md" color="white" fontWeight="700">
                          {value.title}
                        </Heading>
                        <Text color="surface.300" fontSize="sm" lineHeight="1.7">
                          {value.description}
                        </Text>
                      </VStack>
                    </GlassCard>
                  </ScrollReveal>
                ))}
              </SimpleGrid>
            </VStack>
          </ScrollReveal>

          {/* What We Do */}
          <ScrollReveal direction="up" delay={0.8}>
            <GlassCard p={{ base: 6, md: 8 }}>
              <VStack spacing={6} align="stretch">
                <Heading size="lg" color="white">
                  What We Do
                </Heading>
                <VStack spacing={6} align="stretch">
                  {[
                    {
                      title: 'Database Synchronization',
                      description: 'Sync data between production and development databases with confidence. Our tools validate schema compatibility and provide safety checks before any data transfer.',
                    },
                    {
                      title: 'Keep-Alive Service',
                      description: 'Prevent your Supabase free tier databases from pausing due to inactivity. Automated health checks keep your databases active and accessible.',
                    },
                    {
                      title: 'Schema Management',
                      description: 'Compare schemas, detect differences, and generate migration scripts automatically. Ensure your database structures stay in sync across environments.',
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ x: 10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Box>
                        <Heading size="md" color="teal.400" mb={2} fontWeight="700">
                          {item.title}
                        </Heading>
                        <Text color="surface.300" fontSize="md" lineHeight="1.7">
                          {item.description}
                        </Text>
                      </Box>
                    </motion.div>
                  ))}
                </VStack>
              </VStack>
            </GlassCard>
          </ScrollReveal>

          {/* CTA */}
          <ScrollReveal direction="up" delay={0.9}>
            <GlassCard
              p={{ base: 8, md: 12 }}
              textAlign="center"
              bgGradient="linear(to-br, teal.500/10, purple.500/10)"
              borderColor="teal.500/30"
              borderWidth="2px"
            >
              <VStack spacing={6}>
                <Heading size="lg" color="white" fontWeight="700">
                  Ready to get started?
                </Heading>
                <Text color="surface.300" fontSize="lg" maxW="2xl">
                  Join developers who are already using suparbase to manage their Supabase databases.
                </Text>
                <HStack spacing={4} justify="center" flexWrap="wrap">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      colorScheme="teal"
                      onClick={() => router.push('/signup')}
                      minH="52px"
                      px={8}
                      fontSize="md"
                      fontWeight="600"
                      bgGradient="linear(to-r, teal.400, teal.500)"
                    >
                      Get Started
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      onClick={() => router.push('/use-cases')}
                      minH="52px"
                      px={8}
                      fontSize="md"
                      fontWeight="600"
                      borderColor="teal.400/40"
                      color="teal.400"
                      backdropFilter="blur(10px)"
                      bg="rgba(255, 255, 255, 0.05)"
                      _hover={{
                        borderColor: 'teal.400',
                        bg: 'teal.400/10',
                      }}
                    >
                      See Use Cases
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      onClick={() => router.push('/getting-started')}
                      minH="52px"
                      px={8}
                      fontSize="md"
                      fontWeight="600"
                      borderColor="teal.400/40"
                      color="teal.400"
                      backdropFilter="blur(10px)"
                      bg="rgba(255, 255, 255, 0.05)"
                      _hover={{
                        borderColor: 'teal.400',
                        bg: 'teal.400/10',
                      }}
                    >
                      Quick Start Guide
                    </Button>
                  </motion.div>
                </HStack>
              </VStack>
            </GlassCard>
          </ScrollReveal>
        </VStack>
      </Container>
    </Box>
  );
}
