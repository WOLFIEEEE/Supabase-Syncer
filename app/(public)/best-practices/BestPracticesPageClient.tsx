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
  Code,
  Divider,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionCard = motion.create(Card);

const PlugIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v6M8 8h8M6 12h12M4 20h16v-4H4v4z"/>
  </svg>
);

const ZapIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const ClipboardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
  </svg>
);

const KeyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
);

const RocketIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
);

const SaveIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const WarningIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const practices = [
  {
    category: 'Connection Management',
    icon: <PlugIcon />,
    color: 'teal',
    tips: [
      {
        title: 'Use descriptive names',
        description: 'Name your connections clearly: "Production DB", "Staging DB", "Dev Local". This helps avoid mistakes.',
        do: 'Production - Main App',
        dont: 'DB1, DB2, test'
      },
      {
        title: 'Organize by environment',
        description: 'Group connections by environment type. Use tags or naming conventions to keep things organized.',
        do: 'Use consistent prefixes: prod-, staging-, dev-',
        dont: 'Mix environments randomly'
      },
      {
        title: 'Test connections regularly',
        description: 'Periodically test your connections to ensure they\'re still valid and accessible.',
        do: 'Test monthly or after password changes',
        dont: 'Assume connections never break'
      }
    ]
  },
  {
    category: 'Sync Strategy',
    icon: <ZapIcon />,
    color: 'purple',
    tips: [
      {
        title: 'Sync during off-peak hours',
        description: 'For large databases, schedule syncs during low-traffic periods to avoid performance impact.',
        do: 'Schedule syncs for nights/weekends',
        dont: 'Sync during peak usage times'
      },
      {
        title: 'Use dry-run first',
        description: 'Always preview changes with dry-run mode before executing actual syncs.',
        do: 'Dry-run → Review → Execute',
        dont: 'Execute syncs blindly'
      },
      {
        title: 'Sync incrementally',
        description: 'For large databases, sync tables in batches rather than all at once.',
        do: 'Sync 5-10 tables at a time',
        dont: 'Sync 100+ tables simultaneously'
      }
    ]
  },
  {
    category: 'Schema Management',
    icon: <ClipboardIcon />,
    color: 'blue',
    tips: [
      {
        title: 'Validate before syncing',
        description: 'Always run schema validation to catch incompatible changes early.',
        do: 'Validate → Fix issues → Sync',
        dont: 'Skip validation steps'
      },
      {
        title: 'Version control schemas',
        description: 'Keep track of schema changes using version control or migration tools.',
        do: 'Document schema changes',
        dont: 'Make undocumented changes'
      },
      {
        title: 'Test in dev first',
        description: 'Always test schema changes in development before syncing to production.',
        do: 'Dev → Staging → Production',
        dont: 'Test directly in production'
      }
    ]
  },
  {
    category: 'Security',
    icon: <KeyIcon />,
    color: 'green',
    tips: [
      {
        title: 'Use strong passwords',
        description: 'Ensure your database passwords are strong and unique for each environment.',
        do: 'Complex passwords, different per env',
        dont: 'Weak or reused passwords'
      },
      {
        title: 'Review access regularly',
        description: 'Periodically review who has access to your connections and remove unused ones.',
        do: 'Audit access quarterly',
        dont: 'Keep old connections forever'
      },
      {
        title: 'Enable notifications',
        description: 'Set up email notifications to be alerted of sync failures or security issues.',
        do: 'Enable all critical notifications',
        dont: 'Ignore security alerts'
      }
    ]
  },
  {
    category: 'Performance',
    icon: <RocketIcon />,
    color: 'yellow',
    tips: [
      {
        title: 'Optimize table selection',
        description: 'Only sync tables you actually need. Unnecessary syncs waste time and resources.',
        do: 'Sync only required tables',
        dont: 'Sync everything "just in case"'
      },
      {
        title: 'Monitor usage limits',
        description: 'Keep an eye on your usage to avoid hitting monthly limits unexpectedly.',
        do: 'Check usage dashboard weekly',
        dont: 'Ignore limit warnings'
      },
      {
        title: 'Clean up old syncs',
        description: 'Archive or delete old sync jobs to keep your dashboard clean and organized.',
        do: 'Archive completed syncs monthly',
        dont: 'Keep thousands of old syncs'
      }
    ]
  },
  {
    category: 'Backup Strategy',
    icon: <SaveIcon />,
    color: 'pink',
    tips: [
      {
        title: 'Backup before major syncs',
        description: 'Always backup your target database before syncing major schema changes.',
        do: 'Backup → Validate → Sync',
        dont: 'Sync without backups'
      },
      {
        title: 'Test restore procedures',
        description: 'Periodically test that you can restore from backups to ensure they work.',
        do: 'Test restores quarterly',
        dont: 'Assume backups always work'
      },
      {
        title: 'Keep multiple backups',
        description: 'Maintain backups from different points in time, not just the latest.',
        do: 'Daily + Weekly + Monthly backups',
        dont: 'Single backup point'
      }
    ]
  }
];

export default function BestPracticesPageClient() {
  const router = useRouter();

  return (
    <Box minH="100vh" bg="rgba(9, 9, 11, 1)">
      <Container maxW="7xl" py={{ base: 8, md: 12 }} px={{ base: 4, md: 6 }}>
        <VStack spacing={16} align="stretch">
          {/* Header */}
          <VStack spacing={4} align="center" textAlign="center">
            <Badge colorScheme="teal" px={3} py={1} borderRadius="full" fontSize="sm">
              TIPS & RECOMMENDATIONS
            </Badge>
            <Heading
              as="h1"
              fontSize={{ base: '3xl', md: '5xl' }}
              fontWeight="700"
              color="white"
              fontFamily="'Outfit', sans-serif"
              letterSpacing="-0.02em"
            >
              Best <Text as="span" color="teal.400">Practices</Text>
            </Heading>
            <Text
              color="surface.400"
              fontSize={{ base: 'md', md: 'lg' }}
              maxW="3xl"
              lineHeight="1.6"
            >
              Learn from the community and our team. Follow these best practices to get the most
              out of suparbase and avoid common pitfalls.
            </Text>
          </VStack>

          {/* Practices by Category */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 6, md: 8 }}>
            {practices.map((category, categoryIndex) => (
              <Box key={category.category}>
                <HStack spacing={3} mb={{ base: 4, md: 6 }}>
                  <Box color={`${category.color}.400`} fontSize={{ base: 'xl', md: '2xl' }} display="flex" alignItems="center" justifyContent="center">
                    {category.icon}
                  </Box>
                  <Heading size="md" color="white" fontSize={{ base: 'sm', md: 'md' }}>
                    {category.category}
                  </Heading>
                </HStack>
                <VStack spacing={{ base: 3, md: 4 }} align="stretch">
                  {category.tips.map((tip, tipIndex) => (
                    <MotionCard
                      key={tipIndex}
                      bg="surface.800"
                      borderColor="surface.700"
                      borderWidth="1px"
                      borderRadius="xl"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: (categoryIndex * 0.1) + (tipIndex * 0.05) }}
                    >
                      <CardBody p={{ base: 4, md: 6 }}>
                        <VStack align="start" spacing={4}>
                          <Heading size="sm" color="white" fontSize={{ base: 'xs', md: 'sm' }}>
                            {tip.title}
                          </Heading>
                          <Text color="surface.300" fontSize={{ base: 'xs', md: 'sm' }} lineHeight="1.6">
                            {tip.description}
                          </Text>
                          <SimpleGrid columns={2} spacing={{ base: 2, md: 3 }} w="full">
                            <Box
                              p={{ base: 2, md: 3 }}
                              bg="green.400/10"
                              borderLeft="3px solid"
                              borderColor="green.400"
                              borderRadius="md"
                            >
                              <HStack spacing={1} mb={1}>
                                <Box color="green.400" display="flex" alignItems="center">
                                  <CheckIcon />
                                </Box>
                                <Text
                                  fontSize="xs"
                                  fontWeight="700"
                                  color="green.400"
                                  textTransform="uppercase"
                                >
                                  Do
                                </Text>
                              </HStack>
                              <Text color="surface.300" fontSize="xs" lineHeight="1.5">
                                {tip.do}
                              </Text>
                            </Box>
                            <Box
                              p={{ base: 2, md: 3 }}
                              bg="red.400/10"
                              borderLeft="3px solid"
                              borderColor="red.400"
                              borderRadius="md"
                            >
                              <HStack spacing={1} mb={1}>
                                <Box color="red.400" display="flex" alignItems="center">
                                  <XIcon />
                                </Box>
                                <Text
                                  fontSize="xs"
                                  fontWeight="700"
                                  color="red.400"
                                  textTransform="uppercase"
                                >
                                  Don't
                                </Text>
                              </HStack>
                              <Text color="surface.300" fontSize="xs" lineHeight="1.5">
                                {tip.dont}
                              </Text>
                            </Box>
                          </SimpleGrid>
                        </VStack>
                      </CardBody>
                    </MotionCard>
                  ))}
                </VStack>
              </Box>
            ))}
          </SimpleGrid>

          <Divider borderColor="surface.700" />

          {/* Pro Tips Section */}
          <Box>
            <VStack spacing={6} align="stretch">
              <Heading size="lg" color="white" textAlign="center">
                Pro Tips
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 3, md: 4 }}>
                <Card bg="surface.800" borderColor="teal.400/20" borderWidth="1px" borderRadius="xl">
                  <CardBody p={{ base: 4, md: 6 }}>
                    <VStack align="start" spacing={3}>
                      <Badge colorScheme="teal" variant="subtle" fontSize={{ base: 'xs', md: 'sm' }}>Tip #1</Badge>
                      <Text color="white" fontWeight="600" fontSize={{ base: 'xs', md: 'sm' }}>
                        Start Small
                      </Text>
                      <Text color="surface.400" fontSize={{ base: 'xs', md: 'sm' }} lineHeight="1.6">
                        Begin with a single table sync to understand the process before scaling up.
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
                <Card bg="surface.800" borderColor="teal.400/20" borderWidth="1px" borderRadius="xl">
                  <CardBody p={{ base: 4, md: 6 }}>
                    <VStack align="start" spacing={3}>
                      <Badge colorScheme="teal" variant="subtle" fontSize={{ base: 'xs', md: 'sm' }}>Tip #2</Badge>
                      <Text color="white" fontWeight="600" fontSize={{ base: 'xs', md: 'sm' }}>
                        Use Keep-Alive Wisely
                      </Text>
                      <Text color="surface.400" fontSize={{ base: 'xs', md: 'sm' }} lineHeight="1.6">
                        Enable keep-alive only for databases you actively use to avoid unnecessary requests.
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
                <Card bg="surface.800" borderColor="teal.400/20" borderWidth="1px" borderRadius="xl">
                  <CardBody p={{ base: 4, md: 6 }}>
                    <VStack align="start" spacing={3}>
                      <Badge colorScheme="teal" variant="subtle" fontSize={{ base: 'xs', md: 'sm' }}>Tip #3</Badge>
                      <Text color="white" fontWeight="600" fontSize={{ base: 'xs', md: 'sm' }}>
                        Monitor Regularly
                      </Text>
                      <Text color="surface.400" fontSize={{ base: 'xs', md: 'sm' }} lineHeight="1.6">
                        Check your sync history and logs weekly to catch issues early and optimize performance.
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </VStack>
          </Box>

          {/* CTA Section */}
          <Card
            bgGradient="linear(to-r, teal.500/10, brand.500/10)"
            borderColor="teal.400/20"
            borderWidth="1px"
            borderRadius="2xl"
          >
            <CardBody p={{ base: 6, md: 8 }}>
              <VStack spacing={6} align="center" textAlign="center">
                <Heading size="lg" color="white">
                  Ready to Apply These Practices?
                </Heading>
                <Text color="surface.400" fontSize="md" maxW="2xl">
                  Start implementing these best practices today and optimize your database synchronization workflow.
                </Text>
                <HStack spacing={4} flexWrap="wrap" justify="center">
                  <Button
                    colorScheme="teal"
                    size="lg"
                    onClick={() => router.push('/getting-started')}
                    minH="48px"
                  >
                    Get Started
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => router.push('/guide')}
                    minH="48px"
                  >
                    Read Full Guide
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

