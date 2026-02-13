'use client';

import Link from 'next/link';
import { Box, Container, Flex, Link as ChakraLink } from '@chakra-ui/react';
import { SuparbaseLogo } from '@/components/Logo';

export default function AuthHeader() {
  return (
    <Box
      as="nav"
      position="sticky"
      top={0}
      bg="rgba(8, 10, 15, 0.88)"
      borderBottomWidth="1px"
      borderColor="border.default"
      zIndex={100}
      backdropFilter="blur(10px)"
    >
      <Container maxW="6xl" py={{ base: 2, md: 3 }} px={{ base: 4, md: 6 }}>
        <Flex justify="flex-start" align="center">
          <ChakraLink
            as={Link}
            href="/"
            aria-label="Back to homepage"
            _hover={{ textDecoration: 'none', opacity: 0.92 }}
          >
            <SuparbaseLogo size="lg" variant="full" />
          </ChakraLink>
        </Flex>
      </Container>
    </Box>
  );
}
