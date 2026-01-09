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
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import MetricCard from '@/components/admin/charts/MetricCard';

interface User {
  userId: string;
  firstSeen: string;
  lastActivity?: string;
  connectionCount: number;
  sessionCount: number;
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
  const toast = useToast();

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
                      <Menu>
                        <MenuButton as={IconButton} icon={<Text>⋯</Text>} variant="ghost" size="sm" />
                        <MenuList bg="surface.800" borderColor="surface.700">
                          <MenuItem bg="surface.800" _hover={{ bg: 'surface.700' }} color="white">
                            View Details
                          </MenuItem>
                          <MenuItem bg="surface.800" _hover={{ bg: 'surface.700' }} color="white">
                            View Activity
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
    </VStack>
  );
}

