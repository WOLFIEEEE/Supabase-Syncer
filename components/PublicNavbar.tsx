'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Flex,
  HStack,
  Button,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  VStack,
} from '@chakra-ui/react';
import { SuparbaseLogo } from '@/components/Logo';

// Icons
const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '/features' },
  { label: 'Use Cases', href: '/use-cases' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Guide', href: '/guide' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Status', href: '/status' },
];

export default function PublicNavbar() {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isScrolled, setIsScrolled] = useState(false);

  // Dynamic scroll detection for navbar transformation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Box
      as="nav"
      position="sticky"
      top={0}
      bg="surface.900"
      borderBottomWidth="1px"
      borderColor={isScrolled ? "rgba(62, 207, 142, 0.15)" : "surface.700"}
      zIndex={100}
      backdropFilter={isScrolled ? "blur(20px) saturate(180%)" : "blur(10px)"}
      bgColor={isScrolled ? "rgba(9, 9, 11, 0.95)" : "rgba(9, 9, 11, 0.9)"}
      boxShadow={isScrolled ? "0 4px 30px rgba(0, 0, 0, 0.3), 0 1px 0 rgba(255, 255, 255, 0.03) inset" : "none"}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
    >
      <Container maxW="6xl" py={{ base: 2, md: 3 }} px={{ base: 4, md: 6 }}>
        <Flex justify="space-between" align="center">
          {/* Logo - exactly matching AuthHeader structure */}
          <Box
            cursor="pointer"
            onClick={() => router.push('/')}
            _hover={{ opacity: 0.8 }}
            transition="opacity 0.2s"
          >
            <Box display={{ base: 'block', md: 'none' }}>
              <SuparbaseLogo size="lg" showText={true} variant="full" />
            </Box>
            <Box display={{ base: 'none', md: 'block' }}>
              <SuparbaseLogo size="2xl" showText={true} variant="full" />
            </Box>
          </Box>

          {/* Desktop Navigation */}
          <HStack spacing={1} display={{ base: 'none', md: 'flex' }}>
            {navLinks.map((link) => (
              <Button
                key={link.href}
                variant="ghost"
                size="sm"
                color="surface.300"
                minH="44px"
                fontWeight="500"
                letterSpacing="0.01em"
                _hover={{
                  color: 'white',
                  bg: 'surface.700',
                  transform: 'translateY(-1px)'
                }}
                _active={{
                  transform: 'translateY(0px)',
                  bg: 'surface.600'
                }}
                transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                onClick={() => router.push(link.href)}
              >
                {link.label}
              </Button>
            ))}
          </HStack>

          {/* Right Side Actions */}
          <HStack spacing={2}>
            <Button
              colorScheme="teal"
              size="sm"
              minH="44px"
              fontWeight="600"
              letterSpacing="0.02em"
              onClick={() => router.push('/login')}
              display={{ base: 'none', sm: 'flex' }}
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 20px rgba(62, 207, 142, 0.4)'
              }}
              _active={{
                transform: 'translateY(0px)',
                boxShadow: '0 2px 10px rgba(62, 207, 142, 0.3)'
              }}
              transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
            >
              Login
            </Button>

            {/* Mobile Menu Button */}
            <IconButton
              aria-label="Menu"
              icon={<MenuIcon />}
              variant="ghost"
              display={{ base: 'flex', md: 'none' }}
              onClick={onOpen}
              size="md"
              minW="44px"
              minH="44px"
            />
          </HStack>
        </Flex>
      </Container>

      {/* Mobile Drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="surface.800">
          <DrawerCloseButton color="white" />
          <DrawerBody pt={12} px={4}>
            <VStack spacing={2} align="stretch">
              {navLinks.map((link) => (
                <Button
                  key={link.href}
                  variant="ghost"
                  justifyContent="flex-start"
                  color="surface.300"
                  minH="44px"
                  _hover={{ color: 'white', bg: 'surface.700' }}
                  onClick={() => {
                    router.push(link.href);
                    onClose();
                  }}
                >
                  {link.label}
                </Button>
              ))}
              <Button
                colorScheme="teal"
                mt={4}
                minH="44px"
                onClick={() => {
                  router.push('/login');
                  onClose();
                }}
              >
                Login
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
