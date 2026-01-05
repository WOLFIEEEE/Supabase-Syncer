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
  Button,
  Card,
  CardBody,
  Badge,
  Spinner,
  useToast,
  IconButton,
  Flex,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
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
  Code,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Tooltip,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import React from 'react';

const MotionCard = motion.create(Card);

// Icons
const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const DatabaseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const TableIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <line x1="3" y1="9" x2="21" y2="9"/>
    <line x1="3" y1="15" x2="21" y2="15"/>
    <line x1="9" y1="3" x2="9" y2="21"/>
  </svg>
);

const KeyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
);

const LinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const ZapIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const XCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const HeartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const HeartFilledIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const ActivityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

interface Connection {
  id: string;
  name: string;
  environment: 'production' | 'development';
  createdAt: string;
  updatedAt: string;
}

interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  foreignKeyRef?: string;
}

interface TableInfo {
  name: string;
  columns: TableColumn[];
  rowCount: number;
  primaryKeys: string[];
  foreignKeys: { column: string; references: string }[];
  indexes: string[];
}

interface SchemaData {
  tables: TableInfo[];
  totalTables: number;
  totalRows: number;
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newConnection, setNewConnection] = useState({
    name: '',
    databaseUrl: '',
    environment: 'development' as 'production' | 'development',
  });
  
  // Schema inspection state
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [schemaData, setSchemaData] = useState<SchemaData | null>(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  
  // Connection test state
  const [testingConnectionId, setTestingConnectionId] = useState<string | null>(null);
  
  // Keep-alive state
  const [keepAliveStatus, setKeepAliveStatus] = useState<{
    keepAlive: boolean;
    lastPingedAt: string | null;
  } | null>(null);
  const [isTogglingKeepAlive, setIsTogglingKeepAlive] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isDeleteOpen, 
    onOpen: onDeleteOpen, 
    onClose: onDeleteClose 
  } = useDisclosure();
  const {
    isOpen: isSchemaOpen,
    onOpen: onSchemaOpen,
    onClose: onSchemaClose
  } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null!);
  
  const router = useRouter();
  const toast = useToast();

  const fetchConnections = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/connections');
      const data = await response.json();
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

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchSchema = async (connectionId: string) => {
    setIsLoadingSchema(true);
    setSchemaData(null);
    try {
      const response = await fetch(`/api/connections/${connectionId}/schema`);
      const data = await response.json();
      if (data.success) {
        setSchemaData(data.data);
        if (data.data.tables.length > 0) {
          setSelectedTable(data.data.tables[0].name);
        }
      } else {
        toast({
          title: 'Failed to load schema',
          description: data.error,
          status: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to load schema',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoadingSchema(false);
    }
  };

  const handleInspectConnection = (connection: Connection) => {
    setSelectedConnection(connection);
    setSelectedTable(null);
    setKeepAliveStatus(null);
    onSchemaOpen();
    fetchSchema(connection.id);
    fetchKeepAliveStatus(connection.id);
  };

  const fetchKeepAliveStatus = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/connections/${connectionId}/keep-alive`);
      const data = await response.json();
      if (!data.error) {
        setKeepAliveStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch keep-alive status:', error);
    }
  };

  const handleToggleKeepAlive = async () => {
    if (!selectedConnection || !keepAliveStatus) return;
    
    setIsTogglingKeepAlive(true);
    try {
      const response = await fetch(`/api/connections/${selectedConnection.id}/keep-alive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keepAlive: !keepAliveStatus.keepAlive }),
      });
      const data = await response.json();
      
      if (data.success) {
        setKeepAliveStatus({
          ...keepAliveStatus,
          keepAlive: data.keepAlive,
        });
        toast({
          title: data.keepAlive ? 'Keep-Alive Enabled' : 'Keep-Alive Disabled',
          description: data.message,
          status: 'success',
          duration: 3000,
        });
      } else {
        toast({
          title: 'Failed to update',
          description: data.error,
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to update keep-alive setting',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsTogglingKeepAlive(false);
    }
  };

  const handleManualPing = async () => {
    if (!selectedConnection) return;
    
    setIsPinging(true);
    try {
      const response = await fetch(`/api/connections/${selectedConnection.id}/keep-alive`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        setKeepAliveStatus({
          ...keepAliveStatus!,
          lastPingedAt: new Date().toISOString(),
        });
        toast({
          title: 'Ping Successful',
          description: data.message,
          status: 'success',
          duration: 3000,
        });
      } else {
        toast({
          title: 'Ping Failed',
          description: data.error || data.message,
          status: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to ping database',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsPinging(false);
    }
  };

  const formatLastPinged = (lastPingedAt: string | null): string => {
    if (!lastPingedAt) return 'Never';
    
    const date = new Date(lastPingedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleTestConnection = async (connection: Connection) => {
    setTestingConnectionId(connection.id);
    try {
      const response = await fetch(`/api/connections/${connection.id}/test`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success && data.data.status === 'connected') {
        toast({
          title: 'Connection Successful',
          description: `PostgreSQL ${data.data.version?.split(' ')[1] || ''} • ${data.data.tableCount} tables • ${data.data.responseTime}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Connection Failed',
          description: data.data?.error || data.error || 'Unknown error',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Connection Test Failed',
        description: 'Could not reach the server',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setTestingConnectionId(null);
    }
  };

  const handleCreate = async () => {
    if (!newConnection.name || !newConnection.databaseUrl) {
      toast({
        title: 'Please fill in all fields',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConnection),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Connection created',
          description: `Found ${data.data.syncableTables?.length || 0} syncable tables`,
          status: 'success',
          duration: 3000,
        });
        setNewConnection({ name: '', databaseUrl: '', environment: 'development' });
        onClose();
        fetchConnections();
      } else {
        toast({
          title: 'Failed to create connection',
          description: data.error,
          status: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to create connection',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/connections/${deleteId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Connection deleted',
          status: 'success',
          duration: 3000,
        });
        fetchConnections();
      } else {
        toast({
          title: 'Failed to delete connection',
          description: data.error,
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to delete connection',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setDeleteId(null);
      onDeleteClose();
    }
  };

  const getSelectedTableInfo = () => {
    if (!schemaData || !selectedTable) return null;
    return schemaData.tables.find(t => t.name === selectedTable);
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
          <Flex justify="space-between" align="center" gap={2}>
            <HStack spacing={{ base: 2, md: 4 }} flex={1} minW={0}>
              <IconButton
                aria-label="Back"
                icon={<ArrowLeftIcon />}
                variant="ghost"
                size={{ base: 'sm', md: 'md' }}
                onClick={() => router.push('/')}
              />
              <Heading size={{ base: 'sm', md: 'md' }} color="white" isTruncated>
                Connections
              </Heading>
            </HStack>
            <Button
              leftIcon={<PlusIcon />}
              colorScheme="teal"
              onClick={onOpen}
              size={{ base: 'sm', md: 'md' }}
            >
              <Text display={{ base: 'none', sm: 'inline' }}>Add Connection</Text>
              <Text display={{ base: 'inline', sm: 'none' }}>Add</Text>
            </Button>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="7xl" py={{ base: 4, md: 8 }} px={{ base: 4, md: 6 }}>
        {isLoading ? (
          <Flex justify="center" py={16}>
            <Spinner size="xl" color="brand.400" />
          </Flex>
        ) : connections.length === 0 ? (
          <Card bg="surface.800" borderColor="surface.700">
            <CardBody>
              <VStack spacing={4} py={12}>
                <Box color="surface.500">
                  <DatabaseIcon />
                </Box>
                <Text color="surface.400">No connections configured</Text>
                <Button
                  leftIcon={<PlusIcon />}
                  colorScheme="teal"
                  onClick={onOpen}
                >
                  Add your first connection
                </Button>
              </VStack>
            </CardBody>
          </Card>
        ) : (
          <VStack spacing={4} align="stretch">
            {connections.map((connection, index) => (
              <MotionCard
                key={connection.id}
                bg="surface.800"
                borderColor="surface.700"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                cursor="pointer"
                onClick={() => handleInspectConnection(connection)}
                _hover={{ borderColor: 'brand.500', transform: 'translateY(-2px)' }}
                style={{ transition: 'all 0.2s' }}
              >
                <CardBody p={{ base: 3, md: 4 }}>
                  <Flex 
                    justify="space-between" 
                    align={{ base: 'flex-start', sm: 'center' }}
                    direction={{ base: 'column', sm: 'row' }}
                    gap={{ base: 3, sm: 0 }}
                  >
                    <HStack spacing={{ base: 3, md: 4 }} flex={1} minW={0}>
                      <Box 
                        p={{ base: 2, md: 3 }} 
                        borderRadius="lg" 
                        bg={connection.environment === 'production' ? 'red.900' : 'green.900'}
                        flexShrink={0}
                      >
                        <DatabaseIcon />
                      </Box>
                      <VStack align="start" spacing={0} minW={0} flex={1}>
                        <Text 
                          color="white" 
                          fontWeight="semibold" 
                          fontSize={{ base: 'md', md: 'lg' }}
                          isTruncated
                          maxW="100%"
                        >
                          {connection.name}
                        </Text>
                        <HStack spacing={2}>
                          <Text color="surface.500" fontSize={{ base: 'xs', md: 'sm' }}>
                            Created {new Date(connection.createdAt).toLocaleDateString()}
                          </Text>
                          <Text color="brand.400" fontSize={{ base: 'xs', md: 'sm' }} display={{ base: 'none', md: 'block' }}>
                            • Click to inspect schema
                          </Text>
                        </HStack>
                      </VStack>
                    </HStack>
                    <HStack spacing={2} w={{ base: '100%', sm: 'auto' }} justify={{ base: 'space-between', sm: 'flex-end' }}>
                      <HStack spacing={2}>
                        <Badge 
                          colorScheme={connection.environment === 'production' ? 'red' : 'green'}
                          fontSize={{ base: 'xs', md: 'sm' }}
                          px={{ base: 2, md: 3 }}
                          py={1}
                          borderRadius="md"
                        >
                          {connection.environment.toUpperCase()}
                        </Badge>
                        <Tooltip label="Test Connection" hasArrow>
                          <IconButton
                            aria-label="Test connection"
                            icon={testingConnectionId === connection.id ? <Spinner size="sm" /> : <ZapIcon />}
                            variant="ghost"
                            colorScheme="yellow"
                            size="sm"
                            isLoading={testingConnectionId === connection.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTestConnection(connection);
                            }}
                          />
                        </Tooltip>
                        <Tooltip label="Inspect Schema" hasArrow>
                          <IconButton
                            aria-label="Inspect schema"
                            icon={<EyeIcon />}
                            variant="ghost"
                            colorScheme="teal"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInspectConnection(connection);
                            }}
                          />
                        </Tooltip>
                      </HStack>
                      <IconButton
                        aria-label="Delete connection"
                        icon={<TrashIcon />}
                        variant="ghost"
                        colorScheme="red"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(connection.id);
                          onDeleteOpen();
                        }}
                      />
                    </HStack>
                  </Flex>
                </CardBody>
              </MotionCard>
            ))}
          </VStack>
        )}
      </Container>

      {/* Schema Inspection Modal */}
      <Modal 
        isOpen={isSchemaOpen} 
        onClose={onSchemaClose} 
        size="6xl" 
        scrollBehavior="inside"
      >
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
        <ModalContent bg="surface.800" borderColor="surface.700" maxH="90vh" mx={{ base: 2, md: 4 }}>
          <ModalHeader color="white" pb={2}>
            <HStack spacing={3}>
              <Box 
                p={2} 
                borderRadius="md" 
                bg={selectedConnection?.environment === 'production' ? 'red.900' : 'green.900'}
              >
                <DatabaseIcon />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize={{ base: 'md', md: 'lg' }}>{selectedConnection?.name}</Text>
                <Text fontSize="xs" color="surface.400" fontWeight="normal">
                  Schema Inspector
                </Text>
              </VStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody pb={6}>
            {isLoadingSchema ? (
              <Flex justify="center" align="center" py={16}>
                <VStack spacing={4}>
                  <Spinner size="xl" color="brand.400" />
                  <Text color="surface.400">Loading schema...</Text>
                </VStack>
              </Flex>
            ) : schemaData ? (
              <VStack spacing={6} align="stretch">
                {/* Stats */}
                <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }} gap={4}>
                  <Card bg="surface.900" borderColor="surface.700">
                    <CardBody p={4}>
                      <Stat>
                        <StatLabel color="surface.400" fontSize="xs">Tables</StatLabel>
                        <StatNumber color="white" fontSize={{ base: 'xl', md: '2xl' }}>
                          {schemaData.totalTables}
                        </StatNumber>
                        <StatHelpText color="surface.500" fontSize="xs">
                          syncable tables
                        </StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>
                  <Card bg="surface.900" borderColor="surface.700">
                    <CardBody p={4}>
                      <Stat>
                        <StatLabel color="surface.400" fontSize="xs">Total Rows</StatLabel>
                        <StatNumber color="white" fontSize={{ base: 'xl', md: '2xl' }}>
                          {schemaData.totalRows.toLocaleString()}
                        </StatNumber>
                        <StatHelpText color="surface.500" fontSize="xs">
                          across all tables
                        </StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>
                  <Card bg="surface.900" borderColor="surface.700" display={{ base: 'none', md: 'block' }}>
                    <CardBody p={4}>
                      <Stat>
                        <StatLabel color="surface.400" fontSize="xs">Environment</StatLabel>
                        <StatNumber fontSize={{ base: 'xl', md: '2xl' }}>
                          <Badge 
                            colorScheme={selectedConnection?.environment === 'production' ? 'red' : 'green'}
                            fontSize="md"
                            px={3}
                            py={1}
                          >
                            {selectedConnection?.environment?.toUpperCase()}
                          </Badge>
                        </StatNumber>
                        <StatHelpText color="surface.500" fontSize="xs">
                          database type
                        </StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>
                </Grid>

                {/* Keep-Alive Section */}
                <Card bg="surface.900" borderColor="surface.700" borderWidth="1px">
                  <CardBody p={4}>
                    <Flex 
                      justify="space-between" 
                      align={{ base: 'flex-start', sm: 'center' }}
                      direction={{ base: 'column', sm: 'row' }}
                      gap={3}
                    >
                      <HStack spacing={3} flex={1}>
                        <Box 
                          p={2} 
                          borderRadius="md" 
                          bg={keepAliveStatus?.keepAlive ? 'green.900' : 'surface.800'}
                          color={keepAliveStatus?.keepAlive ? 'green.300' : 'surface.400'}
                        >
                          {keepAliveStatus?.keepAlive ? <HeartFilledIcon /> : <HeartIcon />}
                        </Box>
                        <VStack align="start" spacing={0}>
                          <Text color="white" fontWeight="semibold" fontSize="sm">
                            Keep Database Active
                          </Text>
                          <Text color="surface.400" fontSize="xs">
                            {keepAliveStatus?.keepAlive 
                              ? 'Pings daily to prevent Supabase from pausing your database'
                              : 'Enable to prevent Supabase free tier from pausing inactive databases'}
                          </Text>
                        </VStack>
                      </HStack>
                      
                      <HStack spacing={2}>
                        {keepAliveStatus?.keepAlive && (
                          <VStack align="end" spacing={0} mr={2}>
                            <Text color="surface.400" fontSize="xs">Last Pinged</Text>
                            <Text color="surface.300" fontSize="xs" fontWeight="medium">
                              {formatLastPinged(keepAliveStatus.lastPingedAt)}
                            </Text>
                          </VStack>
                        )}
                        
                        <Tooltip label="Ping database now" hasArrow>
                          <IconButton
                            aria-label="Ping database"
                            icon={isPinging ? <Spinner size="sm" /> : <ActivityIcon />}
                            size="sm"
                            variant="outline"
                            colorScheme="teal"
                            onClick={handleManualPing}
                            isLoading={isPinging}
                            isDisabled={!keepAliveStatus}
                          />
                        </Tooltip>
                        
                        <Button
                          size="sm"
                          colorScheme={keepAliveStatus?.keepAlive ? 'gray' : 'green'}
                          variant={keepAliveStatus?.keepAlive ? 'outline' : 'solid'}
                          onClick={handleToggleKeepAlive}
                          isLoading={isTogglingKeepAlive}
                          isDisabled={!keepAliveStatus}
                          leftIcon={keepAliveStatus?.keepAlive ? <XCircleIcon /> : <HeartFilledIcon />}
                        >
                          {keepAliveStatus?.keepAlive ? 'Disable' : 'Enable'}
                        </Button>
                      </HStack>
                    </Flex>
                    
                    {keepAliveStatus?.keepAlive && (
                      <Box mt={3} pt={3} borderTopWidth="1px" borderColor="surface.700">
                        <HStack spacing={2} flexWrap="wrap">
                          <Badge colorScheme="green" variant="subtle">
                            <HStack spacing={1}>
                              <CheckCircleIcon />
                              <Text>Auto-ping enabled</Text>
                            </HStack>
                          </Badge>
                          <Badge colorScheme="blue" variant="subtle">
                            Daily at midnight UTC
                          </Badge>
                          <Badge colorScheme="purple" variant="subtle">
                            Via Vercel Cron
                          </Badge>
                        </HStack>
                      </Box>
                    )}
                    
                    {/* Expandable explanation section */}
                    <Accordion allowToggle mt={4}>
                      <AccordionItem border="none">
                        <AccordionButton 
                          px={0} 
                          py={2} 
                          _hover={{ bg: 'transparent' }}
                          color="surface.400"
                          fontSize="sm"
                        >
                          <HStack spacing={2} flex={1}>
                            <InfoIcon />
                            <Text>Learn how Keep-Alive works</Text>
                          </HStack>
                          <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel px={0} pb={4}>
                          <VStack 
                            align="stretch" 
                            spacing={4} 
                            bg="surface.800" 
                            p={4} 
                            borderRadius="md"
                            fontSize="sm"
                          >
                            {/* What is it */}
                            <Box>
                              <Text color="teal.300" fontWeight="semibold" mb={1}>
                                🤔 What is Keep-Alive?
                              </Text>
                              <Text color="surface.300" lineHeight="tall">
                                Supabase automatically pauses free-tier databases after 1 week of inactivity 
                                to save resources. Keep-Alive prevents this by sending periodic health checks 
                                to your database, keeping it active and responsive.
                              </Text>
                            </Box>
                            
                            {/* What happens when enabled */}
                            <Box>
                              <Text color="teal.300" fontWeight="semibold" mb={1}>
                                ✅ What happens when enabled?
                              </Text>
                              <VStack align="stretch" spacing={2} color="surface.300" pl={2}>
                                <HStack align="start" spacing={2}>
                                  <Text color="green.400">•</Text>
                                  <Text>A lightweight query (<Code fontSize="xs" bg="surface.700" px={1}>SELECT 1</Code>) is sent to your database once daily at midnight UTC</Text>
                                </HStack>
                                <HStack align="start" spacing={2}>
                                  <Text color="green.400">•</Text>
                                  <Text>This counts as activity, preventing Supabase from pausing your database</Text>
                                </HStack>
                                <HStack align="start" spacing={2}>
                                  <Text color="green.400">•</Text>
                                  <Text>Ping results are logged so you can monitor database health</Text>
                                </HStack>
                                <HStack align="start" spacing={2}>
                                  <Text color="green.400">•</Text>
                                  <Text>You&apos;ll see the last ping time and can manually trigger pings anytime</Text>
                                </HStack>
                              </VStack>
                            </Box>
                            
                            {/* How it works */}
                            <Box>
                              <Text color="teal.300" fontWeight="semibold" mb={1}>
                                ⚙️ How does it work?
                              </Text>
                              <VStack align="stretch" spacing={2} color="surface.300" pl={2}>
                                <HStack align="start" spacing={2}>
                                  <Text color="blue.400">1.</Text>
                                  <Text>A Vercel Cron job runs once daily at midnight UTC (0:00 UTC)</Text>
                                </HStack>
                                <HStack align="start" spacing={2}>
                                  <Text color="blue.400">2.</Text>
                                  <Text>It finds all databases with Keep-Alive enabled</Text>
                                </HStack>
                                <HStack align="start" spacing={2}>
                                  <Text color="blue.400">3.</Text>
                                  <Text>Connects to each database and runs a simple health check query</Text>
                                </HStack>
                                <HStack align="start" spacing={2}>
                                  <Text color="blue.400">4.</Text>
                                  <Text>Records the result (success/failure, response time) in the logs</Text>
                                </HStack>
                              </VStack>
                            </Box>
                            
                            {/* Important notes */}
                            <Box 
                              bg="yellow.900" 
                              borderLeft="3px solid" 
                              borderColor="yellow.500" 
                              p={3} 
                              borderRadius="md"
                            >
                              <Text color="yellow.200" fontWeight="semibold" mb={1}>
                                ⚠️ Important Notes
                              </Text>
                              <VStack align="stretch" spacing={1} color="yellow.100" fontSize="xs">
                                <Text>• This feature uses minimal resources - just a simple query once daily</Text>
                                <Text>• Your database credentials are encrypted and never exposed</Text>
                                <Text>• If pings fail repeatedly, check your database status in Supabase dashboard</Text>
                                <Text>• Paid Supabase plans don&apos;t pause databases, but Keep-Alive still works for health monitoring</Text>
                              </VStack>
                            </Box>
                          </VStack>
                        </AccordionPanel>
                      </AccordionItem>
                    </Accordion>
                  </CardBody>
                </Card>

                <Divider borderColor="surface.700" />

                {/* Tables List and Details */}
                <Flex direction={{ base: 'column', lg: 'row' }} gap={4}>
                  {/* Table List */}
                  <Box 
                    w={{ base: '100%', lg: '280px' }} 
                    flexShrink={0}
                    bg="surface.900"
                    borderRadius="md"
                    p={3}
                    maxH={{ base: '200px', lg: '500px' }}
                    overflowY="auto"
                  >
                    <Text color="surface.400" fontSize="xs" fontWeight="bold" mb={2} px={2}>
                      TABLES ({schemaData.tables.length})
                    </Text>
                    <VStack spacing={1} align="stretch">
                      {schemaData.tables.map((table) => (
                        <Button
                          key={table.name}
                          variant={selectedTable === table.name ? 'solid' : 'ghost'}
                          colorScheme={selectedTable === table.name ? 'teal' : 'gray'}
                          size="sm"
                          justifyContent="space-between"
                          onClick={() => setSelectedTable(table.name)}
                          px={3}
                        >
                          <HStack spacing={2} flex={1} minW={0}>
                            <TableIcon />
                            <Text isTruncated fontSize="sm">{table.name}</Text>
                          </HStack>
                          <Badge 
                            colorScheme="gray" 
                            fontSize="xs"
                            ml={2}
                          >
                            {table.rowCount.toLocaleString()}
                          </Badge>
                        </Button>
                      ))}
                    </VStack>
                  </Box>

                  {/* Table Details */}
                  <Box flex={1} minW={0}>
                    {getSelectedTableInfo() ? (
                      <VStack spacing={4} align="stretch">
                        <HStack justify="space-between" flexWrap="wrap" gap={2}>
                          <HStack spacing={2}>
                            <TableIcon />
                            <Heading size="sm" color="white">
                              {getSelectedTableInfo()?.name}
                            </Heading>
                          </HStack>
                          <HStack spacing={2} flexWrap="wrap">
                            <Badge colorScheme="blue">
                              {getSelectedTableInfo()?.columns.length} columns
                            </Badge>
                            <Badge colorScheme="purple">
                              {getSelectedTableInfo()?.rowCount.toLocaleString()} rows
                            </Badge>
                          </HStack>
                        </HStack>

                        <Tabs colorScheme="teal" size="sm">
                          <TabList overflowX="auto" flexWrap="nowrap">
                            <Tab fontSize={{ base: 'xs', md: 'sm' }}>Columns</Tab>
                            <Tab fontSize={{ base: 'xs', md: 'sm' }}>Keys & Indexes</Tab>
                          </TabList>
                          
                          <TabPanels>
                            {/* Columns Tab */}
                            <TabPanel px={0}>
                              <Box overflowX="auto">
                                <Table size="sm" variant="simple">
                                  <Thead>
                                    <Tr>
                                      <Th color="surface.400" borderColor="surface.700">Column</Th>
                                      <Th color="surface.400" borderColor="surface.700">Type</Th>
                                      <Th color="surface.400" borderColor="surface.700" display={{ base: 'none', md: 'table-cell' }}>Nullable</Th>
                                      <Th color="surface.400" borderColor="surface.700" display={{ base: 'none', lg: 'table-cell' }}>Default</Th>
                                    </Tr>
                                  </Thead>
                                  <Tbody>
                                    {getSelectedTableInfo()?.columns.map((col) => (
                                      <Tr key={col.name}>
                                        <Td borderColor="surface.700">
                                          <HStack spacing={2}>
                                            {col.isPrimaryKey && (
                                              <Tooltip label="Primary Key" hasArrow>
                                                <Box color="yellow.400"><KeyIcon /></Box>
                                              </Tooltip>
                                            )}
                                            {col.isForeignKey && (
                                              <Tooltip label={`FK: ${col.foreignKeyRef}`} hasArrow>
                                                <Box color="blue.400"><LinkIcon /></Box>
                                              </Tooltip>
                                            )}
                                            <Code 
                                              bg="transparent" 
                                              color="white" 
                                              fontSize={{ base: 'xs', md: 'sm' }}
                                            >
                                              {col.name}
                                            </Code>
                                          </HStack>
                                        </Td>
                                        <Td borderColor="surface.700">
                                          <Code 
                                            colorScheme="teal" 
                                            fontSize={{ base: 'xs', md: 'sm' }}
                                          >
                                            {col.type}
                                          </Code>
                                        </Td>
                                        <Td borderColor="surface.700" display={{ base: 'none', md: 'table-cell' }}>
                                          <Badge colorScheme={col.nullable ? 'gray' : 'orange'} fontSize="xs">
                                            {col.nullable ? 'NULL' : 'NOT NULL'}
                                          </Badge>
                                        </Td>
                                        <Td borderColor="surface.700" display={{ base: 'none', lg: 'table-cell' }}>
                                          {col.defaultValue ? (
                                            <Code fontSize="xs" bg="surface.700" color="surface.300">
                                              {col.defaultValue.length > 30 
                                                ? col.defaultValue.substring(0, 30) + '...' 
                                                : col.defaultValue}
                                            </Code>
                                          ) : (
                                            <Text color="surface.500" fontSize="xs">—</Text>
                                          )}
                                        </Td>
                                      </Tr>
                                    ))}
                                  </Tbody>
                                </Table>
                              </Box>
                            </TabPanel>

                            {/* Keys & Indexes Tab */}
                            <TabPanel px={0}>
                              <VStack spacing={4} align="stretch">
                                {/* Primary Keys */}
                                <Box>
                                  <Text color="surface.400" fontSize="xs" fontWeight="bold" mb={2}>
                                    PRIMARY KEYS
                                  </Text>
                                  <HStack spacing={2} flexWrap="wrap">
                                    {getSelectedTableInfo()?.primaryKeys.map((pk) => (
                                      <Badge key={pk} colorScheme="yellow" variant="subtle" px={2} py={1}>
                                        <HStack spacing={1}>
                                          <KeyIcon />
                                          <Text>{pk}</Text>
                                        </HStack>
                                      </Badge>
                                    ))}
                                    {(!getSelectedTableInfo()?.primaryKeys || getSelectedTableInfo()?.primaryKeys.length === 0) && (
                                      <Text color="surface.500" fontSize="sm">No primary keys</Text>
                                    )}
                                  </HStack>
                                </Box>

                                {/* Foreign Keys */}
                                <Box>
                                  <Text color="surface.400" fontSize="xs" fontWeight="bold" mb={2}>
                                    FOREIGN KEYS
                                  </Text>
                                  {getSelectedTableInfo()?.foreignKeys && getSelectedTableInfo()!.foreignKeys.length > 0 ? (
                                    <VStack spacing={2} align="stretch">
                                      {getSelectedTableInfo()?.foreignKeys.map((fk, idx) => (
                                        <HStack key={idx} spacing={2} flexWrap="wrap">
                                          <Badge colorScheme="blue" variant="subtle" px={2} py={1}>
                                            <HStack spacing={1}>
                                              <LinkIcon />
                                              <Text>{fk.column}</Text>
                                            </HStack>
                                          </Badge>
                                          <Box color="surface.500"><ArrowRightIcon /></Box>
                                          <Code fontSize="xs" bg="surface.700" color="surface.300" px={2} py={1}>
                                            {fk.references}
                                          </Code>
                                        </HStack>
                                      ))}
                                    </VStack>
                                  ) : (
                                    <Text color="surface.500" fontSize="sm">No foreign keys</Text>
                                  )}
                                </Box>

                                {/* Indexes */}
                                <Box>
                                  <Text color="surface.400" fontSize="xs" fontWeight="bold" mb={2}>
                                    INDEXES
                                  </Text>
                                  {getSelectedTableInfo()?.indexes && getSelectedTableInfo()!.indexes.length > 0 ? (
                                    <VStack spacing={1} align="stretch">
                                      {getSelectedTableInfo()?.indexes.map((idx, i) => (
                                        <Code 
                                          key={i} 
                                          fontSize="xs" 
                                          bg="surface.700" 
                                          color="surface.300"
                                          p={2}
                                          borderRadius="md"
                                        >
                                          {idx}
                                        </Code>
                                      ))}
                                    </VStack>
                                  ) : (
                                    <Text color="surface.500" fontSize="sm">No indexes</Text>
                                  )}
                                </Box>
                              </VStack>
                            </TabPanel>
                          </TabPanels>
                        </Tabs>
                      </VStack>
                    ) : (
                      <Flex justify="center" align="center" py={12}>
                        <Text color="surface.400">Select a table to view details</Text>
                      </Flex>
                    )}
                  </Box>
                </Flex>
              </VStack>
            ) : (
              <Flex justify="center" align="center" py={12}>
                <Text color="surface.400">No schema data available</Text>
              </Flex>
            )}
          </ModalBody>

          <ModalFooter borderTopWidth="1px" borderColor="surface.700">
            <HStack spacing={3}>
              <Button 
                leftIcon={<RefreshIcon />}
                variant="ghost" 
                onClick={() => selectedConnection && fetchSchema(selectedConnection.id)}
                isLoading={isLoadingSchema}
                size={{ base: 'sm', md: 'md' }}
              >
                Refresh
              </Button>
              <Button colorScheme="teal" onClick={onSchemaClose} size={{ base: 'sm', md: 'md' }}>
                Close
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Create Connection Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size={{ base: 'full', md: 'lg' }} motionPreset="slideInBottom">
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
        <ModalContent bg="surface.800" borderColor="surface.700" mx={{ base: 0, md: 4 }} my={{ base: 0, md: 'auto' }}>
          <ModalHeader color="white" fontSize={{ base: 'md', md: 'lg' }}>Add Database Connection</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel color="surface.300">Connection Name</FormLabel>
                <Input
                  placeholder="e.g., Production DB, Staging DB"
                  value={newConnection.name}
                  onChange={(e) => setNewConnection({ ...newConnection, name: e.target.value })}
                  bg="surface.900"
                  borderColor="surface.600"
                />
              </FormControl>

              <FormControl>
                <FormLabel color="surface.300">Environment</FormLabel>
                <Select
                  value={newConnection.environment}
                  onChange={(e) => setNewConnection({ 
                    ...newConnection, 
                    environment: e.target.value as 'production' | 'development' 
                  })}
                  bg="surface.900"
                  borderColor="surface.600"
                >
                  <option value="development">Development</option>
                  <option value="production">Production</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel color="surface.300">PostgreSQL Connection URL</FormLabel>
                <Textarea
                  placeholder="postgresql://user:password@host:5432/database"
                  value={newConnection.databaseUrl}
                  onChange={(e) => setNewConnection({ ...newConnection, databaseUrl: e.target.value })}
                  bg="surface.900"
                  borderColor="surface.600"
                  rows={3}
                  fontFamily="mono"
                  fontSize="sm"
                />
                <Text color="surface.500" fontSize="xs" mt={2}>
                  Your connection URL will be encrypted before storage
                </Text>
              </FormControl>

              {newConnection.environment === 'production' && (
                <Box 
                  w="full" 
                  p={4} 
                  bg="red.900" 
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="red.700"
                >
                  <Text color="red.200" fontSize="sm">
                    <strong>Warning:</strong> You are adding a production database. 
                    Be careful when syncing data to this connection.
                  </Text>
                </Box>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="teal" 
              onClick={handleCreate}
              isLoading={isCreating}
            >
              Add Connection
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay bg="blackAlpha.700" backdropFilter="blur(4px)">
          <AlertDialogContent bg="surface.800" borderColor="surface.700">
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="white">
              Delete Connection
            </AlertDialogHeader>

            <AlertDialogBody color="surface.300">
              Are you sure you want to delete this connection? 
              This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose} variant="ghost">
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
