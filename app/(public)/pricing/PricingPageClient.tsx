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
  Button,
  Badge,
  SimpleGrid,
  List,
  ListItem,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Flex,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FlipCard, ScrollReveal, GlassCard } from '@/components/animations';

const MotionBox = motion(Box);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const ZapIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const ChartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 3v18h18"/>
    <path d="M18 17V9"/>
    <path d="M13 17V5"/>
    <path d="M8 17v-3"/>
  </svg>
);

const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

interface PricingTier {
  id: string;
  name: string;
  price: number;
  priceYearly?: number;
  description: string;
  badge?: string;
  badgeColor?: string;
  features: string[];
  limits: {
    connections: string;
    syncsPerMonth: string;
    dataTransfer: string;
    teamMembers: string;
  };
  isPopular?: boolean;
  isBeta?: boolean;
  comingSoon?: boolean;
  ctaText?: string;
}

const pricingTiers: PricingTier[] = [
  {
    id: 'beta',
    name: 'Beta Access',
    price: 0,
    description: 'Full access during beta testing period',
    badge: 'CURRENT',
    badgeColor: 'teal',
    isBeta: true,
    ctaText: 'Get Started Free',
    features: [
      '25 database connections',
      '100 sync jobs per month',
      '10 GB data transfer',
      'Schema synchronization',
      'One-way & two-way sync',
      'Real-time monitoring',
      'Keep-alive service',
      'Migration generation',
      'Encrypted storage',
      'Email support',
    ],
    limits: {
      connections: '25',
      syncsPerMonth: '100',
      dataTransfer: '10 GB',
      teamMembers: '1',
    },
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 12,
    priceYearly: 120,
    description: 'For individual developers',
    comingSoon: true,
    features: [
      '10 database connections',
      '50 sync jobs per month',
      '5 GB data transfer',
      'Schema synchronization',
      'One-way & two-way sync',
      'Basic monitoring',
      'Keep-alive service',
      'Email support',
    ],
    limits: {
      connections: '10',
      syncsPerMonth: '50',
      dataTransfer: '5 GB',
      teamMembers: '1',
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 39,
    priceYearly: 390,
    description: 'For growing projects',
    badge: 'POPULAR',
    badgeColor: 'purple',
    isPopular: true,
    comingSoon: true,
    features: [
      '50 database connections',
      '500 sync jobs per month',
      '50 GB data transfer',
      'All sync features',
      'Advanced scheduling',
      'API access',
      'Webhooks',
      'Priority support',
      'Advanced analytics',
    ],
    limits: {
      connections: '50',
      syncsPerMonth: '500',
      dataTransfer: '50 GB',
      teamMembers: '3',
    },
  },
  {
    id: 'team',
    name: 'Team',
    price: 99,
    priceYearly: 990,
    description: 'For teams and agencies',
    comingSoon: true,
    features: [
      '200 database connections',
      '2,000 sync jobs per month',
      '200 GB data transfer',
      'Team collaboration',
      'Role-based access',
      'Shared workspaces',
      'Activity audit logs',
      'Dedicated support',
      'SSO ready',
    ],
    limits: {
      connections: '200',
      syncsPerMonth: '2,000',
      dataTransfer: '200 GB',
      teamMembers: '10',
    },
  },
];

const valueProps = [
  {
    icon: ShieldIcon,
    title: 'Enterprise Security',
    description: 'AES-256 encryption, CSRF protection, rate limiting, and comprehensive audit logs.',
  },
  {
    icon: ZapIcon,
    title: 'Production Ready',
    description: 'Automatic rollback, transaction isolation, and idempotency guarantees built-in.',
  },
  {
    icon: ChartIcon,
    title: 'Real-Time Insights',
    description: 'Live dashboards, detailed metrics, and comprehensive sync monitoring.',
  },
];

const faqItems = [
  {
    question: 'What happens when beta ends?',
    answer: 'Beta users will receive 30+ days notice before any pricing changes. Early adopters get special benefits including discounted rates and grandfathered pricing options.',
  },
  {
    question: 'Can I change my plan later?',
    answer: 'Yes! Upgrade or downgrade anytime. Changes take effect immediately with prorated billing for upgrades.',
  },
  {
    question: 'What counts as a sync job?',
    answer: 'Each time you initiate a sync operation between databases counts as one sync job, regardless of the number of tables or rows synced.',
  },
  {
    question: 'How is data transfer calculated?',
    answer: 'Data transfer is the total amount of data moved between your databases during sync operations. This includes both reads from source and writes to target.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Yes, we offer a 30-day money-back guarantee for all paid plans. No questions asked.',
  },
  {
    question: 'Is suparbase safe for production?',
    answer: 'Absolutely! suparbase includes automatic rollback, transaction isolation, dry-run previews, and comprehensive safety features designed for production use.',
  },
];

export default function PricingPageClient() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <Box position="relative" bg="rgba(9, 9, 11, 1)" overflow="hidden" minH="100vh">
      {/* Animated Gradient Mesh Background */}
      <MotionBox
        position="absolute"
        top="10%"
        right="-10%"
        w="800px"
        h="800px"
        bgGradient="radial(circle, rgba(62, 207, 142, 0.15) 0%, transparent 70%)"
        borderRadius="full"
        filter="blur(100px)"
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
      
      <MotionBox
        position="absolute"
        bottom="10%"
        left="-10%"
        w="700px"
        h="700px"
        bgGradient="radial(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)"
        borderRadius="full"
        filter="blur(100px)"
        pointerEvents="none"
        zIndex={0}
        animate={{
          scale: [1, 1.4, 1],
          x: [0, -100, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 3,
        }}
      />

      <Container maxW="6xl" py={{ base: 12, md: 20 }} px={{ base: 4, sm: 6, md: 8 }} position="relative" zIndex={1}>
        <VStack spacing={{ base: 12, md: 16 }} align="stretch">
          {/* Hero Header */}
          <ScrollReveal direction="fade" delay={0.2}>
            <VStack spacing={6} align="center" textAlign="center">
              <HStack
                px={4}
                py={1.5}
                bg="rgba(255,255,255,0.05)"
                borderRadius="full"
                border="1px solid"
                borderColor="rgba(255,255,255,0.1)"
                spacing={2}
                backdropFilter="blur(10px)"
              >
                <Box w={1.5} h={1.5} borderRadius="full" bg="teal.400" />
                <Text fontSize="xs" fontWeight="600" color="surface.300" letterSpacing="0.05em">
                  SIMPLE PRICING
                </Text>
              </HStack>

              <Heading
                as="h1"
                fontSize={{ base: '3xl', md: '5xl', lg: '6xl' }}
                fontWeight="700"
                lineHeight="1.1"
                letterSpacing="-0.02em"
                color="white"
              >
                One plan,{' '}
                <Box
                  as="span"
                  bgGradient="linear(to-r, teal.400, purple.400)"
                  bgClip="text"
                  sx={{
                    WebkitTextFillColor: 'transparent',
                    WebkitBackgroundClip: 'text',
                  }}
                >
                  full access
                </Box>
              </Heading>

              <Text
                fontSize={{ base: 'md', md: 'xl' }}
                color="surface.400"
                maxW="2xl"
                lineHeight="1.6"
              >
                suparbase is in beta - enjoy full access to all features while we perfect the product.
                <br />
                <Text as="span" color="teal.400" fontWeight="500">No credit card required.</Text>
              </Text>
            </VStack>
          </ScrollReveal>

          {/* Beta Banner */}
          <ScrollReveal direction="up" delay={0.3}>
            <GlassCard
              p={{ base: 6, md: 8 }}
              bgGradient="linear(to-br, teal.500/10, teal.400/5)"
              borderColor="teal.500/30"
              borderWidth="2px"
            >
              <HStack spacing={{ base: 4, md: 6 }} align="start" flexWrap="wrap">
                <Box
                  p={3}
                  borderRadius="xl"
                  bg="teal.500/10"
                  border="1px solid"
                  borderColor="teal.500/20"
                >
                  <Box color="teal.400">
                    <StarIcon />
                  </Box>
                </Box>
                <VStack align="start" spacing={2} flex={1} minW="200px">
                  <HStack spacing={3}>
                    <Heading size="md" color="white">Beta Access</Heading>
                    <Badge colorScheme="teal" fontSize="xs" px={2} py={0.5} borderRadius="full">
                      FREE
                    </Badge>
                  </HStack>
                  <Text color="surface.300" fontSize="sm" lineHeight="1.6">
                    Get full access to all features during our beta period. Help shape the future of database synchronization
                    and lock in early adopter benefits when we launch paid plans.
                  </Text>
                </VStack>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    colorScheme="teal"
                    size="lg"
                    onClick={() => router.push('/signup')}
                    px={8}
                    flexShrink={0}
                    bgGradient="linear(to-r, teal.400, teal.500)"
                  >
                    Start Free
                  </Button>
                </motion.div>
              </HStack>
            </GlassCard>
          </ScrollReveal>

          {/* Value Propositions */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            {valueProps.map((prop, index) => {
              const IconComponent = prop.icon;
              return (
                <ScrollReveal key={index} delay={index * 0.1} direction="up">
                  <GlassCard p={6} h="100%">
                    <VStack spacing={4} align="start">
                      <Box color="teal.400">
                        <IconComponent />
                      </Box>
                      <Heading size="sm" color="white" fontWeight="600">
                        {prop.title}
                      </Heading>
                      <Text color="surface.300" fontSize="sm" lineHeight="1.6">
                        {prop.description}
                      </Text>
                    </VStack>
                  </GlassCard>
                </ScrollReveal>
              );
            })}
          </SimpleGrid>

          {/* Billing Toggle */}
          <Flex justify="center">
            <GlassCard p={1} borderColor="rgba(255,255,255,0.08)">
              <HStack spacing={0}>
                <Button
                  size="sm"
                  variant={billingCycle === 'monthly' ? 'solid' : 'ghost'}
                  colorScheme={billingCycle === 'monthly' ? 'teal' : 'gray'}
                  onClick={() => setBillingCycle('monthly')}
                  borderRadius="lg"
                  px={6}
                >
                  Monthly
                </Button>
                <Button
                  size="sm"
                  variant={billingCycle === 'yearly' ? 'solid' : 'ghost'}
                  colorScheme={billingCycle === 'yearly' ? 'teal' : 'gray'}
                  onClick={() => setBillingCycle('yearly')}
                  borderRadius="lg"
                  px={6}
                >
                  Yearly
                  <Badge ml={2} colorScheme="green" fontSize="2xs" px={2} borderRadius="full">
                    -17%
                  </Badge>
                </Button>
              </HStack>
            </GlassCard>
          </Flex>

          {/* Pricing Cards with 3D Flip */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            {pricingTiers.map((tier, index) => {
              const displayPrice = billingCycle === 'yearly' && tier.priceYearly
                ? Math.round(tier.priceYearly / 12)
                : tier.price;

              const frontContent = (
                <GlassCard
                  p={6}
                  h="100%"
                  position="relative"
                  bgGradient={tier.isBeta 
                    ? "linear(to-br, teal.500/10, teal.400/5)" 
                    : tier.isPopular
                    ? "linear(to-br, purple.500/10, purple.400/5)"
                    : "linear(to-br, rgba(255,255,255,0.05), rgba(255,255,255,0.02))"
                  }
                  borderColor={tier.isPopular ? 'purple.500/50' : tier.isBeta ? 'teal.500/30' : 'rgba(255,255,255,0.1)'}
                  borderWidth={tier.isPopular || tier.isBeta ? '2px' : '1px'}
                >
                  {tier.isPopular && (
                    <Badge
                      position="absolute"
                      top={4}
                      right={4}
                      colorScheme="purple"
                      fontSize="2xs"
                      px={2}
                      py={0.5}
                      borderRadius="full"
                      bgGradient="linear(to-r, purple.500/30, purple.400/30)"
                      borderWidth="1px"
                      borderColor="purple.400/40"
                    >
                      MOST POPULAR
                    </Badge>
                  )}
                  {tier.badge && !tier.isPopular && (
                    <Badge
                      position="absolute"
                      top={4}
                      right={4}
                      colorScheme={tier.badgeColor}
                      fontSize="2xs"
                      px={2}
                      py={0.5}
                      borderRadius="full"
                    >
                      {tier.badge}
                    </Badge>
                  )}
                  <VStack spacing={5} align="stretch" h="full">
                    <VStack spacing={3} align="start">
                      <Heading size="md" color="white" fontWeight="600">
                        {tier.name}
                      </Heading>
                      <HStack spacing={1} align="baseline">
                        {tier.price === 0 ? (
                          <Heading size="2xl" color="teal.400" fontWeight="700">
                            Free
                          </Heading>
                        ) : (
                          <>
                            <Heading size="2xl" color="white" fontWeight="700">
                              ${displayPrice}
                            </Heading>
                            <Text color="surface.500" fontSize="sm">/mo</Text>
                          </>
                        )}
                      </HStack>
                      <Text color="surface.300" fontSize="sm">
                        {tier.description}
                      </Text>
                    </VStack>

                    <HStack
                      spacing={4}
                      py={3}
                      px={3}
                      bg="rgba(255,255,255,0.05)"
                      borderRadius="lg"
                      flexWrap="wrap"
                    >
                      <VStack spacing={0} align="start" flex={1} minW="80px">
                        <Text color="teal.400" fontWeight="700" fontSize="sm">
                          {tier.limits.connections}
                        </Text>
                        <Text color="surface.500" fontSize="2xs">connections</Text>
                      </VStack>
                      <VStack spacing={0} align="start" flex={1} minW="80px">
                        <Text color="teal.400" fontWeight="700" fontSize="sm">
                          {tier.limits.syncsPerMonth}
                        </Text>
                        <Text color="surface.500" fontSize="2xs">syncs/mo</Text>
                      </VStack>
                    </HStack>

                    <List spacing={2} flex={1}>
                      {tier.features.slice(0, 5).map((feature, idx) => (
                        <ListItem key={idx}>
                          <HStack align="start" spacing={2}>
                            <Box color="teal.400" mt={0.5} flexShrink={0}>
                              <CheckIcon />
                            </Box>
                            <Text color="surface.300" fontSize="sm">{feature}</Text>
                          </HStack>
                        </ListItem>
                      ))}
                    </List>

                    {tier.comingSoon ? (
                      <Button
                        size="lg"
                        variant="outline"
                        borderColor="rgba(255,255,255,0.1)"
                        color="surface.400"
                        width="full"
                        isDisabled
                        _hover={{ cursor: 'not-allowed' }}
                      >
                        Coming Soon
                      </Button>
                    ) : (
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          size="lg"
                          colorScheme={tier.isBeta ? 'teal' : 'gray'}
                          variant={tier.isBeta ? 'solid' : 'outline'}
                          width="full"
                          onClick={() => router.push('/signup')}
                          {...(tier.isBeta ? { bgGradient: "linear(to-r, teal.400, teal.500)" } : {})}
                        >
                          {tier.ctaText || 'Get Started'}
                        </Button>
                      </motion.div>
                    )}
                  </VStack>
                </GlassCard>
              );

              const backContent = (
                <GlassCard
                  p={6}
                  h="100%"
                  bgGradient="linear(to-br, rgba(139, 92, 246, 0.1), rgba(62, 207, 142, 0.05))"
                  borderColor="purple.500/30"
                  borderWidth="2px"
                >
                  <VStack spacing={4} align="stretch" h="full" justify="center">
                    <VStack spacing={2}>
                      <Text color="white" fontWeight="700" fontSize="lg">
                        All Features Included
                      </Text>
                      <List spacing={2} w="full">
                        {tier.features.slice(5).map((feature, idx) => (
                          <ListItem key={idx}>
                            <HStack align="start" spacing={2}>
                              <Box color="purple.400" mt={0.5} flexShrink={0}>
                                <CheckIcon />
                              </Box>
                              <Text color="surface.300" fontSize="sm">{feature}</Text>
                            </HStack>
                          </ListItem>
                        ))}
                      </List>
                    </VStack>
                  </VStack>
                </GlassCard>
              );

              return (
                <ScrollReveal key={tier.id} delay={index * 0.1} direction="up">
                  <FlipCard
                    front={frontContent}
                    back={backContent}
                    flipOnHover={true}
                    h="100%"
                    minH="500px"
                  />
                </ScrollReveal>
              );
            })}
          </SimpleGrid>

          {/* FAQ Section */}
          <ScrollReveal direction="up" delay={0.4}>
            <VStack spacing={8} align="stretch">
              <Heading size="lg" color="white" textAlign="center">
                Frequently Asked Questions
              </Heading>
              <GlassCard p={0} borderColor="rgba(255,255,255,0.1)">
                <Accordion allowToggle>
                  {faqItems.map((item, index) => (
                    <AccordionItem
                      key={index}
                      borderColor="rgba(255,255,255,0.06)"
                      borderTopWidth={index === 0 ? '1px' : '0'}
                    >
                      <AccordionButton
                        py={5}
                        _hover={{ bg: 'rgba(255,255,255,0.02)' }}
                      >
                        <Box flex="1" textAlign="left" color="white" fontWeight="500">
                          {item.question}
                        </Box>
                        <AccordionIcon color="teal.400" />
                      </AccordionButton>
                      <AccordionPanel pb={5} color="surface.300" lineHeight="1.7">
                        {item.answer}
                      </AccordionPanel>
                    </AccordionItem>
                  ))}
                </Accordion>
              </GlassCard>
            </VStack>
          </ScrollReveal>

          {/* Final CTA */}
          <ScrollReveal direction="up" delay={0.5}>
            <GlassCard
              p={{ base: 8, md: 12 }}
              textAlign="center"
              bgGradient="linear(to-br, teal.500/10, purple.500/10)"
              borderColor="teal.500/30"
              borderWidth="2px"
            >
              <VStack spacing={6}>
                <Heading size="lg" color="white">
                  Ready to sync your databases?
                </Heading>
                <Text color="surface.300" maxW="xl" fontSize="lg">
                  Join the beta and experience production-grade database synchronization.
                  No credit card required.
                </Text>
                <HStack spacing={4} flexWrap="wrap" justify="center">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="lg"
                      colorScheme="teal"
                      onClick={() => router.push('/signup')}
                      px={8}
                      bgGradient="linear(to-r, teal.400, teal.500)"
                    >
                      Start Free Beta
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="lg"
                      variant="outline"
                      borderColor="rgba(255,255,255,0.2)"
                      color="white"
                      onClick={() => router.push('/guide')}
                      backdropFilter="blur(10px)"
                      bg="rgba(255, 255, 255, 0.05)"
                      _hover={{ borderColor: 'teal.500', bg: 'rgba(62, 207, 142, 0.1)' }}
                    >
                      Read Documentation
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
