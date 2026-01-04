'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  useDisclosure,
} from '@chakra-ui/react';

// Icons
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

const SyncIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const BookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: 'navigation' | 'actions' | 'settings';
}

interface CommandPaletteProviderProps {
  children: React.ReactNode;
}

export default function CommandPaletteProvider({ children }: CommandPaletteProviderProps) {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const commands: Command[] = [
    // Navigation
    {
      id: 'home',
      label: 'Go to Dashboard',
      icon: <HomeIcon />,
      shortcut: 'G D',
      action: () => router.push('/'),
      category: 'navigation',
    },
    {
      id: 'connections',
      label: 'Manage Connections',
      icon: <DatabaseIcon />,
      shortcut: 'G C',
      action: () => router.push('/connections'),
      category: 'navigation',
    },
    {
      id: 'schema-sync',
      label: 'Schema Sync',
      icon: <SyncIcon />,
      shortcut: 'G S',
      action: () => router.push('/schema-sync'),
      category: 'navigation',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <SettingsIcon />,
      shortcut: 'G ,',
      action: () => router.push('/settings'),
      category: 'navigation',
    },
    {
      id: 'docs',
      label: 'Documentation',
      icon: <BookIcon />,
      shortcut: 'G ?',
      action: () => router.push('/guide'),
      category: 'navigation',
    },
    // Actions
    {
      id: 'new-sync',
      label: 'Create New Sync Job',
      description: 'Start a new data synchronization',
      icon: <SyncIcon />,
      action: () => router.push('/sync/create'),
      category: 'actions',
    },
    {
      id: 'sync-history',
      label: 'Sync History',
      description: 'View all past sync jobs',
      icon: <SyncIcon />,
      action: () => router.push('/sync/history'),
      category: 'actions',
    },
    {
      id: 'new-connection',
      label: 'Add New Connection',
      description: 'Add a new database connection',
      icon: <DatabaseIcon />,
      action: () => router.push('/connections'),
      category: 'actions',
    },
    // Settings
    {
      id: 'logout',
      label: 'Logout',
      icon: <LogoutIcon />,
      action: handleLogout,
      category: 'settings',
    },
  ];

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(search.toLowerCase()) ||
      cmd.description?.toLowerCase().includes(search.toLowerCase())
  );

  // Expose open function globally for button access
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  useEffect(() => {
    // Make openCommandPalette available globally
    (window as any).__openCommandPalette = () => {
      onOpenRef.current();
    };

    // Also listen for custom event as fallback
    const handleOpenPalette = () => {
      onOpenRef.current();
    };
    document.addEventListener('open-command-palette', handleOpenPalette);

    return () => {
      delete (window as any).__openCommandPalette;
      document.removeEventListener('open-command-palette', handleOpenPalette);
    };
  }, []);

  // Keyboard shortcut to open (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          onOpen();
        }
      }

      if (isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            onClose();
          }
        } else if (e.key === 'Escape') {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onOpen, onClose, filteredCommands, selectedIndex]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const groupedCommands = {
    navigation: filteredCommands.filter((c) => c.category === 'navigation'),
    actions: filteredCommands.filter((c) => c.category === 'actions'),
    settings: filteredCommands.filter((c) => c.category === 'settings'),
  };

  let globalIndex = -1;

  return (
    <>
      {children}
      
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(8px)" />
        <ModalContent bg="surface.800" borderColor="surface.600" borderWidth="1px" mt="20vh">
          <ModalBody p={0}>
            <InputGroup size="lg">
              <InputLeftElement pointerEvents="none" color="surface.400">
                <SearchIcon />
              </InputLeftElement>
              <Input
                ref={inputRef}
                placeholder="Search commands..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                border="none"
                borderBottomWidth="1px"
                borderColor="surface.700"
                borderRadius="none"
                _focus={{ boxShadow: 'none' }}
                color="white"
              />
            </InputGroup>

            <Box maxH="400px" overflowY="auto" py={2}>
              {filteredCommands.length === 0 ? (
                <Text color="surface.400" textAlign="center" py={8}>
                  No commands found
                </Text>
              ) : (
                <VStack align="stretch" spacing={0}>
                  {Object.entries(groupedCommands).map(([category, cmds]) => {
                    if (cmds.length === 0) return null;
                    
                    return (
                      <Box key={category}>
                        <Text
                          px={4}
                          py={2}
                          fontSize="xs"
                          fontWeight="bold"
                          color="surface.500"
                          textTransform="uppercase"
                        >
                          {category}
                        </Text>
                        {cmds.map((cmd) => {
                          globalIndex++;
                          const isSelected = globalIndex === selectedIndex;
                          const currentIndex = globalIndex;
                          
                          return (
                            <HStack
                              key={cmd.id}
                              px={4}
                              py={3}
                              cursor="pointer"
                              bg={isSelected ? 'surface.700' : 'transparent'}
                              _hover={{ bg: 'surface.700' }}
                              onClick={() => {
                                cmd.action();
                                onClose();
                              }}
                              onMouseEnter={() => setSelectedIndex(currentIndex)}
                              spacing={3}
                            >
                              <Box color={isSelected ? 'brand.400' : 'surface.400'}>
                                {cmd.icon}
                              </Box>
                              <VStack align="start" spacing={0} flex={1}>
                                <Text color="white" fontSize="sm">
                                  {cmd.label}
                                </Text>
                                {cmd.description && (
                                  <Text color="surface.500" fontSize="xs">
                                    {cmd.description}
                                  </Text>
                                )}
                              </VStack>
                              {cmd.shortcut && (
                                <HStack spacing={1}>
                                  {cmd.shortcut.split(' ').map((key, i) => (
                                    <Kbd key={i} bg="surface.900" color="surface.400" fontSize="xs">
                                      {key}
                                    </Kbd>
                                  ))}
                                </HStack>
                              )}
                            </HStack>
                          );
                        })}
                      </Box>
                    );
                  })}
                </VStack>
              )}
            </Box>

            <HStack
              px={4}
              py={3}
              borderTopWidth="1px"
              borderColor="surface.700"
              justify="center"
              spacing={4}
            >
              <HStack spacing={1}>
                <Kbd bg="surface.900" fontSize="xs">↑</Kbd>
                <Kbd bg="surface.900" fontSize="xs">↓</Kbd>
                <Text color="surface.500" fontSize="xs">to navigate</Text>
              </HStack>
              <HStack spacing={1}>
                <Kbd bg="surface.900" fontSize="xs">↵</Kbd>
                <Text color="surface.500" fontSize="xs">to select</Text>
              </HStack>
              <HStack spacing={1}>
                <Kbd bg="surface.900" fontSize="xs">esc</Kbd>
                <Text color="surface.500" fontSize="xs">to close</Text>
              </HStack>
            </HStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

