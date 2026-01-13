'use client';

import {
  Box,
  HStack,
  Text,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
  Button,
  Tooltip,
  Spinner,
} from '@chakra-ui/react';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion.create(Box);

// Icons
const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const ServerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
    <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
    <line x1="6" y1="6" x2="6.01" y2="6"/>
    <line x1="6" y1="18" x2="6.01" y2="18"/>
  </svg>
);

const TestIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
    <path d="m9 15 2 2 4-4"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2v6h-6"/>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
    <path d="M3 22v-6h6"/>
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

interface AdminHeaderProps {
  onMenuClick?: () => void;
  adminUser: { id: string; email: string };
}

const pageTitles: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/users': 'User Management',
  '/admin/sync-jobs': 'Sync Jobs',
  '/admin/security': 'Security Monitoring',
  '/admin/analytics': 'Analytics',
  '/admin/system-health': 'System Health',
  '/admin/audit-log': 'Audit Log',
  '/admin/api-testing': 'API Testing',
};

type BackendStatus = 'checking' | 'online' | 'offline' | 'degraded';

export default function AdminHeader({ onMenuClick, adminUser }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle = pageTitles[pathname] || 'Admin';
  
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking');
  const [backendLatency, setBackendLatency] = useState<number | null>(null);

  // Check backend status via proxy (avoids CORS)
  useEffect(() => {
    const checkBackendHealth = async () => {
      const start = Date.now();
      try {
        // Use proxy path configured in next.config.ts
        const res = await fetch('/backend-api/health', {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        const latency = Date.now() - start;
        setBackendLatency(latency);
        
        if (res.ok) {
          const data = await res.json();
          setBackendStatus(data.status === 'healthy' || data.status === 'running' ? 'online' : 'degraded');
        } else {
          setBackendStatus('degraded');
        }
      } catch {
        setBackendStatus('offline');
        setBackendLatency(null);
      }
    };

    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const statusColors = {
    checking: { bg: 'gray.500', text: 'Checking...' },
    online: { bg: 'green.400', text: 'Online' },
    offline: { bg: 'red.400', text: 'Offline' },
    degraded: { bg: 'yellow.400', text: 'Degraded' },
  };

  const currentStatus = statusColors[backendStatus];

  return (
    <Box
      w="100%"
      h="64px"
      bg="rgba(9, 9, 11, 0.95)"
      backdropFilter="blur(10px)"
      borderBottom="1px solid"
      borderColor="surface.700"
      px={{ base: 4, md: 6 }}
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      position="sticky"
      top={0}
      zIndex={100}
    >
      <HStack spacing={4}>
        {/* Mobile Menu Button */}
        <IconButton
          aria-label="Open menu"
          icon={<MenuIcon />}
          variant="ghost"
          color="white"
          display={{ base: 'flex', md: 'none' }}
          onClick={onMenuClick}
          _hover={{ bg: 'surface.800' }}
        />

        {/* Page Title */}
        <Text
          fontSize={{ base: 'lg', md: 'xl' }}
          fontWeight="700"
          color="white"
          fontFamily="'Outfit', sans-serif"
          letterSpacing="-0.02em"
        >
          {pageTitle}
        </Text>

        {/* Backend Status Indicator */}
        <Tooltip
          label={
            backendLatency
              ? `Backend ${currentStatus.text} (${backendLatency}ms)`
              : `Backend ${currentStatus.text}`
          }
          placement="bottom"
        >
          <HStack
            spacing={2}
            px={3}
            py={1.5}
            borderRadius="full"
            bg="rgba(255, 255, 255, 0.05)"
            border="1px solid"
            borderColor="surface.700"
            cursor="default"
            display={{ base: 'none', md: 'flex' }}
          >
            <AnimatePresence mode="wait">
              {backendStatus === 'checking' ? (
                <Spinner size="xs" color="gray.400" />
              ) : (
                <MotionBox
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Box
                    w={2}
                    h={2}
                    borderRadius="full"
                    bg={currentStatus.bg}
                    boxShadow={backendStatus === 'online' ? `0 0 8px ${currentStatus.bg}` : 'none'}
                  />
                </MotionBox>
              )}
            </AnimatePresence>
            <HStack spacing={1}>
              <ServerIcon />
              <Text fontSize="xs" color="surface.300" fontWeight="medium">
                {currentStatus.text}
              </Text>
            </HStack>
          </HStack>
        </Tooltip>
      </HStack>

      <HStack spacing={3}>
        {/* Run Tests Button */}
        <Tooltip label="Run API Tests" placement="bottom">
          <Button
            size="sm"
            variant="ghost"
            color="surface.300"
            leftIcon={<TestIcon />}
            _hover={{ bg: 'surface.800', color: 'white' }}
            onClick={() => router.push('/admin/api-testing')}
            display={{ base: 'none', md: 'flex' }}
          >
            Run Tests
          </Button>
        </Tooltip>

        {/* Notifications */}
        <Menu>
          <MenuButton
            as={IconButton}
            aria-label="Notifications"
            icon={<BellIcon />}
            variant="ghost"
            color="surface.300"
            _hover={{ bg: 'surface.800', color: 'white' }}
            position="relative"
          />
          <MenuList bg="surface.800" borderColor="surface.700" shadow="xl">
            <Box px={4} py={3} borderBottom="1px solid" borderColor="surface.700">
              <Text fontSize="sm" fontWeight="600" color="white">Notifications</Text>
            </Box>
            <MenuItem bg="surface.800" _hover={{ bg: 'surface.700' }} color="surface.400" py={3}>
              <Text fontSize="sm">No new notifications</Text>
            </MenuItem>
          </MenuList>
        </Menu>

        {/* Quick Actions */}
        <Menu>
          <MenuButton
            as={Button}
            size="sm"
            bg="linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)"
            color="teal.400"
            border="1px solid"
            borderColor="teal.400/30"
            _hover={{ 
              bg: 'linear-gradient(135deg, rgba(20, 184, 166, 0.3) 0%, rgba(6, 182, 212, 0.3) 100%)',
              borderColor: 'teal.400/50',
            }}
            _active={{ bg: 'rgba(20, 184, 166, 0.4)' }}
            fontWeight="600"
          >
            Quick Actions
          </MenuButton>
          <MenuList bg="surface.800" borderColor="surface.700" shadow="xl" py={2}>
            <MenuItem 
              bg="surface.800" 
              _hover={{ bg: 'surface.700' }} 
              color="white"
              icon={<RefreshIcon />}
              onClick={() => window.location.reload()}
            >
              Refresh Dashboard
            </MenuItem>
            <MenuItem 
              bg="surface.800" 
              _hover={{ bg: 'surface.700' }} 
              color="white"
              icon={<TestIcon />}
              onClick={() => router.push('/admin/api-testing')}
            >
              Run All Tests
            </MenuItem>
            <MenuItem 
              bg="surface.800" 
              _hover={{ bg: 'surface.700' }} 
              color="white"
              icon={<DownloadIcon />}
            >
              Export Data
            </MenuItem>
            <Box h="1px" bg="surface.700" my={2} mx={3} />
            <MenuItem 
              bg="surface.800" 
              _hover={{ bg: 'surface.700' }} 
              color="white"
              icon={<FileIcon />}
              onClick={() => router.push('/admin/audit-log')}
            >
              View Logs
            </MenuItem>
            <MenuItem 
              bg="surface.800" 
              _hover={{ bg: 'surface.700' }} 
              color="white"
              icon={<SettingsIcon />}
              onClick={() => router.push('/admin/system-health')}
            >
              System Settings
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Box>
  );
}
