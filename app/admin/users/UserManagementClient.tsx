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
  Divider,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Textarea,
  FormControl,
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import MetricCard from '@/components/admin/charts/MetricCard';
import { logger } from '@/lib/services/logger';

interface User {
  userId: string;
  firstSeen: string;
  lastActivity?: string;
  connectionCount: number;
  sessionCount: number;
  isBanned?: boolean;
}

interface UserDetails {
  userId: string;
  email?: string;
  connectionCount: number;
  syncJobCount: number;
  lastActivity?: string;
  isBanned: boolean;
  connections: Array<{
    id: string;
    name: string;
    environment: string;
    createdAt: string;
  }>;
  recentSyncJobs: Array<{
    id: string;
    status: string;
    createdAt: string;
  }>;
}

interface UserManagementClientProps {
  adminUser: { id: string; email: string };
}

export default function UserManagementClient({ adminUser }: UserManagementClientProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [banReason, setBanReason] = useState('');
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [banningUser, setBanningUser] = useState<string | null>(null);
  const toast = useToast();
  
  const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure();
  const { isOpen: isBanOpen, onOpen: onBanOpen, onClose: onBanClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null!);  // Non-null assertion for Chakra AlertDialog

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      if (search) params.append('search', search);
      
      const response = await fetch(`/api/admin/users?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setUsers(result.data);
        setTotal(result.pagination.total);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to fetch users',
          status: 'error',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        status: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [offset, limit, search]);

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'users', format: 'csv' }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-export-${new Date().toISOString()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: 'Success',
          description: 'Users exported successfully',
          status: 'success',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export users',
        status: 'error',
      });
    }
  };

  const handleViewDetails = async (user: User) => {
    setSelectedUser(user);
    setLoadingDetails(true);
    onDetailsOpen();
    
    try {
      const response = await fetch(`/api/admin/users/${user.userId}`);
      const result = await response.json();
      
      if (result.success) {
        setUserDetails(result.data);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to fetch user details',
          status: 'error',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch user details',
        status: 'error',
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleBanUser = (user: User) => {
    setSelectedUser(user);
    setBanReason('');
    onBanOpen();
  };

  const handleConfirmBan = async () => {
    if (!selectedUser) return;
    
    setBanningUser(selectedUser.userId);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          banned: !selectedUser.isBanned,
          reason: banReason || 'No reason provided',
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Success',
          description: `User ${result.data.banned ? 'banned' : 'unbanned'} successfully`,
          status: 'success',
        });
        onBanClose();
        fetchUsers();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update ban status',
          status: 'error',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update ban status',
        status: 'error',
      });
    } finally {
      setBanningUser(null);
    }
  };

  const handleForceLogout = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/logout`, {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'User logged out successfully',
          status: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to force logout',
          status: 'error',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to force logout',
        status: 'error',
      });
    }
  };

  const handleImpersonate = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/impersonate`, {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Impersonation Token Created',
          description: 'Token created. Copy it to use for impersonation.',
          status: 'info',
          duration: 5000,
        });
        // In production, you'd handle the token differently
        logger.info('Impersonation token created', { token: result.data.token });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create impersonation token',
          status: 'error',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create impersonation token',
        status: 'error',
      });
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <MetricCard title="Total Users" value={total} color="blue" />
        <MetricCard title="Active Users" value={users.filter(u => u.lastActivity).length} color="green" />
        <MetricCard title="Users with Connections" value={users.filter(u => u.connectionCount > 0).length} color="orange" />
      </SimpleGrid>

      {/* Search and Filters */}
      <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
        <CardBody>
          <HStack spacing={4}>
            <Input
              placeholder="Search by user ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              bg="surface.900"
              borderColor="surface.700"
              color="white"
              flex={1}
            />
            <Select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              bg="surface.900"
              borderColor="surface.700"
              color="white"
              w="200px"
            >
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </Select>
            <Button colorScheme="brand" onClick={handleExport}>
              Export CSV
            </Button>
          </HStack>
        </CardBody>
      </Card>

      {/* Users Table */}
      <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
        <CardBody p={0}>
          {loading ? (
            <Box p={8} textAlign="center">
              <Spinner size="xl" color="brand.400" />
            </Box>
          ) : (
            <Table variant="simple" colorScheme="whiteAlpha">
              <Thead>
                <Tr>
                  <Th color="surface.300">User ID</Th>
                  <Th color="surface.300">First Seen</Th>
                  <Th color="surface.300">Last Activity</Th>
                  <Th color="surface.300">Connections</Th>
                  <Th color="surface.300">Sessions</Th>
                  <Th color="surface.300">Status</Th>
                  <Th color="surface.300">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {users.map((user) => (
                  <Tr key={user.userId}>
                    <Td color="white" fontFamily="mono" fontSize="sm">
                      {user.userId.substring(0, 8)}...
                    </Td>
                    <Td color="surface.400" fontSize="sm">
                      {new Date(user.firstSeen).toLocaleDateString()}
                    </Td>
                    <Td color="surface.400" fontSize="sm">
                      {user.lastActivity ? new Date(user.lastActivity).toLocaleString() : 'Never'}
                    </Td>
                    <Td color="white">{user.connectionCount}</Td>
                    <Td color="white">{user.sessionCount}</Td>
                    <Td>
                      {user.isBanned ? (
                        <Badge colorScheme="red">Banned</Badge>
                      ) : (
                        <Badge colorScheme="green">Active</Badge>
                      )}
                    </Td>
                    <Td>
                      <Menu>
                        <MenuButton as={IconButton} icon={<Text>⋯</Text>} variant="ghost" size="sm" />
                        <MenuList bg="surface.800" borderColor="surface.700">
                          <MenuItem 
                            bg="surface.800" 
                            _hover={{ bg: 'surface.700' }} 
                            color="white"
                            onClick={() => handleViewDetails(user)}
                          >
                            View Details
                          </MenuItem>
                          <MenuItem 
                            bg="surface.800" 
                            _hover={{ bg: 'surface.700' }} 
                            color={user.isBanned ? 'green.400' : 'red.400'}
                            onClick={() => handleBanUser(user)}
                          >
                            {user.isBanned ? 'Unban User' : 'Ban User'}
                          </MenuItem>
                          <MenuItem 
                            bg="surface.800" 
                            _hover={{ bg: 'surface.700' }} 
                            color="orange.400"
                            onClick={() => handleImpersonate(user.userId)}
                          >
                            Impersonate
                          </MenuItem>
                          <MenuItem 
                            bg="surface.800" 
                            _hover={{ bg: 'surface.700' }} 
                            color="yellow.400"
                            onClick={() => handleForceLogout(user.userId)}
                          >
                            Force Logout
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
            Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} users
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

      {/* User Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={onDetailsClose} size="xl">
        <ModalOverlay />
        <ModalContent bg="surface.800" borderColor="surface.700" borderWidth="1px">
          <ModalHeader color="white">User Details</ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody>
            {loadingDetails ? (
              <Box textAlign="center" py={8}>
                <Spinner size="xl" color="teal.400" />
              </Box>
            ) : userDetails ? (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text color="surface.400" fontSize="sm" mb={1}>User ID</Text>
                  <Text color="white" fontFamily="mono" fontSize="sm">{userDetails.userId}</Text>
                </Box>
                <Divider borderColor="surface.700" />
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text color="surface.400" fontSize="sm" mb={1}>Connections</Text>
                    <Text color="white" fontSize="lg" fontWeight="bold">{userDetails.connectionCount}</Text>
                  </Box>
                  <Box>
                    <Text color="surface.400" fontSize="sm" mb={1}>Sync Jobs</Text>
                    <Text color="white" fontSize="lg" fontWeight="bold">{userDetails.syncJobCount}</Text>
                  </Box>
                  <Box>
                    <Text color="surface.400" fontSize="sm" mb={1}>Status</Text>
                    {userDetails.isBanned ? (
                      <Badge colorScheme="red">Banned</Badge>
                    ) : (
                      <Badge colorScheme="green">Active</Badge>
                    )}
                  </Box>
                  <Box>
                    <Text color="surface.400" fontSize="sm" mb={1}>Last Activity</Text>
                    <Text color="white" fontSize="sm">
                      {userDetails.lastActivity 
                        ? new Date(userDetails.lastActivity).toLocaleString() 
                        : 'Never'}
                    </Text>
                  </Box>
                </SimpleGrid>
                {userDetails.connections.length > 0 && (
                  <>
                    <Divider borderColor="surface.700" />
                    <Box>
                      <Text color="white" fontWeight="bold" mb={2}>Connections</Text>
                      <VStack spacing={2} align="stretch">
                        {userDetails.connections.map((conn) => (
                          <Box key={conn.id} p={2} bg="surface.700" borderRadius="md">
                            <HStack justify="space-between">
                              <Text color="white">{conn.name}</Text>
                              <Badge colorScheme={conn.environment === 'production' ? 'red' : 'blue'}>
                                {conn.environment}
                              </Badge>
                            </HStack>
                          </Box>
                        ))}
                      </VStack>
                    </Box>
                  </>
                )}
                {userDetails.recentSyncJobs.length > 0 && (
                  <>
                    <Divider borderColor="surface.700" />
                    <Box>
                      <Text color="white" fontWeight="bold" mb={2}>Recent Sync Jobs</Text>
                      <VStack spacing={2} align="stretch">
                        {userDetails.recentSyncJobs.map((job) => (
                          <Box key={job.id} p={2} bg="surface.700" borderRadius="md">
                            <HStack justify="space-between">
                              <Text color="white" fontFamily="mono" fontSize="sm">{job.id.substring(0, 8)}...</Text>
                              <Badge colorScheme={
                                job.status === 'completed' ? 'green' :
                                job.status === 'failed' ? 'red' :
                                job.status === 'running' ? 'blue' : 'gray'
                              }>
                                {job.status}
                              </Badge>
                            </HStack>
                          </Box>
                        ))}
                      </VStack>
                    </Box>
                  </>
                )}
              </VStack>
            ) : (
              <Text color="surface.400">No details available</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDetailsClose} color="white">
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Ban/Unban Confirmation Dialog */}
      <AlertDialog
        isOpen={isBanOpen}
        leastDestructiveRef={cancelRef}
        onClose={onBanClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg="surface.800" borderColor="surface.700" borderWidth="1px">
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="white">
              {selectedUser?.isBanned ? 'Unban User' : 'Ban User'}
            </AlertDialogHeader>
            <AlertDialogBody>
              <VStack spacing={4} align="stretch">
                <Text color="surface.300">
                  Are you sure you want to {selectedUser?.isBanned ? 'unban' : 'ban'} user &quot;{selectedUser?.userId.substring(0, 8)}...&quot;?
                </Text>
                <FormControl>
                  <Text color="surface.300" fontSize="sm" mb={2}>Reason (optional)</Text>
                  <Textarea
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="Enter reason for ban/unban..."
                    bg="surface.900"
                    borderColor="surface.700"
                    color="white"
                    rows={3}
                  />
                </FormControl>
              </VStack>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onBanClose} variant="ghost" color="white">
                Cancel
              </Button>
              <Button
                colorScheme={selectedUser?.isBanned ? 'green' : 'red'}
                onClick={handleConfirmBan}
                ml={3}
                isLoading={banningUser === selectedUser?.userId}
              >
                {selectedUser?.isBanned ? 'Unban' : 'Ban'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  );
}

