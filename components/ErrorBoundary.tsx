'use client';

import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Button,
  Code,
  Card,
  CardBody,
  HStack,
} from '@chakra-ui/react';

// Icons
const AlertIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box minH="100vh" bg="surface.900" className="gradient-mesh" py={20}>
          <Container maxW="2xl">
            <VStack spacing={8} align="center" textAlign="center">
              <Box color="red.400">
                <AlertIcon />
              </Box>
              
              <VStack spacing={3}>
                <Heading size="lg" color="white">
                  Something went wrong
                </Heading>
                <Text color="surface.400" maxW="md">
                  An unexpected error occurred. This might be a temporary issue.
                  Try refreshing the page or going back to the dashboard.
                </Text>
              </VStack>

              <HStack spacing={4}>
                <Button
                  leftIcon={<RefreshIcon />}
                  colorScheme="teal"
                  onClick={this.handleReload}
                >
                  Refresh Page
                </Button>
                <Button
                  leftIcon={<HomeIcon />}
                  variant="outline"
                  onClick={this.handleGoHome}
                >
                  Go to Dashboard
                </Button>
              </HStack>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Card bg="surface.800" borderColor="red.700" borderWidth="1px" w="100%">
                  <CardBody>
                    <VStack align="start" spacing={3}>
                      <Text color="red.400" fontWeight="bold" fontSize="sm">
                        Error Details (Development Only)
                      </Text>
                      <Code
                        display="block"
                        whiteSpace="pre-wrap"
                        p={4}
                        bg="gray.900"
                        color="red.300"
                        fontSize="xs"
                        borderRadius="md"
                        w="100%"
                        overflowX="auto"
                      >
                        {this.state.error.toString()}
                        {this.state.errorInfo && (
                          <>
                            {'\n\nComponent Stack:'}
                            {this.state.errorInfo.componentStack}
                          </>
                        )}
                      </Code>
                      <Button
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={this.handleReset}
                      >
                        Try to recover
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              )}
            </VStack>
          </Container>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for easier use with hooks
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}




