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

const GitHubIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const VercelIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M24 22.525H0l12-21.05 12 21.05z" />
  </svg>
);

const DockerIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M13.983 10.282h2.119a.15.15 0 0 0 .15-.15V8.466a.15.15 0 0 0-.15-.15h-2.119a.15.15 0 0 0-.15.15v1.666a.15.15 0 0 0 .15.15zm-2.558 0h2.119a.15.15 0 0 0 .15-.15V8.466a.15.15 0 0 0-.15-.15h-2.119a.15.15 0 0 0-.15.15v1.666a.15.15 0 0 0 .15.15zm-2.539 0h2.119a.15.15 0 0 0 .15-.15V8.466a.15.15 0 0 0-.15-.15H8.886a.15.15 0 0 0-.15.15v1.666a.15.15 0 0 0 .15.15zm-2.558 0h2.119a.15.15 0 0 0 .15-.15V8.466a.15.15 0 0 0-.15-.15H6.328a.15.15 0 0 0-.15.15v1.666a.15.15 0 0 0 .15.15zm5.117-2.816h2.119a.15.15 0 0 0 .15-.15V5.65a.15.15 0 0 0-.15-.15h-2.119a.15.15 0 0 0-.15.15v1.666a.15.15 0 0 0 .15.15zm-2.558 0h2.119a.15.15 0 0 0 .15-.15V5.65a.15.15 0 0 0-.15-.15H8.886a.15.15 0 0 0-.15.15v1.666a.15.15 0 0 0 .15.15zm-2.539 0h2.119a.15.15 0 0 0 .15-.15V5.65a.15.15 0 0 0-.15-.15H6.328a.15.15 0 0 0-.15.15v1.666a.15.15 0 0 0 .15.15zm-2.558 0h2.119a.15.15 0 0 0 .15-.15V5.65a.15.15 0 0 0-.15-.15H3.77a.15.15 0 0 0-.15.15v1.666a.15.15 0 0 0 .15.15zm10.235 2.816h2.119a.15.15 0 0 0 .15-.15V8.466a.15.15 0 0 0-.15-.15h-2.119a.15.15 0 0 0-.15.15v1.666a.15.15 0 0 0 .15.15zm-2.558 0h2.119a.15.15 0 0 0 .15-.15V8.466a.15.15 0 0 0-.15-.15h-2.119a.15.15 0 0 0-.15.15v1.666a.15.15 0 0 0 .15.15zM1.6 8.466v1.666a.15.15 0 0 0 .15.15h2.02a.15.15 0 0 0 .15-.15V8.466a.15.15 0 0 0-.15-.15H1.75a.15.15 0 0 0-.15.15zm.15 3.768h2.02a.15.15 0 0 0 .15-.15v-1.666a.15.15 0 0 0-.15-.15H1.75a.15.15 0 0 0-.15.15v1.666a.15.15 0 0 0 .15.15zm19.373-3.768v1.666a.15.15 0 0 0 .15.15h2.02a.15.15 0 0 0 .15-.15V8.466a.15.15 0 0 0-.15-.15h-2.02a.15.15 0 0 0-.15.15zm.15 3.768h2.02a.15.15 0 0 0 .15-.15v-1.666a.15.15 0 0 0-.15-.15h-2.02a.15.15 0 0 0-.15.15v1.666a.15.15 0 0 0 .15.15zM4.943 12.234H2.923a.15.15 0 0 0-.15.15v1.666a.15.15 0 0 0 .15.15h2.02a.15.15 0 0 0 .15-.15v-1.666a.15.15 0 0 0-.15-.15zm2.558 0H5.481a.15.15 0 0 0-.15.15v1.666a.15.15 0 0 0 .15.15h2.02a.15.15 0 0 0 .15-.15v-1.666a.15.15 0 0 0-.15-.15zm11.373 0h-2.02a.15.15 0 0 0-.15.15v1.666a.15.15 0 0 0 .15.15h2.02a.15.15 0 0 0 .15-.15v-1.666a.15.15 0 0 0-.15-.15zm2.558 0h-2.02a.15.15 0 0 0-.15.15v1.666a.15.15 0 0 0 .15.15h2.02a.15.15 0 0 0 .15-.15v-1.666a.15.15 0 0 0-.15-.15z" />
  </svg>
);

const RedisIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22c-5.514 0-10-4.486-10-10S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z" />
  </svg>
);

const integrations = [
  {
    id: 'github',
    name: 'GitHub',
    description: 'Integrate with GitHub Actions for CI/CD workflows. Automate database syncs on pull requests and deployments.',
    icon: GitHubIcon,
    status: 'available',
    category: 'CI/CD',
    color: 'gray',
    link: '/docs/api',
  },
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Deploy suparbase frontend on Vercel with automatic deployments. Perfect for Next.js applications.',
    icon: VercelIcon,
    status: 'available',
    category: 'Hosting',
    color: 'black',
    link: '/docs/architecture',
  },
  {
    id: 'docker',
    name: 'Docker',
    description: 'Run suparbase backend in Docker containers. Production-ready Docker Compose configurations included.',
    icon: DockerIcon,
    status: 'available',
    category: 'Containerization',
    color: 'blue',
    link: '/docs/architecture',
  },
  {
    id: 'redis',
    name: 'Redis',
    description: 'Use Redis for job queues and caching. Built-in support for BullMQ job processing.',
    icon: RedisIcon,
    status: 'available',
    category: 'Infrastructure',
    color: 'red',
    link: '/docs/architecture',
  },
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'Native integration with Supabase databases. Direct connection support with encrypted credentials.',
    icon: () => (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M21.362 9.354H12V.396a.396.396 0 0 0-.716-.233L2.203 12.424l-.401.562a1.04 1.04 0 0 0 .836 1.659H12v8.959a.396.396 0 0 0 .716.233l9.081-12.261.401-.562a1.04 1.04 0 0 0-.836-1.66z" />
      </svg>
    ),
    status: 'available',
    category: 'Database',
    color: 'green',
    link: '/docs/database',
  },
];

export default function IntegrationsPageClient() {
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
                INTEGRATIONS
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
                  Connect Your Tools
                </Text>
              </Heading>
              <Text
                color="surface.400"
                fontSize={{ base: 'lg', md: 'xl' }}
                maxW="3xl"
                lineHeight="1.7"
              >
                Integrate suparbase with your favorite development tools and workflows for seamless database management.
              </Text>
            </VStack>
          </ScrollReveal>

          {/* Integrations Grid */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {integrations.map((integration, index) => {
              const IconComponent = integration.icon;
              return (
                <ScrollReveal key={integration.id} delay={0.3 + index * 0.1} direction="up">
                  <GlassCard
                    p={6}
                    cursor="pointer"
                    onClick={() => router.push(integration.link)}
                    h="100%"
                    _hover={{
                      borderColor: 'teal.400/50',
                      transform: 'translateY(-4px)',
                    }}
                    transition="all 0.3s"
                  >
                    <VStack spacing={4} align="start" h="100%">
                      <HStack spacing={4} w="full" justify="space-between">
                        <Box
                          p={3}
                          bgGradient="linear(to-br, teal.400/20, teal.500/10)"
                          borderRadius="xl"
                          borderWidth="1px"
                          borderColor="teal.400/30"
                          color="teal.400"
                        >
                          <IconComponent />
                        </Box>
                        <Badge
                          colorScheme="green"
                          fontSize="xs"
                          px={3}
                          py={1}
                          borderRadius="full"
                          textTransform="uppercase"
                        >
                          {integration.status}
                        </Badge>
                      </HStack>
                      <VStack spacing={2} align="start" flex={1}>
                        <Heading size="md" color="white" fontWeight="700">
                          {integration.name}
                        </Heading>
                        <Badge
                          colorScheme="teal"
                          fontSize="xs"
                          px={2}
                          py={0.5}
                          borderRadius="md"
                          variant="subtle"
                        >
                          {integration.category}
                        </Badge>
                        <Text color="surface.300" fontSize="sm" lineHeight="1.7">
                          {integration.description}
                        </Text>
                      </VStack>
                      <HStack spacing={2} color="teal.400" fontSize="sm" fontWeight="600" w="full">
                        <Text>View integration</Text>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </HStack>
                    </VStack>
                  </GlassCard>
                </ScrollReveal>
              );
            })}
          </SimpleGrid>

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
                  Need a Custom Integration?
                </Heading>
                <Text color="surface.300" fontSize="lg" maxW="2xl">
                  Our API is flexible and well-documented. Build custom integrations for your specific workflow needs.
                </Text>
                <HStack spacing={4} justify="center" flexWrap="wrap">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      colorScheme="teal"
                      onClick={() => router.push('/docs/api')}
                      minH="52px"
                      px={8}
                      fontSize="md"
                      fontWeight="600"
                      bgGradient="linear(to-r, teal.400, teal.500)"
                    >
                      View API Docs
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
                      Request Integration
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
