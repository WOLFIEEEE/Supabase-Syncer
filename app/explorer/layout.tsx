'use client';

import { Box, Flex, HStack, VStack, Text, Badge, IconButton, Tooltip, useToast, Kbd, Button, useDisclosure } from '@chakra-ui/react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import Image from 'next/image';
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
          px={{ base: 2, md: 4 }}
          py={{ base: 2, md: 3 }}
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'stretch', md: 'center' }}
          gap={{ base: 2, md: 0 }}
        >
          {/* Left: Back button + Breadcrumbs */}
          <Flex
            direction={{ base: 'row', md: 'row' }}
            align="center"
            gap={{ base: 2, md: 3 }}
            flex={1}
            minW={0}
            overflow="hidden"
          >
            {pathname !== '/explorer' && (
              <Tooltip label="Back" hasArrow>
                <IconButton
                  aria-label="Go back"
                  icon={<ArrowLeftIcon />}
                  variant="ghost"
                  size={{ base: 'sm', md: 'sm' }}
                  onClick={handleBack}
                  flexShrink={0}
                  minH="44px"
                />
              </Tooltip>
            )}
            
            <HStack 
              spacing={{ base: 1, md: 2 }} 
              divider={<Box color="surface.600" display={{ base: 'none', sm: 'block' }}><ChevronRightIcon /></Box>}
              flex={1}
              minW={0}
              overflow="hidden"
            >
              {breadcrumbs.map((crumb, index) => (
                <HStack
                  key={crumb.href}
                  spacing={{ base: 1, md: 2 }}
                  cursor="pointer"
                  onClick={() => router.push(crumb.href)}
                  px={{ base: 1, md: 2 }}
                  py={1}
                  borderRadius="md"
                  _hover={{ bg: 'surface.700' }}
                  transition="all 0.2s"
                  flexShrink={index === breadcrumbs.length - 1 ? 0 : 1}
                  minW={0}
                >
                  <Box 
                    color={index === breadcrumbs.length - 1 ? 'teal.400' : 'surface.400'}
                    flexShrink={0}
                    display={{ base: index === breadcrumbs.length - 1 ? 'block' : 'none', sm: 'block' }}
                  >
                    {crumb.icon}
                  </Box>
                  <Text
                    fontSize={{ base: 'xs', md: 'sm' }}
                    fontWeight={index === breadcrumbs.length - 1 ? 'semibold' : 'normal'}
                    color={index === breadcrumbs.length - 1 ? 'white' : 'surface.300'}
                    noOfLines={1}
                    minW={0}
                  >
                    {crumb.label}
                  </Text>
                  {crumb.badge && (
                    <Badge
                      colorScheme={crumb.badge === 'production' ? 'red' : 'green'}
                      fontSize={{ base: '2xs', md: 'xs' }}
                      textTransform="lowercase"
                      flexShrink={0}
                    >
                      {crumb.badge}
                    </Badge>
                  )}
                </HStack>
              ))}
            </HStack>
          </Flex>
          
          {/* Right: Actions */}
          <HStack spacing={{ base: 1, md: 2 }} flexShrink={0}>
            {/* Command Bar Trigger */}
            <Tooltip label="Command Palette (⌘K)" hasArrow>
              <Button
                variant="ghost"
                size={{ base: 'sm', md: 'sm' }}
                color="surface.400"
                _hover={{ bg: 'surface.700' }}
                leftIcon={<CommandIcon />}
                onClick={onCommandOpen}
                minH="44px"
                display={{ base: 'flex', md: 'flex' }}
              >
                <HStack spacing={1} display={{ base: 'none', sm: 'flex' }}>
                  <Kbd bg="surface.700" fontSize="xs">⌘</Kbd>
                  <Kbd bg="surface.700" fontSize="xs">K</Kbd>
                </HStack>
              </Button>
            </Tooltip>
            
            {/* Logo - Hidden on mobile, shown on tablet+ */}
            <VStack 
              spacing={0.5} 
              align="start" 
              mr={{ base: 0, md: 4 }}
              display={{ base: 'none', lg: 'flex' }}
            >
              <HStack spacing={2}>
                <Box width="24px" height="24px" position="relative" flexShrink={0}>
                  <Image
                    src="/logo.png"
                    alt="suparbase logo"
                    width={24}
                    height={24}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                    priority
                  />
                </Box>
                <HStack spacing={0}>
                  <Text fontSize="xs" fontWeight="300" color="white" letterSpacing="0.05em" opacity={0.9}>
                    SUPA
                  </Text>
                  <Box 
                    mx={1} 
                    px={1.5} 
                    py={0.5} 
                    bgGradient="linear(to-br, #3ECF8E, #14B8A6)" 
                    borderRadius="full" 
                    display="flex" 
                    alignItems="center"
                    boxShadow="0 0 10px rgba(62, 207, 142, 0.2)"
                  >
                    <Text fontSize="xs" fontWeight="900" color="white" lineHeight="1" fontFamily="JetBrains Mono, monospace">
                      R
                    </Text>
                  </Box>
                  <Text fontSize="xs" fontWeight="300" color="white" letterSpacing="0.05em" opacity={0.9}>
                    BASE
                  </Text>
                </HStack>
              </HStack>
              <Text 
                fontSize="2xs" 
                fontWeight="400" 
                color="surface.400"
                letterSpacing="0.1em"
                textTransform="uppercase"
                ml="32px"
              >
                reimagining
              </Text>
            </VStack>
            
            <Tooltip label="Back to Dashboard" hasArrow>
              <IconButton
                aria-label="Dashboard"
                icon={<HomeIcon />}
                variant="ghost"
                size={{ base: 'sm', md: 'sm' }}
                onClick={() => router.push('/')}
                minH="44px"
              />
            </Tooltip>
            
            <Tooltip label="Logout" hasArrow>
              <IconButton
                aria-label="Logout"
                icon={<LogoutIcon />}
                variant="ghost"
                size={{ base: 'sm', md: 'sm' }}
                onClick={handleLogout}
                minH="44px"
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
        py={{ base: 2, md: 2 }}
        px={{ base: 2, md: 4 }}
      >
        <Flex 
          direction={{ base: 'column', md: 'row' }}
          justify="space-between" 
          align={{ base: 'start', md: 'center' }}
          gap={{ base: 2, md: 4 }}
        >
          <HStack spacing={{ base: 2, md: 4 }} flexWrap="wrap">
            <Text fontSize={{ base: 'xs', md: 'xs' }} color="surface.500">
              Data Explorer
            </Text>
            {connectionInfo && (
              <Badge 
                colorScheme="teal" 
                variant="subtle" 
                fontSize={{ base: '2xs', md: 'xs' }}
                whiteSpace="nowrap"
              >
                Connected to {connectionInfo.name}
              </Badge>
            )}
          </HStack>
          <Text 
            fontSize={{ base: '2xs', md: 'xs' }} 
            color="surface.600"
            textAlign={{ base: 'left', md: 'right' }}
            lineHeight="1.4"
          >
            <Box as="span" display={{ base: 'none', sm: 'inline' }}>
              Single row operations only • Bulk disabled for safety
            </Box>
            <Box as="span" display={{ base: 'inline', sm: 'none' }}>
              Read-only mode
            </Box>
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}

