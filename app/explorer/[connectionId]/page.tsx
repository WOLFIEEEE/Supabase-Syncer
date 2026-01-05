'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  IconButton,
  Tooltip,
  Divider,
  Progress,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import ActivityFeed from '@/components/explorer/ActivityFeed';

const MotionCard = motion.create(Card);

// Icons
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const TableIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <line x1="3" y1="9" x2="21" y2="9"/>
    <line x1="3" y1="15" x2="21" y2="15"/>
    <line x1="9" y1="3" x2="9" y2="21"/>
  </svg>
);

const RowsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const ColumnsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="6" y1="3" x2="6" y2="21"/>
    <line x1="12" y1="3" x2="12" y2="21"/>
    <line x1="18" y1="3" x2="18" y2="21"/>
  </svg>
);

const KeyIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
);

const LinkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

// Get smart icon based on table name
const getTableIcon = (tableName: string) => {
  const name = tableName.toLowerCase();
  
  if (name.includes('user') || name.includes('profile') || name.includes('account')) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    );
  }
  if (name.includes('order') || name.includes('purchase') || name.includes('transaction')) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="9" cy="21" r="1"/>
        <circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
    );
  }
  if (name.includes('product') || name.includes('item') || name.includes('inventory')) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    );
  }
  if (name.includes('message') || name.includes('chat') || name.includes('notification')) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    );
  }
  if (name.includes('setting') || name.includes('config') || name.includes('preference')) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    );
  }
  if (name.includes('log') || name.includes('audit') || name.includes('history')) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    );
  }
  
  return <TableIcon />;
};

// Get color scheme based on table name
const getTableColorScheme = (tableName: string): { bg: string; border: string; icon: string } => {
  const name = tableName.toLowerCase();
  
  if (name.includes('user') || name.includes('profile') || name.includes('account')) {
    return { bg: 'rgba(59, 130, 246, 0.1)', border: 'blue.600', icon: 'blue.400' };
  }
  if (name.includes('order') || name.includes('purchase') || name.includes('transaction')) {
    return { bg: 'rgba(168, 85, 247, 0.1)', border: 'purple.600', icon: 'purple.400' };
  }
  if (name.includes('product') || name.includes('item') || name.includes('inventory')) {
    return { bg: 'rgba(34, 197, 94, 0.1)', border: 'green.600', icon: 'green.400' };
  }
  if (name.includes('message') || name.includes('chat') || name.includes('notification')) {
    return { bg: 'rgba(251, 191, 36, 0.1)', border: 'yellow.600', icon: 'yellow.400' };
  }
  if (name.includes('setting') || name.includes('config')) {
    return { bg: 'rgba(156, 163, 175, 0.1)', border: 'gray.600', icon: 'gray.400' };
  }
  if (name.includes('log') || name.includes('audit') || name.includes('history')) {
    return { bg: 'rgba(249, 115, 22, 0.1)', border: 'orange.600', icon: 'orange.400' };
  }
  
  return { bg: 'rgba(20, 184, 166, 0.1)', border: 'teal.600', icon: 'teal.400' };
};

interface TableInfo {
  name: string;
  rowCount: number;
  columnCount: number;
  sizeBytes: number | null;
  columns: Array<{
    name: string;
    type: string;
    isPrimaryKey: boolean;
  }>;
  hasPrimaryKey: boolean;
  foreignKeyCount: number;
}

interface ConnectionData {
  id: string;
  name: string;
  environment: 'production' | 'development';
}

function formatBytes(bytes: number | null): string {
  if (bytes === null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatRowCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
}

export default function DatabaseOverviewPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [connection, setConnection] = useState<ConnectionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  
  const connectionId = params?.connectionId as string;

  const fetchTables = useCallback(async () => {
    if (!connectionId) return;
    
    setIsLoading(true);
    try {
      const res = await fetch(`/api/explorer/${connectionId}/tables`);
      const data = await res.json();
      
      if (data.success) {
        setTables(data.data.tables);
        setConnection(data.data.connection);
      } else {
        toast({
          title: data.error || 'Failed to load tables',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to load tables',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [connectionId, toast]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const handleTableClick = (tableName: string) => {
    // Save to recent tables
    try {
      const stored = localStorage.getItem('pulse-recent-tables');
      const recent = stored ? JSON.parse(stored) : [];
      const newEntry = {
        connectionId,
        connectionName: connection?.name || '',
        tableName,
        accessedAt: new Date().toISOString(),
      };
      const filtered = recent.filter(
        (r: { connectionId: string; tableName: string }) => 
          !(r.connectionId === connectionId && r.tableName === tableName)
      );
      localStorage.setItem('pulse-recent-tables', JSON.stringify([newEntry, ...filtered].slice(0, 10)));
    } catch {
      // Ignore localStorage errors
    }
    
    router.push(`/explorer/${connectionId}/${encodeURIComponent(tableName)}`);
  };

  const filteredTables = tables.filter((table) =>
    table.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const totalRows = tables.reduce((sum, t) => sum + t.rowCount, 0);
  const totalSize = tables.reduce((sum, t) => sum + (t.sizeBytes || 0), 0);

  return (
    <Box minH="calc(100vh - 120px)" py={6}>
      <Container maxW="7xl">
        <VStack spacing={6} align="stretch">
          {/* Stats Bar */}
          {!isLoading && (
            <Flex 
              gap={6} 
              p={4} 
              bg="surface.800" 
              borderRadius="xl" 
              border="1px solid" 
              borderColor="surface.700"
              flexWrap="wrap"
            >
              <VStack align="start" spacing={0}>
                <Text fontSize="2xl" fontWeight="bold" color="white">
                  {tables.length}
                </Text>
                <Text fontSize="xs" color="surface.400">Tables</Text>
              </VStack>
              <Divider orientation="vertical" h="40px" borderColor="surface.600" />
              <VStack align="start" spacing={0}>
                <Text fontSize="2xl" fontWeight="bold" color="white">
                  {formatRowCount(totalRows)}
                </Text>
                <Text fontSize="xs" color="surface.400">Total Rows</Text>
              </VStack>
              <Divider orientation="vertical" h="40px" borderColor="surface.600" />
              <VStack align="start" spacing={0}>
                <Text fontSize="2xl" fontWeight="bold" color="white">
                  {formatBytes(totalSize)}
                </Text>
                <Text fontSize="xs" color="surface.400">Database Size</Text>
              </VStack>
              <Box flex={1} />
              <HStack>
                <InputGroup maxW="250px">
                  <InputLeftElement pointerEvents="none">
                    <Box color="surface.500"><SearchIcon /></Box>
                  </InputLeftElement>
                  <Input
                    placeholder="Filter tables..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    bg="surface.900"
                    border="1px solid"
                    borderColor="surface.700"
                    size="sm"
                    _hover={{ borderColor: 'surface.600' }}
                    _focus={{ borderColor: 'teal.500' }}
                  />
                </InputGroup>
                <Tooltip label="Refresh" hasArrow>
                  <IconButton
                    aria-label="Refresh"
                    icon={<RefreshIcon />}
                    variant="ghost"
                    size="sm"
                    onClick={fetchTables}
                    isLoading={isLoading}
                  />
                </Tooltip>
              </HStack>
            </Flex>
          )}

          {/* Activity Feed - Only show if we have a connection */}
          {connection && (
            <Box maxW="400px">
              <ActivityFeed connectionId={connectionId} maxItems={10} />
            </Box>
          )}

          {/* Tables Grid */}
          {isLoading ? (
            <Flex justify="center" py={20}>
              <VStack spacing={4}>
                <Spinner size="xl" color="teal.400" thickness="3px" />
                <Text color="surface.400">Loading tables...</Text>
              </VStack>
            </Flex>
          ) : filteredTables.length === 0 ? (
            <Card bg="surface.800" borderColor="surface.700">
              <CardBody py={16} textAlign="center">
                <VStack spacing={4}>
                  <Box color="surface.500" opacity={0.5}>
                    <TableIcon />
                  </Box>
                  <Text color="surface.400">
                    {searchQuery ? 'No tables match your filter' : 'No tables found in this database'}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={4}>
              {filteredTables.map((table, index) => {
                const colorScheme = getTableColorScheme(table.name);
                
                return (
                  <MotionCard
                    key={table.name}
                    bg="surface.800"
                    borderWidth="1px"
                    borderColor="surface.700"
                    cursor="pointer"
                    onClick={() => handleTableClick(table.name)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    _hover={{
                      borderColor: colorScheme.border,
                      transform: 'translateY(-2px)',
                      boxShadow: 'lg',
                    }}
                    style={{ transition: 'all 0.2s' }}
                    overflow="hidden"
                  >
                    {/* Top gradient bar */}
                    <Progress
                      value={100}
                      size="xs"
                      bg="transparent"
                      sx={{
                        '& > div': {
                          background: `linear-gradient(90deg, ${colorScheme.icon}, transparent)`,
                        },
                      }}
                    />
                    
                    <CardBody bg={colorScheme.bg}>
                      <VStack align="stretch" spacing={3}>
                        {/* Header */}
                        <Flex justify="space-between" align="start">
                          <VStack align="start" spacing={1} flex={1} minW={0}>
                            <Heading 
                              size="sm" 
                              color="white" 
                              fontFamily="mono"
                              noOfLines={1}
                              title={table.name}
                            >
                              {table.name}
                            </Heading>
                            <HStack spacing={2}>
                              {table.hasPrimaryKey && (
                                <Tooltip label="Has primary key" hasArrow>
                                  <Box color="yellow.400"><KeyIcon /></Box>
                                </Tooltip>
                              )}
                              {table.foreignKeyCount > 0 && (
                                <Tooltip label={`${table.foreignKeyCount} foreign key(s)`} hasArrow>
                                  <HStack spacing={0.5} color="purple.400">
                                    <LinkIcon />
                                    <Text fontSize="xs">{table.foreignKeyCount}</Text>
                                  </HStack>
                                </Tooltip>
                              )}
                            </HStack>
                          </VStack>
                          <Box color={colorScheme.icon} opacity={0.8}>
                            {getTableIcon(table.name)}
                          </Box>
                        </Flex>

                        {/* Stats */}
                        <HStack spacing={4} divider={<Divider orientation="vertical" h="16px" borderColor="surface.600" />}>
                          <HStack spacing={1}>
                            <Box color="surface.500"><RowsIcon /></Box>
                            <Text fontSize="sm" color="surface.300" fontFamily="mono">
                              {formatRowCount(table.rowCount)}
                            </Text>
                          </HStack>
                          <HStack spacing={1}>
                            <Box color="surface.500"><ColumnsIcon /></Box>
                            <Text fontSize="sm" color="surface.300" fontFamily="mono">
                              {table.columnCount}
                            </Text>
                          </HStack>
                          <Text fontSize="xs" color="surface.500">
                            {formatBytes(table.sizeBytes)}
                          </Text>
                        </HStack>

                        {/* Column preview */}
                        <Box>
                          <Text fontSize="xs" color="surface.500" mb={1}>
                            Columns
                          </Text>
                          <HStack spacing={1} flexWrap="wrap">
                            {table.columns.slice(0, 3).map((col) => (
                              <Badge
                                key={col.name}
                                variant="subtle"
                                colorScheme={col.isPrimaryKey ? 'yellow' : 'gray'}
                                fontSize="xs"
                                fontFamily="mono"
                              >
                                {col.name}
                              </Badge>
                            ))}
                            {table.columnCount > 3 && (
                              <Badge variant="subtle" colorScheme="gray" fontSize="xs">
                                +{table.columnCount - 3}
                              </Badge>
                            )}
                          </HStack>
                        </Box>

                        {/* Footer */}
                        <Flex justify="flex-end" pt={2}>
                          <HStack spacing={1} color="teal.400" fontSize="sm">
                            <Text fontWeight="medium">View Data</Text>
                            <ArrowRightIcon />
                          </HStack>
                        </Flex>
                      </VStack>
                    </CardBody>
                  </MotionCard>
                );
              })}
            </SimpleGrid>
          )}
        </VStack>
      </Container>
    </Box>
  );
}

