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
  Badge,
  Flex,
  Button,
  SimpleGrid,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollReveal, GlassCard } from '@/components/animations';

const MotionBox = motion(Box);
const MotionVStack = motion(VStack);

const PlugIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v6M8 8h8M6 12h12M4 20h16v-4H4v4z"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const ZapIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const BarChartIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="20" x2="12" y2="10"/>
    <line x1="18" y1="20" x2="18" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="16"/>
  </svg>
);

const ArrowDownIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <polyline points="19 12 12 19 5 12"/>
  </svg>
);

const steps = [
  {
    number: 1,
    title: 'Connect Databases',
    description: 'Add your source and target Supabase database connections. Credentials are encrypted with AES-256-GCM before storage.',
    icon: PlugIcon,
    color: 'teal',
    details: 'We securely store your connection strings using industry-standard encryption. Your credentials never leave our servers unencrypted.',
  },
  {
    number: 2,
    title: 'Schema Analysis',
    description: 'suparbase analyzes both databases to understand table structures, columns, types, and relationships.',
    icon: SearchIcon,
    color: 'blue',
    details: 'We compare schemas to identify differences: new tables, modified columns, missing indexes, and foreign key changes.',
  },
  {
    number: 3,
    title: 'Validation',
    description: 'Schema compatibility is validated to ensure safe synchronization. Conflicts are detected and reported.',
    icon: CheckCircleIcon,
    color: 'green',
    details: 'We check for incompatible changes, data type mismatches, and potential data loss scenarios before proceeding.',
  },
  {
    number: 4,
    title: 'Sync Execution',
    description: 'Changes are applied to the target database. You can preview with dry-run or execute immediately.',
    icon: ZapIcon,
    color: 'purple',
    details: 'Schema changes are applied in the correct order, respecting dependencies. Data can be synced selectively by table.',
  },
  {
    number: 5,
    title: 'Monitoring',
    description: 'Real-time progress tracking shows sync status, completion percentage, and any errors encountered.',
    icon: BarChartIcon,
    color: 'orange',
    details: 'Monitor sync progress in real-time. Get notifications on completion or failure. View detailed logs for troubleshooting.',
  },
];

export default function HowItWorksPageClient() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <Box 
      minH="100vh" 
      bg="rgba(9, 9, 11, 1)" 
      position="relative" 
      overflow="hidden"
    >
      {/* Animated Background */}
      <MotionBox
        position="absolute"
        top="10%"
        right="-10%"
        w="600px"
        h="600px"
        bgGradient="radial(circle, rgba(62, 207, 142, 0.1) 0%, transparent 70%)"
        borderRadius="full"
        filter="blur(80px)"
        pointerEvents="none"
        zIndex={0}
        animate={{
          scale: [1, 1.3, 1],
          x: [0, 100, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <Container maxW="7xl" py={{ base: 12, md: 20 }} px={{ base: 4, md: 6 }} position="relative" zIndex={1}>
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
                bgGradient="linear(to-r, teal.500/20, teal.400/20)"
                borderWidth="1px"
                borderColor="teal.400/30"
                backdropFilter="blur(10px)"
              >
                TECHNICAL OVERVIEW
              </Badge>
              <Heading
                fontSize={{ base: '4xl', md: '6xl', lg: '7xl' }}
                fontWeight="800"
                color="white"
                fontFamily="mono"
                letterSpacing="-0.03em"
                lineHeight="1.1"
              >
                How <Text
                  as="span"
                  bgGradient="linear(to-r, teal.400, purple.400)"
                  bgClip="text"
                  sx={{
                    WebkitTextFillColor: 'transparent',
                    WebkitBackgroundClip: 'text',
                  }}
                >
                  It Works
                </Text>
              </Heading>
              <Text
                color="surface.400"
                fontSize={{ base: 'lg', md: 'xl' }}
                maxW="3xl"
                lineHeight="1.7"
              >
                A visual, step-by-step explanation of how suparbase synchronizes your databases,
                keeps them alive, and ensures your data stays in sync across environments.
              </Text>
            </VStack>
          </ScrollReveal>

          {/* Interactive Flow Diagram */}
          <VStack spacing={8} align="stretch">
            <ScrollReveal direction="fade" delay={0.3}>
              <Heading size="lg" color="white" textAlign="center">
                The Sync Process
              </Heading>
            </ScrollReveal>

            {/* Steps with Animated Connections */}
            <Box position="relative" w="full">
              <VStack spacing={6} align="stretch">
                {steps.map((step, index) => {
                  const IconComponent = step.icon;
                  const isActive = activeStep === step.number;
                  const isLast = index === steps.length - 1;

                  return (
                    <Box key={step.number} position="relative">
                      <ScrollReveal
                        direction="left"
                        delay={0.4 + index * 0.1}
                      >
                        <motion.div
                          onHoverStart={() => setActiveStep(step.number)}
                          onHoverEnd={() => setActiveStep(null)}
                          whileHover={{ scale: 1.02 }}
                        >
                          <GlassCard
                            p={6}
                            cursor="pointer"
                            bgGradient={isActive 
                              ? `linear(to-br, ${step.color}.500/20, ${step.color}.400/10)` 
                              : "linear(to-br, rgba(255,255,255,0.05), rgba(255,255,255,0.02))"
                            }
                            borderColor={isActive 
                              ? `${step.color}.400/50` 
                              : 'rgba(255,255,255,0.1)'
                            }
                            borderWidth={isActive ? '2px' : '1px'}
                            transition="all 0.3s"
                          >
                            <Flex
                              direction={{ base: 'column', md: 'row' }}
                              gap={6}
                              align={{ base: 'start', md: 'center' }}
                            >
                              {/* Step Number & Icon */}
                              <Flex
                                align="center"
                                gap={4}
                                flexShrink={0}
                              >
                                <Box
                                  position="relative"
                                  w="64px"
                                  h="64px"
                                  borderRadius="full"
                                  bgGradient={`linear(to-br, ${step.color}.400, ${step.color}.600)`}
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  boxShadow={isActive ? `0 0 30px ${step.color}.400/50` : 'none'}
                                  transition="all 0.3s"
                                >
                                  <IconComponent />
                                  <Box
                                    position="absolute"
                                    top="-8px"
                                    right="-8px"
                                    w="28px"
                                    h="28px"
                                    borderRadius="full"
                                    bg={`${step.color}.500`}
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    fontSize="xs"
                                    fontWeight="700"
                                    color="white"
                                    border="3px solid"
                                    borderColor="rgba(9, 9, 11, 1)"
                                  >
                                    {step.number}
                                  </Box>
                                </Box>
                              </Flex>

                              {/* Content */}
                              <VStack
                                spacing={2}
                                align="start"
                                flex={1}
                              >
                                <HStack spacing={3}>
                                  <Heading size="md" color="white" fontWeight="700">
                                    {step.title}
                                  </Heading>
                                  <Badge
                                    colorScheme={step.color}
                                    fontSize="xs"
                                    px={2}
                                    py={0.5}
                                    borderRadius="full"
                                    bgGradient={`linear(to-r, ${step.color}.500/30, ${step.color}.400/30)`}
                                    borderWidth="1px"
                                    borderColor={`${step.color}.400/40`}
                                  >
                                    Step {step.number}
                                  </Badge>
                                </HStack>
                                <Text color="surface.300" fontSize="sm" lineHeight="1.7">
                                  {step.description}
                                </Text>
                                <AnimatePresence>
                                  {isActive && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.3 }}
                                    >
                                      <Box
                                        mt={2}
                                        p={3}
                                        bg="rgba(255,255,255,0.05)"
                                        borderRadius="lg"
                                        borderWidth="1px"
                                        borderColor={`${step.color}.400/20`}
                                      >
                                        <Text color="surface.300" fontSize="xs" lineHeight="1.6">
                                          {step.details}
                                        </Text>
                                      </Box>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </VStack>
                            </Flex>
                          </GlassCard>
                        </motion.div>
                      </ScrollReveal>

                      {/* Animated Connection Line */}
                      {!isLast && (
                        <Flex
                          justify="center"
                          py={2}
                          position="relative"
                        >
                          <motion.div
                            animate={{
                              y: [0, 10, 0],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: 'easeInOut',
                              delay: index * 0.2,
                            }}
                          >
                            <Box
                              color="teal.400"
                              opacity={0.5}
                            >
                              <ArrowDownIcon />
                            </Box>
                          </motion.div>
                          {/* Animated Line */}
                          <Box
                            position="absolute"
                            left="50%"
                            top="50%"
                            w="2px"
                            h="40px"
                            bgGradient="linear(to-b, teal.400/60, transparent)"
                            transform="translateX(-50%)"
                            opacity={0.3}
                          />
                        </Flex>
                      )}
                    </Box>
                  );
                })}
              </VStack>
            </Box>
          </VStack>

          {/* Progress Indicator */}
          <ScrollReveal direction="up" delay={0.8}>
            <GlassCard p={6}>
              <VStack spacing={4}>
                <Heading size="md" color="white" textAlign="center">
                  Complete Process Overview
                </Heading>
                <Flex
                  w="full"
                  justify="space-between"
                  align="center"
                  gap={2}
                  flexWrap="wrap"
                >
                  {steps.map((step, index) => (
                    <VStack
                      key={step.number}
                      spacing={2}
                      flex={1}
                      minW="100px"
                    >
                      <Box
                        w="40px"
                        h="40px"
                        borderRadius="full"
                        bgGradient={`linear(to-br, ${step.color}.400, ${step.color}.600)`}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        color="white"
                        fontWeight="700"
                        fontSize="sm"
                      >
                        {step.number}
                      </Box>
                      <Text
                        color="surface.300"
                        fontSize="xs"
                        textAlign="center"
                        fontWeight="600"
                      >
                        {step.title.split(' ')[0]}
                      </Text>
                    </VStack>
                  ))}
                </Flex>
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
                  Ready to Try It?
                </Heading>
                <Text color="surface.300" maxW="2xl" fontSize="lg">
                  Start synchronizing your databases today. No credit card required.
                </Text>
                <HStack spacing={4} justify="center" flexWrap="wrap">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="lg"
                      colorScheme="teal"
                      onClick={() => router.push('/signup')}
                      px={8}
                      bgGradient="linear(to-r, teal.400, teal.500)"
                    >
                      Get Started Free
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="lg"
                      variant="outline"
                      borderColor="teal.400/40"
                      color="teal.400"
                      onClick={() => router.push('/getting-started')}
                      backdropFilter="blur(10px)"
                      bg="rgba(255, 255, 255, 0.05)"
                      _hover={{
                        borderColor: 'teal.400',
                        bg: 'teal.400/10',
                      }}
                    >
                      View Guide
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
