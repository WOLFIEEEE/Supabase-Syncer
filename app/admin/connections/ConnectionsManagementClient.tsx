'use client';

import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Card,
  CardBody,
  Badge,
  Text,
  useToast,
  Spinner,
  SimpleGrid,
  Select,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import MetricCard from '@/components/admin/charts/MetricCard';

interface Connection {
  id: string;
  userId: string;
  name: string;
  environment: 'production' | 'development';
  keepAlive: boolean;
  lastPingedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

interface ConnectionsManagementClientProps {
  adminUser: { id: string; email: string };
  requestId: string;
}

export default function ConnectionsManagementClient({ adminUser }: ConnectionsManagementClientProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [environmentFilter, setEnvironmentFilter] = useState('');
  const [keepAliveFilter, setKeepAliveFilter] = useState('');
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [pingingConnection, setPingingConnection] = useState<string | null>(null);
  const toast = useToast();
  
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null!);  // Non-null assertion for Chakra AlertDialog

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      if (search) params.append('search', search);
      if (environmentFilter) params.append('environment', environmentFilter);
      if (keepAliveFilter) params.append('keepAlive', keepAliveFilter);
      
      const response = await fetch(`/api/admin/connections?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setConnections(result.data);
        setTotal(result.pagination.total);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to fetch connections',
          status: 'error',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch connections',
        status: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [offset, limit, search, environmentFilter, keepAliveFilter]);

  const handleEdit = (connection: Connection) => {
    setSelectedConnection(connection);
    onEditOpen();
  };

  const handleSaveEdit = async () => {
    if (!selectedConnection) return;
    
    try {
      const response = await fetch(`/api/admin/connections/${selectedConnection.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedConnection.name,
          environment: selectedConnection.environment,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Connection updated successfully',
          status: 'success',
        });
        onEditClose();
        fetchConnections();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update connection',
          status: 'error',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update connection',
        status: 'error',
      });
    }
  };

  const handleDelete = (connection: Connection) => {
    setSelectedConnection(connection);
    onDeleteOpen();
  };

  const handleConfirmDelete = async () => {
    if (!selectedConnection) return;
    
    try {
      const response = await fetch(`/api/admin/connections/${selectedConnection.id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Connection deleted successfully',
          status: 'success',
        });
        onDeleteClose();
        fetchConnections();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete connection',
          status: 'error',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete connection',
        status: 'error',
      });
    }
  };

  const handleTestConnection = async (connectionId: string) => {
    setTestingConnection(connectionId);
    try {
      const response = await fetch(`/api/admin/connections/${connectionId}/test`, {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Connection Test',
          description: result.data.healthy 
            ? `Connection is healthy. Version: ${result.data.version}, Tables: ${result.data.tableCount}`
            : `Connection test failed: ${result.data.error}`,
          status: result.data.healthy ? 'success' : 'error',
          duration: 5000,
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to test connection',
          status: 'error',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to test connection',
        status: 'error',
      });
    } finally {
      setTestingConnection(null);
    }
  };

  const handlePingConnection = async (connectionId: string) => {
    setPingingConnection(connectionId);
    try {
      const response = await fetch(`/api/admin/connections/${connectionId}/keep-alive`, {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Keep-Alive Ping',
          description: result.data.alive 
            ? `Ping successful! Duration: ${result.data.duration}`
            : `Ping failed: ${result.data.error || 'Unknown error'}`,
          status: result.data.alive ? 'success' : 'error',
          duration: 5000,
        });
        // Refresh connections to update lastPingedAt
        fetchConnections();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to ping connection',
          status: 'error',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to ping connection',
        status: 'error',
      });
    } finally {
      setPingingConnection(null);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'connections', 
          format: 'csv',
          filters: {
            environment: environmentFilter,
            keepAlive: keepAliveFilter,
            search,
          },
        }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `connections-export-${new Date().toISOString()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: 'Success',
          description: 'Connections exported successfully',
          status: 'success',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export connections',
        status: 'error',
      });
    }
  };

  const stats = {
    total: total,
    production: connections.filter(c => c.environment === 'production').length,
    development: connections.filter(c => c.environment === 'development').length,
    withKeepAlive: connections.filter(c => c.keepAlive).length,
  };

  const formatLastPinged = (lastPingedAt: string | null) => {
    if (!lastPingedAt) return 'Never';
    const date = new Date(lastPingedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
        <MetricCard title="Total Connections" value={stats.total} color="blue" />
        <MetricCard title="Production" value={stats.production} color="red" />
        <MetricCard title="Development" value={stats.development} color="blue" />
        <MetricCard title="Keep-Alive Enabled" value={stats.withKeepAlive} color="green" />
      </SimpleGrid>

      {/* Search and Filters */}
      <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
        <CardBody>
          <HStack spacing={4} flexWrap="wrap">
            <Input
              placeholder="Search by name or user ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              bg="surface.900"
              borderColor="surface.700"
              color="white"
              flex={1}
              minW="200px"
            />
            <Select
              value={environmentFilter}
              onChange={(e) => setEnvironmentFilter(e.target.value)}
              bg="surface.900"
              borderColor="surface.700"
              color="white"
              w="180px"
              placeholder="All Environments"
            >
              <option value="production">Production</option>
              <option value="development">Development</option>
            </Select>
            <Select
              value={keepAliveFilter}
              onChange={(e) => setKeepAliveFilter(e.target.value)}
              bg="surface.900"
              borderColor="surface.700"
              color="white"
              w="180px"
              placeholder="All Keep-Alive"
            >
              <option value="true">Keep-Alive Enabled</option>
              <option value="false">Keep-Alive Disabled</option>
            </Select>
            <Select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              bg="surface.900"
              borderColor="surface.700"
              color="white"
              w="150px"
            >
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </Select>
            <Button colorScheme="teal" onClick={handleExport}>
              Export CSV
            </Button>
          </HStack>
        </CardBody>
      </Card>

      {/* Connections Table */}
      <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
        <CardBody p={0}>
          {loading ? (
            <Box p={8} textAlign="center">
              <Spinner size="xl" color="teal.400" />
            </Box>
          ) : (
            <Table variant="simple" colorScheme="whiteAlpha">
              <Thead>
                <Tr>
                  <Th color="surface.300">Name</Th>
                  <Th color="surface.300">User ID</Th>
                  <Th color="surface.300">Environment</Th>
                  <Th color="surface.300">Keep-Alive</Th>
                  <Th color="surface.300">Last Pinged</Th>
                  <Th color="surface.300">Created</Th>
                  <Th color="surface.300">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {connections.map((connection) => (
                  <Tr key={connection.id}>
                    <Td color="white" fontWeight="medium">{connection.name}</Td>
                    <Td color="surface.400" fontFamily="mono" fontSize="sm">
                      {connection.userId.substring(0, 8)}...
                    </Td>
                    <Td>
                      <Badge colorScheme={connection.environment === 'production' ? 'red' : 'blue'}>
                        {connection.environment}
                      </Badge>
                    </Td>
                    <Td>
                      {connection.keepAlive ? (
                        <Badge colorScheme="green">Enabled</Badge>
                      ) : (
                        <Badge colorScheme="gray">Disabled</Badge>
                      )}
                    </Td>
                    <Td color="surface.400" fontSize="sm">
                      {formatLastPinged(connection.lastPingedAt)}
                    </Td>
                    <Td color="surface.400" fontSize="sm">
                      {new Date(connection.createdAt).toLocaleDateString()}
                    </Td>
                    <Td>
                      <Menu>
                        <MenuButton as={IconButton} icon={<Text>⋯</Text>} variant="ghost" size="sm" />
                        <MenuList bg="surface.800" borderColor="surface.700">
                          <MenuItem 
                            bg="surface.800" 
                            _hover={{ bg: 'surface.700' }} 
                            color="white"
                            onClick={() => handleTestConnection(connection.id)}
                            isDisabled={testingConnection === connection.id}
                          >
                            {testingConnection === connection.id ? 'Testing...' : 'Test Connection'}
                          </MenuItem>
                          <MenuItem 
                            bg="surface.800" 
                            _hover={{ bg: 'surface.700' }} 
                            color="teal.400"
                            onClick={() => handlePingConnection(connection.id)}
                            isDisabled={pingingConnection === connection.id}
                          >
                            {pingingConnection === connection.id ? 'Pinging...' : 'Ping Keep-Alive'}
                          </MenuItem>
                          <MenuItem 
                            bg="surface.800" 
                            _hover={{ bg: 'surface.700' }} 
                            color="white"
                            onClick={() => handleEdit(connection)}
                          >
                            Edit
                          </MenuItem>
                          <MenuItem 
                            bg="surface.800" 
                            _hover={{ bg: 'surface.700' }} 
                            color="red.400"
                            onClick={() => handleDelete(connection)}
                          >
                            Delete
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Pagination */}
      {!loading && total > 0 && (
        <HStack justify="space-between">
          <Text color="surface.400" fontSize="sm">
            Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} connections
          </Text>
          <HStack spacing={2}>
            <Button
              size="sm"
              onClick={() => setOffset(Math.max(0, offset - limit))}
              isDisabled={offset === 0}
              variant="outline"
              borderColor="surface.700"
              color="white"
            >
              Previous
            </Button>
            <Button
              size="sm"
              onClick={() => setOffset(offset + limit)}
              isDisabled={offset + limit >= total}
              variant="outline"
              borderColor="surface.700"
              color="white"
            >
              Next
            </Button>
          </HStack>
        </HStack>
      )}

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose}>
        <ModalOverlay />
        <ModalContent bg="surface.800" borderColor="surface.700" borderWidth="1px">
          <ModalHeader color="white">Edit Connection</ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody>
            {selectedConnection && (
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel color="white">Name</FormLabel>
                  <Input
                    value={selectedConnection.name}
                    onChange={(e) => setSelectedConnection({ ...selectedConnection, name: e.target.value })}
                    bg="surface.900"
                    borderColor="surface.700"
                    color="white"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color="white">Environment</FormLabel>
                  <Select
                    value={selectedConnection.environment}
                    onChange={(e) => setSelectedConnection({ ...selectedConnection, environment: e.target.value as 'production' | 'development' })}
                    bg="surface.900"
                    borderColor="surface.700"
                    color="white"
                  >
                    <option value="production">Production</option>
                    <option value="development">Development</option>
                  </Select>
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose} color="white">
              Cancel
            </Button>
            <Button colorScheme="teal" onClick={handleSaveEdit}>
              Save
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
        <AlertDialogOverlay>
          <AlertDialogContent bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="white">
              Delete Connection
            </AlertDialogHeader>
            <AlertDialogBody color="surface.300">
              Are you sure you want to delete connection &quot;{selectedConnection?.name}&quot;? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose} variant="ghost" color="white">
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleConfirmDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  );
}
