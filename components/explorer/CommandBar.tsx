'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
  HStack,
  Text,
  Box,
  Badge,
  Kbd,
  Flex,
  Spinner,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion.create(Box);

// Icons
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const DatabaseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const SyncIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

interface Connection {
  id: string;
  name: string;
  environment: 'production' | 'development';
}

interface TableInfo {
  name: string;
  connectionId: string;
  connectionName: string;
}

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  badge?: string;
  badgeColor?: string;
  category: 'navigation' | 'connections' | 'tables' | 'actions';
}

interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
  currentConnectionId?: string;
}

export default function CommandBar({ isOpen, onClose, currentConnectionId }: CommandBarProps) {
  const [query, setQuery] = useState('');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Fetch connections on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      fetchConnections();
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Fetch tables when connection is selected
  useEffect(() => {
    if (currentConnectionId) {
      fetchTables(currentConnectionId);
    }
  }, [currentConnectionId]);

  const fetchConnections = async () => {
    try {
      const res = await fetch('/api/connections');
      const data = await res.json();
      if (data.success) {
        setConnections(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    }
  };

  const fetchTables = async (connId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/explorer/${connId}/tables`);
      const data = await res.json();
      if (data.success) {
        const tableItems = data.data.tables.map((t: { name: string }) => ({
          name: t.name,
          connectionId: connId,
          connectionName: data.data.connection.name,
        }));
        setTables(tableItems);
      }
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = useCallback((action: () => void) => {
    action();
    onClose();
  }, [onClose]);

  // Build command items
  const commandItems: CommandItem[] = [
    // Navigation
    {
      id: 'nav-home',
      label: 'Go to Dashboard',
      description: 'Main dashboard',
      icon: <HomeIcon />,
      action: () => router.push('/'),
      category: 'navigation',
    },
    {
      id: 'nav-explorer',
      label: 'Go to Explorer',
      description: 'Data Explorer home',
      icon: <DatabaseIcon />,
      action: () => router.push('/explorer'),
      category: 'navigation',
    },
    {
      id: 'nav-sync',
      label: 'New Sync Job',
      description: 'Create a new sync',
      icon: <SyncIcon />,
      action: () => router.push('/sync/create'),
      category: 'navigation',
    },
    {
      id: 'nav-connections',
      label: 'Manage Connections',
      description: 'Connection settings',
      icon: <SettingsIcon />,
      action: () => router.push('/connections'),
      category: 'navigation',
    },
    // Connections
    ...connections.map((conn) => ({
      id: `conn-${conn.id}`,
      label: conn.name,
      description: 'Open database',
      icon: <DatabaseIcon />,
      action: () => router.push(`/explorer/${conn.id}`),
      badge: conn.environment,
      badgeColor: conn.environment === 'production' ? 'red' : 'green',
      category: 'connections' as const,
    })),
    // Tables (if in a connection context)
    ...tables.map((table) => ({
      id: `table-${table.connectionId}-${table.name}`,
      label: table.name,
      description: `in ${table.connectionName}`,
      icon: <TableIcon />,
      action: () => router.push(`/explorer/${table.connectionId}/${encodeURIComponent(table.name)}`),
      category: 'tables' as const,
    })),
  ];

  // Filter by query
  const filteredItems = query
    ? commandItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.description?.toLowerCase().includes(query.toLowerCase())
      )
    : commandItems;

  // Group by category
  const groupedItems = {
    navigation: filteredItems.filter((i) => i.category === 'navigation'),
    connections: filteredItems.filter((i) => i.category === 'connections'),
    tables: filteredItems.filter((i) => i.category === 'tables'),
  };

  const allFilteredItems = [
    ...groupedItems.navigation,
    ...groupedItems.connections,
    ...groupedItems.tables,
  ];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, allFilteredItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = allFilteredItems[selectedIndex];
        if (item) {
          handleAction(item.action);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, allFilteredItems, handleAction]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const renderCategory = (title: string, items: CommandItem[], startIndex: number) => {
    if (items.length === 0) return null;

    return (
      <Box key={title}>
        <Text fontSize="xs" color="surface.500" fontWeight="semibold" px={3} py={2}>
          {title}
        </Text>
        <VStack spacing={0} align="stretch">
          {items.map((item, idx) => {
            const globalIndex = startIndex + idx;
            const isSelected = selectedIndex === globalIndex;

            return (
              <MotionBox
                key={item.id}
                px={3}
                py={2}
                cursor="pointer"
                bg={isSelected ? 'surface.700' : 'transparent'}
                borderRadius="md"
                mx={2}
                onClick={() => handleAction(item.action)}
                onMouseEnter={() => setSelectedIndex(globalIndex)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.1, delay: idx * 0.02 }}
              >
                <Flex justify="space-between" align="center">
                  <HStack spacing={3}>
                    <Box color={isSelected ? 'teal.400' : 'surface.400'}>
                      {item.icon}
                    </Box>
                    <VStack align="start" spacing={0}>
                      <Text
                        fontSize="sm"
                        color={isSelected ? 'white' : 'surface.200'}
                        fontWeight={isSelected ? 'medium' : 'normal'}
                      >
                        {item.label}
                      </Text>
                      {item.description && (
                        <Text fontSize="xs" color="surface.500">
                          {item.description}
                        </Text>
                      )}
                    </VStack>
                  </HStack>
                  <HStack spacing={2}>
                    {item.badge && (
                      <Badge colorScheme={item.badgeColor} fontSize="xs">
                        {item.badge}
                      </Badge>
                    )}
                    {isSelected && (
                      <Box color="surface.500">
                        <ArrowRightIcon />
                      </Box>
                    )}
                  </HStack>
                </Flex>
              </MotionBox>
            );
          })}
        </VStack>
      </Box>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" motionPreset="slideInBottom">
      <ModalOverlay backdropFilter="blur(8px)" bg="blackAlpha.700" />
      <ModalContent
        bg="surface.800"
        borderColor="surface.600"
        borderWidth="1px"
        borderRadius="xl"
        overflow="hidden"
        mt="20vh"
        boxShadow="dark-lg"
      >
        <ModalBody p={0}>
          {/* Search Input */}
          <Box borderBottomWidth="1px" borderColor="surface.700" p={3}>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Box color="surface.500">
                  <SearchIcon />
                </Box>
              </InputLeftElement>
              <Input
                ref={inputRef}
                placeholder="Search commands, connections, tables..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                variant="unstyled"
                fontSize="lg"
                pl={10}
                color="white"
                _placeholder={{ color: 'surface.500' }}
              />
              <Box position="absolute" right={3} top="50%" transform="translateY(-50%)">
                <Kbd bg="surface.700" color="surface.400" fontSize="xs">
                  ESC
                </Kbd>
              </Box>
            </InputGroup>
          </Box>

          {/* Results */}
          <Box maxH="400px" overflowY="auto" py={2}>
            {isLoading ? (
              <Flex justify="center" py={8}>
                <Spinner size="md" color="teal.400" />
              </Flex>
            ) : allFilteredItems.length === 0 ? (
              <Box py={8} textAlign="center">
                <Text color="surface.500">No results found</Text>
              </Box>
            ) : (
              <VStack spacing={2} align="stretch">
                <AnimatePresence>
                  {renderCategory('Navigation', groupedItems.navigation, 0)}
                  {renderCategory(
                    'Connections',
                    groupedItems.connections,
                    groupedItems.navigation.length
                  )}
                  {renderCategory(
                    'Tables',
                    groupedItems.tables,
                    groupedItems.navigation.length + groupedItems.connections.length
                  )}
                </AnimatePresence>
              </VStack>
            )}
          </Box>

          {/* Footer */}
          <Box
            borderTopWidth="1px"
            borderColor="surface.700"
            px={3}
            py={2}
            bg="surface.850"
          >
            <HStack spacing={4} justify="center">
              <HStack spacing={1}>
                <Kbd bg="surface.700" fontSize="xs">↑</Kbd>
                <Kbd bg="surface.700" fontSize="xs">↓</Kbd>
                <Text fontSize="xs" color="surface.500">navigate</Text>
              </HStack>
              <HStack spacing={1}>
                <Kbd bg="surface.700" fontSize="xs">↵</Kbd>
                <Text fontSize="xs" color="surface.500">select</Text>
              </HStack>
              <HStack spacing={1}>
                <Kbd bg="surface.700" fontSize="xs">esc</Kbd>
                <Text fontSize="xs" color="surface.500">close</Text>
              </HStack>
            </HStack>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}


