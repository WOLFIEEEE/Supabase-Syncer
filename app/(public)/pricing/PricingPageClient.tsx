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
  Card,
  CardBody,
  Badge,
  Divider,
  SimpleGrid,
  List,
  ListItem,
  ListIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Icon,
  Flex,
  useColorModeValue,
} from '@chakra-ui/react';

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const ZapIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

interface PricingTier {
  id: string;
  name: string;
  displayName: string;
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
    support: string;
  };
  isPopular?: boolean;
  isBeta?: boolean;
  comingSoon?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    id: 'beta',
    name: 'beta',
    displayName: 'Beta Plan',
    price: 0,
    description: 'Full access during beta testing',
    badge: 'FREE',
    badgeColor: 'green',
    isBeta: true,
    features: [
      'Unlimited database connections',
      'Unlimited sync jobs',
      'Unlimited data transfer',
      'Schema synchronization',
      'Data sync (one-way & two-way)',
      'Automatic rollback protection',
      'Real-time sync monitoring',
      'Keep-alive service',
      'Migration script generation',
      'Schema validation',
      'Encrypted credential storage',
      '10/10 Security Score',
      'Email support',
    ],
    limits: {
      connections: 'Unlimited',
      syncsPerMonth: 'Unlimited',
      dataTransfer: 'Unlimited',
      teamMembers: '1',
      support: 'Email',
    },
  },
  {
    id: 'free',
    name: 'free',
    displayName: 'Free',
    price: 0,
    description: 'Perfect for getting started',
    comingSoon: true,
    features: [
      '3 database connections',
      '5 sync jobs per month',
      '500 MB data transfer/month',
      'Schema synchronization',
      'Data sync (one-way)',
      'Basic monitoring',
      'Community support',
    ],
    limits: {
      connections: '3',
      syncsPerMonth: '5',
      dataTransfer: '500 MB',
      teamMembers: '1',
      support: 'Community',
    },
  },
  {
    id: 'starter',
    name: 'starter',
    displayName: 'Starter',
    price: 9,
    priceYearly: 90,
    description: 'For small projects',
    comingSoon: true,
    features: [
      '10 database connections',
      '50 sync jobs per month',
      '5 GB data transfer/month',
      'Schema synchronization',
      'Data sync (one-way & two-way)',
      'Scheduled syncs',
      'Real-time monitoring',
      'Email support',
    ],
    limits: {
      connections: '10',
      syncsPerMonth: '50',
      dataTransfer: '5 GB',
      teamMembers: '1',
      support: 'Email',
    },
  },
  {
    id: 'pro',
    name: 'pro',
    displayName: 'Pro',
    price: 29,
    priceYearly: 290,
    description: 'For growing teams',
    badge: 'POPULAR',
    badgeColor: 'purple',
    isPopular: true,
    comingSoon: true,
    features: [
      'Unlimited connections',
      '500 sync jobs per month',
      '50 GB data transfer/month',
      'All sync features',
      'Advanced scheduling (cron)',
      'API access',
      'Webhooks',
      'Advanced monitoring & analytics',
      'Priority email support',
      '10/10 Security Score',
    ],
    limits: {
      connections: 'Unlimited',
      syncsPerMonth: '500',
      dataTransfer: '50 GB',
      teamMembers: '3',
      support: 'Priority Email',
    },
  },
  {
    id: 'team',
    name: 'team',
    displayName: 'Team',
    price: 99,
    priceYearly: 990,
    description: 'For teams and agencies',
    comingSoon: true,
    features: [
      'Everything in Pro',
      'Unlimited sync jobs',
      'Unlimited data transfer',
      'Team collaboration',
      'Role-based access control',
      'Shared workspaces',
      'Activity logs',
      'Advanced security (SSO ready)',
      'Dedicated support',
    ],
    limits: {
      connections: 'Unlimited',
      syncsPerMonth: 'Unlimited',
      dataTransfer: 'Unlimited',
      teamMembers: '10',
      support: 'Dedicated',
    },
  },
  {
    id: 'enterprise',
    name: 'enterprise',
    displayName: 'Enterprise',
    price: 0,
    description: 'Custom solutions',
    comingSoon: true,
    features: [
      'Everything in Team',
      'Custom limits',
      'SSO/SAML',
      'Dedicated infrastructure',
      'SLA guarantee',
      'Custom integrations',
      'On-premise deployment',
      '24/7 phone support',
      'Account manager',
    ],
    limits: {
      connections: 'Custom',
      syncsPerMonth: 'Custom',
      dataTransfer: 'Custom',
      teamMembers: 'Unlimited',
      support: '24/7 Phone',
    },
  },
];

const valuePropositions = [
  {
    icon: ShieldIcon,
    title: '10/10 Security Score',
    description: 'Enterprise-grade security with CSRF protection, rate limiting, and encrypted storage',
  },
  {
    icon: ZapIcon,
    title: 'Production-Grade Reliability',
    description: 'Automatic rollback, transaction isolation, and idempotency guarantees',
  },
  {
    icon: UsersIcon,
    title: 'Real-Time Monitoring',
    description: 'Live sync dashboards with metrics, alerts, and comprehensive logging',
  },
];

const faqItems = [
  {
    question: 'When will pricing change?',
    answer: 'We will notify all beta users at least 30 days before any pricing changes. Beta users will receive special early adopter benefits including grandfathered pricing.',
  },
  {
    question: 'What happens to beta users?',
    answer: 'Beta users will receive: 50% off first year of any paid plan, grandfathered pricing option, priority support, and feature request priority. We value our early adopters!',
  },
  {
    question: 'Can I upgrade or downgrade my plan?',
    answer: 'Yes! You can upgrade or downgrade at any time. Changes take effect immediately, and we prorate charges for upgrades.',
  },
  {
    question: 'What\'s included in each plan?',
    answer: 'All plans include schema sync, data sync, encrypted storage, and basic monitoring. Higher tiers add scheduling, API access, team features, and priority support.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Yes, we offer a 30-day money-back guarantee for all paid plans. No questions asked.',
  },
  {
    question: 'Is there a free tier after beta?',
    answer: 'Yes! We plan to offer a free tier with 3 connections and 5 syncs per month. Perfect for small projects and testing.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, debit cards, and ACH transfers. Enterprise customers can also pay via invoice.',
  },
  {
    question: 'Can I use suparbase for production databases?',
    answer: 'Absolutely! suparbase is production-ready with automatic rollback, transaction isolation, and comprehensive safety features. Many users sync production databases daily.',
  },
];

export default function PricingPageClient() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const cardBg = useColorModeValue('surface.800', 'surface.900');
  const borderColor = useColorModeValue('surface.700', 'surface.600');

  return (
    <Box minH="100vh" bg="surface.900">
      <Container maxW="7xl" py={{ base: 8, md: 12 }}>
        <VStack spacing={12} align="stretch">
          {/* Header */}
          <VStack spacing={4} align="center" textAlign="center">
            <Heading
              size={{ base: 'xl', md: '2xl' }}
              fontFamily="mono"
              bgGradient="linear(to-r, brand.300, brand.500)"
              bgClip="text"
            >
              Simple, Transparent Pricing
            </Heading>
            <Text color="surface.400" fontSize={{ base: 'md', md: 'lg' }} maxW="2xl">
              suparbase is currently in <strong>beta testing phase</strong> and is <strong>completely free</strong> to use.
              <br />
              Preview our future pricing tiers below.
            </Text>
          </VStack>

          {/* Beta Notice */}
          <Box
            bg="brand.500"
            bgGradient="linear(to-r, brand.500, brand.600)"
            p={6}
            borderRadius="xl"
            textAlign="center"
            borderWidth="1px"
            borderColor="brand.400"
            position="relative"
            overflow="hidden"
          >
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              bgGradient="linear(to-br, brand.400/20, transparent)"
              pointerEvents="none"
            />
            <VStack spacing={3} position="relative">
              <Badge colorScheme="white" fontSize="md" px={3} py={1} borderRadius="full">
                BETA TESTING PHASE
              </Badge>
              <Heading size="lg" color="white">
                Free During Beta
              </Heading>
              <Text color="white" fontSize="md" maxW="2xl">
                We're currently in beta testing and all features are available at no cost. 
                Help us improve suparbase by using it and sharing your feedback!
              </Text>
            </VStack>
          </Box>

          {/* Value Propositions */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            {valuePropositions.map((prop, index) => {
              const IconComponent = prop.icon;
              return (
                <Card key={index} bg={cardBg} borderColor={borderColor}>
                  <CardBody>
                    <VStack spacing={3} align="start">
                      <Box color="brand.400">
                        <IconComponent />
                      </Box>
                      <Heading size="sm" color="white">
                        {prop.title}
                      </Heading>
                      <Text color="surface.400" fontSize="sm">
                        {prop.description}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              );
            })}
          </SimpleGrid>

          <Divider borderColor={borderColor} />

          {/* Billing Cycle Toggle */}
          <Box display="flex" justifyContent="center">
            <HStack
              bg={cardBg}
              p={1}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
            >
              <Button
                size="sm"
                variant={billingCycle === 'monthly' ? 'solid' : 'ghost'}
                colorScheme={billingCycle === 'monthly' ? 'brand' : 'gray'}
                onClick={() => setBillingCycle('monthly')}
              >
                Monthly
              </Button>
              <Button
                size="sm"
                variant={billingCycle === 'yearly' ? 'solid' : 'ghost'}
                colorScheme={billingCycle === 'yearly' ? 'brand' : 'gray'}
                onClick={() => setBillingCycle('yearly')}
              >
                Yearly
                <Badge ml={2} colorScheme="green" fontSize="xs">
                  Save 17%
                </Badge>
              </Button>
            </HStack>
          </Box>

          {/* Pricing Cards */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {pricingTiers.map((tier) => {
              const displayPrice = billingCycle === 'yearly' && tier.priceYearly
                ? tier.priceYearly
                : tier.price;
              const isBeta = tier.isBeta;
              const isPopular = tier.isPopular;
              const comingSoon = tier.comingSoon;

              return (
                <Card
                  key={tier.id}
                  bg={cardBg}
                  borderColor={isPopular ? 'brand.500' : isBeta ? 'green.500' : borderColor}
                  borderWidth={isPopular || isBeta ? '2px' : '1px'}
                  position="relative"
                  transform={isPopular ? 'scale(1.05)' : 'none'}
                  transition="all 0.2s"
                  _hover={{ transform: isPopular ? 'scale(1.07)' : 'scale(1.02)', shadow: 'xl' }}
                >
                  {isPopular && (
                    <Badge
                      position="absolute"
                      top={-3}
                      right={4}
                      colorScheme="purple"
                      fontSize="xs"
                      px={2}
                      py={1}
                      borderRadius="full"
                    >
                      MOST POPULAR
                    </Badge>
                  )}
                  <CardBody p={6}>
                    <VStack spacing={4} align="stretch">
                      <VStack spacing={2} align="start">
                        <HStack spacing={3} w="full" justify="space-between">
                          <Heading size="md" color="white">
                            {tier.displayName}
                          </Heading>
                          {tier.badge && (
                            <Badge colorScheme={tier.badgeColor} fontSize="xs" px={2} py={1}>
                              {tier.badge}
                            </Badge>
                          )}
                        </HStack>
                        <HStack spacing={2} align="baseline">
                          <Heading size="2xl" color="brand.400">
                            {displayPrice === 0 ? '$0' : `$${displayPrice}`}
                          </Heading>
                          {displayPrice > 0 && (
                            <Text color="surface.400" fontSize="sm">
                              /{billingCycle === 'yearly' ? 'year' : 'month'}
                            </Text>
                          )}
                        </HStack>
                        <Text color="surface.400" fontSize="sm">
                          {tier.description}
                        </Text>
                      </VStack>

                      <Divider borderColor={borderColor} />

                      <List spacing={2} flex={1}>
                        {tier.features.slice(0, 6).map((feature, index) => (
                          <ListItem key={index} color="surface.300">
                            <HStack align="start" spacing={2}>
                              <ListIcon as={CheckIcon} color="brand.400" mt={0.5} />
                              <Text fontSize="sm">{feature}</Text>
                            </HStack>
                          </ListItem>
                        ))}
                        {tier.features.length > 6 && (
                          <Text color="surface.500" fontSize="xs" pl={6}>
                            +{tier.features.length - 6} more features
                          </Text>
                        )}
                      </List>

                      {comingSoon ? (
                        <Button
                          size="lg"
                          variant="outline"
                          width="full"
                          isDisabled
                          _hover={{ cursor: 'not-allowed' }}
                        >
                          Coming Soon
                        </Button>
                      ) : (
                        <Button
                          size="lg"
                          colorScheme={isPopular ? 'brand' : 'teal'}
                          width="full"
                          onClick={() => router.push('/signup')}
                        >
                          {isBeta ? 'Get Started Free' : 'Get Started'}
                        </Button>
                      )}

                      {isBeta && (
                        <Text color="surface.500" fontSize="xs" textAlign="center">
                          No credit card required
                        </Text>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              );
            })}
          </SimpleGrid>

          {/* Feature Comparison Table */}
          <Box>
            <VStack spacing={4} align="stretch">
              <Heading size="lg" color="white" textAlign="center">
                Compare Plans
              </Heading>
              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th color="surface.300">Feature</Th>
                      {pricingTiers.map((tier) => (
                        <Th key={tier.id} color="surface.300" textAlign="center">
                          {tier.displayName}
                        </Th>
                      ))}
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr>
                      <Td color="surface.400">Database Connections</Td>
                      {pricingTiers.map((tier) => (
                        <Td key={tier.id} textAlign="center" color="surface.300">
                          {tier.limits.connections}
                        </Td>
                      ))}
                    </Tr>
                    <Tr>
                      <Td color="surface.400">Sync Jobs / Month</Td>
                      {pricingTiers.map((tier) => (
                        <Td key={tier.id} textAlign="center" color="surface.300">
                          {tier.limits.syncsPerMonth}
                        </Td>
                      ))}
                    </Tr>
                    <Tr>
                      <Td color="surface.400">Data Transfer</Td>
                      {pricingTiers.map((tier) => (
                        <Td key={tier.id} textAlign="center" color="surface.300">
                          {tier.limits.dataTransfer}
                        </Td>
                      ))}
                    </Tr>
                    <Tr>
                      <Td color="surface.400">Team Members</Td>
                      {pricingTiers.map((tier) => (
                        <Td key={tier.id} textAlign="center" color="surface.300">
                          {tier.limits.teamMembers}
                        </Td>
                      ))}
                    </Tr>
                    <Tr>
                      <Td color="surface.400">Support</Td>
                      {pricingTiers.map((tier) => (
                        <Td key={tier.id} textAlign="center" color="surface.300">
                          {tier.limits.support}
                        </Td>
                      ))}
                    </Tr>
                  </Tbody>
                </Table>
              </Box>
            </VStack>
          </Box>

          {/* Beta Benefits */}
          <Card bg={cardBg} borderColor="green.500" borderWidth="2px">
            <CardBody p={8}>
              <VStack spacing={4} align="start">
                <HStack spacing={2}>
                  <Badge colorScheme="green" fontSize="md" px={3} py={1}>
                    BETA USER BENEFITS
                  </Badge>
                </HStack>
                <Heading size="md" color="white">
                  Special Perks for Early Adopters
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                  <HStack align="start" spacing={3}>
                    <Box color="green.400" mt={1}>
                      <CheckIcon />
                    </Box>
                    <VStack align="start" spacing={1}>
                      <Text color="white" fontWeight="bold" fontSize="sm">
                        50% Off First Year
                      </Text>
                      <Text color="surface.400" fontSize="sm">
                        Get half off any paid plan for your first year
                      </Text>
                    </VStack>
                  </HStack>
                  <HStack align="start" spacing={3}>
                    <Box color="green.400" mt={1}>
                      <CheckIcon />
                    </Box>
                    <VStack align="start" spacing={1}>
                      <Text color="white" fontWeight="bold" fontSize="sm">
                        Grandfathered Pricing
                      </Text>
                      <Text color="surface.400" fontSize="sm">
                        Lock in beta pricing when we launch paid plans
                      </Text>
                    </VStack>
                  </HStack>
                  <HStack align="start" spacing={3}>
                    <Box color="green.400" mt={1}>
                      <CheckIcon />
                    </Box>
                    <VStack align="start" spacing={1}>
                      <Text color="white" fontWeight="bold" fontSize="sm">
                        Priority Support
                      </Text>
                      <Text color="surface.400" fontSize="sm">
                        Get faster response times and dedicated help
                      </Text>
                    </VStack>
                  </HStack>
                  <HStack align="start" spacing={3}>
                    <Box color="green.400" mt={1}>
                      <CheckIcon />
                    </Box>
                    <VStack align="start" spacing={1}>
                      <Text color="white" fontWeight="bold" fontSize="sm">
                        Feature Request Priority
                      </Text>
                      <Text color="surface.400" fontSize="sm">
                        Your suggestions get prioritized in our roadmap
                      </Text>
                    </VStack>
                  </HStack>
                </SimpleGrid>
              </VStack>
            </CardBody>
          </Card>

          {/* FAQ Section */}
          <Box>
            <VStack spacing={6} align="stretch">
              <Heading size="lg" color="white" textAlign="center">
                Frequently Asked Questions
              </Heading>
              <Accordion allowToggle>
                {faqItems.map((item, index) => (
                  <AccordionItem key={index} borderColor={borderColor}>
                    <AccordionButton _hover={{ bg: cardBg }}>
                      <Box flex="1" textAlign="left" color="white" fontWeight="medium">
                        {item.question}
                      </Box>
                      <AccordionIcon color="brand.400" />
                    </AccordionButton>
                    <AccordionPanel pb={4} color="surface.400">
                      {item.answer}
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
            </VStack>
          </Box>

          {/* CTA Section */}
          <Card bg={cardBg} borderColor="brand.500" borderWidth="2px">
            <CardBody p={8} textAlign="center">
              <VStack spacing={4}>
                <Heading size="md" color="white">
                  Ready to Get Started?
                </Heading>
                <Text color="surface.400" maxW="2xl">
                  Join the beta and get full access to all features for free. 
                  No credit card required. Start syncing your databases today!
                </Text>
                <HStack spacing={4} justify="center" flexWrap="wrap">
                  <Button
                    size="lg"
                    colorScheme="brand"
                    onClick={() => router.push('/signup')}
                  >
                    Start Free Beta
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => router.push('/guide')}
                  >
                    View Documentation
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
}
