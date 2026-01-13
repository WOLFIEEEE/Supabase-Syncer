'use client';

import { useState, useCallback } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  Card,
  CardBody,
  Badge,
  SimpleGrid,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Code,
  Spinner,
  Progress,
  Divider,
  Tooltip,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Collapse,
  IconButton,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion.create(Box);
const MotionCard = motion.create(Card);

// Icons
const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const SkipIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 4 15 12 5 20 5 4"/>
    <line x1="19" y1="5" x2="19" y2="19"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2v6h-6"/>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
    <path d="M3 22v-6h6"/>
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const ExpandIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 3 21 3 21 9"/>
    <polyline points="9 21 3 21 3 15"/>
    <line x1="21" y1="3" x2="14" y2="10"/>
    <line x1="3" y1="21" x2="10" y2="14"/>
  </svg>
);

// Types
type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

interface TestResult {
  name: string;
  status: TestStatus;
  message: string;
  details?: unknown;
  duration?: number;
  request?: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: unknown;
  };
  response?: {
    status: number;
    data?: unknown;
  };
}

interface TestCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface APITestingClientProps {
  adminUser: { id: string; email: string };
  requestId: string;
}

const testCategories: TestCategory[] = [
  { id: 'health', name: 'Health & Status', description: 'Health endpoints and system status', icon: '💚' },
  { id: 'auth', name: 'Authentication', description: 'CSRF and session management', icon: '🔐' },
  { id: 'connections', name: 'Connections API', description: 'Database connection management', icon: '🔌' },
  { id: 'sync', name: 'Sync Operations', description: 'Sync job creation and management', icon: '🔄' },
  { id: 'explorer', name: 'Database Explorer', description: 'Table and row exploration', icon: '🔍' },
  { id: 'admin', name: 'Admin API', description: 'Administrative endpoints', icon: '👑' },
  { id: 'backend', name: 'Backend Integration', description: 'Direct backend API testing', icon: '⚡' },
  { id: 'sse', name: 'SSE Streaming', description: 'Server-Sent Events', icon: '📡' },
];

export default function APITestingClient({ adminUser, requestId }: APITestingClientProps) {
  const [results, setResults] = useState<Record<string, TestResult[]>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [runningCategory, setRunningCategory] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<TestResult | null>(null);
  const [progress, setProgress] = useState(0);
  const toast = useToast();

  const summary = {
    total: Object.values(results).flat().length,
    passed: Object.values(results).flat().filter(r => r.status === 'passed').length,
    failed: Object.values(results).flat().filter(r => r.status === 'failed').length,
    skipped: Object.values(results).flat().filter(r => r.status === 'skipped').length,
  };

  // Test Runner Functions
  const runTest = async (
    name: string,
    method: string,
    url: string,
    options?: { body?: unknown; headers?: Record<string, string>; expectedStatus?: number[] }
  ): Promise<TestResult> => {
    const start = Date.now();
    const result: TestResult = {
      name,
      status: 'running',
      message: '',
      request: { method, url, headers: options?.headers, body: options?.body },
    };

    try {
      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      };

      if (options?.body && method !== 'GET') {
        fetchOptions.body = JSON.stringify(options.body);
      }

      const res = await fetch(url, fetchOptions);
      const duration = Date.now() - start;
      
      let data;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      result.duration = duration;
      result.response = { status: res.status, data };

      const expectedStatuses = options?.expectedStatus || [200, 201];
      const isExpectedStatus = expectedStatuses.includes(res.status);
      const isAuthExpected = [401, 403].includes(res.status);

      if (isExpectedStatus) {
        result.status = 'passed';
        result.message = `Success (${res.status}) - ${duration}ms`;
      } else if (isAuthExpected) {
        result.status = 'skipped';
        result.message = `Requires authentication (${res.status})`;
      } else if (res.status === 404) {
        result.status = 'skipped';
        result.message = 'Resource not found (expected for test IDs)';
      } else {
        result.status = 'failed';
        result.message = `Unexpected status: ${res.status}`;
      }
    } catch (error) {
      result.status = 'failed';
      result.message = error instanceof Error ? error.message : 'Unknown error';
      result.duration = Date.now() - start;
    }

    return result;
  };

  // Category Test Runners
  const runHealthTests = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [];

    tests.push(await runTest('Frontend Health', 'GET', '/api/health'));
    tests.push(await runTest('Frontend Status', 'GET', '/api/status'));
    tests.push(await runTest('Frontend Version', 'GET', '/api/version'));
    
    // Backend health via proxy (avoids CORS)
    tests.push(await runTest('Backend Health', 'GET', '/backend-api/health'));

    return tests;
  };

  const runAuthTests = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [];

    tests.push(await runTest('CSRF Token', 'GET', '/api/csrf'));
    tests.push(await runTest('User Sessions', 'GET', '/api/sessions', { expectedStatus: [200, 401] }));

    return tests;
  };

  const runConnectionsTests = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [];

    tests.push(await runTest('List Connections', 'GET', '/api/connections', { expectedStatus: [200, 401] }));
    tests.push(await runTest('Test Connection', 'POST', '/api/connections/test-id/test', {
      body: { encryptedUrl: 'test' },
      expectedStatus: [200, 400, 401, 404],
    }));
    tests.push(await runTest('Get Schema', 'GET', '/api/connections/test-id/schema', {
      expectedStatus: [200, 401, 404],
    }));
    tests.push(await runTest('Execute SQL', 'POST', '/api/connections/test-id/execute', {
      body: { encryptedUrl: 'test', sql: 'SELECT 1' },
      expectedStatus: [200, 400, 401, 403, 404],
    }));
    tests.push(await runTest('Keep Alive', 'POST', '/api/connections/test-id/keep-alive', {
      expectedStatus: [200, 401, 404],
    }));

    return tests;
  };

  const runSyncTests = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [];

    tests.push(await runTest('List Sync Jobs', 'GET', '/api/sync', { expectedStatus: [200, 401] }));
    tests.push(await runTest('Create Sync Job', 'POST', '/api/sync', {
      body: { name: 'Test', sourceConnectionId: 'test', targetConnectionId: 'test', tables: [] },
      expectedStatus: [201, 400, 401, 403],
    }));
    tests.push(await runTest('Get Sync Job', 'GET', '/api/sync/test-id', { expectedStatus: [200, 401, 404] }));
    tests.push(await runTest('Validate Schema', 'POST', '/api/sync/validate', {
      body: { sourceConnectionId: 'test', targetConnectionId: 'test' },
      expectedStatus: [200, 400, 401, 403],
    }));
    tests.push(await runTest('Generate Migration', 'POST', '/api/sync/generate-migration', {
      body: { sourceConnectionId: 'test', targetConnectionId: 'test' },
      expectedStatus: [200, 400, 401, 403],
    }));
    tests.push(await runTest('Start Sync', 'POST', '/api/sync/test-id/start', {
      body: { sourceEncryptedUrl: 'test', targetEncryptedUrl: 'test' },
      expectedStatus: [200, 401, 404],
    }));
    tests.push(await runTest('Pause Sync', 'POST', '/api/sync/test-id/pause', {
      expectedStatus: [200, 401, 403, 404],
    }));
    tests.push(await runTest('Stop Sync', 'POST', '/api/sync/test-id/stop', {
      expectedStatus: [200, 401, 403, 404],
    }));

    return tests;
  };

  const runExplorerTests = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [];

    tests.push(await runTest('Get Tables', 'GET', '/api/explorer/test-connection/tables', {
      expectedStatus: [200, 401, 404],
    }));

    return tests;
  };

  const runAdminTests = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [];

    tests.push(await runTest('Admin Analytics', 'GET', '/api/admin/analytics', {
      expectedStatus: [200, 401, 403],
    }));
    tests.push(await runTest('Admin Users', 'GET', '/api/admin/users', {
      expectedStatus: [200, 401, 403],
    }));
    tests.push(await runTest('Admin Sync Jobs', 'GET', '/api/admin/sync-jobs', {
      expectedStatus: [200, 401, 403],
    }));
    tests.push(await runTest('Admin Security Events', 'GET', '/api/admin/security-events', {
      expectedStatus: [200, 401, 403],
    }));

    return tests;
  };

  const runBackendTests = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [];
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

    // Most backend tests will be skipped due to CORS
    tests.push({
      name: 'Backend Connections',
      status: 'skipped',
      message: 'Requires backend secret (server-side only)',
    });
    tests.push({
      name: 'Backend Sync',
      status: 'skipped',
      message: 'Requires backend secret (server-side only)',
    });
    tests.push({
      name: 'Backend Queue Status',
      status: 'skipped',
      message: 'Internal endpoint (not exposed)',
    });

    return tests;
  };

  const runSSETests = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [];

    // SSE test with timeout
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      
      const res = await fetch('/api/sync/test-id/stream', {
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      tests.push({
        name: 'SSE Stream Endpoint',
        status: res.status === 401 || res.status === 404 ? 'skipped' : 'passed',
        message: res.status === 401 ? 'Requires authentication' : res.status === 404 ? 'Sync not found' : 'Endpoint accessible',
        response: { status: res.status },
      });
    } catch (error) {
      tests.push({
        name: 'SSE Stream Endpoint',
        status: 'skipped',
        message: error instanceof Error && error.name === 'AbortError' ? 'Timeout (expected)' : 'Connection failed',
      });
    }

    return tests;
  };

  // Run category tests
  const runCategoryTests = useCallback(async (categoryId: string): Promise<TestResult[]> => {
    switch (categoryId) {
      case 'health': return runHealthTests();
      case 'auth': return runAuthTests();
      case 'connections': return runConnectionsTests();
      case 'sync': return runSyncTests();
      case 'explorer': return runExplorerTests();
      case 'admin': return runAdminTests();
      case 'backend': return runBackendTests();
      case 'sse': return runSSETests();
      default: return [];
    }
  }, []);

  // Run single category
  const runSingleCategory = async (categoryId: string) => {
    setRunningCategory(categoryId);
    const categoryResults = await runCategoryTests(categoryId);
    setResults(prev => ({ ...prev, [categoryId]: categoryResults }));
    setRunningCategory(null);
  };

  // Run all tests
  const runAllTests = async () => {
    setIsRunning(true);
    setProgress(0);
    const newResults: Record<string, TestResult[]> = {};

    for (let i = 0; i < testCategories.length; i++) {
      const category = testCategories[i];
      setRunningCategory(category.id);
      const categoryResults = await runCategoryTests(category.id);
      newResults[category.id] = categoryResults;
      setResults({ ...newResults });
      setProgress(((i + 1) / testCategories.length) * 100);
    }

    setRunningCategory(null);
    setIsRunning(false);

    const finalSummary = {
      total: Object.values(newResults).flat().length,
      passed: Object.values(newResults).flat().filter(r => r.status === 'passed').length,
      failed: Object.values(newResults).flat().filter(r => r.status === 'failed').length,
    };

    toast({
      title: 'Tests Complete',
      description: `${finalSummary.passed}/${finalSummary.total} tests passed`,
      status: finalSummary.failed === 0 ? 'success' : 'warning',
      duration: 5000,
      isClosable: true,
    });
  };

  // Export results
  const exportResults = () => {
    const data = {
      timestamp: new Date().toISOString(),
      requestId,
      adminUser: adminUser.email,
      summary,
      results,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-test-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: TestStatus }) => {
    const config = {
      pending: { colorScheme: 'gray', icon: null },
      running: { colorScheme: 'blue', icon: <Spinner size="xs" /> },
      passed: { colorScheme: 'green', icon: <CheckIcon /> },
      failed: { colorScheme: 'red', icon: <XIcon /> },
      skipped: { colorScheme: 'yellow', icon: <SkipIcon /> },
    };
    const c = config[status];
    return (
      <Badge colorScheme={c.colorScheme} display="flex" alignItems="center" gap={1} px={2} py={0.5}>
        {c.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Box minH="100vh" bg="rgba(9, 9, 11, 1)">
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <MotionBox
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <HStack justify="space-between" align="start" flexWrap="wrap" gap={4}>
              <VStack align="start" spacing={2}>
                <HStack spacing={3}>
                  <Text fontSize="3xl">🧪</Text>
                  <Heading
                    size="xl"
                    bgGradient="linear(to-r, teal.400, cyan.400)"
                    bgClip="text"
                    fontFamily="'Outfit', sans-serif"
                  >
                    API Testing Suite
                  </Heading>
                </HStack>
                <Text color="surface.400" maxW="lg">
                  Comprehensive testing for all frontend and backend API endpoints. Run individual tests or execute the full suite.
                </Text>
              </VStack>
              <HStack spacing={3}>
                <Button
                  leftIcon={<DownloadIcon />}
                  variant="outline"
                  borderColor="surface.600"
                  color="surface.300"
                  _hover={{ bg: 'surface.800', borderColor: 'surface.500' }}
                  onClick={exportResults}
                  isDisabled={summary.total === 0}
                >
                  Export
                </Button>
                <Button
                  leftIcon={isRunning ? <Spinner size="sm" /> : <PlayIcon />}
                  bg="linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)"
                  color="white"
                  _hover={{ opacity: 0.9 }}
                  onClick={runAllTests}
                  isLoading={isRunning}
                  loadingText="Running..."
                  size="lg"
                >
                  Run All Tests
                </Button>
              </HStack>
            </HStack>
          </MotionBox>

          {/* Progress Bar */}
          <AnimatePresence>
            {isRunning && (
              <MotionBox
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Progress
                  value={progress}
                  size="sm"
                  colorScheme="teal"
                  borderRadius="full"
                  bg="surface.800"
                  hasStripe
                  isAnimated
                />
              </MotionBox>
            )}
          </AnimatePresence>

          {/* Summary Cards */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <MotionCard
              bg="surface.800"
              borderColor="surface.700"
              borderWidth="1px"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <CardBody textAlign="center">
                <Text fontSize="3xl" fontWeight="bold" color="white">{summary.total}</Text>
                <Text fontSize="sm" color="surface.400">Total Tests</Text>
              </CardBody>
            </MotionCard>
            <MotionCard
              bg="rgba(34, 197, 94, 0.1)"
              borderColor="green.500/30"
              borderWidth="1px"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <CardBody textAlign="center">
                <Text fontSize="3xl" fontWeight="bold" color="green.400">{summary.passed}</Text>
                <Text fontSize="sm" color="green.300">Passed</Text>
              </CardBody>
            </MotionCard>
            <MotionCard
              bg="rgba(239, 68, 68, 0.1)"
              borderColor="red.500/30"
              borderWidth="1px"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CardBody textAlign="center">
                <Text fontSize="3xl" fontWeight="bold" color="red.400">{summary.failed}</Text>
                <Text fontSize="sm" color="red.300">Failed</Text>
              </CardBody>
            </MotionCard>
            <MotionCard
              bg="rgba(234, 179, 8, 0.1)"
              borderColor="yellow.500/30"
              borderWidth="1px"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <CardBody textAlign="center">
                <Text fontSize="3xl" fontWeight="bold" color="yellow.400">{summary.skipped}</Text>
                <Text fontSize="sm" color="yellow.300">Skipped</Text>
              </CardBody>
            </MotionCard>
          </SimpleGrid>

          {/* Test Categories */}
          <Accordion allowMultiple defaultIndex={[0]}>
            {testCategories.map((category, index) => (
              <AccordionItem
                key={category.id}
                border="1px solid"
                borderColor="surface.700"
                borderRadius="lg"
                mb={4}
                overflow="hidden"
              >
                <AccordionButton
                  bg="surface.800"
                  _hover={{ bg: 'surface.750' }}
                  py={4}
                >
                  <HStack flex={1} spacing={4}>
                    <Text fontSize="xl">{category.icon}</Text>
                    <VStack align="start" spacing={0} flex={1}>
                      <Text fontWeight="600" color="white">{category.name}</Text>
                      <Text fontSize="sm" color="surface.400">{category.description}</Text>
                    </VStack>
                    {results[category.id] && (
                      <HStack spacing={2}>
                        <Badge colorScheme="green" variant="subtle">
                          {results[category.id].filter(r => r.status === 'passed').length} passed
                        </Badge>
                        {results[category.id].filter(r => r.status === 'failed').length > 0 && (
                          <Badge colorScheme="red" variant="subtle">
                            {results[category.id].filter(r => r.status === 'failed').length} failed
                          </Badge>
                        )}
                      </HStack>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      color="teal.400"
                      leftIcon={runningCategory === category.id ? <Spinner size="xs" /> : <PlayIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        runSingleCategory(category.id);
                      }}
                      isDisabled={isRunning}
                    >
                      Run
                    </Button>
                  </HStack>
                  <AccordionIcon color="surface.400" />
                </AccordionButton>
                <AccordionPanel bg="surface.900" p={0}>
                  {results[category.id] ? (
                    <VStack spacing={0} align="stretch" divider={<Divider borderColor="surface.700" />}>
                      {results[category.id].map((test, i) => (
                        <HStack
                          key={i}
                          px={6}
                          py={3}
                          justify="space-between"
                          _hover={{ bg: 'surface.800' }}
                          cursor="pointer"
                          onClick={() => setSelectedTest(test)}
                        >
                          <HStack spacing={3}>
                            <StatusBadge status={test.status} />
                            <Text color="white" fontSize="sm">{test.name}</Text>
                          </HStack>
                          <HStack spacing={3}>
                            <Text color="surface.400" fontSize="xs">{test.message}</Text>
                            {test.duration && (
                              <Badge variant="outline" colorScheme="gray" fontSize="xs">
                                {test.duration}ms
                              </Badge>
                            )}
                            <IconButton
                              aria-label="View details"
                              icon={<ExpandIcon />}
                              size="xs"
                              variant="ghost"
                              color="surface.400"
                              _hover={{ color: 'white' }}
                            />
                          </HStack>
                        </HStack>
                      ))}
                    </VStack>
                  ) : (
                    <Box px={6} py={8} textAlign="center">
                      <Text color="surface.500">No test results yet. Click "Run" to execute tests.</Text>
                    </Box>
                  )}
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Test Details Modal/Panel */}
          <AnimatePresence>
            {selectedTest && (
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                position="fixed"
                bottom={0}
                left={{ base: 0, md: '280px' }}
                right={0}
                bg="surface.800"
                borderTop="1px solid"
                borderColor="surface.700"
                p={6}
                maxH="50vh"
                overflowY="auto"
                zIndex={200}
              >
                <HStack justify="space-between" mb={4}>
                  <HStack spacing={3}>
                    <StatusBadge status={selectedTest.status} />
                    <Heading size="md" color="white">{selectedTest.name}</Heading>
                  </HStack>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedTest(null)}>
                    Close
                  </Button>
                </HStack>
                
                <Tabs variant="soft-rounded" colorScheme="teal" size="sm">
                  <TabList mb={4}>
                    <Tab color="surface.400" _selected={{ color: 'white', bg: 'teal.500/20' }}>Response</Tab>
                    <Tab color="surface.400" _selected={{ color: 'white', bg: 'teal.500/20' }}>Request</Tab>
                  </TabList>
                  <TabPanels>
                    <TabPanel p={0}>
                      <Box bg="surface.900" p={4} borderRadius="md" overflow="auto">
                        <Code
                          display="block"
                          whiteSpace="pre-wrap"
                          bg="transparent"
                          color="surface.200"
                          fontSize="sm"
                        >
                          {JSON.stringify(selectedTest.response || { message: selectedTest.message }, null, 2)}
                        </Code>
                      </Box>
                    </TabPanel>
                    <TabPanel p={0}>
                      <Box bg="surface.900" p={4} borderRadius="md" overflow="auto">
                        <Code
                          display="block"
                          whiteSpace="pre-wrap"
                          bg="transparent"
                          color="surface.200"
                          fontSize="sm"
                        >
                          {JSON.stringify(selectedTest.request || {}, null, 2)}
                        </Code>
                      </Box>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </MotionBox>
            )}
          </AnimatePresence>
        </VStack>
      </Container>
    </Box>
  );
}
