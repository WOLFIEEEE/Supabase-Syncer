'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Card,
  CardBody,
  Badge,
  Spinner,
  useToast,
  Input,
  InputGroup,
  InputLeftElement,
  Flex,
  Divider,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionCard = motion.create(Card);

// Icons
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const DatabaseIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);

const TableIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <line x1="3" y1="9" x2="21" y2="9"/>
    <line x1="9" y1="21" x2="9" y2="9"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

interface Connection {
  id: string;
  name: string;
  environment: 'production' | 'development';
  createdAt: string;
}

interface RecentTable {
  connectionId: string;
  connectionName: string;
  tableName: string;
  accessedAt: string;
}

export default function ExplorerPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [recentTables, setRecentTables] = useState<RecentTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    fetchConnections();
    loadRecentTables();
  }, []);

  const fetchConnections = async () => {
    try {
      const res = await fetch('/api/connections');
      const data = await res.json();
      if (data.success) {
        setConnections(data.data);
      }
    } catch (error) {
      toast({
        title: 'Failed to load connections',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentTables = () => {
    try {
      const stored = localStorage.getItem('pulse-recent-tables');
      if (stored) {
        setRecentTables(JSON.parse(stored).slice(0, 5));
      }
    } catch {
      // Ignore localStorage errors
    }
  };

  const handleConnectionClick = (connectionId: string) => {
    router.push(`/explorer/${connectionId}`);
  };

  const handleRecentTableClick = (item: RecentTable) => {
    router.push(`/explorer/${item.connectionId}/${item.tableName}`);
  };

  const filteredConnections = connections.filter((conn) =>
    conn.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEnvironmentGradient = (env: string) => {
    return env === 'production'
      ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(185, 28, 28, 0.05) 100%)'
      : 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(22, 163, 74, 0.05) 100%)';
  };

  return (
    <Box minH="calc(100vh - 120px)" py={8}>
      <Container maxW="6xl">
        <VStack spacing={8} align="stretch">
          {/* Hero Section */}
          <VStack spacing={4} textAlign="center" py={8}>
            <Box
              p={4}
              borderRadius="2xl"
              bg="linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(13, 148, 136, 0.1) 100%)"
              backdropFilter="blur(10px)"
              border="1px solid"
              borderColor="rgba(20, 184, 166, 0.3)"
              boxShadow="0 8px 32px rgba(20, 184, 166, 0.1)"
              transition="all 0.3s"
              _hover={{
                transform: 'scale(1.05)',
                boxShadow: '0 12px 40px rgba(20, 184, 166, 0.2)',
              }}
            >
              <Box color="teal.400">
                <DatabaseIcon />
              </Box>
            </Box>
            <Heading 
              size="xl" 
              color="white" 
              fontWeight="bold"
              bgGradient="linear(to-r, white, teal.200)"
              bgClip="text"
            >
              Data Explorer
            </Heading>
            <Text color="surface.400" maxW="md">
              Browse, view, and edit your database records with a beautiful interface.
              Select a connection to get started.
            </Text>
          </VStack>

          {/* Search */}
          <InputGroup maxW="md" mx="auto">
            <InputLeftElement pointerEvents="none">
              <Box color="surface.500"><SearchIcon /></Box>
            </InputLeftElement>
            <Input
              placeholder="Search connections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg="surface.800"
              border="1px solid"
              borderColor="surface.700"
              _hover={{ borderColor: 'surface.600' }}
              _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px var(--chakra-colors-teal-500)' }}
            />
          </InputGroup>

          {/* Recent Tables */}
          {recentTables.length > 0 && !searchQuery && (
            <Box>
              <HStack mb={3} spacing={2}>
                <ClockIcon />
                <Text fontSize="sm" fontWeight="medium" color="surface.400">
                  Recently Viewed
                </Text>
              </HStack>
              <Flex gap={2} flexWrap="wrap">
                {recentTables.map((item, index) => (
                  <Box
                    key={`${item.connectionId}-${item.tableName}-${index}`}
                    px={3}
                    py={2}
                    bg="surface.800"
                    borderRadius="lg"
                    border="1px solid"
                    borderColor="surface.700"
                    cursor="pointer"
                    onClick={() => handleRecentTableClick(item)}
                    _hover={{ borderColor: 'teal.500', bg: 'surface.750' }}
                    transition="all 0.2s"
                  >
                    <HStack spacing={2}>
                      <Box color="surface.500"><TableIcon /></Box>
                      <Text fontSize="sm" color="white">{item.tableName}</Text>
                      <Text fontSize="xs" color="surface.500">in {item.connectionName}</Text>
                    </HStack>
                  </Box>
                ))}
              </Flex>
            </Box>
          )}

          <Divider borderColor="surface.700" />

          {/* Connections Grid */}
          <Box>
            <HStack mb={4} justify="space-between">
              <HStack spacing={2}>
                <DatabaseIcon />
                <Heading size="md" color="white">
                  Your Connections
                </Heading>
              </HStack>
              <Text fontSize="sm" color="surface.500">
                {filteredConnections.length} connection{filteredConnections.length !== 1 ? 's' : ''}
              </Text>
            </HStack>

            {isLoading ? (
              <Flex justify="center" py={12}>
                <Spinner size="lg" color="teal.400" />
              </Flex>
            ) : filteredConnections.length === 0 ? (
              <Card bg="surface.800" borderColor="surface.700">
                <CardBody py={12} textAlign="center">
                  <VStack spacing={4}>
                    <Box color="surface.500" opacity={0.5}>
                      <DatabaseIcon />
                    </Box>
                    <Text color="surface.400">
                      {searchQuery ? 'No connections match your search' : 'No connections yet'}
                    </Text>
                    {!searchQuery && (
                      <Text fontSize="sm" color="surface.500">
                        Add a connection from the main dashboard to start exploring
                      </Text>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {filteredConnections.map((conn, index) => (
                  <MotionCard
                    key={conn.id}
                    bg="surface.800"
                    borderColor="surface.700"
                    borderWidth="1px"
                    cursor="pointer"
                    onClick={() => handleConnectionClick(conn.id)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    _hover={{
                      borderColor: conn.environment === 'production' ? 'red.500' : 'green.500',
                      transform: 'translateY(-4px)',
                      boxShadow: 'lg',
                    }}
                    style={{ transition: 'all 0.2s' }}
                    overflow="hidden"
                  >
                    {/* Gradient Header */}
                    <Box
                      h="4px"
                      bg={conn.environment === 'production' 
                        ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                        : 'linear-gradient(90deg, #22c55e, #16a34a)'}
                    />
                    <CardBody
                      bg={getEnvironmentGradient(conn.environment)}
                    >
                      <VStack align="stretch" spacing={4}>
                        <Flex justify="space-between" align="start">
                          <VStack align="start" spacing={1}>
                            <Heading size="md" color="white" noOfLines={1}>
                              {conn.name}
                            </Heading>
                            <Badge
                              colorScheme={conn.environment === 'production' ? 'red' : 'green'}
                              fontSize="xs"
                              textTransform="lowercase"
                            >
                              {conn.environment}
                            </Badge>
                          </VStack>
                          <Box
                            p={2}
                            borderRadius="lg"
                            bg={conn.environment === 'production' ? 'red.900' : 'green.900'}
                            color={conn.environment === 'production' ? 'red.300' : 'green.300'}
                          >
                            <DatabaseIcon />
                          </Box>
                        </Flex>

                        <Divider borderColor="surface.700" />

                        <Flex justify="space-between" align="center">
                          <Text fontSize="xs" color="surface.500">
                            Added {new Date(conn.createdAt).toLocaleDateString()}
                          </Text>
                          <HStack spacing={1} color="teal.400">
                            <Text fontSize="sm" fontWeight="medium">
                              Explore
                            </Text>
                            <ArrowRightIcon />
                          </HStack>
                        </Flex>
                      </VStack>
                    </CardBody>
                  </MotionCard>
                ))}
              </SimpleGrid>
            )}
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}

