'use client';

import { useRouter } from 'next/navigation';
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
  Text,
} from '@chakra-ui/react';

// Icons
const DatabaseIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const navLinks = [
  { label: 'Home', href: '/landing' },
  { label: 'Guide', href: '/guide' },
  { label: 'Status', href: '/status' },
];

export default function PublicNavbar() {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box
      as="nav"
      position="sticky"
      top={0}
      bg="surface.900"
      borderBottomWidth="1px"
      borderColor="surface.700"
      zIndex={100}
      backdropFilter="blur(10px)"
      bgColor="rgba(9, 9, 11, 0.9)"
    >
      <Container maxW="6xl" py={3}>
        <Flex justify="space-between" align="center">
          {/* Logo */}
          <HStack 
            spacing={2} 
            cursor="pointer" 
            onClick={() => router.push('/landing')}
            _hover={{ opacity: 0.8 }}
            transition="opacity 0.2s"
          >
            <Box color="brand.400">
              <DatabaseIcon />
            </Box>
            <Text
              fontFamily="mono"
              fontWeight="bold"
              fontSize="lg"
              bgGradient="linear(to-r, brand.300, brand.500)"
              bgClip="text"
              display={{ base: 'none', sm: 'block' }}
            >
              Supabase Syncer
            </Text>
          </HStack>

          {/* Desktop Nav */}
          <HStack spacing={1} display={{ base: 'none', md: 'flex' }}>
            {navLinks.map((link) => (
              <Button
                key={link.href}
                variant="ghost"
                size="sm"
                color="surface.300"
                _hover={{ color: 'white', bg: 'surface.700' }}
                onClick={() => router.push(link.href)}
              >
                {link.label}
              </Button>
            ))}
          </HStack>

          {/* CTA Buttons */}
          <HStack spacing={2}>
            <Button
              colorScheme="teal"
              size="sm"
              onClick={() => router.push('/login')}
              display={{ base: 'none', sm: 'flex' }}
            >
              Login
            </Button>
            
            {/* Mobile Menu */}
            <IconButton
              aria-label="Menu"
              icon={<MenuIcon />}
              variant="ghost"
              display={{ base: 'flex', md: 'none' }}
              onClick={onOpen}
            />
          </HStack>
        </Flex>
      </Container>

      {/* Mobile Drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="surface.800">
          <DrawerCloseButton color="white" />
          <DrawerBody pt={12}>
            <VStack spacing={2} align="stretch">
              {navLinks.map((link) => (
                <Button
                  key={link.href}
                  variant="ghost"
                  justifyContent="flex-start"
                  color="surface.300"
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

