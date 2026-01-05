'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth-context';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Grid,
  GridItem,
  Card,
  CardBody,
  Badge,
  Spinner,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Flex,
  Divider,
  Kbd,
  Tooltip,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);
const MotionCard = motion.create(Card);

// Icons
const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const DatabaseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);

const SyncIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const MoreIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="1"/>
    <circle cx="19" cy="12" r="1"/>
    <circle cx="5" cy="12" r="1"/>
  </svg>
);

const SchemaSyncIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 3h5v5"/>
    <path d="M8 3H3v5"/>
    <path d="M21 3l-7 7"/>
    <path d="M3 3l7 7"/>
    <path d="M16 21h5v-5"/>
    <path d="M8 21H3v-5"/>
    <path d="M21 21l-7-7"/>
    <path d="M3 21l7-7"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const CommandIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
  </svg>
);

const ArrowRightIconSmall = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

interface SyncJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  direction: 'one_way' | 'two_way';
  createdAt: string;
  completedAt?: string;
  sourceConnection?: { name: string; environment: string };
  targetConnection?: { name: string; environment: string };
  progress?: {
    totalTables: number;
    completedTables: number;
    processedRows: number;
  };
}

const statusColors: Record<string, string> = {
  pending: 'yellow',
  running: 'blue',
  completed: 'green',
  failed: 'red',
  paused: 'orange',
};

export default function DashboardPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const toast = useToast();
  const { user, signOut, isLoading: authLoading } = useAuth();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [connectionsRes, syncJobsRes] = await Promise.all([
        fetch('/api/connections'),
        fetch('/api/sync'),
      ]);

      const connectionsData = await connectionsRes.json();
      const syncJobsData = await syncJobsRes.json();

      if (connectionsData.success) {
        setConnections(connectionsData.data);
      }
      if (syncJobsData.success) {
        setSyncJobs(syncJobsData.data);
      }
    } catch (error) {
      toast({
        title: 'Failed to load data',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      toast({
        title: 'Logout failed',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const stats = {
    totalConnections: connections.length,
    productionConnections: connections.filter(c => c.environment === 'production').length,
    totalSyncs: syncJobs.length,
    completedSyncs: syncJobs.filter(j => j.status === 'completed').length,
    runningSyncs: syncJobs.filter(j => j.status === 'running').length,
    failedSyncs: syncJobs.filter(j => j.status === 'failed').length,
  };

  return (
    <Box minH="100vh" className="gradient-mesh">
      {/* Header */}
      <Box 
        as="header" 
        bg="surface.800" 
        borderBottomWidth="1px" 
        borderColor="surface.700"
        position="sticky"
        top={0}
        zIndex={10}
      >
        <Container maxW="7xl" py={{ base: 3, md: 4 }} px={{ base: 4, md: 6 }}>
          <Flex justify="space-between" align="center">
            <HStack spacing={{ base: 2, md: 3 }}>
              {/* Supapulse Logo */}
              <Box display="flex" alignItems="center" gap={2}>
                <svg 
                  width="32" 
                  height="32" 
                  viewBox="0 0 48 48" 
                  fill="none"
                >
                  <defs>
                    <linearGradient id="hpg" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#14B8A6"/>
                      <stop offset="100%" stopColor="#0D9488"/>
                    </linearGradient>
                    <linearGradient id="hlg" x1="0%" y1="50%" x2="100%" y2="50%">
                      <stop offset="0%" stopColor="#5EEAD4"/>
                      <stop offset="50%" stopColor="#2DD4BF"/>
                      <stop offset="100%" stopColor="#5EEAD4"/>
                    </linearGradient>
                  </defs>
                  <circle cx="24" cy="24" r="22" fill="url(#hpg)"/>
                  <path 
                    d="M8 24 L14 24 L17 18 L20 30 L24 12 L28 36 L31 18 L34 24 L40 24" 
                    stroke="url(#hlg)" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <circle cx="24" cy="12" r="2" fill="#5EEAD4" opacity="0.6"/>
                </svg>
                <Heading size={{ base: 'sm', md: 'md' }} fontWeight="bold" color="white" letterSpacing="-0.02em">
                  Supapulse
                </Heading>
              </Box>
            </HStack>
            <HStack spacing={{ base: 1, md: 2 }}>
              {/* Cmd+K button - opens command palette */}
              <Tooltip label="Press Cmd+K for command palette" hasArrow>
                <Button
                  variant="ghost"
                  size="sm"
                  display={{ base: 'none', md: 'flex' }}
                  color="surface.400"
                  _hover={{ bg: 'surface.700' }}
                  leftIcon={<CommandIcon />}
                  onClick={() => (window as any).__openCommandPalette?.()}
                >
                  <HStack spacing={1}>
                    <Kbd bg="surface.700" fontSize="xs">Cmd</Kbd>
                    <Kbd bg="surface.700" fontSize="xs">K</Kbd>
                  </HStack>
                </Button>
              </Tooltip>
              <IconButton
                aria-label="Refresh"
                icon={<RefreshIcon />}
                variant="ghost"
                onClick={fetchData}
                isLoading={isLoading}
                size={{ base: 'sm', md: 'md' }}
              />
              <IconButton
                aria-label="Settings"
                icon={<SettingsIcon />}
                variant="ghost"
                onClick={() => router.push('/settings')}
                size={{ base: 'sm', md: 'md' }}
              />
              <Divider orientation="vertical" h="24px" display={{ base: 'none', md: 'block' }} borderColor="surface.600" />
              <HStack spacing={2} display={{ base: 'none', md: 'flex' }}>
                <Text fontSize="sm" color="surface.400" isTruncated maxW="180px">
                  {user?.email || 'Loading...'}
                </Text>
              </HStack>
              <Button
                leftIcon={<LogoutIcon />}
                variant="ghost"
                size={{ base: 'sm', md: 'md' }}
                onClick={handleLogout}
              >
                <Text display={{ base: 'none', sm: 'inline' }}>Logout</Text>
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="7xl" py={{ base: 4, md: 8 }} px={{ base: 4, md: 6 }}>
        <VStack spacing={{ base: 4, md: 8 }} align="stretch">
          {/* Stats Grid */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={{ base: 3, md: 4 }}>
              <GridItem>
                <Card bg="surface.800" borderColor="surface.700">
                  <CardBody p={{ base: 3, md: 4 }}>
                    <Stat>
                      <StatLabel color="surface.400" fontSize={{ base: 'xs', md: 'sm' }}>Connections</StatLabel>
                      <StatNumber color="white" fontSize={{ base: 'xl', md: '3xl' }}>{stats.totalConnections}</StatNumber>
                      <StatHelpText color="surface.500" fontSize={{ base: 'xs', md: 'sm' }}>
                        {stats.productionConnections} prod
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </GridItem>
              <GridItem>
                <Card bg="surface.800" borderColor="surface.700">
                  <CardBody p={{ base: 3, md: 4 }}>
                    <Stat>
                      <StatLabel color="surface.400" fontSize={{ base: 'xs', md: 'sm' }}>Syncs</StatLabel>
                      <StatNumber color="white" fontSize={{ base: 'xl', md: '3xl' }}>{stats.totalSyncs}</StatNumber>
                      <StatHelpText color="green.400" fontSize={{ base: 'xs', md: 'sm' }}>
                        {stats.completedSyncs} done
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </GridItem>
              <GridItem>
                <Card bg="surface.800" borderColor="surface.700">
                  <CardBody p={{ base: 3, md: 4 }}>
                    <Stat>
                      <StatLabel color="surface.400" fontSize={{ base: 'xs', md: 'sm' }}>Running</StatLabel>
                      <StatNumber color="blue.400" fontSize={{ base: 'xl', md: '3xl' }}>{stats.runningSyncs}</StatNumber>
                      <StatHelpText color="surface.500" fontSize={{ base: 'xs', md: 'sm' }}>
                        active
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </GridItem>
              <GridItem>
                <Card bg="surface.800" borderColor="surface.700">
                  <CardBody p={{ base: 3, md: 4 }}>
                    <Stat>
                      <StatLabel color="surface.400" fontSize={{ base: 'xs', md: 'sm' }}>Failed</StatLabel>
                      <StatNumber color="red.400" fontSize={{ base: 'xl', md: '3xl' }}>{stats.failedSyncs}</StatNumber>
                      <StatHelpText color="surface.500" fontSize={{ base: 'xs', md: 'sm' }}>
                        errors
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </GridItem>
            </Grid>
          </MotionBox>

          {/* Action Buttons */}
          <Flex gap={{ base: 2, md: 4 }} direction={{ base: 'column', sm: 'row' }} flexWrap="wrap">
            <Button
              leftIcon={<PlusIcon />}
              colorScheme="teal"
              onClick={() => router.push('/sync/create')}
              size={{ base: 'md', md: 'md' }}
              w={{ base: '100%', sm: 'auto' }}
            >
              New Sync Job
            </Button>
            <Button
              leftIcon={<SchemaSyncIcon />}
              colorScheme="purple"
              variant="solid"
              onClick={() => router.push('/schema-sync')}
              size={{ base: 'md', md: 'md' }}
              w={{ base: '100%', sm: 'auto' }}
            >
              Schema Sync
            </Button>
            <Button
              leftIcon={<DatabaseIcon />}
              colorScheme="cyan"
              variant="solid"
              onClick={() => router.push('/explorer')}
              size={{ base: 'md', md: 'md' }}
              w={{ base: '100%', sm: 'auto' }}
            >
              Data Explorer
            </Button>
            <Button
              leftIcon={<DatabaseIcon />}
              variant="outline"
              onClick={() => router.push('/connections')}
              size={{ base: 'md', md: 'md' }}
              w={{ base: '100%', sm: 'auto' }}
            >
              Manage Connections
            </Button>
          </Flex>

          <Divider borderColor="surface.700" />

          {/* Recent Sync Jobs */}
          <Box>
            <Heading size={{ base: 'sm', md: 'md' }} color="white" mb={{ base: 3, md: 4 }}>
              Recent Sync Jobs
            </Heading>

            {isLoading ? (
              <Flex justify="center" py={8}>
                <Spinner size="lg" color="brand.400" />
              </Flex>
            ) : syncJobs.length === 0 ? (
              <Card bg="surface.800" borderColor="surface.700">
                <CardBody>
                  <VStack spacing={4} py={{ base: 6, md: 8 }}>
                    <Box color="surface.500">
                      <SyncIcon />
                    </Box>
                    <Text color="surface.400" fontSize={{ base: 'sm', md: 'md' }}>No sync jobs yet</Text>
                    <Button
                      size="sm"
                      leftIcon={<PlusIcon />}
                      colorScheme="teal"
                      onClick={() => router.push('/sync/create')}
                    >
                      Create your first sync
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            ) : (
              <VStack spacing={{ base: 2, md: 3 }} align="stretch">
                {syncJobs.slice(0, 10).map((job, index) => (
                  <MotionCard
                    key={job.id}
                    bg="surface.800"
                    borderColor="surface.700"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    cursor="pointer"
                    onClick={() => router.push(`/sync/${job.id}`)}
                    _hover={{ borderColor: 'brand.500', transform: 'translateY(-2px)' }}
                    style={{ transition: 'all 0.2s' }}
                  >
                    <CardBody p={{ base: 3, md: 4 }}>
                      <Flex 
                        justify="space-between" 
                        align={{ base: 'flex-start', md: 'center' }}
                        direction={{ base: 'column', md: 'row' }}
                        gap={{ base: 2, md: 0 }}
                      >
                        <HStack spacing={{ base: 2, md: 4 }} flex={1} minW={0}>
                          <Badge colorScheme={statusColors[job.status]} fontSize="xs">
                            {job.status.toUpperCase()}
                          </Badge>
                          <VStack align="start" spacing={0} minW={0} flex={1}>
                            <HStack 
                              color="white" 
                              fontWeight="medium" 
                              fontSize={{ base: 'sm', md: 'md' }}
                              maxW="100%"
                              spacing={1}
                            >
                              <Text isTruncated>{job.sourceConnection?.name || 'Unknown'}</Text>
                              <Box flexShrink={0}><ArrowRightIconSmall /></Box>
                              <Text isTruncated>{job.targetConnection?.name || 'Unknown'}</Text>
                            </HStack>
                            <Text color="surface.500" fontSize={{ base: 'xs', md: 'sm' }}>
                              {new Date(job.createdAt).toLocaleDateString()}
                            </Text>
                          </VStack>
                        </HStack>
                        <HStack spacing={{ base: 2, md: 4 }} w={{ base: '100%', md: 'auto' }} justify={{ base: 'space-between', md: 'flex-end' }}>
                          <HStack spacing={2}>
                            <Badge variant="outline" colorScheme="gray" fontSize={{ base: 'xs', md: 'xs' }}>
                              {job.direction === 'one_way' ? '1-way' : '2-way'}
                            </Badge>
                            {job.progress && (
                              <Text color="surface.400" fontSize={{ base: 'xs', md: 'sm' }} display={{ base: 'none', sm: 'block' }}>
                                {job.progress.completedTables}/{job.progress.totalTables} tables
                              </Text>
                            )}
                          </HStack>
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              icon={<MoreIcon />}
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <MenuList bg="surface.800" borderColor="surface.700">
                              <MenuItem 
                                bg="surface.800" 
                                _hover={{ bg: 'surface.700' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/sync/${job.id}`);
                                }}
                              >
                                View Details
                              </MenuItem>
                              {job.status === 'failed' && (
                                <MenuItem 
                                  bg="surface.800" 
                                  _hover={{ bg: 'surface.700' }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Retry
                                </MenuItem>
                              )}
                            </MenuList>
                          </Menu>
                        </HStack>
                      </Flex>
                    </CardBody>
                  </MotionCard>
                ))}
              </VStack>
            )}
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}

