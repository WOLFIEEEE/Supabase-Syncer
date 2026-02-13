'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDisclosure } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  Flex,
  HStack,
  IconButton,
  Link as ChakraLink,
  Text,
  VStack,
} from '@chakra-ui/react';
import { SuparbaseLogo } from '@/components/Logo';

type PublicNavItem = {
  label: string;
  href: string;
  exact?: boolean;
};

const navLinks: PublicNavItem[] = [
  { label: 'Home', href: '/', exact: true },
  { label: 'Features', href: '/features' },
  { label: 'Use Cases', href: '/use-cases' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Guide', href: '/guide' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Status', href: '/status' },
];

function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function isActiveLink(pathname: string, link: PublicNavItem): boolean {
  if (link.exact) return pathname === link.href;
  return pathname.startsWith(link.href);
}

export default function PublicNavbar() {
  const pathname = usePathname();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Box
      as="nav"
      position="sticky"
      top={0}
      bg="rgba(8, 10, 15, 0.88)"
      borderBottomWidth="1px"
      borderColor={isScrolled ? 'rgba(147, 222, 203, 0.24)' : 'border.default'}
      zIndex={100}
      backdropFilter={isScrolled ? 'blur(14px) saturate(150%)' : 'blur(8px)'}
      boxShadow={isScrolled ? 'var(--chakra-shadows-elevation-soft)' : 'none'}
      transition="border-color var(--motion-base) var(--ease-standard), box-shadow var(--motion-base) var(--ease-standard), backdrop-filter var(--motion-base) var(--ease-standard)"
    >
      <Container maxW="6xl" py={{ base: 2, md: 3 }} px={{ base: 4, md: 6 }}>
        <Flex justify="space-between" align="center">
          <ChakraLink
            as={Link}
            href="/"
            aria-label="Suparbase home"
            _hover={{ textDecoration: 'none', opacity: 0.92 }}
          >
            <Box display={{ base: 'block', md: 'none' }}>
              <SuparbaseLogo size="md" variant="full" />
            </Box>
            <Box display={{ base: 'none', md: 'block' }}>
              <SuparbaseLogo size="lg" variant="full" />
            </Box>
          </ChakraLink>

          <HStack spacing={1} display={{ base: 'none', md: 'flex' }} as="ul" listStyleType="none">
            {navLinks.map((link) => {
              const active = isActiveLink(pathname, link);
              return (
                <Box as="li" key={link.href}>
                  <ChakraLink
                    as={Link}
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    px={3}
                    py={2}
                    minH="44px"
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor={active ? 'rgba(147, 222, 203, 0.35)' : 'transparent'}
                    bg={active ? 'rgba(25, 196, 167, 0.15)' : 'transparent'}
                    color={active ? 'text.primary' : 'text.secondary'}
                    fontSize="sm"
                    fontWeight="600"
                    transition="all var(--motion-fast) linear"
                    _hover={{
                      color: 'text.primary',
                      bg: 'rgba(255, 255, 255, 0.07)',
                      textDecoration: 'none',
                      borderColor: 'rgba(147, 222, 203, 0.2)',
                    }}
                    _focusVisible={{
                      boxShadow: '0 0 0 2px var(--chakra-colors-focus-ring)',
                    }}
                  >
                    {link.label}
                  </ChakraLink>
                </Box>
              );
            })}
          </HStack>

          <HStack spacing={2}>
            <Button
              as={Link}
              href="/login"
              size="sm"
              variant="solid"
              minH="44px"
              display={{ base: 'none', sm: 'inline-flex' }}
            >
              Login
            </Button>

            <IconButton
              aria-label="Open navigation menu"
              icon={<MenuIcon />}
              variant="ghost"
              display={{ base: 'flex', md: 'none' }}
              onClick={onOpen}
              size="md"
              minW="44px"
              minH="44px"
              _focusVisible={{
                boxShadow: '0 0 0 2px var(--chakra-colors-focus-ring)',
              }}
            />
          </HStack>
        </Flex>
      </Container>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="bg.surface" borderLeftWidth="1px" borderColor="border.default">
          <DrawerCloseButton color="white" />
          <DrawerBody pt={12} px={4}>
            <VStack spacing={2} align="stretch" as="ul" listStyleType="none">
              {navLinks.map((link) => {
                const active = isActiveLink(pathname, link);
                return (
                  <Box as="li" key={link.href}>
                    <ChakraLink
                      as={Link}
                      href={link.href}
                      aria-current={active ? 'page' : undefined}
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      px={4}
                      minH="46px"
                      borderRadius="lg"
                      color={active ? 'text.primary' : 'text.secondary'}
                      bg={active ? 'rgba(25, 196, 167, 0.13)' : 'transparent'}
                      onClick={onClose}
                      _hover={{ bg: 'rgba(255, 255, 255, 0.08)', textDecoration: 'none' }}
                    >
                      <Text fontWeight="600">{link.label}</Text>
                    </ChakraLink>
                  </Box>
                );
              })}
              <Button as={Link} href="/login" mt={3} minH="46px" onClick={onClose}>
                Login
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
