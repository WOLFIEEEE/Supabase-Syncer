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
  useDisclosure,
} from '@chakra-ui/react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

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
};

export default function AdminHeader({ onMenuClick, adminUser }: AdminHeaderProps) {
  const pathname = usePathname();
  const pageTitle = pageTitles[pathname] || 'Admin';

  return (
    <Box
      w="100%"
      h="64px"
      bg="surface.900"
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
          icon={<Text fontSize="xl">☰</Text>}
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
        >
          {pageTitle}
        </Text>
      </HStack>

      <HStack spacing={4}>
        {/* Notifications */}
        <Menu>
          <MenuButton
            as={IconButton}
            aria-label="Notifications"
            icon={<Text fontSize="lg">🔔</Text>}
            variant="ghost"
            color="white"
            _hover={{ bg: 'surface.800' }}
            position="relative"
          >
            <Badge
              position="absolute"
              top="8px"
              right="8px"
              colorScheme="red"
              borderRadius="full"
              fontSize="xs"
              w="18px"
              h="18px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              0
            </Badge>
          </MenuButton>
          <MenuList bg="surface.800" borderColor="surface.700">
            <MenuItem bg="surface.800" _hover={{ bg: 'surface.700' }} color="white">
              No new notifications
            </MenuItem>
          </MenuList>
        </Menu>

        {/* Quick Actions */}
        <Menu>
          <MenuButton
            as={Button}
            size="sm"
            colorScheme="brand"
            variant="outline"
            borderColor="brand.400"
            color="brand.400"
            _hover={{ bg: 'brand.500/20' }}
          >
            Quick Actions
          </MenuButton>
          <MenuList bg="surface.800" borderColor="surface.700">
            <MenuItem bg="surface.800" _hover={{ bg: 'surface.700' }} color="white">
              Export Data
            </MenuItem>
            <MenuItem bg="surface.800" _hover={{ bg: 'surface.700' }} color="white">
              System Settings
            </MenuItem>
            <MenuItem bg="surface.800" _hover={{ bg: 'surface.700' }} color="white">
              View Logs
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Box>
  );
}

