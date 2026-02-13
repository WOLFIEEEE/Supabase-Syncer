'use client';

import Link from 'next/link';
import {
  Box,
  Container,
  Flex,
  Grid,
  HStack,
  Link as ChakraLink,
  Text,
  VStack,
} from '@chakra-ui/react';
import { SuparbaseLogo } from './Logo';

type FooterLink = {
  label: string;
  href: string;
};

type FooterColumn = {
  title: string;
  links: FooterLink[];
};

const footerColumns: FooterColumn[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Benefits', href: '/benefits' },
      { label: 'Integrations', href: '/integrations' },
      { label: 'Status', href: '/status' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { label: 'Getting Started', href: '/getting-started' },
      { label: 'How It Works', href: '/how-it-works' },
      { label: 'Guide', href: '/guide' },
      { label: 'Best Practices', href: '/best-practices' },
      { label: 'Troubleshooting', href: '/troubleshooting' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Changelog', href: '/changelog' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Legal', href: '/legal' },
    ],
  },
];

export default function PublicFooter() {
  return (
    <Box
      as="footer"
      borderTopWidth="1px"
      borderColor="border.default"
      bg="rgba(8, 10, 15, 0.94)"
      backdropFilter="blur(12px)"
      mt="auto"
    >
      <Container maxW="7xl" py={{ base: 10, md: 12 }} px={{ base: 4, md: 6 }}>
        <VStack spacing={{ base: 10, md: 12 }} align="stretch">
          <Grid templateColumns={{ base: '1fr', md: '1.35fr repeat(3, minmax(0, 1fr))' }} gap={{ base: 8, md: 10 }}>
            <VStack align={{ base: 'center', md: 'start' }} spacing={4}>
              <ChakraLink as={Link} href="/" _hover={{ textDecoration: 'none', opacity: 0.92 }}>
                <Box display={{ base: 'block', md: 'none' }}>
                  <SuparbaseLogo size="md" variant="full" />
                </Box>
                <Box display={{ base: 'none', md: 'block' }}>
                  <SuparbaseLogo size="lg" variant="full" />
                </Box>
              </ChakraLink>
              <Text color="text.secondary" fontSize="sm" maxW="22rem" textAlign={{ base: 'center', md: 'left' }}>
                Production-safe Supabase synchronization with schema validation, rollback protection, and keep-alive automation.
              </Text>
              <HStack spacing={3} flexWrap="wrap" justify={{ base: 'center', md: 'flex-start' }}>
                <Text fontSize="xs" color="text.tertiary">Security-first workflows</Text>
                <Text color="text.tertiary" fontSize="xs">•</Text>
                <Text fontSize="xs" color="text.tertiary">Built for teams</Text>
              </HStack>
            </VStack>

            {footerColumns.map((column) => (
              <VStack key={column.title} align={{ base: 'center', md: 'start' }} spacing={3}>
                <Text textStyle="label" color="text.tertiary">
                  {column.title}
                </Text>
                <VStack align={{ base: 'center', md: 'start' }} spacing={2}>
                  {column.links.map((link) => (
                    <ChakraLink
                      key={link.href}
                      as={Link}
                      href={link.href}
                      color="text.secondary"
                      fontSize="sm"
                      _hover={{ color: 'text.primary', textDecoration: 'underline' }}
                    >
                      {link.label}
                    </ChakraLink>
                  ))}
                </VStack>
              </VStack>
            ))}
          </Grid>

          <Flex
            borderTopWidth="1px"
            borderColor="border.subtle"
            pt={5}
            direction={{ base: 'column', md: 'row' }}
            align={{ base: 'center', md: 'center' }}
            justify="space-between"
            gap={3}
          >
            <Text color="text.tertiary" fontSize="xs" textAlign={{ base: 'center', md: 'left' }}>
              © {new Date().getFullYear()} Suparbase. All rights reserved.
            </Text>
            <HStack spacing={3} color="text.tertiary" fontSize="xs">
              <Text>v1.0.0</Text>
              <Text aria-hidden="true">•</Text>
              <Text>Dark-first UI</Text>
            </HStack>
          </Flex>
        </VStack>
      </Container>
    </Box>
  );
}
