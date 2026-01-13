'use client';

import {
  Box,
  VStack,
  HStack,
  Text,
  Link,
  Divider,
  Badge,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Button,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
} from '@chakra-ui/react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

// Suparbase Logo Icon - Superhero Shield
const SuparbaseLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#14b8a6" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
    </defs>
    <path 
      d="M16 2L4 7v9c0 7.5 5.1 14.5 12 16 6.9-1.5 12-8.5 12-16V7L16 2z" 
      fill="url(#shieldGrad)"
      stroke="#0d9488"
      strokeWidth="1"
    />
    <path 
      d="M16 8L11 12v4l5 4 5-4v-4L16 8z" 
      fill="rgba(255,255,255,0.9)"
    />
    <path 
      d="M16 10l3 2.5v2.5L16 18l-3-3v-2.5L16 10z" 
      fill="#0d9488"
    />
  </svg>
);

// Navigation Icons
const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9" rx="1"/>
    <rect x="14" y="3" width="7" height="5" rx="1"/>
    <rect x="14" y="12" width="7" height="9" rx="1"/>
    <rect x="3" y="16" width="7" height="5" rx="1"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const SyncIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2v6h-6"/>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
    <path d="M3 22v-6h6"/>
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
  </svg>
);

const SecurityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const AnalyticsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

const HealthIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
);

const AuditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const TestingIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
    <path d="m9 15 2 2 4-4"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const DatabaseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  isNew?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: <DashboardIcon /> },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Users', href: '/admin/users', icon: <UsersIcon /> },
      { label: 'Connections', href: '/admin/connections', icon: <DatabaseIcon /> },
      { label: 'Sync Jobs', href: '/admin/sync-jobs', icon: <SyncIcon /> },
      { label: 'Security', href: '/admin/security', icon: <SecurityIcon /> },
    ],
  },
  {
    title: 'Monitoring',
    items: [
      { label: 'Analytics', href: '/admin/analytics', icon: <AnalyticsIcon /> },
      { label: 'System Health', href: '/admin/system-health', icon: <HealthIcon /> },
      { label: 'Audit Log', href: '/admin/audit-log', icon: <AuditIcon /> },
    ],
  },
  {
    title: 'Developer',
    items: [
      { label: 'API Testing', href: '/admin/api-testing', icon: <TestingIcon />, isNew: true },
    ],
  },
];

interface AdminSidebarProps {
  adminUser: { id: string; email: string };
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

export default function AdminSidebar({ adminUser, isOpen, onClose, isMobile = false }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const SidebarContent = () => (
    <VStack
      spacing={0}
      align="stretch"
      h="100%"
      bg="linear-gradient(180deg, rgba(9, 9, 11, 0.98) 0%, rgba(9, 9, 11, 1) 100%)"
      borderRight="1px solid"
      borderColor="surface.700"
      p={4}
      position="relative"
      overflow="hidden"
    >
      {/* Background Glow Effect */}
      <Box
        position="absolute"
        top="-50px"
        left="-50px"
        w="200px"
        h="200px"
        bg="radial-gradient(circle, rgba(20, 184, 166, 0.1) 0%, transparent 70%)"
        pointerEvents="none"
      />

      {/* Logo/Header */}
      <MotionBox
        mb={6}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <HStack spacing={3} mb={2}>
          <Box
            p={1}
            borderRadius="lg"
            bg="rgba(20, 184, 166, 0.1)"
            border="1px solid"
            borderColor="rgba(20, 184, 166, 0.2)"
          >
            <SuparbaseLogo />
          </Box>
          <VStack spacing={0} align="start">
            <HStack spacing={2}>
              <Text 
                fontSize="xl" 
                fontWeight="800" 
                bgGradient="linear(to-r, teal.400, cyan.400)"
                bgClip="text"
                fontFamily="'Outfit', sans-serif"
                letterSpacing="-0.02em"
              >
                Suparbase
              </Text>
            </HStack>
            <Text fontSize="xs" color="surface.500" fontWeight="medium">
              Admin Control Center
          </Text>
          </VStack>
        </HStack>
      </MotionBox>

      <Divider borderColor="surface.700" mb={4} opacity={0.5} />

      {/* Navigation Groups */}
      <VStack spacing={5} align="stretch" flex={1} overflowY="auto" pr={1}>
        {navGroups.map((group, groupIndex) => (
          <MotionBox
            key={group.title}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: groupIndex * 0.1 }}
          >
            <Text
              fontSize="xs"
              fontWeight="600"
              color="surface.500"
              textTransform="uppercase"
              letterSpacing="0.05em"
              mb={2}
              px={3}
            >
              {group.title}
        </Text>
            <VStack spacing={1} align="stretch">
              {group.items.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/admin' && pathname.startsWith(item.href + '/'));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (isMobile && onClose) {
                  onClose();
                }
              }}
              _hover={{ textDecoration: 'none' }}
            >
              <HStack
                spacing={3}
                      px={3}
                      py={2.5}
                      borderRadius="lg"
                      bg={isActive ? 'rgba(20, 184, 166, 0.15)' : 'transparent'}
                borderLeft={isActive ? '3px solid' : '3px solid transparent'}
                      borderColor={isActive ? 'teal.400' : 'transparent'}
                      color={isActive ? 'teal.400' : 'surface.300'}
                _hover={{
                        bg: isActive ? 'rgba(20, 184, 166, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        color: isActive ? 'teal.400' : 'white',
                }}
                transition="all 0.2s"
                cursor="pointer"
                      position="relative"
              >
                      <Box opacity={isActive ? 1 : 0.7}>{item.icon}</Box>
                <Text fontSize="sm" fontWeight={isActive ? '600' : '400'} flex={1}>
                  {item.label}
                </Text>
                      {item.isNew && (
                        <Badge 
                          colorScheme="teal" 
                          fontSize="9px" 
                          borderRadius="full"
                          px={2}
                          textTransform="uppercase"
                        >
                          New
                        </Badge>
                      )}
                {item.badge && item.badge > 0 && (
                  <Badge colorScheme="red" fontSize="xs" borderRadius="full">
                    {item.badge}
                  </Badge>
                )}
              </HStack>
            </Link>
          );
        })}
      </VStack>
          </MotionBox>
        ))}
      </VStack>

      <Divider borderColor="surface.700" my={4} opacity={0.5} />

      {/* Quick Links */}
      <Box mb={4}>
        <Tooltip label="Return to main app" placement="right">
          <Link href="/dashboard" _hover={{ textDecoration: 'none' }}>
            <HStack
              spacing={3}
              px={3}
              py={2}
              borderRadius="lg"
              color="surface.400"
              _hover={{ bg: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
              transition="all 0.2s"
            >
              <HomeIcon />
              <Text fontSize="sm">Back to App</Text>
            </HStack>
          </Link>
        </Tooltip>
      </Box>

      {/* User Profile Section */}
      <Box
        p={3}
        borderRadius="lg"
        bg="rgba(255, 255, 255, 0.03)"
        border="1px solid"
        borderColor="surface.700"
      >
        <Menu>
          <MenuButton
            as={Button}
            variant="ghost"
            w="100%"
            h="auto"
            p={0}
            justifyContent="flex-start"
            _hover={{ bg: 'transparent' }}
            _active={{ bg: 'transparent' }}
          >
            <HStack spacing={3} w="100%">
              <Avatar 
                size="sm" 
                name={adminUser.email} 
                bg="linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)"
                color="white"
                fontWeight="bold"
              />
              <VStack spacing={0} align="start" flex={1} minW={0}>
                <Text fontSize="xs" color="white" fontWeight="medium" isTruncated w="100%">
                  {adminUser.email}
                </Text>
                <HStack spacing={1}>
                  <Box w={2} h={2} borderRadius="full" bg="green.400" />
                <Text fontSize="xs" color="surface.400">
                    Super Admin
                </Text>
                </HStack>
              </VStack>
            </HStack>
          </MenuButton>
          <MenuList bg="surface.800" borderColor="surface.700" shadow="xl">
            <MenuItem
              bg="surface.800"
              _hover={{ bg: 'surface.700' }}
              color="white"
              icon={<LogoutIcon />}
              onClick={handleLogout}
            >
              Sign Out
            </MenuItem>
          </MenuList>
        </Menu>
      </Box>
    </VStack>
  );

  if (isMobile) {
    return (
      <Drawer isOpen={isOpen || false} placement="left" onClose={onClose || (() => {})}>
        <DrawerOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
        <DrawerContent bg="rgba(9, 9, 11, 0.98)" borderRight="1px solid" borderColor="surface.700">
          <DrawerCloseButton color="white" />
          <DrawerHeader>
            <HStack spacing={2}>
              <SuparbaseLogo />
              <Text 
                bgGradient="linear(to-r, teal.400, cyan.400)"
                bgClip="text"
                fontWeight="800"
              >
                Suparbase
              </Text>
            </HStack>
          </DrawerHeader>
          <DrawerBody p={0}>
            <SidebarContent />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Box
      w="280px"
      minH="100vh"
      position="fixed"
      left={0}
      top={0}
      zIndex={10}
      display={{ base: 'none', md: 'block' }}
    >
      <SidebarContent />
    </Box>
  );
}
