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
  Button,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionCard = motion.create(Card);
const MotionBox = motion.create(Box);

const benefits = [
  {
    title: 'Time Savings',
    icon: '⏱️',
    color: 'teal',
    metric: '5-10 hours/week',
    description: 'Automate manual database migrations and schema updates. What used to take hours now takes minutes.',
    details: [
      'No more manual SQL script writing',
      'Automated schema comparison',
      'One-click sync execution',
      'Batch operations for multiple tables'
    ]
  },
  {
    title: 'Risk Reduction',
    icon: '🛡️',
    color: 'green',
    metric: '90% fewer errors',
    description: 'Schema validation prevents incompatible changes from breaking your databases.',
    details: [
      'Pre-sync compatibility checks',
      'Automatic conflict detection',
      'Dry-run mode for safe testing',
      'Rollback capabilities'
    ]
  },
  {
    title: 'Cost Efficiency',
    icon: '💰',
    color: 'yellow',
    metric: 'Free tier optimized',
    description: 'Keep your Supabase free tier databases alive automatically. No more unexpected pauses.',
    details: [
      'Automated keep-alive service',
      'Prevents 7-day inactivity pause',
      'Free during beta testing',
      'Optimized for free tier usage'
    ]
  },
  {
    title: 'Developer Experience',
    icon: '✨',
    color: 'purple',
    metric: 'Simple UI',
    description: 'Beautiful, intuitive interface vs complex CLI tools. Manage databases without command line expertise.',
    details: [
      'Visual schema comparison',
      'Real-time progress tracking',
      'Interactive dashboard',
      'No CLI knowledge required'
    ]
  },
  {
    title: 'Reliability',
    icon: '🔒',
    color: 'blue',
    metric: '99.9% uptime',
    description: 'Automated processes eliminate human error. Consistent, repeatable sync operations.',
    details: [
      'Automated error handling',
      'Retry mechanisms',
      'Detailed logging',
      'Email notifications'
    ]
  },
  {
    title: 'Security',
    icon: '🔐',
    color: 'pink',
    metric: 'AES-256-GCM',
    description: 'Enterprise-grade encryption for your credentials. Your data stays secure.',
    details: [
      'Encrypted credential storage',
      'RLS-aware operations',
      'Secure connections only',
      'No data stored on our servers'
    ]
  }
];

const comparisons = [
  {
    method: 'Manual Migration',
    time: '2-4 hours',
    risk: 'High',
    cost: 'Developer time',
    suparbase: {
      time: '2-5 minutes',
      risk: 'Low',
      cost: 'Free (beta)'
    }
  },
  {
    method: 'CLI Tools',
    time: '30-60 minutes',
    risk: 'Medium',
    cost: 'Learning curve',
    suparbase: {
      time: '2-5 minutes',
      risk: 'Low',
      cost: 'Free (beta)'
    }
  },
  {
    method: 'Custom Scripts',
    time: '1-2 hours',
    risk: 'High',
    cost: 'Maintenance',
    suparbase: {
      time: '2-5 minutes',
      risk: 'Low',
      cost: 'Free (beta)'
    }
  }
];

export default function BenefitsPageClient() {
  const router = useRouter();

  return (
    <Box minH="100vh" bg="rgba(9, 9, 11, 1)">
      <Container maxW="7xl" py={{ base: 8, md: 12 }} px={{ base: 4, md: 6 }}>
        <VStack spacing={16} align="stretch">
          {/* Header */}
          <VStack spacing={4} align="center" textAlign="center">
            <Badge colorScheme="teal" px={3} py={1} borderRadius="full" fontSize="sm">
              VALUE PROPOSITION
            </Badge>
            <Heading
              as="h1"
              fontSize={{ base: '3xl', md: '5xl' }}
              fontWeight="700"
              color="white"
              fontFamily="'Outfit', sans-serif"
              letterSpacing="-0.02em"
            >
              Why <Text as="span" color="teal.400">Suparbase</Text>?
            </Heading>
            <Text
              color="surface.400"
              fontSize={{ base: 'md', md: 'lg' }}
              maxW="3xl"
              lineHeight="1.6"
            >
              Discover the key benefits that make suparbase the preferred choice for developers
              managing Supabase databases across environments.
            </Text>
          </VStack>

          {/* Benefits Grid */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {benefits.map((benefit, index) => (
              <MotionCard
                key={benefit.title}
                bg="surface.800"
                borderColor="surface.700"
                borderWidth="1px"
                borderRadius="xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                _hover={{
                  borderColor: `${benefit.color}.400`,
                  transform: 'translateY(-4px)',
                }}
                transition="all 0.3s"
              >
                <CardBody p={6}>
                  <VStack align="start" spacing={4}>
                    <HStack spacing={3} w="full">
                      <Box fontSize="3xl">{benefit.icon}</Box>
                      <VStack align="start" spacing={0} flex={1}>
                        <Heading size="sm" color="white">
                          {benefit.title}
                        </Heading>
                        <Stat>
                          <StatNumber fontSize="lg" color={`${benefit.color}.400`}>
                            {benefit.metric}
                          </StatNumber>
                        </Stat>
                      </VStack>
                    </HStack>
                    <Text color="surface.300" fontSize="sm" lineHeight="1.6">
                      {benefit.description}
                    </Text>
                    <VStack align="start" spacing={2} w="full" pt={2}>
                      {benefit.details.map((detail, i) => (
                        <HStack key={i} spacing={2} align="start">
                          <Box
                            color={`${benefit.color}.400`}
                            mt={1}
                            flexShrink={0}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </Box>
                          <Text color="surface.400" fontSize="xs" lineHeight="1.5">
                            {detail}
                          </Text>
                        </HStack>
                      ))}
                    </VStack>
                  </VStack>
                </CardBody>
              </MotionCard>
            ))}
          </SimpleGrid>

          <Divider borderColor="surface.700" />

          {/* Comparison Section */}
          <Box>
            <VStack spacing={8} align="stretch">
              <Heading size="lg" color="white" textAlign="center">
                suparbase vs Traditional Methods
              </Heading>
              
              <Box overflowX="auto" className="responsive-table" style={{ WebkitOverflowScrolling: 'touch' }}>
                <Box as="table" w="full" minW="600px">
                  <Box as="thead">
                    <Box as="tr" borderBottom="1px solid" borderColor="surface.700">
                      <Box as="th" p={{ base: 2, md: 4 }} textAlign="left" color="surface.400" fontSize={{ base: 'xs', md: 'sm' }} fontWeight="600">
                        Method
                      </Box>
                      <Box as="th" p={{ base: 2, md: 4 }} textAlign="center" color="surface.400" fontSize={{ base: 'xs', md: 'sm' }} fontWeight="600">
                        Time Required
                      </Box>
                      <Box as="th" p={{ base: 2, md: 4 }} textAlign="center" color="surface.400" fontSize={{ base: 'xs', md: 'sm' }} fontWeight="600">
                        Risk Level
                      </Box>
                      <Box as="th" p={{ base: 2, md: 4 }} textAlign="center" color="surface.400" fontSize={{ base: 'xs', md: 'sm' }} fontWeight="600">
                        Cost
                      </Box>
                    </Box>
                  </Box>
                  <Box as="tbody">
                    {comparisons.map((comp, index) => (
                      <Box
                        key={index}
                        as="tr"
                        borderBottom="1px solid"
                        borderColor="surface.800"
                        _hover={{ bg: 'surface.800' }}
                      >
                        <Box as="td" p={{ base: 2, md: 4 }} color="surface.300" fontSize={{ base: 'xs', md: 'sm' }} fontWeight="600">
                          {comp.method}
                        </Box>
                        <Box as="td" p={{ base: 2, md: 4 }} textAlign="center" color="red.400" fontSize={{ base: 'xs', md: 'sm' }}>
                          {comp.time}
                        </Box>
                        <Box as="td" p={{ base: 2, md: 4 }} textAlign="center">
                          <Badge colorScheme="red" variant="subtle" fontSize={{ base: 'xs', md: 'sm' }}>{comp.risk}</Badge>
                        </Box>
                        <Box as="td" p={{ base: 2, md: 4 }} textAlign="center" color="surface.400" fontSize={{ base: 'xs', md: 'sm' }}>
                          {comp.cost}
                        </Box>
                      </Box>
                    ))}
                    <Box
                      as="tr"
                      bg="teal.400/10"
                      borderTop="2px solid"
                      borderColor="teal.400"
                    >
                      <Box as="td" p={{ base: 2, md: 4 }} color="white" fontSize={{ base: 'xs', md: 'sm' }} fontWeight="700">
                        suparbase
                      </Box>
                      <Box as="td" p={{ base: 2, md: 4 }} textAlign="center" color="teal.400" fontSize={{ base: 'xs', md: 'sm' }} fontWeight="600">
                        {comparisons[0].suparbase.time}
                      </Box>
                      <Box as="td" p={{ base: 2, md: 4 }} textAlign="center">
                        <Badge colorScheme="teal" fontSize={{ base: 'xs', md: 'sm' }}>{comparisons[0].suparbase.risk}</Badge>
                      </Box>
                      <Box as="td" p={{ base: 2, md: 4 }} textAlign="center" color="teal.400" fontSize={{ base: 'xs', md: 'sm' }} fontWeight="600">
                        {comparisons[0].suparbase.cost}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </VStack>
          </Box>

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
                    Experience the Benefits Yourself
                  </Heading>
                  <Text color="surface.400" fontSize="md" maxW="2xl">
                    Join developers who are saving hours every week and reducing errors with automated database synchronization.
                  </Text>
                  <HStack spacing={4} flexWrap="wrap" justify="center">
                    <Button
                      colorScheme="teal"
                      size="lg"
                      onClick={() => router.push('/signup')}
                      minH="48px"
                    >
                      Start Free Today
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => router.push('/use-cases')}
                      minH="48px"
                    >
                      See Use Cases
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

