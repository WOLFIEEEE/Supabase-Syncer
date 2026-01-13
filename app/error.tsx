'use client';

/**
 * Global Error Boundary
 * 
 * Catches errors in the app and reports them to Sentry.
 * This is a Next.js App Router error boundary.
 */

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { Box, Container, Heading, Text, Button, VStack } from '@chakra-ui/react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <Box minH="100vh" bg="surface.900" display="flex" alignItems="center" justifyContent="center">
      <Container maxW="md">
        <VStack spacing={6} textAlign="center">
          <Box
            p={4}
            borderRadius="full"
            bg="red.900"
            color="red.400"
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </Box>
          
          <Heading size="lg" color="white">
            Something went wrong
          </Heading>
          
          <Text color="surface.400" maxW="sm">
            We apologize for the inconvenience. Our team has been notified and is working on a fix.
          </Text>
          
          {error.digest && (
            <Text fontSize="xs" color="surface.500" fontFamily="mono">
              Error ID: {error.digest}
            </Text>
          )}
          
          <VStack spacing={3} pt={4}>
            <Button
              onClick={reset}
              colorScheme="teal"
              size="lg"
            >
              Try Again
            </Button>
            
            <Button
              as="a"
              href="/"
              variant="ghost"
              color="surface.400"
              _hover={{ color: 'white' }}
            >
              Go to Homepage
            </Button>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
}
