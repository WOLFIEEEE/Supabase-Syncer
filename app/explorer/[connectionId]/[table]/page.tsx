'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { logger } from '@/lib/services/logger';
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
  Spinner,
  useToast,
  Input,
  InputGroup,
  InputLeftElement,
  Flex,
  IconButton,
  Tooltip,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Select,
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
  Textarea,
  Switch,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Code,
  Checkbox,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { addActivity } from '@/components/explorer/ActivityFeed';

const MotionTr = motion.create(Tr);

// Icons
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const MoreIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="1"/>
    <circle cx="19" cy="12" r="1"/>
    <circle cx="5" cy="12" r="1"/>
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const SortAscIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
);

const SortDescIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const KeyIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
);

interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  defaultValue: string | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalRows: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

type ViewMode = 'grid' | 'card';

function formatValue(value: unknown, type: string): string {
  if (value === null) return 'NULL';
  if (value === undefined) return '';
  
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  
  if (type === 'timestamptz' || type === 'timestamp') {
    try {
      return new Date(value as string).toLocaleString();
    } catch {
      return String(value);
    }
  }
  
  return String(value);
}

function truncateValue(value: string, maxLength: number = 50): string {
  if (value.length <= maxLength) return value;
  return value.substring(0, maxLength) + '...';
}

export default function TableDataPage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [columns, setColumns] = useState<ColumnSchema[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [primaryKey, setPrimaryKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());
  const [connectionEnv, setConnectionEnv] = useState<string>('development');
  const [connectionName, setConnectionName] = useState<string>('');
  
  // Modal states
  const [editingRow, setEditingRow] = useState<Record<string, unknown> | null>(null);
  const [deletingRowId, setDeletingRowId] = useState<string | null>(null);
  const [isNewRow, setIsNewRow] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  
  const connectionId = params?.connectionId as string;
  const tableName = decodeURIComponent(params?.table as string);

  const fetchRows = useCallback(async (page: number = 1) => {
    if (!connectionId || !tableName) return;
    
    setIsLoading(true);
    try {
      const searchParams = new URLSearchParams({
        page: String(page),
        limit: String(pagination?.limit || 50),
      });
      
      if (sortBy) {
        searchParams.set('sortBy', sortBy);
        searchParams.set('sortOrder', sortOrder);
      }
      
      if (searchQuery) {
        searchParams.set('search', searchQuery);
      }
      
      const res = await fetch(
        `/api/explorer/${connectionId}/${encodeURIComponent(tableName)}/rows?${searchParams}`
      );
      const data = await res.json();
      
      if (data.success) {
        setRows(data.data.rows);
        setColumns(data.data.columns);
        setPagination(data.data.pagination);
        setPrimaryKey(data.data.table.primaryKey);
        
        // Initialize visible columns
        if (visibleColumns.size === 0) {
          setVisibleColumns(new Set(data.data.columns.map((c: ColumnSchema) => c.name)));
        }
      } else {
        toast({
          title: data.error || 'Failed to load data',
          status: 'error',
          duration: 3000,
        });
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
  }, [connectionId, tableName, sortBy, sortOrder, searchQuery, pagination?.limit, visibleColumns.size, toast]);

  // Fetch connection info for environment
  useEffect(() => {
    fetch(`/api/explorer/${connectionId}/tables`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setConnectionEnv(data.data.connection.environment);
          setConnectionName(data.data.connection.name);
        }
      })
      .catch((error) => logger.error('Failed to fetch connection info', { error }));
  }, [connectionId]);

  // Log view activity when page loads
  useEffect(() => {
    if (tableName && connectionId && connectionName) {
      addActivity({
        type: 'view',
        table: tableName,
        connectionId,
        connectionName,
        details: `Viewed table data`,
      });
    }
  }, [tableName, connectionId, connectionName]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleSearch = () => {
    fetchRows(1);
  };

  const handlePageChange = (newPage: number) => {
    fetchRows(newPage);
  };

  const handleEditRow = (row: Record<string, unknown>) => {
    setEditingRow(row);
    setFormData({ ...row });
    setIsNewRow(false);
    onEditOpen();
  };

  const handleNewRow = () => {
    const emptyRow: Record<string, unknown> = {};
    columns.forEach((col) => {
      if (col.defaultValue) {
        emptyRow[col.name] = null; // Let DB handle defaults
      } else {
        emptyRow[col.name] = col.nullable ? null : '';
      }
    });
    setEditingRow(null);
    setFormData(emptyRow);
    setIsNewRow(true);
    onEditOpen();
  };

  const handleDeleteRow = (rowId: string) => {
    setDeletingRowId(rowId);
    onDeleteOpen();
  };

  const handleSaveRow = async () => {
    if (!primaryKey && !isNewRow) {
      toast({
        title: 'Cannot update: No primary key',
        status: 'error',
        duration: 3000,
      });
      return;
    }
    
    setIsSaving(true);
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (connectionEnv === 'production') {
        headers['X-Confirm-Production'] = 'true';
      }
      
      const endpoint = `/api/explorer/${connectionId}/${encodeURIComponent(tableName)}/row`;
      
      if (isNewRow) {
        // Insert
        const res = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({ data: formData }),
        });
        const data = await res.json();
        
        if (data.success) {
          // Log activity
          addActivity({
            type: 'insert',
            table: tableName,
            connectionId,
            connectionName,
            rowId: data.data?.[primaryKey!],
            details: `Inserted new row`,
          });
          
          toast({
            title: 'Row inserted successfully',
            status: 'success',
            duration: 3000,
          });
          onEditClose();
          fetchRows(pagination?.page || 1);
        } else {
          toast({
            title: data.error || 'Failed to insert row',
            status: 'error',
            duration: 5000,
          });
        }
      } else {
        // Update
        const rowId = editingRow?.[primaryKey!];
        const res = await fetch(endpoint, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ id: rowId, data: formData }),
        });
        const data = await res.json();
        
        if (data.success) {
          // Log activity
          addActivity({
            type: 'update',
            table: tableName,
            connectionId,
            connectionName,
            rowId: String(rowId),
            details: `Updated row ${rowId}`,
          });
          
          toast({
            title: 'Row updated successfully',
            status: 'success',
            duration: 3000,
          });
          onEditClose();
          fetchRows(pagination?.page || 1);
        } else {
          toast({
            title: data.error || 'Failed to update row',
            status: 'error',
            duration: 5000,
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Operation failed',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingRowId || !primaryKey) return;
    
    setIsSaving(true);
    try {
      const headers: HeadersInit = {};
      
      if (connectionEnv === 'production') {
        headers['X-Confirm-Production'] = 'true';
      }
      
      const res = await fetch(
        `/api/explorer/${connectionId}/${encodeURIComponent(tableName)}/row?id=${deletingRowId}`,
        { method: 'DELETE', headers }
      );
      const data = await res.json();
      
      if (data.success) {
        // Log activity
        addActivity({
          type: 'delete',
          table: tableName,
          connectionId,
          connectionName,
          rowId: deletingRowId,
          details: `Deleted row ${deletingRowId}`,
        });
        
        toast({
          title: 'Row deleted successfully',
          status: 'success',
          duration: 3000,
        });
        onDeleteClose();
        fetchRows(pagination?.page || 1);
      } else {
        toast({
          title: data.error || 'Failed to delete row',
          status: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: 'Delete failed',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
      setDeletingRowId(null);
    }
  };

  const getInputType = (type: string): string => {
    if (type.includes('int') || type === 'numeric' || type === 'decimal' || type === 'float' || type === 'real') {
      return 'number';
    }
    if (type.includes('timestamp') || type === 'date') {
      return 'datetime-local';
    }
    return 'text';
  };

  const visibleColumnsList = columns.filter((c) => visibleColumns.has(c.name));

  return (
    <Box minH="calc(100vh - 120px)" py={4}>
      <Container maxW="full" px={4}>
        <VStack spacing={4} align="stretch">
          {/* Toolbar */}
          <Flex
            gap={3}
            p={3}
            bg="surface.800"
            borderRadius="lg"
            border="1px solid"
            borderColor="surface.700"
            flexWrap="wrap"
            align="center"
          >
            {/* Search */}
            <InputGroup maxW="300px">
              <InputLeftElement pointerEvents="none">
                <Box color="surface.500"><SearchIcon /></Box>
              </InputLeftElement>
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                bg="surface.900"
                border="1px solid"
                borderColor="surface.700"
                size="sm"
                _hover={{ borderColor: 'surface.600' }}
                _focus={{ borderColor: 'teal.500' }}
              />
            </InputGroup>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSearch}
              leftIcon={<SearchIcon />}
            >
              Search
            </Button>
            
            <Box flex={1} />
            
            {/* View mode toggle */}
            <HStack spacing={1} bg="surface.900" p={1} borderRadius="md">
              <Tooltip label="Grid View" hasArrow>
                <IconButton
                  aria-label="Grid view"
                  icon={<ListIcon />}
                  size="sm"
                  variant={viewMode === 'grid' ? 'solid' : 'ghost'}
                  colorScheme={viewMode === 'grid' ? 'teal' : 'gray'}
                  onClick={() => setViewMode('grid')}
                />
              </Tooltip>
              <Tooltip label="Card View" hasArrow>
                <IconButton
                  aria-label="Card view"
                  icon={<GridIcon />}
                  size="sm"
                  variant={viewMode === 'card' ? 'solid' : 'ghost'}
                  colorScheme={viewMode === 'card' ? 'teal' : 'gray'}
                  onClick={() => setViewMode('card')}
                />
              </Tooltip>
            </HStack>
            
            {/* Page size */}
            <Select
              size="sm"
              w="100px"
              bg="surface.900"
              borderColor="surface.700"
              value={pagination?.limit || 50}
              onChange={(e) => {
                const newLimit = parseInt(e.target.value);
                if (pagination) {
                  setPagination({ ...pagination, limit: newLimit });
                }
                fetchRows(1);
              }}
            >
              <option value={25}>25 rows</option>
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
            </Select>
            
            <Tooltip label="Refresh" hasArrow>
              <IconButton
                aria-label="Refresh"
                icon={<RefreshIcon />}
                variant="ghost"
                size="sm"
                onClick={() => fetchRows(pagination?.page || 1)}
                isLoading={isLoading}
              />
            </Tooltip>
            
            <Button
              size="sm"
              colorScheme="teal"
              leftIcon={<PlusIcon />}
              onClick={handleNewRow}
            >
              Add Row
            </Button>
          </Flex>

          {/* Warning for production */}
          {connectionEnv === 'production' && (
            <Box
              p={3}
              bg="red.900"
              borderRadius="md"
              border="1px solid"
              borderColor="red.700"
            >
              <HStack>
                <Badge colorScheme="red">PRODUCTION</Badge>
                <Text fontSize="sm" color="red.200">
                  You are viewing production data. All changes will be applied immediately.
                </Text>
              </HStack>
            </Box>
          )}

          {/* Stats */}
          {pagination && (
            <Flex justify="space-between" align="center" px={1}>
              <HStack spacing={4}>
                <Text fontSize="sm" color="surface.400">
                  {pagination.totalRows.toLocaleString()} total rows
                </Text>
                <Text fontSize="sm" color="surface.500">
                  Page {pagination.page} of {pagination.totalPages}
                </Text>
              </HStack>
              
              {/* Bulk operations disabled notice */}
              <Tooltip label="Bulk operations are disabled for safety. Use individual row actions." hasArrow>
                <Badge colorScheme="gray" variant="subtle" cursor="help">
                  Single-row ops only
                </Badge>
              </Tooltip>
            </Flex>
          )}

          {/* Data View */}
          {isLoading ? (
            <Flex justify="center" py={20}>
              <VStack spacing={4}>
                <Spinner size="xl" color="teal.400" thickness="3px" />
                <Text color="surface.400">Loading data...</Text>
              </VStack>
            </Flex>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <Box
              overflowX="auto"
              bg="surface.800"
              borderRadius="lg"
              border="1px solid"
              borderColor="surface.700"
            >
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr bg="surface.900">
                    {visibleColumnsList.map((col) => (
                      <Th
                        key={col.name}
                        color="surface.300"
                        borderColor="surface.700"
                        cursor="pointer"
                        onClick={() => handleSort(col.name)}
                        _hover={{ bg: 'surface.800' }}
                        whiteSpace="nowrap"
                      >
                        <HStack spacing={1}>
                          {col.isPrimaryKey && (
                            <Box color="yellow.400"><KeyIcon /></Box>
                          )}
                          <Text>{col.name}</Text>
                          {sortBy === col.name && (
                            sortOrder === 'asc' ? <SortAscIcon /> : <SortDescIcon />
                          )}
                        </HStack>
                        <Text fontSize="xs" color="surface.500" fontWeight="normal">
                          {col.type}
                        </Text>
                      </Th>
                    ))}
                    <Th color="surface.300" borderColor="surface.700" w="80px">
                      Actions
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  <AnimatePresence>
                    {rows.map((row, index) => {
                      const rowId = primaryKey ? String(row[primaryKey]) : String(index);
                      return (
                        <MotionTr
                          key={rowId}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.1, delay: index * 0.02 }}
                          _hover={{ bg: 'surface.750' }}
                        >
                          {visibleColumnsList.map((col) => (
                            <Td
                              key={col.name}
                              borderColor="surface.700"
                              maxW="300px"
                              overflow="hidden"
                              textOverflow="ellipsis"
                            >
                              <Tooltip
                                label={formatValue(row[col.name], col.type)}
                                hasArrow
                                placement="top"
                                isDisabled={formatValue(row[col.name], col.type).length < 50}
                              >
                                <Text
                                  fontSize="sm"
                                  color={row[col.name] === null ? 'surface.500' : 'surface.200'}
                                  fontFamily={col.type.includes('int') || col.type === 'uuid' ? 'mono' : 'inherit'}
                                  fontStyle={row[col.name] === null ? 'italic' : 'normal'}
                                >
                                  {truncateValue(formatValue(row[col.name], col.type))}
                                </Text>
                              </Tooltip>
                            </Td>
                          ))}
                          <Td borderColor="surface.700">
                            <HStack spacing={1}>
                              <Tooltip label="Edit" hasArrow>
                                <IconButton
                                  aria-label="Edit row"
                                  icon={<EditIcon />}
                                  size="xs"
                                  variant="ghost"
                                  onClick={() => handleEditRow(row)}
                                />
                              </Tooltip>
                              <Tooltip label="Delete" hasArrow>
                                <IconButton
                                  aria-label="Delete row"
                                  icon={<TrashIcon />}
                                  size="xs"
                                  variant="ghost"
                                  colorScheme="red"
                                  onClick={() => handleDeleteRow(rowId)}
                                  isDisabled={!primaryKey}
                                />
                              </Tooltip>
                            </HStack>
                          </Td>
                        </MotionTr>
                      );
                    })}
                  </AnimatePresence>
                </Tbody>
              </Table>
              
              {rows.length === 0 && (
                <Box py={12} textAlign="center">
                  <Text color="surface.400">No data found</Text>
                </Box>
              )}
            </Box>
          ) : (
            /* Card View */
            <VStack spacing={3} align="stretch">
              {rows.map((row, index) => {
                const rowId = primaryKey ? String(row[primaryKey]) : String(index);
                return (
                  <Card
                    key={rowId}
                    bg="surface.800"
                    borderColor="surface.700"
                    _hover={{ borderColor: 'teal.600' }}
                  >
                    <CardBody>
                      <Flex justify="space-between" align="start" mb={3}>
                        <HStack>
                          {primaryKey && (
                            <Badge colorScheme="yellow" fontFamily="mono">
                              {primaryKey}: {String(row[primaryKey])}
                            </Badge>
                          )}
                        </HStack>
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<MoreIcon />}
                            variant="ghost"
                            size="sm"
                          />
                          <MenuList bg="surface.800" borderColor="surface.700">
                            <MenuItem
                              bg="surface.800"
                              _hover={{ bg: 'surface.700' }}
                              onClick={() => handleEditRow(row)}
                              icon={<EditIcon />}
                            >
                              Edit
                            </MenuItem>
                            <MenuItem
                              bg="surface.800"
                              _hover={{ bg: 'red.900' }}
                              color="red.400"
                              onClick={() => handleDeleteRow(rowId)}
                              icon={<TrashIcon />}
                              isDisabled={!primaryKey}
                            >
                              Delete
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Flex>
                      
                      <VStack align="stretch" spacing={2}>
                        {columns.filter((c) => c.name !== primaryKey).slice(0, 6).map((col) => (
                          <HStack key={col.name} justify="space-between">
                            <Text fontSize="xs" color="surface.500" fontWeight="medium">
                              {col.name}
                            </Text>
                            <Text
                              fontSize="sm"
                              color={row[col.name] === null ? 'surface.500' : 'white'}
                              fontStyle={row[col.name] === null ? 'italic' : 'normal'}
                              maxW="60%"
                              textAlign="right"
                              isTruncated
                            >
                              {truncateValue(formatValue(row[col.name], col.type), 40)}
                            </Text>
                          </HStack>
                        ))}
                        {columns.length > 7 && (
                          <Text fontSize="xs" color="surface.500" textAlign="center">
                            +{columns.length - 7} more fields
                          </Text>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                );
              })}
            </VStack>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <Flex justify="center" gap={2} py={4}>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<ChevronLeftIcon />}
                onClick={() => handlePageChange(pagination.page - 1)}
                isDisabled={!pagination.hasPrev}
              >
                Previous
              </Button>
              
              <HStack spacing={1}>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      size="sm"
                      variant={pagination.page === pageNum ? 'solid' : 'ghost'}
                      colorScheme={pagination.page === pageNum ? 'teal' : 'gray'}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </HStack>
              
              <Button
                size="sm"
                variant="outline"
                rightIcon={<ChevronRightIcon />}
                onClick={() => handlePageChange(pagination.page + 1)}
                isDisabled={!pagination.hasNext}
              >
                Next
              </Button>
            </Flex>
          )}
        </VStack>
      </Container>

      {/* Edit/Create Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl" scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg="surface.800" borderColor="surface.700">
          <ModalHeader color="white">
            {isNewRow ? 'Add New Row' : 'Edit Row'}
            {connectionEnv === 'production' && (
              <Badge colorScheme="red" ml={2}>PRODUCTION</Badge>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {columns.map((col) => (
                <FormControl key={col.name}>
                  <FormLabel fontSize="sm" color="surface.300">
                    <HStack spacing={2}>
                      <Text>{col.name}</Text>
                      {col.isPrimaryKey && (
                        <Badge colorScheme="yellow" size="sm">PK</Badge>
                      )}
                      {col.nullable && (
                        <Badge colorScheme="gray" size="sm">nullable</Badge>
                      )}
                    </HStack>
                    <Text fontSize="xs" color="surface.500">{col.type}</Text>
                  </FormLabel>
                  
                  {col.type === 'bool' || col.type === 'boolean' ? (
                    <Switch
                      isChecked={formData[col.name] === true}
                      onChange={(e) => setFormData({ ...formData, [col.name]: e.target.checked })}
                      colorScheme="teal"
                      isDisabled={col.isPrimaryKey && !isNewRow}
                    />
                  ) : col.type === 'json' || col.type === 'jsonb' || col.type === 'text' ? (
                    <Textarea
                      value={
                        typeof formData[col.name] === 'object'
                          ? JSON.stringify(formData[col.name], null, 2)
                          : String(formData[col.name] ?? '')
                      }
                      onChange={(e) => {
                        let value: unknown = e.target.value;
                        if (col.type === 'json' || col.type === 'jsonb') {
                          try {
                            value = JSON.parse(e.target.value);
                          } catch {
                            value = e.target.value;
                          }
                        }
                        setFormData({ ...formData, [col.name]: value });
                      }}
                      bg="surface.900"
                      borderColor="surface.700"
                      fontFamily="mono"
                      fontSize="sm"
                      rows={col.type === 'text' ? 3 : 5}
                      isDisabled={col.isPrimaryKey && !isNewRow}
                    />
                  ) : (
                    <Input
                      type={getInputType(col.type)}
                      value={String(formData[col.name] ?? '')}
                      onChange={(e) => {
                        let value: unknown = e.target.value;
                        if (getInputType(col.type) === 'number') {
                          value = e.target.value === '' ? null : Number(e.target.value);
                        }
                        setFormData({ ...formData, [col.name]: value });
                      }}
                      bg="surface.900"
                      borderColor="surface.700"
                      isDisabled={col.isPrimaryKey && !isNewRow}
                    />
                  )}
                </FormControl>
              ))}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose}>
              Cancel
            </Button>
            <Button
              colorScheme="teal"
              onClick={handleSaveRow}
              isLoading={isSaving}
            >
              {isNewRow ? 'Create' : 'Save Changes'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef as React.RefObject<HTMLButtonElement>}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay backdropFilter="blur(4px)">
          <AlertDialogContent bg="surface.800" borderColor="surface.700">
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="white">
              Delete Row
              {connectionEnv === 'production' && (
                <Badge colorScheme="red" ml={2}>PRODUCTION</Badge>
              )}
            </AlertDialogHeader>

            <AlertDialogBody color="surface.300">
              <VStack align="start" spacing={3}>
                <Text>Are you sure you want to delete this row?</Text>
                <Code bg="surface.900" p={2} borderRadius="md" fontSize="sm">
                  {primaryKey}: {deletingRowId}
                </Code>
                <Text fontSize="sm" color="red.400">
                  This action cannot be undone.
                </Text>
              </VStack>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleConfirmDelete}
                ml={3}
                isLoading={isSaving}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}

