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
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';

// Icons
const AlertCircleIcon = () => (
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

const ArrowLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  showBackButton?: boolean;
  pageName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Page-level error boundary with better UX
 * Use this to wrap individual pages for graceful error handling
 */
export class PageErrorBoundary extends React.Component<Props, State> {
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
    console.error(`PageErrorBoundary [${this.props.pageName || 'Unknown'}]:`, error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoBack = () => {
    window.history.back();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    const { fallbackTitle, fallbackMessage, showBackButton = true, pageName } = this.props;

    if (this.state.hasError) {
      return (
        <Box minH="60vh" py={20}>
          <Container maxW="2xl">
            <VStack spacing={8} align="center" textAlign="center">
              <Box color="red.400">
                <AlertCircleIcon />
              </Box>
              
              <VStack spacing={3}>
                <Heading size="lg" color="white">
                  {fallbackTitle || 'Something went wrong'}
                </Heading>
                <Text color="surface.400" maxW="md">
                  {fallbackMessage || `An error occurred while loading ${pageName || 'this page'}. This might be a temporary issue.`}
                </Text>
              </VStack>

              <Alert status="warning" bg="surface.800" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>What you can try:</AlertTitle>
                  <AlertDescription>
                    Refresh the page, go back, or return to the dashboard.
                  </AlertDescription>
                </Box>
              </Alert>

              <HStack spacing={4} flexWrap="wrap" justify="center">
                <Button
                  leftIcon={<RefreshIcon />}
                  colorScheme="teal"
                  onClick={this.handleReload}
                >
                  Refresh Page
                </Button>
                {showBackButton && (
                  <Button
                    leftIcon={<ArrowLeftIcon />}
                    variant="outline"
                    onClick={this.handleGoBack}
                  >
                    Go Back
                  </Button>
                )}
                <Button
                  leftIcon={<HomeIcon />}
                  variant="outline"
                  onClick={this.handleGoHome}
                >
                  Dashboard
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

/**
 * HOC wrapper for functional components
 */
export function withPageErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<Props, 'children'>
): React.FC<P> {
  return function WrappedComponent(props: P) {
    return (
      <PageErrorBoundary {...options}>
        <Component {...props} />
      </PageErrorBoundary>
    );
  };
}

/**
 * Inline error display for non-critical errors
 */
export function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Alert status="error" bg="surface.800" borderRadius="md">
      <AlertIcon />
      <Box flex="1">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Box>
      {onRetry && (
        <Button size="sm" colorScheme="red" variant="ghost" onClick={onRetry}>
          Retry
        </Button>
      )}
    </Alert>
  );
}

/**
 * Loading error component
 */
export function LoadingError({
  title = 'Failed to load data',
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <VStack spacing={4} py={10} textAlign="center">
      <Box color="red.400">
        <AlertCircleIcon />
      </Box>
      <VStack spacing={2}>
        <Text color="white" fontWeight="bold">{title}</Text>
        {message && <Text color="surface.400" fontSize="sm">{message}</Text>}
      </VStack>
      {onRetry && (
        <Button
          leftIcon={<RefreshIcon />}
          size="sm"
          colorScheme="teal"
          onClick={onRetry}
        >
          Try Again
        </Button>
      )}
    </VStack>
  );
}

export default PageErrorBoundary;



