/**
 * Documentation Layout
 * 
 * Clean, professional documentation layout inspired by modern doc sites.
 * Features a responsive sidebar with collapsible sections.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Container,
  IconButton,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  useDisclosure,
  Input,
  InputGroup,
  InputLeftElement,
  Collapse,
  Badge,
} from '@chakra-ui/react';

// Icons
const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const BookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const CodeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const DatabaseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const SyncIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const ExternalIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

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

function NavItem({ href, label, badge, isActive }: { href: string; label: string; badge?: string; isActive: boolean }) {
  return (
    <Link href={href}>
      <HStack
        px={3}
        py={1.5}
        borderRadius="md"
        color={isActive ? 'white' : 'gray.400'}
        bg={isActive ? 'rgba(20, 184, 166, 0.1)' : 'transparent'}
        borderLeft="2px solid"
        borderColor={isActive ? 'teal.400' : 'transparent'}
        _hover={{
          color: 'white',
          bg: 'rgba(255, 255, 255, 0.05)',
        }}
        transition="all 0.15s"
        fontSize="sm"
        justify="space-between"
      >
        <Text>{label}</Text>
        {badge && (
          <Badge
            colorScheme="teal"
            fontSize="9px"
            px={1.5}
            py={0.5}
            borderRadius="full"
            textTransform="none"
            fontWeight="500"
          >
            {badge}
          </Badge>
        )}
      </HStack>
    </Link>
  );
}

function NavSectionComponent({ section, pathname }: { section: NavSection; pathname: string }) {
  const [isOpen, setIsOpen] = useState(true);
  const hasActiveItem = section.items.some((item) => pathname === item.href || pathname.startsWith(item.href + '#'));
  const IconComponent = section.icon;

  return (
    <Box>
      <HStack
        px={2}
        py={2}
        cursor="pointer"
        onClick={() => setIsOpen(!isOpen)}
        _hover={{ color: 'white' }}
        color={hasActiveItem ? 'white' : 'gray.400'}
        transition="color 0.15s"
        justify="space-between"
      >
        <HStack spacing={2}>
          <Box color={hasActiveItem ? 'teal.400' : 'gray.500'}>
            <IconComponent />
          </Box>
          <Text fontSize="sm" fontWeight="600">
            {section.title}
          </Text>
        </HStack>
        <ChevronIcon isOpen={isOpen} />
      </HStack>
      <Collapse in={isOpen}>
        <VStack align="stretch" spacing={0.5} pl={4} mt={1}>
          {section.items.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              badge={item.badge}
              isActive={pathname === item.href}
            />
          ))}
        </VStack>
      </Collapse>
    </Box>
  );
}

function Sidebar({ pathname }: { pathname: string }) {
  return (
    <VStack align="stretch" spacing={1} h="full">
      {/* Logo */}
      <Link href="/">
        <HStack spacing={2} px={2} py={3} mb={4}>
          <Box
            w={8}
            h={8}
            bg="linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)"
            borderRadius="lg"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize="lg" fontWeight="bold" color="white">
              S
            </Text>
          </Box>
          <Box>
            <Text fontSize="md" fontWeight="700" color="white" lineHeight="1.2">
              Suparbase
            </Text>
            <Text fontSize="xs" color="gray.500" lineHeight="1">
              Documentation
            </Text>
          </Box>
        </HStack>
      </Link>

      {/* Search */}
      <Box px={2} mb={4}>
        <InputGroup size="sm">
          <InputLeftElement pointerEvents="none">
            <Box color="gray.500">
              <SearchIcon />
            </Box>
          </InputLeftElement>
          <Input
            placeholder="Search docs..."
            bg="rgba(255, 255, 255, 0.05)"
            border="1px solid"
            borderColor="gray.700"
            borderRadius="md"
            _hover={{ borderColor: 'gray.600' }}
            _focus={{ borderColor: 'teal.500', boxShadow: 'none' }}
            color="white"
            _placeholder={{ color: 'gray.500' }}
          />
        </InputGroup>
      </Box>

      {/* Navigation */}
      <VStack align="stretch" spacing={4} flex={1} overflowY="auto">
        {navSections.map((section) => (
          <NavSectionComponent key={section.title} section={section} pathname={pathname} />
        ))}
      </VStack>

      {/* Footer Links */}
      <Box pt={4} mt={4} borderTop="1px solid" borderColor="gray.800">
        <VStack align="stretch" spacing={1}>
          <a href="/api/docs?format=openapi" target="_blank" rel="noopener noreferrer">
            <HStack
              px={2}
              py={1.5}
              color="gray.400"
              _hover={{ color: 'white' }}
              transition="color 0.15s"
              fontSize="sm"
            >
              <CodeIcon />
              <Text>OpenAPI Spec</Text>
              <Box ml="auto">
                <ExternalIcon />
              </Box>
            </HStack>
          </a>
          <a href="https://github.com/WOLFIEEEE/Supabase-Syncer" target="_blank" rel="noopener noreferrer">
            <HStack
              px={2}
              py={1.5}
              color="gray.400"
              _hover={{ color: 'white' }}
              transition="color 0.15s"
              fontSize="sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <Text>GitHub</Text>
              <Box ml="auto">
                <ExternalIcon />
              </Box>
            </HStack>
          </a>
        </VStack>
      </Box>
    </VStack>
  );
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box minH="100vh" bg="#0a0a0b">
      <Flex>
        {/* Desktop Sidebar */}
        <Box
          display={{ base: 'none', lg: 'block' }}
          w="280px"
          h="100vh"
          position="fixed"
          left={0}
          top={0}
          bg="#0f0f11"
          borderRight="1px solid"
          borderColor="gray.800"
          px={4}
          py={4}
          overflowY="auto"
        >
          <Sidebar pathname={pathname} />
        </Box>

        {/* Mobile Header */}
        <Box
          display={{ base: 'block', lg: 'none' }}
          position="fixed"
          top={0}
          left={0}
          right={0}
          bg="#0f0f11"
          borderBottom="1px solid"
          borderColor="gray.800"
          px={4}
          py={3}
          zIndex={100}
        >
          <HStack justify="space-between">
            <Link href="/">
              <HStack spacing={2}>
                <Box
                  w={8}
                  h={8}
                  bg="linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)"
                  borderRadius="lg"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize="lg" fontWeight="bold" color="white">
                    S
                  </Text>
                </Box>
                <Text fontSize="md" fontWeight="700" color="white">
                  Suparbase Docs
                </Text>
              </HStack>
            </Link>
            <IconButton
              aria-label="Open menu"
              icon={<MenuIcon />}
              onClick={onOpen}
              variant="ghost"
              color="gray.400"
              _hover={{ color: 'white', bg: 'rgba(255, 255, 255, 0.1)' }}
            />
          </HStack>
        </Box>

        {/* Mobile Drawer */}
        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay bg="rgba(0, 0, 0, 0.6)" backdropFilter="blur(4px)" />
          <DrawerContent bg="#0f0f11" maxW="280px">
            <DrawerCloseButton color="gray.400" />
            <DrawerBody px={4} py={4}>
              <Sidebar pathname={pathname} />
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* Main Content */}
        <Box
          ml={{ base: 0, lg: '280px' }}
          mt={{ base: '60px', lg: 0 }}
          flex={1}
          minH="100vh"
        >
          <Container maxW="900px" py={{ base: 6, lg: 10 }} px={{ base: 4, lg: 8 }}>
            {children}
          </Container>
        </Box>
      </Flex>
    </Box>
  );
}
