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
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { ScrollReveal, GlassCard } from '@/components/animations';

const MotionBox = motion(Box);

const releases = [
  {
    version: '1.0.0',
    date: '2024-01-15',
    type: 'major',
    features: [
      'Initial release with core database synchronization',
      'Schema validation and comparison tools',
      'Automatic migration generation',
      'Keep-alive service for Supabase databases',
      'AES-256-GCM encryption for database credentials',
      'Real-time sync progress tracking',
      'One-way and two-way sync support',
    ],
    improvements: [
      'Improved error handling and user feedback',
      'Enhanced UI/UX for sync operations',
    ],
    fixes: [
      'Fixed connection timeout issues',
      'Resolved schema comparison edge cases',
    ],
  },
  {
    version: '0.9.0',
    date: '2024-01-01',
    type: 'minor',
    features: [
      'Added dry-run mode for safe previews',
      'Enhanced conflict resolution strategies',
      'Improved schema difference visualization',
    ],
    improvements: [
      'Better performance for large database syncs',
      'Optimized UI loading states',
    ],
    fixes: [
      'Fixed authentication token refresh',
      'Resolved memory leaks in long-running syncs',
    ],
  },
  {
    version: '0.8.0',
    date: '2023-12-20',
    type: 'minor',
    features: [
      'Added automatic rollback on sync failures',
      'Enhanced keep-alive scheduling options',
      'Improved API documentation',
    ],
    improvements: [
      'Faster schema comparison algorithm',
      'Better error messages',
    ],
    fixes: [
      'Fixed issue with ENUM type handling',
      'Resolved connection pooling problems',
    ],
  },
];

const getTypeColor = (type: string) => {
  switch (type) {
    case 'major':
      return 'purple';
    case 'minor':
      return 'teal';
    case 'patch':
      return 'blue';
    default:
      return 'gray';
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'major':
      return 'Major Release';
    case 'minor':
      return 'Minor Release';
    case 'patch':
      return 'Patch Release';
    default:
      return 'Update';
  }
};

export default function ChangelogPageClient() {
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

      <Container maxW="4xl" py={{ base: 12, md: 20 }} px={{ base: 4, md: 6 }} position="relative" zIndex={1}>
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
                CHANGELOG
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
                  What's New
                </Text>
              </Heading>
              <Text
                color="surface.400"
                fontSize={{ base: 'lg', md: 'xl' }}
                maxW="3xl"
                lineHeight="1.7"
              >
                Stay up to date with the latest features, improvements, and fixes in suparbase.
              </Text>
            </VStack>
          </ScrollReveal>

          {/* Timeline */}
          <VStack spacing={0} align="stretch" position="relative">
            {/* Timeline Line */}
            <Box
              position="absolute"
              left={{ base: '24px', md: '32px' }}
              top={0}
              bottom={0}
              w="2px"
              bgGradient="linear(to-b, teal.500, purple.500)"
              opacity={0.3}
            />

            {releases.map((release, index) => (
              <ScrollReveal key={release.version} delay={0.3 + index * 0.1} direction="up">
                <HStack spacing={0} align="start" position="relative" pb={12}>
                  {/* Timeline Dot */}
                  <Box
                    position="relative"
                    zIndex={2}
                    left={{ base: '12px', md: '20px' }}
                    transform="translateX(-50%)"
                    w="48px"
                    h="48px"
                    borderRadius="full"
                    bgGradient={`linear(to-br, ${getTypeColor(release.type)}.400, ${getTypeColor(release.type)}.600)`}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow={`0 0 20px ${getTypeColor(release.type)}.400/50`}
                    border="4px solid"
                    borderColor="rgba(9, 9, 11, 1)"
                  >
                    <Box
                      w="12px"
                      h="12px"
                      borderRadius="full"
                      bg="white"
                    />
                  </Box>

                  {/* Content Card */}
                  <Box flex={1} ml={{ base: 8, md: 12 }}>
                    <GlassCard
                      p={6}
                      bgGradient={`linear(to-br, ${getTypeColor(release.type)}.500/10, ${getTypeColor(release.type)}.400/5)`}
                      borderColor={`${getTypeColor(release.type)}.400/30`}
                      borderWidth="2px"
                    >
                      <VStack spacing={4} align="start">
                        <HStack spacing={3} flexWrap="wrap">
                          <Heading size="lg" color="white" fontWeight="700">
                            v{release.version}
                          </Heading>
                          <Badge
                            colorScheme={getTypeColor(release.type)}
                            fontSize="xs"
                            px={3}
                            py={1}
                            borderRadius="full"
                            textTransform="uppercase"
                            bgGradient={`linear(to-r, ${getTypeColor(release.type)}.500/30, ${getTypeColor(release.type)}.400/30)`}
                            borderWidth="1px"
                            borderColor={`${getTypeColor(release.type)}.400/40`}
                          >
                            {getTypeLabel(release.type)}
                          </Badge>
                          <Text color="surface.500" fontSize="sm">
                            {new Date(release.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </Text>
                        </HStack>

                        {release.features.length > 0 && (
                          <VStack spacing={2} align="start" w="full">
                            <HStack spacing={2}>
                              <Box color="green.400" fontSize="lg" fontWeight="700">
                                ✨
                              </Box>
                              <Text color="white" fontWeight="600" fontSize="sm">
                                New Features
                              </Text>
                            </HStack>
                            {release.features.map((feature, featureIndex) => (
                              <Text key={featureIndex} color="surface.300" fontSize="sm" pl={6} lineHeight="1.7">
                                • {feature}
                              </Text>
                            ))}
                          </VStack>
                        )}

                        {release.improvements.length > 0 && (
                          <VStack spacing={2} align="start" w="full">
                            <HStack spacing={2}>
                              <Box color="blue.400" fontSize="lg" fontWeight="700">
                                ⚡
                              </Box>
                              <Text color="white" fontWeight="600" fontSize="sm">
                                Improvements
                              </Text>
                            </HStack>
                            {release.improvements.map((improvement, improvementIndex) => (
                              <Text key={improvementIndex} color="surface.300" fontSize="sm" pl={6} lineHeight="1.7">
                                • {improvement}
                              </Text>
                            ))}
                          </VStack>
                        )}

                        {release.fixes.length > 0 && (
                          <VStack spacing={2} align="start" w="full">
                            <HStack spacing={2}>
                              <Box color="orange.400" fontSize="lg" fontWeight="700">
                                🐛
                              </Box>
                              <Text color="white" fontWeight="600" fontSize="sm">
                                Bug Fixes
                              </Text>
                            </HStack>
                            {release.fixes.map((fix, fixIndex) => (
                              <Text key={fixIndex} color="surface.300" fontSize="sm" pl={6} lineHeight="1.7">
                                • {fix}
                              </Text>
                            ))}
                          </VStack>
                        )}
                      </VStack>
                    </GlassCard>
                  </Box>
                </HStack>
              </ScrollReveal>
            ))}
          </VStack>

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
                  Stay Updated
                </Heading>
                <Text color="surface.300" fontSize="lg" maxW="2xl">
                  Follow our development and get notified about new releases and features.
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
                      onClick={() => router.push('/features')}
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
                      View Features
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
