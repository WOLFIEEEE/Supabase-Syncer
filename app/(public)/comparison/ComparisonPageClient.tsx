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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  SimpleGrid,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { ScrollReveal, GlassCard } from '@/components/animations';

const MotionBox = motion(Box);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const features = [
  {
    feature: 'Supabase-Specific',
    suparbase: true,
    alternative1: false,
    alternative2: false,
  },
  {
    feature: 'Schema Validation',
    suparbase: true,
    alternative1: true,
    alternative2: false,
  },
  {
    feature: 'Automatic Migration Generation',
    suparbase: true,
    alternative1: false,
    alternative2: false,
  },
  {
    feature: 'Keep-Alive Service',
    suparbase: true,
    alternative1: false,
    alternative2: true,
  },
  {
    feature: 'AES-256 Encryption',
    suparbase: true,
    alternative1: true,
    alternative2: true,
  },
  {
    feature: 'Real-time Progress Updates',
    suparbase: true,
    alternative1: false,
    alternative2: false,
  },
  {
    feature: 'One-Click Sync',
    suparbase: true,
    alternative1: true,
    alternative2: true,
  },
  {
    feature: 'Conflict Resolution',
    suparbase: true,
    alternative1: true,
    alternative2: false,
  },
  {
    feature: 'Dry-Run Mode',
    suparbase: true,
    alternative1: false,
    alternative2: false,
  },
  {
    feature: 'Open Source',
    suparbase: true,
    alternative1: false,
    alternative2: false,
  },
];

const prosCons = [
  {
    title: 'suparbase',
    pros: [
      'Built specifically for Supabase databases',
      'Automatic schema validation and migration generation',
      'Integrated keep-alive service',
      'Real-time progress tracking',
      'Open source and transparent',
    ],
    cons: [
      'Focused on Supabase ecosystem',
      'Newer platform with growing community',
    ],
  },
  {
    title: 'Generic Database Tools',
    pros: [
      'Works with multiple database types',
      'Established user base',
      'More third-party integrations',
    ],
    cons: [
      'Not optimized for Supabase',
      'May require more configuration',
      'Limited Supabase-specific features',
    ],
  },
];

export default function ComparisonPageClient() {
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
                COMPARISON
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
                  How We Compare
                </Text>
              </Heading>
              <Text
                color="surface.400"
                fontSize={{ base: 'lg', md: 'xl' }}
                maxW="3xl"
                lineHeight="1.7"
              >
                See how suparbase stacks up against other database synchronization and management tools.
              </Text>
            </VStack>
          </ScrollReveal>

          {/* Feature Comparison Table */}
          <ScrollReveal direction="up" delay={0.3}>
            <GlassCard p={0} overflow="hidden">
              <Box overflowX="auto">
                <Table variant="simple" colorScheme="teal">
                  <Thead>
                    <Tr bg="surface.800">
                      <Th color="white" fontWeight="700" fontSize="sm" py={4} px={6} borderBottom="1px solid" borderColor="surface.700">
                        Feature
                      </Th>
                      <Th color="teal.400" fontWeight="700" fontSize="sm" py={4} px={6} borderBottom="1px solid" borderColor="surface.700" textAlign="center">
                        suparbase
                      </Th>
                      <Th color="surface.400" fontWeight="700" fontSize="sm" py={4} px={6} borderBottom="1px solid" borderColor="surface.700" textAlign="center">
                        Generic Tools
                      </Th>
                      <Th color="surface.400" fontWeight="700" fontSize="sm" py={4} px={6} borderBottom="1px solid" borderColor="surface.700" textAlign="center">
                        Basic Tools
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {features.map((item, index) => (
                      <Tr
                        key={index}
                        borderBottom="1px solid"
                        borderColor="surface.700"
                        _hover={{ bg: 'surface.800/50' }}
                      >
                        <Td color="white" fontWeight="600" px={6} py={4}>
                          {item.feature}
                        </Td>
                        <Td textAlign="center" px={6} py={4}>
                          {item.suparbase ? (
                            <Box color="teal.400" display="inline-flex">
                              <CheckIcon />
                            </Box>
                          ) : (
                            <Box color="surface.600" display="inline-flex">
                              <XIcon />
                            </Box>
                          )}
                        </Td>
                        <Td textAlign="center" px={6} py={4}>
                          {item.alternative1 ? (
                            <Box color="teal.400" display="inline-flex">
                              <CheckIcon />
                            </Box>
                          ) : (
                            <Box color="surface.600" display="inline-flex">
                              <XIcon />
                            </Box>
                          )}
                        </Td>
                        <Td textAlign="center" px={6} py={4}>
                          {item.alternative2 ? (
                            <Box color="teal.400" display="inline-flex">
                              <CheckIcon />
                            </Box>
                          ) : (
                            <Box color="surface.600" display="inline-flex">
                              <XIcon />
                            </Box>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </GlassCard>
          </ScrollReveal>

          {/* Pros and Cons */}
          <ScrollReveal direction="up" delay={0.4}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              {prosCons.map((item, index) => (
                <ScrollReveal key={index} delay={0.5 + index * 0.1} direction="up">
                  <GlassCard p={6} h="100%">
                    <VStack spacing={6} align="stretch" h="100%">
                      <Heading size="md" color="white" fontWeight="700">
                        {item.title === 'suparbase' ? (
                          <Text
                            as="span"
                            bgGradient="linear(to-r, teal.400, purple.400)"
                            bgClip="text"
                            sx={{
                              WebkitTextFillColor: 'transparent',
                              WebkitBackgroundClip: 'text',
                            }}
                          >
                            {item.title}
                          </Text>
                        ) : (
                          item.title
                        )}
                      </Heading>

                      <VStack spacing={4} align="stretch" flex={1}>
                        <VStack spacing={3} align="stretch">
                          <HStack spacing={2}>
                            <Box color="green.400" fontSize="lg" fontWeight="700">
                              ✓
                            </Box>
                            <Text color="white" fontWeight="600" fontSize="sm">
                              Pros
                            </Text>
                          </HStack>
                          {item.pros.map((pro, proIndex) => (
                            <Text key={proIndex} color="surface.300" fontSize="sm" pl={6} lineHeight="1.7">
                              • {pro}
                            </Text>
                          ))}
                        </VStack>

                        <VStack spacing={3} align="stretch">
                          <HStack spacing={2}>
                            <Box color="red.400" fontSize="lg" fontWeight="700">
                              ✗
                            </Box>
                            <Text color="white" fontWeight="600" fontSize="sm">
                              Cons
                            </Text>
                          </HStack>
                          {item.cons.map((con, conIndex) => (
                            <Text key={conIndex} color="surface.300" fontSize="sm" pl={6} lineHeight="1.7">
                              • {con}
                            </Text>
                          ))}
                        </VStack>
                      </VStack>
                    </VStack>
                  </GlassCard>
                </ScrollReveal>
              ))}
            </SimpleGrid>
          </ScrollReveal>

          {/* Why Choose suparbase */}
          <ScrollReveal direction="up" delay={0.6}>
            <GlassCard
              p={{ base: 6, md: 8 }}
              bgGradient="linear(to-br, teal.500/10, purple.500/10)"
              borderColor="teal.500/30"
              borderWidth="2px"
            >
              <VStack spacing={6} align="stretch">
                <Heading size="lg" color="white" fontWeight="700">
                  Why Choose suparbase?
                </Heading>
                <VStack spacing={4} align="stretch">
                  {[
                    {
                      title: 'Built for Supabase',
                      description: 'We understand Supabase databases inside and out. Every feature is optimized specifically for Supabase workflows.',
                    },
                    {
                      title: 'Safety First',
                      description: 'Schema validation, dry-run mode, and automatic rollback ensure your data stays safe during sync operations.',
                    },
                    {
                      title: 'Developer Experience',
                      description: 'Real-time progress updates, clear error messages, and intuitive UI make database management effortless.',
                    },
                    {
                      title: 'Open Source',
                      description: 'Transparent, auditable, and community-driven. You can see exactly how your data is handled.',
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
          <ScrollReveal direction="up" delay={0.7}>
            <GlassCard
              p={{ base: 8, md: 12 }}
              textAlign="center"
              bgGradient="linear(to-br, teal.500/10, purple.500/10)"
              borderColor="teal.500/30"
              borderWidth="2px"
            >
              <VStack spacing={6}>
                <Heading size="lg" color="white" fontWeight="700">
                  Ready to Try suparbase?
                </Heading>
                <Text color="surface.300" fontSize="lg" maxW="2xl">
                  Experience the difference of a tool built specifically for Supabase databases.
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
                      Get Started Free
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
