'use client';

import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  HStack,
  Link as ChakraLink,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { SuparbaseLogo } from '@/components/Logo';
import { logger } from '@/lib/services/logger';

const MotionBox = motion.create(Box);

type AdminUser = { id: string; email: string };

interface AdminSidebarProps {
  adminUser: AdminUser;
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType;
  badge?: number;
  isNew?: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function SyncIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  );
}

function SecurityIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function HealthIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function AuditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function TestingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

const navGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', href: '/admin', icon: DashboardIcon }],
  },
  {
    title: 'Management',
    items: [
      { label: 'Users', href: '/admin/users', icon: UsersIcon },
      { label: 'Connections', href: '/admin/connections', icon: DatabaseIcon },
      { label: 'Sync Jobs', href: '/admin/sync-jobs', icon: SyncIcon },
      { label: 'Security', href: '/admin/security', icon: SecurityIcon },
    ],
  },
  {
    title: 'Monitoring',
    items: [
      { label: 'Analytics', href: '/admin/analytics', icon: AnalyticsIcon },
      { label: 'System Health', href: '/admin/system-health', icon: HealthIcon },
      { label: 'Audit Log', href: '/admin/audit-log', icon: AuditIcon },
    ],
  },
  {
    title: 'Developer',
    items: [{ label: 'API Testing', href: '/admin/api-testing', icon: TestingIcon, isNew: true }],
  },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== '/admin' && pathname.startsWith(`${href}/`));
}

interface SidebarContentProps {
  adminUser: AdminUser;
  pathname: string;
  isMobile: boolean;
  onClose?: () => void;
  onLogout: () => void;
}

function SidebarContent({ adminUser, pathname, isMobile, onClose, onLogout }: SidebarContentProps) {
  return (
    <VStack
      spacing={0}
      align="stretch"
      h="100%"
      bg="linear-gradient(180deg, rgba(8, 10, 15, 0.98) 0%, rgba(8, 10, 15, 1) 100%)"
      borderRight="1px solid"
      borderColor="border.default"
      p={4}
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top="-60px"
        left="-60px"
        w="220px"
        h="220px"
        bg="radial-gradient(circle, rgba(25, 196, 167, 0.14) 0%, transparent 70%)"
        pointerEvents="none"
      />

      <MotionBox initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <ChakraLink as={Link} href="/admin" _hover={{ textDecoration: 'none' }}>
          <HStack spacing={3} mb={4}>
            <SuparbaseLogo size="sm" variant="icon" showText={false} />
            <VStack spacing={0} align="start">
              <Text fontSize="lg" fontWeight="700" color="text.primary" lineHeight="1.1">
                Suparbase
              </Text>
              <Text fontSize="xs" color="text.tertiary" lineHeight="1">
                Admin Control Center
              </Text>
            </VStack>
          </HStack>
        </ChakraLink>
      </MotionBox>

      <Divider borderColor="border.default" mb={4} />

      <VStack spacing={5} align="stretch" flex={1} overflowY="auto" pr={1}>
        {navGroups.map((group, groupIndex) => (
          <MotionBox
            key={group.title}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: groupIndex * 0.08 }}
          >
            <Text textStyle="label" mb={2} px={3} color="text.tertiary">
              {group.title}
            </Text>
            <VStack spacing={1} align="stretch">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <ChakraLink
                    as={Link}
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    _hover={{ textDecoration: 'none' }}
                    onClick={() => {
                      if (isMobile && onClose) onClose();
                    }}
                  >
                    <HStack
                      spacing={3}
                      px={3}
                      py={2.5}
                      borderRadius="lg"
                      bg={active ? 'rgba(25, 196, 167, 0.17)' : 'transparent'}
                      borderWidth="1px"
                      borderColor={active ? 'rgba(147, 222, 203, 0.3)' : 'transparent'}
                      color={active ? 'text.primary' : 'text.secondary'}
                      _hover={{ bg: active ? 'rgba(25, 196, 167, 0.2)' : 'rgba(255, 255, 255, 0.06)' }}
                      transition="all var(--motion-fast) linear"
                    >
                      <Box opacity={active ? 1 : 0.82}>
                        <Icon />
                      </Box>
                      <Text fontSize="sm" fontWeight={active ? '600' : '500'} flex={1}>
                        {item.label}
                      </Text>
                      {item.isNew && (
                        <Badge colorScheme="teal" fontSize="9px" textTransform="uppercase">
                          New
                        </Badge>
                      )}
                      {!!item.badge && item.badge > 0 && (
                        <Badge colorScheme="red" fontSize="xs">
                          {item.badge}
                        </Badge>
                      )}
                    </HStack>
                  </ChakraLink>
                );
              })}
            </VStack>
          </MotionBox>
        ))}
      </VStack>

      <Divider borderColor="border.default" my={4} />

      <Box mb={4}>
        <Tooltip label="Return to main app" placement="right">
          <ChakraLink as={Link} href="/dashboard" _hover={{ textDecoration: 'none' }}>
            <HStack
              spacing={3}
              px={3}
              py={2}
              borderRadius="lg"
              color="text.secondary"
              _hover={{ bg: 'rgba(255, 255, 255, 0.06)', color: 'text.primary' }}
              transition="all var(--motion-fast) linear"
            >
              <HomeIcon />
              <Text fontSize="sm">Back to App</Text>
            </HStack>
          </ChakraLink>
        </Tooltip>
      </Box>

      <Box p={3} borderRadius="lg" bg="rgba(255, 255, 255, 0.03)" borderWidth="1px" borderColor="border.default">
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
                bg="linear-gradient(135deg, #19c4a7 0%, #1e84ff 100%)"
                color="white"
                fontWeight="bold"
              />
              <VStack spacing={0} align="start" flex={1} minW={0}>
                <Text fontSize="xs" color="text.primary" fontWeight="medium" isTruncated w="100%">
                  {adminUser.email}
                </Text>
                <HStack spacing={1}>
                  <Box w={2} h={2} borderRadius="full" bg="success.400" />
                  <Text fontSize="xs" color="text.tertiary">
                    Super Admin
                  </Text>
                </HStack>
              </VStack>
            </HStack>
          </MenuButton>
          <MenuList>
            <MenuItem icon={<LogoutIcon />} onClick={onLogout}>
              Sign Out
            </MenuItem>
          </MenuList>
        </Menu>
      </Box>
    </VStack>
  );
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
      logger.error('Logout error', { error });
    }
  };

  if (isMobile) {
    return (
      <Drawer isOpen={isOpen || false} placement="left" onClose={onClose || (() => undefined)}>
        <DrawerOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
        <DrawerContent bg="bg.surface" borderRightWidth="1px" borderColor="border.default">
          <DrawerCloseButton color="white" />
          <DrawerHeader>
            <HStack spacing={2}>
              <SuparbaseLogo size="sm" showText={false} variant="icon" />
              <Text fontWeight="700" color="text.primary">
                Suparbase Admin
              </Text>
            </HStack>
          </DrawerHeader>
          <DrawerBody p={0}>
            <SidebarContent
              adminUser={adminUser}
              pathname={pathname}
              isMobile
              onClose={onClose}
              onLogout={handleLogout}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Box w="280px" minH="100vh" position="fixed" left={0} top={0} zIndex={10} display={{ base: 'none', md: 'block' }}>
      <SidebarContent adminUser={adminUser} pathname={pathname} isMobile={false} onLogout={handleLogout} />
    </Box>
  );
}
