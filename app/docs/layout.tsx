'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Badge,
  Box,
  Collapse,
  Container,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  Flex,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Link as ChakraLink,
  Text,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import { SuparbaseLogo } from '@/components/Logo';

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

interface NavSection {
  title: string;
  icon: React.ComponentType;
  items: { href: string; label: string; badge?: string }[];
}

const navSections: NavSection[] = [
  {
    title: 'Getting Started',
    icon: BookIcon,
    items: [
      { href: '/docs', label: 'Introduction' },
      { href: '/docs/getting-started', label: 'Quickstart', badge: 'Start here' },
      { href: '/docs/architecture', label: 'Architecture' },
    ],
  },
  {
    title: 'Core Concepts',
    icon: DatabaseIcon,
    items: [
      { href: '/docs/database', label: 'Database Schema' },
      { href: '/docs/sync', label: 'Sync Operations' },
      { href: '/docs/authentication', label: 'Authentication' },
    ],
  },
  {
    title: 'API Reference',
    icon: CodeIcon,
    items: [
      { href: '/docs/api', label: 'Overview' },
      { href: '/docs/api#health', label: 'Health Endpoints' },
      { href: '/docs/api#connections', label: 'Connections API' },
      { href: '/docs/api#sync', label: 'Sync API' },
      { href: '/docs/api#explorer', label: 'Explorer API' },
    ],
  },
  {
    title: 'Security',
    icon: ShieldIcon,
    items: [
      { href: '/docs/security', label: 'Overview' },
      { href: '/docs/security#encryption', label: 'Encryption' },
      { href: '/docs/security#authentication', label: 'Auth Security' },
    ],
  },
  {
    title: 'Administration',
    icon: SettingsIcon,
    items: [
      { href: '/docs/admin', label: 'Admin Dashboard' },
      { href: '/docs/admin#monitoring', label: 'Monitoring' },
      { href: '/docs/admin#audit', label: 'Audit Logs' },
    ],
  },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href;
}

function DocsNavItem({ href, label, badge, isActive }: { href: string; label: string; badge?: string; isActive: boolean }) {
  return (
    <ChakraLink as={Link} href={href} aria-current={isActive ? 'page' : undefined} _hover={{ textDecoration: 'none' }}>
      <HStack
        px={3}
        py={2}
        borderRadius="md"
        color={isActive ? 'text.primary' : 'text.secondary'}
        bg={isActive ? 'rgba(25, 196, 167, 0.16)' : 'transparent'}
        borderWidth="1px"
        borderColor={isActive ? 'rgba(147, 222, 203, 0.3)' : 'transparent'}
        _hover={{ bg: 'rgba(255, 255, 255, 0.06)' }}
        transition="all var(--motion-fast) linear"
        fontSize="sm"
        justify="space-between"
      >
        <Text>{label}</Text>
        {badge && (
          <Badge colorScheme="teal" fontSize="9px" px={1.5} py={0.5} borderRadius="full" textTransform="none" fontWeight="500">
            {badge}
          </Badge>
        )}
      </HStack>
    </ChakraLink>
  );
}

function DocsNavSection({ section, pathname }: { section: NavSection; pathname: string }) {
  const [isOpen, setIsOpen] = useState(true);
  const hasActiveItem = section.items.some((item) => pathname === item.href);
  const Icon = section.icon;

  return (
    <Box>
      <HStack
        px={2}
        py={2}
        cursor="pointer"
        onClick={() => setIsOpen((value) => !value)}
        color={hasActiveItem ? 'text.primary' : 'text.secondary'}
        _hover={{ color: 'text.primary' }}
        transition="color var(--motion-fast) linear"
        justify="space-between"
      >
        <HStack spacing={2}>
          <Box color={hasActiveItem ? 'accent.primary' : 'text.tertiary'}>
            <Icon />
          </Box>
          <Text fontSize="sm" fontWeight="600">
            {section.title}
          </Text>
        </HStack>
        <ChevronIcon isOpen={isOpen} />
      </HStack>
      <Collapse in={isOpen}>
        <VStack align="stretch" spacing={1} pl={4} mt={1}>
          {section.items.map((item) => (
            <DocsNavItem key={item.href} href={item.href} label={item.label} badge={item.badge} isActive={isActivePath(pathname, item.href)} />
          ))}
        </VStack>
      </Collapse>
    </Box>
  );
}

function DocsSidebar({ pathname }: { pathname: string }) {
  return (
    <VStack align="stretch" spacing={4} h="full">
      <ChakraLink as={Link} href="/" _hover={{ textDecoration: 'none' }}>
        <HStack spacing={2} px={2} py={2}>
          <SuparbaseLogo size="sm" variant="icon" showText={false} />
          <VStack align="start" spacing={0}>
            <Text fontSize="md" fontWeight="700" color="text.primary" lineHeight="1.2">
              Suparbase Docs
            </Text>
            <Text fontSize="xs" color="text.tertiary" lineHeight="1">
              Reference & Guides
            </Text>
          </VStack>
        </HStack>
      </ChakraLink>

      <Box px={2}>
        <InputGroup size="sm">
          <InputLeftElement pointerEvents="none">
            <Box color="text.tertiary">
              <SearchIcon />
            </Box>
          </InputLeftElement>
          <Input
            placeholder="Search docs..."
            bg="rgba(255, 255, 255, 0.03)"
            border="1px solid"
            borderColor="border.default"
            borderRadius="md"
            _hover={{ borderColor: 'border.strong' }}
            _focusVisible={{ borderColor: 'accent.primary', boxShadow: '0 0 0 2px rgba(30, 132, 255, 0.24)' }}
            color="text.primary"
            _placeholder={{ color: 'text.tertiary' }}
          />
        </InputGroup>
      </Box>

      <VStack align="stretch" spacing={3} flex={1} overflowY="auto" pr={1}>
        {navSections.map((section) => (
          <DocsNavSection key={section.title} section={section} pathname={pathname} />
        ))}
      </VStack>

      <Box pt={4} borderTopWidth="1px" borderColor="border.default">
        <VStack align="stretch" spacing={2}>
          <ChakraLink as="a" href="/api/docs?format=openapi" target="_blank" rel="noopener noreferrer" color="text.secondary" fontSize="sm" px={2} _hover={{ color: 'text.primary' }}>
            OpenAPI Spec
          </ChakraLink>
          <ChakraLink
            as="a"
            href="https://github.com/WOLFIEEEE/Supabase-Syncer"
            target="_blank"
            rel="noopener noreferrer"
            color="text.secondary"
            fontSize="sm"
            px={2}
            _hover={{ color: 'text.primary' }}
          >
            GitHub Repository
          </ChakraLink>
        </VStack>
      </Box>
    </VStack>
  );
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box minH="100vh" className="gradient-mesh">
      <Flex>
        <Box
          display={{ base: 'none', lg: 'block' }}
          w="300px"
          h="100vh"
          position="fixed"
          left={0}
          top={0}
          bg="rgba(8, 10, 15, 0.95)"
          borderRightWidth="1px"
          borderColor="border.default"
          px={4}
          py={4}
          overflowY="auto"
        >
          <DocsSidebar pathname={pathname} />
        </Box>

        <Box
          display={{ base: 'block', lg: 'none' }}
          position="fixed"
          top={0}
          left={0}
          right={0}
          bg="rgba(8, 10, 15, 0.95)"
          borderBottomWidth="1px"
          borderColor="border.default"
          px={4}
          py={3}
          zIndex={100}
        >
          <HStack justify="space-between">
            <ChakraLink as={Link} href="/docs" _hover={{ textDecoration: 'none' }}>
              <HStack spacing={2}>
                <SuparbaseLogo size="xs" variant="icon" showText={false} />
                <Text fontSize="md" fontWeight="700" color="text.primary">
                  Docs
                </Text>
              </HStack>
            </ChakraLink>
            <IconButton
              aria-label="Open docs menu"
              icon={<MenuIcon />}
              onClick={onOpen}
              variant="ghost"
              color="text.secondary"
              _hover={{ color: 'text.primary', bg: 'rgba(255, 255, 255, 0.1)' }}
            />
          </HStack>
        </Box>

        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay bg="rgba(0, 0, 0, 0.6)" backdropFilter="blur(4px)" />
          <DrawerContent bg="bg.surface" maxW="300px" borderRightWidth="1px" borderColor="border.default">
            <DrawerCloseButton color="text.primary" />
            <DrawerBody px={4} py={4}>
              <DocsSidebar pathname={pathname} />
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        <Box ml={{ base: 0, lg: '300px' }} mt={{ base: '62px', lg: 0 }} flex={1} minH="100vh">
          <Container
            maxW="920px"
            py={{ base: 8, lg: 12 }}
            px={{ base: 4, lg: 8 }}
            sx={{
              h1: { textStyle: 'h1', mb: 4 },
              h2: { textStyle: 'h2', mt: 8, mb: 3 },
              h3: { textStyle: 'h3', mt: 6, mb: 2 },
              p: { textStyle: 'body', mb: 3 },
              pre: {
                bg: 'bg.surface',
                borderWidth: '1px',
                borderColor: 'border.default',
                borderRadius: 'lg',
                p: 4,
                overflowX: 'auto',
              },
              code: {
                fontFamily: 'mono',
              },
            }}
          >
            {children}
          </Container>
        </Box>
      </Flex>
    </Box>
  );
}
