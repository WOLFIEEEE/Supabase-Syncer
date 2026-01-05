'use client';

import { Box, Flex, HStack, Text, Badge, IconButton, Tooltip, useToast, Kbd, Button, useDisclosure } from '@chakra-ui/react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import CommandBar from '@/components/explorer/CommandBar';

// Icons
const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const DatabaseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);

const TableIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <line x1="3" y1="9" x2="21" y2="9"/>
    <line x1="3" y1="15" x2="21" y2="15"/>
    <line x1="9" y1="3" x2="9" y2="21"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const CommandIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
  </svg>
);

interface ConnectionInfo {
  id: string;
  name: string;
  environment: 'production' | 'development';
}

export default function ExplorerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const toast = useToast();
  const { signOut } = useAuth();
  const { isOpen: isCommandOpen, onOpen: onCommandOpen, onClose: onCommandClose } = useDisclosure();
  
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [tableName, setTableName] = useState<string | null>(null);
  
  const connectionId = params?.connectionId as string | undefined;
  const table = params?.table as string | undefined;
  
  // Global keyboard shortcut for command bar
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      onCommandOpen();
    }
  }, [onCommandOpen]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  // Fetch connection info when connectionId changes
  useEffect(() => {
    if (connectionId) {
      fetch(`/api/explorer/${connectionId}/tables`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setConnectionInfo(data.data.connection);
          }
        })
        .catch(console.error);
    } else {
      setConnectionInfo(null);
    }
  }, [connectionId]);
  
  // Set table name from URL
  useEffect(() => {
    setTableName(table ? decodeURIComponent(table) : null);
  }, [table]);
  
  const handleBack = () => {
    if (tableName && connectionId) {
      router.push(`/explorer/${connectionId}`);
    } else if (connectionId) {
      router.push('/explorer');
    } else {
      router.push('/');
    }
  };
  
  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      toast({
        title: 'Logout failed',
        status: 'error',
        duration: 3000,
      });
    }
  };
  
  // Build breadcrumbs
  const breadcrumbs = [];
  breadcrumbs.push({ label: 'Explorer', href: '/explorer', icon: <HomeIcon /> });
  
  if (connectionInfo) {
    breadcrumbs.push({
      label: connectionInfo.name,
      href: `/explorer/${connectionId}`,
      icon: <DatabaseIcon />,
      badge: connectionInfo.environment,
    });
  }
  
  if (tableName) {
    breadcrumbs.push({
      label: tableName,
      href: `/explorer/${connectionId}/${tableName}`,
      icon: <TableIcon />,
    });
  }
  
  return (
    <Box minH="100vh" bg="surface.900" display="flex" flexDirection="column">
      {/* Header */}
      <Box
        as="header"
        bg="surface.800"
        borderBottomWidth="1px"
        borderColor="surface.700"
        position="sticky"
        top={0}
        zIndex={100}
      >
        <Flex
          maxW="100%"
          px={4}
          py={3}
          justify="space-between"
          align="center"
        >
          {/* Left: Back button + Breadcrumbs */}
          <HStack spacing={3}>
            {pathname !== '/explorer' && (
              <Tooltip label="Back" hasArrow>
                <IconButton
                  aria-label="Go back"
                  icon={<ArrowLeftIcon />}
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                />
              </Tooltip>
            )}
            
            <HStack spacing={2} divider={<Box color="surface.600"><ChevronRightIcon /></Box>}>
              {breadcrumbs.map((crumb, index) => (
                <HStack
                  key={crumb.href}
                  spacing={2}
                  cursor="pointer"
                  onClick={() => router.push(crumb.href)}
                  px={2}
                  py={1}
                  borderRadius="md"
                  _hover={{ bg: 'surface.700' }}
                  transition="all 0.2s"
                >
                  <Box color={index === breadcrumbs.length - 1 ? 'teal.400' : 'surface.400'}>
                    {crumb.icon}
                  </Box>
                  <Text
                    fontSize="sm"
                    fontWeight={index === breadcrumbs.length - 1 ? 'semibold' : 'normal'}
                    color={index === breadcrumbs.length - 1 ? 'white' : 'surface.300'}
                  >
                    {crumb.label}
                  </Text>
                  {crumb.badge && (
                    <Badge
                      colorScheme={crumb.badge === 'production' ? 'red' : 'green'}
                      fontSize="xs"
                      textTransform="lowercase"
                    >
                      {crumb.badge}
                    </Badge>
                  )}
                </HStack>
              ))}
            </HStack>
          </HStack>
          
          {/* Right: Actions */}
          <HStack spacing={2}>
            {/* Command Bar Trigger */}
            <Tooltip label="Command Palette (⌘K)" hasArrow>
              <Button
                variant="ghost"
                size="sm"
                color="surface.400"
                _hover={{ bg: 'surface.700' }}
                leftIcon={<CommandIcon />}
                onClick={onCommandOpen}
              >
                <HStack spacing={1}>
                  <Kbd bg="surface.700" fontSize="xs">⌘</Kbd>
                  <Kbd bg="surface.700" fontSize="xs">K</Kbd>
                </HStack>
              </Button>
            </Tooltip>
            
            {/* Logo */}
            <HStack spacing={2} mr={4}>
              <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
                <defs>
                  <linearGradient id="elg1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#14B8A6"/>
                    <stop offset="100%" stopColor="#0D9488"/>
                  </linearGradient>
                  <linearGradient id="elg2" x1="0%" y1="50%" x2="100%" y2="50%">
                    <stop offset="0%" stopColor="#5EEAD4"/>
                    <stop offset="50%" stopColor="#2DD4BF"/>
                    <stop offset="100%" stopColor="#5EEAD4"/>
                  </linearGradient>
                </defs>
                <circle cx="24" cy="24" r="22" fill="url(#elg1)"/>
                <path 
                  d="M8 24 L14 24 L17 18 L20 30 L24 12 L28 36 L31 18 L34 24 L40 24" 
                  stroke="url(#elg2)" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
              <Text fontWeight="bold" color="white" fontSize="sm">
                Supapulse
              </Text>
            </HStack>
            
            <Tooltip label="Back to Dashboard" hasArrow>
              <IconButton
                aria-label="Dashboard"
                icon={<HomeIcon />}
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
              />
            </Tooltip>
            
            <Tooltip label="Logout" hasArrow>
              <IconButton
                aria-label="Logout"
                icon={<LogoutIcon />}
                variant="ghost"
                size="sm"
                onClick={handleLogout}
              />
            </Tooltip>
          </HStack>
        </Flex>
      </Box>
      
      {/* Main Content */}
      <Box flex={1} overflow="auto">
        {children}
      </Box>
      
      {/* Command Bar */}
      <CommandBar
        isOpen={isCommandOpen}
        onClose={onCommandClose}
        currentConnectionId={connectionId}
      />
      
      {/* Footer */}
      <Box
        as="footer"
        bg="surface.800"
        borderTopWidth="1px"
        borderColor="surface.700"
        py={2}
        px={4}
      >
        <Flex justify="space-between" align="center">
          <HStack spacing={4}>
            <Text fontSize="xs" color="surface.500">
              Data Explorer
            </Text>
            {connectionInfo && (
              <Badge colorScheme="teal" variant="subtle" fontSize="xs">
                Connected to {connectionInfo.name}
              </Badge>
            )}
          </HStack>
          <HStack spacing={4}>
            <Text fontSize="xs" color="surface.600">
              Single row operations only • Bulk disabled for safety
            </Text>
          </HStack>
        </Flex>
      </Box>
    </Box>
  );
}

