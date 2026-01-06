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
  Card,
  CardBody,
  Badge,
  Button,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Code,
  Alert,
  AlertIcon,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionCard = motion.create(Card);

const issues = [
  {
    category: 'Connection Issues',
    color: 'red',
    items: [
      {
        question: 'Cannot connect to database',
        answer: 'This usually means your connection string is incorrect or your database is not accessible.',
        solutions: [
          'Verify your connection string format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres',
          'Check that your password doesn\'t contain special characters that need URL encoding',
          'Ensure your Supabase project is active and not paused',
          'Check network/firewall settings in Supabase Dashboard → Settings → Database',
          'Try testing the connection directly with a PostgreSQL client'
        ],
        code: 'postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres'
      },
      {
        question: 'Connection timeout',
        answer: 'The connection is timing out, which could indicate network issues or database unavailability.',
        solutions: [
          'Check if your Supabase database is paused (free tier)',
          'Verify your database is accessible from the internet',
          'Check Supabase status page for outages',
          'Try increasing connection timeout in settings',
          'Ensure your IP is not blocked by Supabase firewall'
        ]
      },
      {
        question: 'Authentication failed',
        answer: 'The credentials provided are incorrect or the user doesn\'t have proper permissions.',
        solutions: [
          'Double-check your password in the connection string',
          'Reset your database password in Supabase Dashboard if needed',
          'Ensure you\'re using the correct database user (usually "postgres")',
          'Check that your user has necessary permissions',
          'Verify connection string encoding (special characters)'
        ]
      }
    ]
  },
  {
    category: 'Sync Failures',
    color: 'orange',
    items: [
      {
        question: 'Sync job failed with schema error',
        answer: 'The sync failed because of incompatible schema changes between source and target.',
        solutions: [
          'Review the schema comparison before syncing',
          'Fix incompatible changes in your source database first',
          'Use dry-run mode to preview changes safely',
          'Check for data type mismatches',
          'Ensure foreign key constraints are compatible'
        ]
      },
      {
        question: 'Sync is very slow or timing out',
        answer: 'Large tables or network issues can cause slow syncs or timeouts.',
        solutions: [
          'Sync large tables in smaller batches',
          'Schedule syncs during off-peak hours',
          'Check your network connection stability',
          'Consider syncing only necessary tables',
          'Increase timeout settings if available'
        ]
      },
      {
        question: 'Data not syncing correctly',
        answer: 'Data might not be syncing due to RLS policies, permissions, or data conflicts.',
        solutions: [
          'Check Row Level Security (RLS) policies on both databases',
          'Verify user permissions for read/write operations',
          'Review sync logs for specific error messages',
          'Ensure source and target schemas match',
          'Check for unique constraint violations'
        ]
      }
    ]
  },
  {
    category: 'Schema Conflicts',
    color: 'yellow',
    items: [
      {
        question: 'Schema validation failed',
        answer: 'The schemas are incompatible and cannot be safely synced.',
        solutions: [
          'Review the validation report for specific conflicts',
          'Modify source schema to match target requirements',
          'Use schema sync feature to align schemas first',
          'Manually fix incompatible changes',
          'Consider using migration scripts for complex changes'
        ]
      },
      {
        question: 'Column type mismatch',
        answer: 'A column exists in both databases but with different data types.',
        solutions: [
          'Identify the mismatched columns in the comparison view',
          'Update source database column types to match target',
          'Or update target to match source (if safe)',
          'Be careful with data loss when changing types',
          'Test changes in a development environment first'
        ]
      },
      {
        question: 'Missing tables or columns',
        answer: 'The target database is missing tables or columns that exist in the source.',
        solutions: [
          'Use schema sync to create missing tables/columns',
          'Or manually create them in the target database',
          'Verify you\'ve selected all tables for sync',
          'Check if tables are filtered out by sync settings'
        ]
      }
    ]
  },
  {
    category: 'Performance Issues',
    color: 'blue',
    items: [
      {
        question: 'Keep-alive not working',
        answer: 'Your database is still pausing despite keep-alive being enabled.',
        solutions: [
          'Verify keep-alive is enabled for the connection',
          'Check keep-alive frequency settings',
          'Ensure connection is active and testable',
          'Check Supabase free tier status and limits',
          'Review keep-alive logs for errors'
        ]
      },
      {
        question: 'High usage limits warning',
        answer: 'You\'re approaching your monthly usage limits for syncs or connections.',
        solutions: [
          'Review your usage in the dashboard',
          'Optimize sync frequency (don\'t sync unnecessarily)',
          'Combine multiple syncs into fewer operations',
          'Remove unused connections',
          'Contact support if you need higher limits'
        ]
      }
    ]
  }
];

export default function TroubleshootingPageClient() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIssues = issues.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  return (
    <Box minH="100vh" bg="rgba(9, 9, 11, 1)">
      <Container maxW="6xl" py={{ base: 8, md: 12 }} px={{ base: 4, md: 6 }}>
        <VStack spacing={12} align="stretch">
          {/* Header */}
          <VStack spacing={4} align="center" textAlign="center">
            <Badge colorScheme="orange" px={3} py={1} borderRadius="full" fontSize="sm">
              HELP & SUPPORT
            </Badge>
            <Heading
              as="h1"
              fontSize={{ base: '3xl', md: '5xl' }}
              fontWeight="700"
              color="white"
              fontFamily="'Outfit', sans-serif"
              letterSpacing="-0.02em"
            >
              Troubleshooting <Text as="span" color="teal.400">Guide</Text>
            </Heading>
            <Text
              color="surface.400"
              fontSize={{ base: 'md', md: 'lg' }}
              maxW="3xl"
              lineHeight="1.6"
            >
              Common issues and their solutions. Can't find what you're looking for?
              Check our FAQ or contact support.
            </Text>
          </VStack>

          {/* Search */}
          <InputGroup size="lg">
            <InputLeftElement pointerEvents="none" color="surface.500" h="100%">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </InputLeftElement>
            <Input
              placeholder="Search for issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg="surface.800"
              borderColor="surface.700"
              color="white"
              h="48px"
              _placeholder={{ color: 'surface.500' }}
              _focus={{ borderColor: 'teal.400' }}
            />
          </InputGroup>

          {/* Issues by Category */}
          <VStack spacing={8} align="stretch">
            {filteredIssues.map((category, categoryIndex) => (
              <Box key={category.category}>
                <HStack spacing={3} mb={4}>
                  <Badge colorScheme={category.color} px={3} py={1} borderRadius="md" fontSize="sm">
                    {category.category}
                  </Badge>
                  <Text color="surface.500" fontSize="sm">
                    {category.items.length} {category.items.length === 1 ? 'issue' : 'issues'}
                  </Text>
                </HStack>
                <Accordion allowMultiple>
                  {category.items.map((item, itemIndex) => (
                    <AccordionItem
                      key={itemIndex}
                      borderColor="surface.700"
                      borderWidth="1px"
                      borderRadius="md"
                      mb={3}
                      bg="surface.800"
                    >
                      {({ isExpanded }) => (
                        <>
                          <AccordionButton
                            p={{ base: 3, md: 4 }}
                            minH="48px"
                            _hover={{ bg: 'surface.700' }}
                            _expanded={{ bg: 'surface.700' }}
                          >
                            <Box flex="1" textAlign="left">
                              <Text fontWeight="600" color="white" fontSize={{ base: 'xs', md: 'sm' }}>
                                {item.question}
                              </Text>
                            </Box>
                            <AccordionIcon color="surface.400" />
                          </AccordionButton>
                          <AccordionPanel pb={{ base: 4, md: 6 }} px={{ base: 3, md: 4 }}>
                            <VStack align="start" spacing={4}>
                              <Text color="surface.300" fontSize="sm" lineHeight="1.6">
                                {item.answer}
                              </Text>
                              <Box w="full">
                                <Text
                                  fontSize="xs"
                                  fontWeight="700"
                                  color="teal.400"
                                  textTransform="uppercase"
                                  mb={3}
                                >
                                  Solutions
                                </Text>
                                <VStack align="start" spacing={2}>
                                  {item.solutions.map((solution, i) => (
                                    <HStack key={i} spacing={3} align="start">
                                      <Box
                                        color="teal.400"
                                        mt={1}
                                        flexShrink={0}
                                      >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                          <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                      </Box>
                                      <Text color="surface.400" fontSize="sm" lineHeight="1.6">
                                        {solution}
                                      </Text>
                                    </HStack>
                                  ))}
                                </VStack>
                              </Box>
                              {item.code && (
                                <Box w="full">
                                  <Text
                                    fontSize="xs"
                                    fontWeight="700"
                                    color="surface.500"
                                    textTransform="uppercase"
                                    mb={2}
                                  >
                                    Example
                                  </Text>
                                  <Code
                                    p={3}
                                    bg="surface.900"
                                    color="surface.200"
                                    borderRadius="md"
                                    fontSize="xs"
                                    display="block"
                                    whiteSpace="pre-wrap"
                                    w="full"
                                  >
                                    {item.code}
                                  </Code>
                                </Box>
                              )}
                            </VStack>
                          </AccordionPanel>
                        </>
                      )}
                    </AccordionItem>
                  ))}
                </Accordion>
              </Box>
            ))}
          </VStack>

          {/* Still Need Help */}
          <Card
            bgGradient="linear(to-r, teal.500/10, brand.500/10)"
            borderColor="teal.400/20"
            borderWidth="1px"
            borderRadius="2xl"
          >
            <CardBody p={{ base: 6, md: 8 }}>
              <VStack spacing={6} align="center" textAlign="center">
                <Heading size="lg" color="white">
                  Still Need Help?
                </Heading>
                <Text color="surface.400" fontSize="md" maxW="2xl">
                  Can't find a solution? Check our FAQ, read the documentation, or contact our support team.
                </Text>
                <HStack spacing={4} flexWrap="wrap" justify="center">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => router.push('/faq')}
                    minH="48px"
                  >
                    View FAQ
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => router.push('/guide')}
                    minH="48px"
                  >
                    Read Documentation
                  </Button>
                  <Button
                    colorScheme="teal"
                    size="lg"
                    onClick={() => router.push('/contact')}
                    minH="48px"
                  >
                    Contact Support
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

