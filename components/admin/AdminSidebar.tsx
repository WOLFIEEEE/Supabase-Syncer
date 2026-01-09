'use client';

import {
  Box,
  VStack,
  HStack,
  Text,
  Link,
  Icon,
  Divider,
  Badge,
  useDisclosure,
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
} from '@chakra-ui/react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon?: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: '📊' },
  { label: 'Users', href: '/admin/users', icon: '👥' },
  { label: 'Sync Jobs', href: '/admin/sync-jobs', icon: '🔄' },
  { label: 'Security', href: '/admin/security', icon: '🔒' },
  { label: 'Analytics', href: '/admin/analytics', icon: '📈' },
  { label: 'System Health', href: '/admin/system-health', icon: '💚' },
  { label: 'Audit Log', href: '/admin/audit-log', icon: '📋' },
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
      bg="surface.900"
      borderRight="1px solid"
      borderColor="surface.700"
      p={4}
    >
      {/* Logo/Header */}
      <Box mb={6}>
        <HStack spacing={3} mb={2}>
          <Text fontSize="xl" fontWeight="bold" color="white">
            Admin Panel
          </Text>
          <Badge colorScheme="red" fontSize="xs">
            ADMIN
          </Badge>
        </HStack>
        <Text fontSize="xs" color="surface.400">
          Supabase Syncer
        </Text>
      </Box>

      <Divider borderColor="surface.700" mb={4} />

      {/* Navigation Items */}
      <VStack spacing={1} align="stretch" flex={1}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
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
                px={4}
                py={3}
                borderRadius="md"
                bg={isActive ? 'brand.500/20' : 'transparent'}
                borderLeft={isActive ? '3px solid' : '3px solid transparent'}
                borderColor={isActive ? 'brand.400' : 'transparent'}
                color={isActive ? 'brand.400' : 'surface.300'}
                _hover={{
                  bg: isActive ? 'brand.500/20' : 'surface.800',
                  color: isActive ? 'brand.400' : 'white',
                }}
                transition="all 0.2s"
                cursor="pointer"
              >
                <Text fontSize="lg">{item.icon}</Text>
                <Text fontSize="sm" fontWeight={isActive ? '600' : '400'} flex={1}>
                  {item.label}
                </Text>
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

      <Divider borderColor="surface.700" my={4} />

      {/* User Profile Section */}
      <Box>
        <Menu>
          <MenuButton
            as={Button}
            variant="ghost"
            w="100%"
            justifyContent="flex-start"
            _hover={{ bg: 'surface.800' }}
            _active={{ bg: 'surface.800' }}
          >
            <HStack spacing={3} w="100%">
              <Avatar size="sm" name={adminUser.email} bg="brand.400" />
              <VStack spacing={0} align="start" flex={1} minW={0}>
                <Text fontSize="xs" color="white" fontWeight="medium" isTruncated w="100%">
                  {adminUser.email}
                </Text>
                <Text fontSize="xs" color="surface.400">
                  Admin
                </Text>
              </VStack>
            </HStack>
          </MenuButton>
          <MenuList bg="surface.800" borderColor="surface.700">
            <MenuItem
              bg="surface.800"
              _hover={{ bg: 'surface.700' }}
              color="white"
              onClick={handleLogout}
            >
              Logout
            </MenuItem>
          </MenuList>
        </Menu>
      </Box>
    </VStack>
  );

  if (isMobile) {
    return (
      <Drawer isOpen={isOpen || false} placement="left" onClose={onClose || (() => {})}>
        <DrawerOverlay />
        <DrawerContent bg="surface.900" borderRight="1px solid" borderColor="surface.700">
          <DrawerCloseButton color="white" />
          <DrawerHeader color="white">Admin Panel</DrawerHeader>
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

