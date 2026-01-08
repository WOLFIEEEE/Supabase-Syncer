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
  Badge,
  Divider,
  SimpleGrid,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { ScrollReveal, GlassCard, FloatingCard } from '@/components/animations';

const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

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

const DatabaseIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);

const RewindIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <polygon points="11 19 2 12 11 5 11 19"/>
    <polygon points="22 19 13 12 22 5 22 19"/>
  </svg>
);

const LayersIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
    <polyline points="2 17 12 22 22 17"/>
    <polyline points="2 12 12 17 22 12"/>
  </svg>
);

const ActivityIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const features = [
  {
    icon: SyncIcon,
    title: 'One-Click Database Sync',
    description: 'Synchronize data between production and development databases with a single click. Supports one-way sync with UPSERT operations for safe data migration.',
    category: 'core',
  },
  {
    icon: ShieldIcon,
    title: 'Schema Validation',
    description: 'Automatic schema comparison with critical issue detection before any sync. Identifies breaking changes, type mismatches, and missing columns.',
    category: 'core',
  },
  {
    icon: CodeIcon,
    title: 'Migration Generator',
    description: 'Auto-generate idempotent SQL scripts to fix schema differences automatically. Handles tables, columns, indexes, constraints, and ENUM types.',
    category: 'core',
  },
  {
    icon: ZapIcon,
    title: 'Real-time Execution',
    description: 'Execute migrations directly from the UI with production safety confirmations. Real-time progress tracking and detailed logging.',
    category: 'core',
  },
  {
    icon: DatabaseIcon,
    title: 'Keep-Alive Service',
    description: 'Prevent Supabase free tier databases from pausing due to inactivity with automated daily health checks. Keep your databases active 24/7.',
    category: 'monitoring',
  },
  {
    icon: ShieldIcon,
    title: 'Encrypted Storage',
    description: 'Database connection strings encrypted with AES-256-GCM before storage. Your credentials are never stored in plain text.',
    category: 'security',
  },
  {
    icon: ShieldIcon,
    title: 'Production Safeguards',
    description: 'Extra confirmation required when modifying production databases. Dry-run previews and breaking change warnings protect your data.',
    category: 'security',
  },
  {
    icon: DatabaseIcon,
    title: 'Schema Comparison',
    description: 'Compare table structures, columns, indexes, constraints, and ENUM types between databases. Detailed difference reports with severity levels.',
    category: 'core',
  },
  {
    icon: DatabaseIcon,
    title: 'Data Explorer',
    description: 'Browse and manage database tables with read/write operations. Clean admin dashboard interface for viewing and editing records.',
    category: 'core',
  },
  {
    icon: ZapIcon,
    title: 'Sync Job Monitoring',
    description: 'Real-time progress tracking, detailed logging, and status updates for ongoing synchronization tasks. Monitor sync speed, ETA, and errors.',
    category: 'monitoring',
  },
  {
    icon: RewindIcon,
    title: 'Automatic Rollback',
    description: 'Failed syncs automatically restore to pre-sync state. Backup snapshots are created before every sync operation, enabling instant recovery from failures.',
    category: 'core',
  },
  {
    icon: LayersIcon,
    title: 'Parallel Processing',
    description: 'Sync 3-4 tables concurrently for 2-3x faster performance. FK-aware scheduling ensures data integrity while maximizing throughput.',
    category: 'performance',
  },
  {
    icon: ActivityIcon,
    title: 'Real-time Metrics Dashboard',
    description: 'Live dashboards with throughput metrics, rows/second graphs, and distributed tracing. Monitor every aspect of your sync operations in real-time.',
    category: 'monitoring',
  },
  {
    icon: ClockIcon,
    title: 'Smart Rate Limiting',
    description: 'Intelligent throttling prevents database overload with adaptive rate limits based on target database performance. Protects your production databases.',
    category: 'performance',
  },
  {
    icon: ZapIcon,
    title: 'Dynamic Batch Sizing',
    description: 'Batch sizes automatically adapt to row sizes and processing time. Optimal performance for any data pattern, from tiny records to large blobs.',
    category: 'performance',
  },
  {
    icon: ShieldIcon,
    title: 'Idempotent Retries',
    description: 'Safe retry handling tracks processed rows to prevent duplicates. UPSERT operations and transaction isolation ensure data consistency.',
    category: 'security',
  },
];

const MotionBox = motion(Box);

export default function FeaturesPageClient() {
  const router = useRouter();

  // Structured Data (JSON-LD)
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'suparbase Features',
    description: 'Complete list of features available in suparbase database synchronization tool',
    itemListElement: features.map((feature, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SoftwareFeature',
        name: feature.title,
        description: feature.description,
      },
    })),
  };

  return (
    <Box 
      minH="100vh" 
      bg="rgba(9, 9, 11, 1)" 
      position="relative" 
      overflow="hidden"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      
      {/* Animated Gradient Backgrounds */}
      <MotionBox
        position="absolute"
        top="10%"
        right="-5%"
        w="600px"
        h="600px"
        bgGradient="radial(circle, rgba(62, 207, 142, 0.15) 0%, transparent 70%)"
        borderRadius="full"
        filter="blur(80px)"
        pointerEvents="none"
        zIndex={0}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <MotionBox
        position="absolute"
        bottom="10%"
        left="-5%"
        w="500px"
        h="500px"
        bgGradient="radial(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)"
        borderRadius="full"
        filter="blur(80px)"
        pointerEvents="none"
        zIndex={0}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />
      
      <Container maxW="7xl" py={{ base: 12, md: 20 }} px={{ base: 4, md: 6 }} position="relative" zIndex={1}>
        <VStack spacing={16} align="stretch">
          {/* Header */}
          <ScrollReveal direction="fade" delay={0.2}>
            <VStack spacing={6} align="center" textAlign="center">
              <FloatingCard intensity={8} duration={4}>
                <Badge 
                  colorScheme="teal" 
                  px={4} 
                  py={2} 
                  borderRadius="full" 
                  fontSize="sm"
                  fontWeight="700"
                  letterSpacing="0.1em"
                  textTransform="uppercase"
                  bgGradient="linear(to-r, teal.500/20, teal.400/20)"
                  borderWidth="1px"
                  borderColor="teal.400/30"
                  backdropFilter="blur(10px)"
                >
                  COMPLETE FEATURE SET
                </Badge>
              </FloatingCard>
              <Heading 
                as="h1" 
                fontSize={{ base: '4xl', md: '6xl', lg: '7xl' }}
                fontWeight="800"
                color="white"
                fontFamily="mono"
                letterSpacing="-0.03em"
                lineHeight="1.1"
              >
                <Text
                  as="span"
                  bgGradient="linear(to-r, teal.400, teal.300, purple.400)"
                  bgClip="text"
                  sx={{
                    WebkitTextFillColor: 'transparent',
                    WebkitBackgroundClip: 'text',
                  }}
                >
                  Features
                </Text>
              </Heading>
              <Text 
                color="surface.400" 
                fontSize={{ base: 'lg', md: 'xl' }} 
                maxW="3xl"
                lineHeight="1.7"
              >
                Everything you need to synchronize and manage your Supabase databases
              </Text>
            </VStack>
          </ScrollReveal>

          <Divider borderColor="surface.700" opacity={0.3} />

          {/* Features Grid with Glassmorphism */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={{ base: 6, md: 8 }}>
            {features.map((feature, index) => {
              const categoryColor = feature.category === 'core'
                ? 'teal'
                : feature.category === 'security'
                ? 'red'
                : feature.category === 'performance'
                ? 'purple'
                : 'blue';
              
              return (
                <ScrollReveal
                  key={feature.title}
                  delay={index * 0.1}
                  direction="up"
                >
                  <FloatingCard intensity={5 + (index % 3) * 2} duration={3 + (index % 2)}>
                    <GlassCard
                      p={6}
                      h="100%"
                      position="relative"
                      overflow="hidden"
                      _before={{
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        bgGradient: `linear(to-r, transparent, ${categoryColor}.400, transparent)`,
                        opacity: 0.6,
                      }}
                    >
                      <VStack spacing={5} align="start" h="100%">
                        <HStack spacing={4} w="full">
                          <motion.div
                            whileHover={{ 
                              rotate: [0, -10, 10, -10, 0],
                              scale: 1.1,
                            }}
                            transition={{ duration: 0.5 }}
                          >
                            <Box 
                              color={`${categoryColor}.400`}
                              p={3}
                              bgGradient={`linear(to-br, ${categoryColor}.400/20, ${categoryColor}.500/10)`}
                              borderRadius="xl"
                              borderWidth="1px"
                              borderColor={`${categoryColor}.400/30`}
                              backdropFilter="blur(10px)"
                            >
                              <feature.icon />
                            </Box>
                          </motion.div>
                          <Badge
                            colorScheme={categoryColor}
                            fontSize="xs"
                            px={3}
                            py={1}
                            borderRadius="full"
                            fontWeight="700"
                            textTransform="uppercase"
                            letterSpacing="0.05em"
                            bgGradient={`linear(to-r, ${categoryColor}.500/20, ${categoryColor}.400/20)`}
                            borderWidth="1px"
                            borderColor={`${categoryColor}.400/30`}
                            backdropFilter="blur(10px)"
                          >
                            {feature.category}
                          </Badge>
                        </HStack>
                        <VStack spacing={3} align="start" flex={1}>
                          <Heading 
                            as="h3" 
                            size="md" 
                            color="white" 
                            fontSize={{ base: 'lg', md: 'xl' }} 
                            fontWeight="700"
                          >
                            {feature.title}
                          </Heading>
                          <Text 
                            color="surface.300" 
                            fontSize={{ base: 'sm', md: 'md' }} 
                            lineHeight="1.7" 
                            flex={1}
                          >
                            {feature.description}
                          </Text>
                        </VStack>
                      </VStack>
                    </GlassCard>
                  </FloatingCard>
                </ScrollReveal>
              );
            })}
          </SimpleGrid>

          {/* CTA Section with Glassmorphism */}
          <ScrollReveal direction="up" delay={0.3}>
            <GlassCard
              p={{ base: 8, md: 12 }}
              position="relative"
              overflow="hidden"
              bgGradient="linear(to-br, teal.500/10, purple.500/10, teal.500/5)"
              borderColor="teal.400/30"
              borderWidth="2px"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                bgGradient: 'linear(to-r, teal.400, purple.400, teal.400)',
              }}
            >
              <MotionBox
                position="absolute"
                top="-50%"
                right="-50%"
                w="400px"
                h="400px"
                bgGradient="radial(circle, teal.400/10, transparent)"
                borderRadius="full"
                filter="blur(60px)"
                pointerEvents="none"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <VStack spacing={6} textAlign="center" position="relative" zIndex={1}>
                <Heading 
                  as="h2" 
                  size="lg" 
                  color="white" 
                  fontSize={{ base: '2xl', md: '3xl' }} 
                  fontWeight="700"
                >
                  Ready to Get Started?
                </Heading>
                <Text 
                  color="surface.300" 
                  maxW="2xl" 
                  fontSize={{ base: 'md', md: 'lg' }} 
                  lineHeight="1.7"
                >
                  Start synchronizing your databases today. No credit card required.
                </Text>
                <HStack spacing={4} justify="center" flexWrap="wrap">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="lg"
                      colorScheme="teal"
                      onClick={() => router.push('/signup')}
                      minH="52px"
                      px={8}
                      fontSize="md"
                      fontWeight="600"
                      borderRadius="xl"
                      bgGradient="linear(to-r, teal.400, teal.500)"
                      _hover={{
                        boxShadow: '0 10px 30px rgba(62, 207, 142, 0.4)',
                      }}
                      transition="all 0.3s"
                    >
                      Get Started
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => router.push('/getting-started')}
                      minH="52px"
                      px={8}
                      fontSize="md"
                      fontWeight="600"
                      borderRadius="xl"
                      borderColor="teal.400/40"
                      color="teal.400"
                      backdropFilter="blur(10px)"
                      bg="rgba(255, 255, 255, 0.05)"
                      _hover={{
                        borderColor: 'teal.400',
                        bg: 'teal.400/10',
                      }}
                      transition="all 0.3s"
                    >
                      Quick Start
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => router.push('/use-cases')}
                      minH="52px"
                      px={8}
                      fontSize="md"
                      fontWeight="600"
                      borderRadius="xl"
                      borderColor="teal.400/40"
                      color="teal.400"
                      backdropFilter="blur(10px)"
                      bg="rgba(255, 255, 255, 0.05)"
                      _hover={{
                        borderColor: 'teal.400',
                        bg: 'teal.400/10',
                      }}
                      transition="all 0.3s"
                    >
                      See Use Cases
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
