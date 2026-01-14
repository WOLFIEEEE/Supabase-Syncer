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
  SimpleGrid,
  Icon,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { ScrollReveal, GlassCard } from '@/components/animations';

const MotionBox = motion(Box);

const BookIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const CodeIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const FileIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const VideoIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

const resourceCategories = [
  {
    id: 'tutorials',
    title: 'Tutorials',
    description: 'Step-by-step guides to help you master database synchronization',
    icon: BookIcon,
    color: 'teal',
    resources: [
      {
        title: 'Getting Started with Database Sync',
        description: 'Complete beginner guide to setting up your first sync job',
        type: 'Tutorial',
        link: '/getting-started',
      },
      {
        title: 'Schema Validation Deep Dive',
        description: 'Learn how to validate schemas before syncing data',
        type: 'Tutorial',
        link: '/docs/sync',
      },
      {
        title: 'Keep-Alive Configuration Guide',
        description: 'Configure automated health checks for your databases',
        type: 'Tutorial',
        link: '/docs/database',
      },
      {
        title: 'Migration Generation Explained',
        description: 'Understand how automatic SQL migrations are created',
        type: 'Tutorial',
        link: '/docs/sync',
      },
    ],
  },
  {
    id: 'templates',
    title: 'Templates & Examples',
    description: 'Ready-to-use configurations and code examples',
    icon: CodeIcon,
    color: 'purple',
    resources: [
      {
        title: 'Sync Configuration Template',
        description: 'Pre-configured template for common sync scenarios',
        type: 'Template',
        link: '/guide',
      },
      {
        title: 'API Integration Examples',
        description: 'Code samples for integrating with our API',
        type: 'Example',
        link: '/docs/api',
      },
      {
        title: 'Docker Compose Setup',
        description: 'Production-ready Docker configuration',
        type: 'Template',
        link: '/docs/architecture',
      },
      {
        title: 'Environment Variables Template',
        description: 'Complete .env.example for all configurations',
        type: 'Template',
        link: '/getting-started',
      },
    ],
  },
  {
    id: 'docs',
    title: 'API Documentation',
    description: 'Complete API reference and integration guides',
    icon: FileIcon,
    color: 'blue',
    resources: [
      {
        title: 'REST API Reference',
        description: 'Complete endpoint documentation with examples',
        type: 'API Docs',
        link: '/docs/api',
      },
      {
        title: 'Authentication Guide',
        description: 'Learn how to authenticate API requests',
        type: 'API Docs',
        link: '/docs/authentication',
      },
      {
        title: 'Webhook Integration',
        description: 'Set up webhooks for sync job notifications',
        type: 'API Docs',
        link: '/docs/api',
      },
      {
        title: 'Rate Limiting & Quotas',
        description: 'Understand API rate limits and usage quotas',
        type: 'API Docs',
        link: '/docs/api',
      },
    ],
  },
  {
    id: 'guides',
    title: 'Video Guides',
    description: 'Visual walkthroughs and demonstrations',
    icon: VideoIcon,
    color: 'green',
    resources: [
      {
        title: 'Quick Start Video',
        description: '5-minute overview of core features',
        type: 'Video',
        link: '/getting-started',
      },
      {
        title: 'Sync Workflow Demo',
        description: 'Watch a complete sync operation from start to finish',
        type: 'Video',
        link: '/how-it-works',
      },
      {
        title: 'Schema Comparison Tutorial',
        description: 'Visual guide to comparing database schemas',
        type: 'Video',
        link: '/docs/sync',
      },
    ],
  },
];

export default function ResourcesPageClient() {
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
              >
                RESOURCES
              </Badge>
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
                  Learn & Build
                </Text>
              </Heading>
              <Text
                color="surface.400"
                fontSize={{ base: 'lg', md: 'xl' }}
                maxW="3xl"
                lineHeight="1.7"
              >
                Tutorials, templates, API documentation, and guides to help you succeed with Supabase database management.
              </Text>
            </VStack>
          </ScrollReveal>

          {/* Resource Categories */}
          {resourceCategories.map((category, categoryIndex) => {
            const IconComponent = category.icon;
            return (
              <ScrollReveal key={category.id} direction="up" delay={0.3 + categoryIndex * 0.1}>
                <VStack spacing={6} align="stretch">
                  <HStack spacing={4}>
                    <Box
                      p={3}
                      bgGradient={`linear(to-br, ${category.color}.400/20, ${category.color}.500/10)`}
                      borderRadius="xl"
                      borderWidth="1px"
                      borderColor={`${category.color}.400/30`}
                      color={`${category.color}.400`}
                    >
                      <IconComponent />
                    </Box>
                    <VStack spacing={1} align="start" flex={1}>
                      <Heading size="lg" color="white" fontWeight="700">
                        {category.title}
                      </Heading>
                      <Text color="surface.400" fontSize="sm">
                        {category.description}
                      </Text>
                    </VStack>
                  </HStack>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {category.resources.map((resource, resourceIndex) => (
                      <ScrollReveal
                        key={resourceIndex}
                        delay={0.4 + categoryIndex * 0.1 + resourceIndex * 0.05}
                        direction="up"
                      >
                        <GlassCard
                          p={6}
                          cursor="pointer"
                          onClick={() => router.push(resource.link)}
                          h="100%"
                          _hover={{
                            borderColor: `${category.color}.400/50`,
                          }}
                        >
                          <VStack spacing={4} align="start" h="100%">
                            <HStack spacing={3} w="full" justify="space-between">
                              <Badge
                                colorScheme={category.color}
                                fontSize="xs"
                                px={3}
                                py={1}
                                borderRadius="full"
                                textTransform="uppercase"
                              >
                                {resource.type}
                              </Badge>
                            </HStack>
                            <Heading size="sm" color="white" fontWeight="700" lineHeight="1.3">
                              {resource.title}
                            </Heading>
                            <Text color="surface.300" fontSize="sm" lineHeight="1.7" flex={1}>
                              {resource.description}
                            </Text>
                            <HStack spacing={2} color={`${category.color}.400`} fontSize="sm" fontWeight="600">
                              <Text>View resource</Text>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                              </svg>
                            </HStack>
                          </VStack>
                        </GlassCard>
                      </ScrollReveal>
                    ))}
                  </SimpleGrid>
                </VStack>
              </ScrollReveal>
            );
          })}

          {/* CTA */}
          <ScrollReveal direction="up" delay={0.8}>
            <GlassCard
              p={{ base: 8, md: 12 }}
              textAlign="center"
              bgGradient="linear(to-br, teal.500/10, purple.500/10)"
              borderColor="teal.500/30"
              borderWidth="2px"
            >
              <VStack spacing={6}>
                <Heading size="lg" color="white" fontWeight="700">
                  Need More Help?
                </Heading>
                <Text color="surface.300" fontSize="lg" maxW="2xl">
                  Check out our comprehensive documentation or reach out to our support team.
                </Text>
                <HStack spacing={4} justify="center" flexWrap="wrap">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      colorScheme="teal"
                      onClick={() => router.push('/docs')}
                      minH="52px"
                      px={8}
                      fontSize="md"
                      fontWeight="600"
                      bgGradient="linear(to-r, teal.400, teal.500)"
                    >
                      View Documentation
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      onClick={() => router.push('/contact')}
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
                      Contact Support
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
