'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Card,
  CardBody,
  Badge,
  Spinner,
  useToast,
  IconButton,
  Flex,
  FormControl,
  FormLabel,
  Select,
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  Stack,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useSteps,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useDisclosure,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import MigrationScriptViewer from '@/components/MigrationScriptViewer';
import SchemaFixWizard from '@/components/SchemaFixWizard';
import type { ValidationIssue, SchemaValidationResult } from '@/types';

const MotionBox = motion.create(Box);

// Icons
const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

interface Connection {
  id: string;
  name: string;
  environment: 'production' | 'development';
}

interface TableInfo {
  tableName: string;
  enabled: boolean;
}

interface DryRunResult {
  tables: {
    tableName: string;
    inserts: number;
    updates: number;
    sourceRowCount: number;
    targetRowCount: number;
  }[];
  schemaIssues: {
    tableName: string;
    missingInTarget: boolean;
    missingInSource: boolean;
    columnDifferences: { columnName: string; issue: string }[];
  }[];
  totalInserts: number;
  totalUpdates: number;
  estimatedDuration: number;
  warnings: string[];
}

interface ValidationResult {
  validation: SchemaValidationResult;
  summary: string;
  warnings: string[];
  canProceed: boolean;
  requiresConfirmation: boolean;
  targetEnvironment: 'production' | 'development';
  targetName: string;
}

const steps = [
  { title: 'Connections', description: 'Select source and target' },
  { title: 'Tables', description: 'Choose tables to sync' },
  { title: 'Validate', description: 'Check schema compatibility' },
  { title: 'Options', description: 'Configure sync settings' },
  { title: 'Preview', description: 'Review changes' },
  { title: 'Confirm', description: 'Start the sync' },
];

export default function CreateSyncPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [direction, setDirection] = useState<'one_way' | 'two_way'>('one_way');
  const [conflictStrategy, setConflictStrategy] = useState('last_write_wins');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isDryRunning, setIsDryRunning] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  
  const { activeStep, setActiveStep } = useSteps({ index: 0, count: steps.length });
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
  const router = useRouter();
  const toast = useToast();

  const fetchConnections = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/connections');
      const data = await response.json();
      if (data.success) {
        setConnections(data.data);
      }
    } catch {
      toast({
        title: 'Failed to load connections',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const fetchTables = async () => {
    if (!sourceId) return;
    
    setLoadingTables(true);
    try {
      const response = await fetch(`/api/connections/${sourceId}`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success && data.data.syncableTables) {
        setTables(data.data.syncableTables.map((t: string) => ({
          tableName: t,
          enabled: true,
        })));
      }
    } catch {
      toast({
        title: 'Failed to load tables',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoadingTables(false);
    }
  };

  const runValidation = async () => {
    setIsValidating(true);
    try {
      const response = await fetch('/api/sync/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceConnectionId: sourceId,
          targetConnectionId: targetId,
          tables: enabledTables.map(t => t.tableName),
          direction,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setValidationResult(data.data);
        
        // If there are critical issues, show a toast
        if (data.data.validation.summary.critical > 0) {
          toast({
            title: 'Critical issues detected',
            description: 'Please fix the critical schema issues before proceeding.',
            status: 'error',
            duration: 5000,
          });
        } else {
          setActiveStep(3); // Move to options
        }
      } else {
        toast({
          title: 'Validation failed',
          description: data.error,
          status: 'error',
          duration: 5000,
        });
      }
    } catch {
      toast({
        title: 'Validation failed',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsValidating(false);
    }
  };

  const runDryRun = async () => {
    setIsDryRunning(true);
    
    // Build headers - include production confirmation if targeting production
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (targetConnection?.environment === 'production') {
      headers['X-Confirm-Production'] = 'true';
    }
    
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sourceConnectionId: sourceId,
          targetConnectionId: targetId,
          direction,
          tables: tables.map(t => ({
            ...t,
            conflictStrategy: direction === 'two_way' ? conflictStrategy : undefined,
          })),
          dryRun: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setDryRunResult(data.data);
        setActiveStep(4); // Move to preview
      } else {
        toast({
          title: 'Analysis failed',
          description: data.error,
          status: 'error',
          duration: 5000,
        });
      }
    } catch {
      toast({
        title: 'Analysis failed',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsDryRunning(false);
    }
  };

  const [creatingStatus, setCreatingStatus] = useState<string>('');
  
  const createAndStartSync = async () => {
    setIsCreating(true);
    setCreatingStatus('Creating sync job...');
    
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    
    if (targetConnection?.environment === 'production') {
      headers['X-Confirm-Production'] = 'true';
    }

    try {
      // Create the sync job
      const createResponse = await fetch('/api/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sourceConnectionId: sourceId,
          targetConnectionId: targetId,
          direction,
          tables: tables.map(t => ({
            ...t,
            conflictStrategy: direction === 'two_way' ? conflictStrategy : undefined,
          })),
          dryRun: false,
        }),
      });

      const createData = await createResponse.json();

      if (!createData.success) {
        throw new Error(createData.error);
      }

      setCreatingStatus('Starting sync...');

      // Start the sync job (returns SSE stream, don't wait for it to complete)
      const startResponse = await fetch(`/api/sync/${createData.data.id}/start`, {
        method: 'POST',
      });

      // Check if it's a streaming response or error
      const contentType = startResponse.headers.get('content-type') || '';
      
      if (contentType.includes('text/event-stream')) {
        // SSE stream - sync has started, redirect to status page
        toast({
          title: 'Sync job started',
          description: 'Redirecting to sync status page...',
          status: 'success',
          duration: 2000,
        });
        router.push(`/sync/${createData.data.id}`);
      } else {
        // JSON response - check for errors
        const startData = await startResponse.json();
        
        if (startData.success || startResponse.ok) {
          toast({
            title: 'Sync job started',
            status: 'success',
            duration: 3000,
          });
          router.push(`/sync/${createData.data.id}`);
        } else {
          throw new Error(startData.error || 'Failed to start sync');
        }
      }
    } catch (error) {
      toast({
        title: 'Failed to start sync',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
      setIsCreating(false);
      setCreatingStatus('');
    } finally {
      onConfirmClose();
    }
  };

  const sourceConnection = connections.find(c => c.id === sourceId);
  const targetConnection = connections.find(c => c.id === targetId);
  const enabledTables = tables.filter(t => t.enabled);
  
  // Check if validation blocks proceeding
  const validationBlocked = validationResult?.validation?.summary?.critical 
    ? validationResult.validation.summary.critical > 0 
    : false;

  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return sourceId && targetId && sourceId !== targetId;
      case 1:
        return enabledTables.length > 0;
      case 2:
        return validationResult !== null && !validationBlocked;
      case 3:
        return true;
      case 4:
        return dryRunResult !== null;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (activeStep === 0 && sourceId) {
      fetchTables();
    }
    if (activeStep === 1) {
      runValidation();
      return;
    }
    if (activeStep === 3) {
      runDryRun();
      return;
    }
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleStartSync = () => {
    // Show confirmation dialog
    onConfirmOpen();
  };

  // Group issues by severity for display
  const groupedIssues = validationResult?.validation?.issues?.reduce((acc, issue) => {
    if (!acc[issue.severity]) acc[issue.severity] = [];
    acc[issue.severity].push(issue);
    return acc;
  }, {} as Record<string, ValidationIssue[]>) || {};

  if (isLoading) {
    return (
      <Box minH="100vh" className="gradient-mesh">
        <Flex justify="center" align="center" h="100vh">
          <Spinner size="xl" color="brand.400" />
        </Flex>
      </Box>
    );
  }

  return (
    <Box minH="100vh" className="gradient-mesh">
      {/* Header */}
      <Box 
        as="header" 
        bg="surface.800" 
        borderBottomWidth="1px" 
        borderColor="surface.700"
        position="sticky"
        top={0}
        zIndex={10}
      >
        <Container maxW="4xl" py={{ base: 3, md: 4 }} px={{ base: 4, md: 6 }}>
          <Flex justify="space-between" align="center">
            <HStack spacing={{ base: 2, md: 4 }}>
              <IconButton
                aria-label="Back"
                icon={<ArrowLeftIcon />}
                variant="ghost"
                size={{ base: 'sm', md: 'md' }}
                onClick={() => router.push('/')}
              />
              <Heading size={{ base: 'sm', md: 'md' }} color="white">
                Create Sync Job
              </Heading>
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="4xl" py={{ base: 4, md: 8 }} px={{ base: 4, md: 6 }}>
        {/* Step Progress - 2 Rows on All Screens */}
        <Box mb={6} bg="surface.800" p={{ base: 3, md: 4 }} borderRadius="lg">
          {/* Current Step Title - Mobile */}
          <Box display={{ base: 'block', md: 'none' }} mb={3}>
            <HStack justify="space-between" align="center">
              <VStack align="start" spacing={0}>
                <Text color="surface.400" fontSize="xs" fontWeight="medium">
                  STEP {activeStep + 1} OF {steps.length}
                </Text>
                <Text color="white" fontWeight="bold" fontSize="md">
                  {steps[activeStep].title}
                </Text>
              </VStack>
              <Badge colorScheme="teal" fontSize="xs" px={2}>
                {Math.round(((activeStep + 1) / steps.length) * 100)}%
              </Badge>
            </HStack>
          </Box>
          
          {/* Step Grid - 2 Rows */}
          <Flex wrap="wrap" gap={{ base: 2, md: 3 }} justify="center">
            {/* Row 1: Steps 1-3 */}
            {steps.slice(0, 3).map((step, index) => (
              <Box 
                key={index}
                flex={{ base: '1 1 30%', md: '1 1 30%' }}
                minW={{ base: '90px', md: '140px' }}
                maxW={{ base: '120px', md: '180px' }}
              >
                <VStack 
                  spacing={1} 
                  p={{ base: 2, md: 3 }}
                  bg={index === activeStep ? 'teal.900' : index < activeStep ? 'green.900' : 'surface.700'}
                  borderRadius="md"
                  borderWidth="2px"
                  borderColor={index === activeStep ? 'teal.400' : index < activeStep ? 'green.500' : 'surface.600'}
                  opacity={index <= activeStep ? 1 : 0.6}
                  transition="all 0.2s"
                  cursor={index < activeStep ? 'pointer' : 'default'}
                  onClick={() => {
                    if (index < activeStep) setActiveStep(index);
                  }}
                  _hover={index < activeStep ? { borderColor: 'teal.400' } : {}}
                >
                  <HStack spacing={1}>
                    <Flex
                      w={{ base: '20px', md: '24px' }}
                      h={{ base: '20px', md: '24px' }}
                      borderRadius="full"
                      bg={index < activeStep ? 'green.500' : index === activeStep ? 'teal.500' : 'surface.500'}
                      color="white"
                      align="center"
                      justify="center"
                      fontSize={{ base: 'xs', md: 'sm' }}
                      fontWeight="bold"
                    >
                      {index < activeStep ? <CheckIcon /> : index + 1}
                    </Flex>
                    <Text 
                      color={index <= activeStep ? 'white' : 'surface.400'} 
                      fontSize={{ base: '2xs', md: 'xs' }}
                      fontWeight="semibold"
                      isTruncated
                      display={{ base: 'none', sm: 'block' }}
                    >
                      {step.title}
                    </Text>
                  </HStack>
                  <Text 
                    color="surface.400" 
                    fontSize="2xs"
                    textAlign="center"
                    display={{ base: 'none', lg: 'block' }}
                    isTruncated
                  >
                    {step.description}
                  </Text>
                </VStack>
              </Box>
            ))}
          </Flex>
          
          <Flex wrap="wrap" gap={{ base: 2, md: 3 }} justify="center" mt={{ base: 2, md: 3 }}>
            {/* Row 2: Steps 4-6 */}
            {steps.slice(3).map((step, idx) => {
              const index = idx + 3;
              return (
                <Box 
                  key={index}
                  flex={{ base: '1 1 30%', md: '1 1 30%' }}
                  minW={{ base: '90px', md: '140px' }}
                  maxW={{ base: '120px', md: '180px' }}
                >
                  <VStack 
                    spacing={1} 
                    p={{ base: 2, md: 3 }}
                    bg={index === activeStep ? 'teal.900' : index < activeStep ? 'green.900' : 'surface.700'}
                    borderRadius="md"
                    borderWidth="2px"
                    borderColor={index === activeStep ? 'teal.400' : index < activeStep ? 'green.500' : 'surface.600'}
                    opacity={index <= activeStep ? 1 : 0.6}
                    transition="all 0.2s"
                    cursor={index < activeStep ? 'pointer' : 'default'}
                    onClick={() => {
                      if (index < activeStep) setActiveStep(index);
                    }}
                    _hover={index < activeStep ? { borderColor: 'teal.400' } : {}}
                  >
                    <HStack spacing={1}>
                      <Flex
                        w={{ base: '20px', md: '24px' }}
                        h={{ base: '20px', md: '24px' }}
                        borderRadius="full"
                        bg={index < activeStep ? 'green.500' : index === activeStep ? 'teal.500' : 'surface.500'}
                        color="white"
                        align="center"
                        justify="center"
                        fontSize={{ base: 'xs', md: 'sm' }}
                        fontWeight="bold"
                      >
                        {index < activeStep ? <CheckIcon /> : index + 1}
                      </Flex>
                      <Text 
                        color={index <= activeStep ? 'white' : 'surface.400'} 
                        fontSize={{ base: '2xs', md: 'xs' }}
                        fontWeight="semibold"
                        isTruncated
                        display={{ base: 'none', sm: 'block' }}
                      >
                        {step.title}
                      </Text>
                    </HStack>
                    <Text 
                      color="surface.400" 
                      fontSize="2xs"
                      textAlign="center"
                      display={{ base: 'none', lg: 'block' }}
                      isTruncated
                    >
                      {step.description}
                    </Text>
                  </VStack>
                </Box>
              );
            })}
          </Flex>
          
          {/* Progress Bar */}
          <Box mt={3} display={{ base: 'block', md: 'none' }}>
            <Box 
              h="4px" 
              bg="surface.600" 
              borderRadius="full" 
              overflow="hidden"
            >
              <Box 
                h="100%" 
                bg="teal.400" 
                borderRadius="full"
                w={`${((activeStep + 1) / steps.length) * 100}%`}
                transition="width 0.3s ease"
              />
            </Box>
          </Box>
        </Box>

        <MotionBox
          key={activeStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card bg="surface.800" borderColor="surface.700">
            <CardBody p={{ base: 4, md: 6 }}>
              {/* Step 1: Select Connections */}
              {activeStep === 0 && (
                <VStack spacing={6} align="stretch">
                  <FormControl>
                    <FormLabel color="surface.300">Source Database</FormLabel>
                    <Select
                      placeholder="Select source connection"
                      value={sourceId}
                      onChange={(e) => setSourceId(e.target.value)}
                      bg="surface.900"
                      borderColor="surface.600"
                    >
                      {connections.map((conn) => (
                        <option key={conn.id} value={conn.id}>
                          {conn.name} ({conn.environment})
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel color="surface.300">Target Database</FormLabel>
                    <Select
                      placeholder="Select target connection"
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      bg="surface.900"
                      borderColor="surface.600"
                    >
                      {connections
                        .filter((conn) => conn.id !== sourceId)
                        .map((conn) => (
                          <option key={conn.id} value={conn.id}>
                            {conn.name} ({conn.environment})
                          </option>
                        ))}
                    </Select>
                  </FormControl>

                  {targetConnection?.environment === 'production' && (
                    <Alert status="error" borderRadius="md">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Production Target Selected</AlertTitle>
                        <AlertDescription>
                          You are syncing data TO a production database. 
                          Additional confirmation will be required.
                        </AlertDescription>
                      </Box>
                    </Alert>
                  )}

                  {connections.length < 2 && (
                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Add More Connections</AlertTitle>
                        <AlertDescription>
                          You need at least 2 database connections to create a sync job.
                          <Button 
                            size="sm" 
                            ml={2}
                            onClick={() => router.push('/connections')}
                          >
                            Add Connection
                          </Button>
                        </AlertDescription>
                      </Box>
                    </Alert>
                  )}
                </VStack>
              )}

              {/* Step 2: Select Tables */}
              {activeStep === 1 && (
                <VStack spacing={4} align="stretch">
                  {loadingTables ? (
                    <Flex justify="center" py={8}>
                      <Spinner size="lg" color="brand.400" />
                    </Flex>
                  ) : tables.length === 0 ? (
                    <Alert status="warning" borderRadius="md">
                      <AlertIcon />
                      <AlertDescription>
                        No syncable tables found. Tables must have id (UUID) and updated_at columns.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <HStack justify="space-between">
                        <Text color="surface.300">
                          {enabledTables.length} of {tables.length} tables selected
                        </Text>
                        <HStack>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setTables(tables.map(t => ({ ...t, enabled: true })))}
                          >
                            Select All
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setTables(tables.map(t => ({ ...t, enabled: false })))}
                          >
                            Deselect All
                          </Button>
                        </HStack>
                      </HStack>
                      <Divider borderColor="surface.700" />
                      <CheckboxGroup>
                        <Stack spacing={2}>
                          {tables.map((table) => (
                            <Checkbox
                              key={table.tableName}
                              isChecked={table.enabled}
                              onChange={(e) => {
                                setTables(tables.map(t => 
                                  t.tableName === table.tableName 
                                    ? { ...t, enabled: e.target.checked }
                                    : t
                                ));
                              }}
                              colorScheme="teal"
                            >
                              <Text fontFamily="mono" color="white">
                                {table.tableName}
                              </Text>
                            </Checkbox>
                          ))}
                        </Stack>
                      </CheckboxGroup>
                    </>
                  )}
                </VStack>
              )}

              {/* Step 3: Validation Results */}
              {activeStep === 2 && (
                <VStack spacing={6} align="stretch">
                  {isValidating ? (
                    <Flex justify="center" py={8} direction="column" align="center">
                      <Spinner size="lg" color="brand.400" mb={4} />
                      <Text color="surface.400">Validating schema compatibility...</Text>
                    </Flex>
                  ) : validationResult ? (
                    <>
                      {/* Summary Header */}
                      <HStack spacing={3} p={4} bg="surface.900" borderRadius="md">
                        <Box color={validationBlocked ? 'red.400' : 'green.400'}>
                          <ShieldIcon />
                        </Box>
                        <VStack align="start" spacing={0} flex={1}>
                          <Text color="white" fontWeight="bold">
                            Schema Validation {validationBlocked ? 'Failed' : 'Passed'}
                          </Text>
                          <Text color="surface.400" fontSize="sm">
                            {validationResult.summary}
                          </Text>
                        </VStack>
                      </HStack>

                      {/* Issue Summary Badges */}
                      <HStack spacing={2} flexWrap="wrap">
                        {validationResult.validation.summary.critical > 0 && (
                          <Badge colorScheme="red" variant="solid" px={3} py={1}>
                            {validationResult.validation.summary.critical} Critical
                          </Badge>
                        )}
                        {validationResult.validation.summary.high > 0 && (
                          <Badge colorScheme="orange" variant="solid" px={3} py={1}>
                            {validationResult.validation.summary.high} High Risk
                          </Badge>
                        )}
                        {validationResult.validation.summary.medium > 0 && (
                          <Badge colorScheme="yellow" variant="outline" px={3} py={1}>
                            {validationResult.validation.summary.medium} Medium
                          </Badge>
                        )}
                        {validationResult.validation.summary.low > 0 && (
                          <Badge colorScheme="blue" variant="outline" px={3} py={1}>
                            {validationResult.validation.summary.low} Low
                          </Badge>
                        )}
                        {validationResult.validation.summary.info > 0 && (
                          <Badge colorScheme="gray" variant="outline" px={3} py={1}>
                            {validationResult.validation.summary.info} Info
                          </Badge>
                        )}
                      </HStack>

                      {/* Critical Issues - Schema Fix Wizard */}
                      {groupedIssues['CRITICAL']?.length > 0 && sourceId && targetId && (
                        <SchemaFixWizard
                          sourceConnectionId={sourceId}
                          targetConnectionId={targetId}
                          targetConnectionName={connections.find(c => c.id === targetId)?.name || 'Target'}
                          targetEnvironment={connections.find(c => c.id === targetId)?.environment || 'development'}
                          tables={enabledTables.map(t => t.tableName)}
                          issues={groupedIssues['CRITICAL']}
                          onRevalidate={runValidation}
                          isRevalidating={isValidating}
                        />
                      )}

                      {/* High Risk Issues */}
                      {groupedIssues['HIGH']?.length > 0 && (
                        <Alert status="warning" borderRadius="md" flexDirection="column" alignItems="start">
                          <HStack mb={2}>
                            <AlertIcon />
                            <AlertTitle>High Risk Issues - Requires Confirmation</AlertTitle>
                          </HStack>
                          <AlertDescription w="100%">
                            <VStack align="start" spacing={2} mt={2}>
                              {groupedIssues['HIGH'].map((issue) => (
                                <Box key={issue.id} p={2} bg="orange.900" borderRadius="sm" w="100%">
                                  <Text fontFamily="mono" color="orange.200" fontSize="sm">
                                    {issue.tableName}
                                    {issue.columnName && `.${issue.columnName}`}
                                  </Text>
                                  <Text color="white" fontSize="sm">{issue.message}</Text>
                                  <Text color="orange.300" fontSize="xs">{issue.recommendation}</Text>
                                </Box>
                              ))}
                            </VStack>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Other Issues - Collapsible */}
                      {(groupedIssues['MEDIUM']?.length > 0 || 
                        groupedIssues['LOW']?.length > 0 || 
                        groupedIssues['INFO']?.length > 0) && (
                        <Accordion allowToggle>
                          {groupedIssues['MEDIUM']?.length > 0 && (
                            <AccordionItem border="none">
                              <AccordionButton bg="surface.900" borderRadius="md">
                                <HStack flex={1}>
                                  <Badge colorScheme="yellow">{groupedIssues['MEDIUM'].length}</Badge>
                                  <Text color="white">Medium Priority Issues</Text>
                                </HStack>
                                <AccordionIcon color="surface.400" />
                              </AccordionButton>
                              <AccordionPanel>
                                <VStack align="start" spacing={2}>
                                  {groupedIssues['MEDIUM'].map((issue) => (
                                    <Box key={issue.id} p={2} bg="surface.900" borderRadius="sm" w="100%">
                                      <Text fontFamily="mono" color="yellow.200" fontSize="sm">
                                        {issue.tableName}{issue.columnName && `.${issue.columnName}`}
                                      </Text>
                                      <Text color="surface.300" fontSize="sm">{issue.message}</Text>
                                    </Box>
                                  ))}
                                </VStack>
                              </AccordionPanel>
                            </AccordionItem>
                          )}
                          {(groupedIssues['LOW']?.length > 0 || groupedIssues['INFO']?.length > 0) && (
                            <AccordionItem border="none" mt={2}>
                              <AccordionButton bg="surface.900" borderRadius="md">
                                <HStack flex={1}>
                                  <Badge colorScheme="blue">
                                    {(groupedIssues['LOW']?.length || 0) + (groupedIssues['INFO']?.length || 0)}
                                  </Badge>
                                  <Text color="white">Informational Notices</Text>
                                </HStack>
                                <AccordionIcon color="surface.400" />
                              </AccordionButton>
                              <AccordionPanel>
                                <VStack align="start" spacing={2}>
                                  {[...(groupedIssues['LOW'] || []), ...(groupedIssues['INFO'] || [])].map((issue) => (
                                    <Box key={issue.id} p={2} bg="surface.900" borderRadius="sm" w="100%">
                                      <Text fontFamily="mono" color="blue.200" fontSize="sm">
                                        {issue.tableName}{issue.columnName && `.${issue.columnName}`}
                                      </Text>
                                      <Text color="surface.300" fontSize="sm">{issue.message}</Text>
                                    </Box>
                                  ))}
                                </VStack>
                              </AccordionPanel>
                            </AccordionItem>
                          )}
                        </Accordion>
                      )}

                      {/* No issues message */}
                      {validationResult.validation.issues.length === 0 && (
                        <Alert status="success" borderRadius="md">
                          <AlertIcon />
                          <AlertTitle>All Clear!</AlertTitle>
                          <AlertDescription>
                            No schema compatibility issues detected. You can proceed with the sync.
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Migration Script Generator - show when there are issues */}
                      {validationResult.validation.issues.length > 0 && (
                        <>
                          <Divider borderColor="surface.700" my={4} />
                          <MigrationScriptViewer
                            sourceConnectionId={sourceId}
                            targetConnectionId={targetId}
                            tables={enabledTables.map(t => t.tableName)}
                            isOpen={true}
                            onClose={() => {}}
                          />
                        </>
                      )}
                    </>
                  ) : (
                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      <AlertDescription>
                        Click &quot;Validate&quot; to check schema compatibility between source and target databases.
                      </AlertDescription>
                    </Alert>
                  )}
                </VStack>
              )}

              {/* Step 4: Configure Options */}
              {activeStep === 3 && (
                <VStack spacing={6} align="stretch">
                  <FormControl>
                    <FormLabel color="surface.300">Sync Direction</FormLabel>
                    <RadioGroup value={direction} onChange={(v) => setDirection(v as 'one_way' | 'two_way')}>
                      <Stack>
                        <Radio value="one_way" colorScheme="teal">
                          <VStack align="start" spacing={0}>
                            <Text color="white">One-Way Sync</Text>
                            <Text color="surface.500" fontSize="sm">
                              Copy data from source to target only
                            </Text>
                          </VStack>
                        </Radio>
                        <Radio value="two_way" colorScheme="teal">
                          <VStack align="start" spacing={0}>
                            <Text color="white">Two-Way Sync</Text>
                            <Text color="surface.500" fontSize="sm">
                              Sync data in both directions (requires conflict resolution)
                            </Text>
                          </VStack>
                        </Radio>
                      </Stack>
                    </RadioGroup>
                  </FormControl>

                  {direction === 'two_way' && (
                    <FormControl>
                      <FormLabel color="surface.300">Conflict Resolution Strategy</FormLabel>
                      <RadioGroup value={conflictStrategy} onChange={setConflictStrategy}>
                        <Stack>
                          <Radio value="last_write_wins" colorScheme="teal">
                            <Text color="white">Last Write Wins</Text>
                          </Radio>
                          <Radio value="source_wins" colorScheme="teal">
                            <Text color="white">Source Always Wins</Text>
                          </Radio>
                          <Radio value="target_wins" colorScheme="teal">
                            <Text color="white">Target Always Wins</Text>
                          </Radio>
                          <Radio value="manual" colorScheme="teal">
                            <Text color="white">Manual Review</Text>
                          </Radio>
                        </Stack>
                      </RadioGroup>
                    </FormControl>
                  )}
                </VStack>
              )}

              {/* Step 5: Preview (Dry Run Results) */}
              {activeStep === 4 && dryRunResult && (
                <VStack spacing={6} align="stretch">
                  {dryRunResult.warnings.length > 0 && (
                    <Alert status="warning" borderRadius="md">
                      <AlertIcon />
                      <VStack align="start" spacing={1}>
                        {dryRunResult.warnings.map((warning, i) => (
                          <Text key={i}>{warning}</Text>
                        ))}
                      </VStack>
                    </Alert>
                  )}

                  <Flex 
                    gap={{ base: 4, md: 8 }} 
                    wrap="wrap"
                    justify={{ base: 'space-between', md: 'flex-start' }}
                  >
                    <VStack align="start" minW={{ base: '80px', md: 'auto' }}>
                      <Text color="surface.400" fontSize={{ base: 'xs', md: 'sm' }}>Inserts</Text>
                      <Text color="green.400" fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold">
                        {dryRunResult.totalInserts.toLocaleString()}
                      </Text>
                    </VStack>
                    <VStack align="start" minW={{ base: '80px', md: 'auto' }}>
                      <Text color="surface.400" fontSize={{ base: 'xs', md: 'sm' }}>Updates</Text>
                      <Text color="blue.400" fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold">
                        {dryRunResult.totalUpdates.toLocaleString()}
                      </Text>
                    </VStack>
                    <VStack align="start" minW={{ base: '80px', md: 'auto' }}>
                      <Text color="surface.400" fontSize={{ base: 'xs', md: 'sm' }}>Duration</Text>
                      <Text color="white" fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold">
                        ~{dryRunResult.estimatedDuration}s
                      </Text>
                    </VStack>
                  </Flex>

                  <Divider borderColor="surface.700" />

                  <Box overflowX="auto" mx={{ base: -4, md: 0 }} px={{ base: 4, md: 0 }}>
                    <Table size="sm" minW="500px">
                      <Thead>
                        <Tr>
                          <Th color="surface.400" fontSize={{ base: 'xs', md: 'sm' }}>Table</Th>
                          <Th color="surface.400" isNumeric fontSize={{ base: 'xs', md: 'sm' }} display={{ base: 'none', sm: 'table-cell' }}>Source</Th>
                          <Th color="surface.400" isNumeric fontSize={{ base: 'xs', md: 'sm' }} display={{ base: 'none', sm: 'table-cell' }}>Target</Th>
                          <Th color="surface.400" isNumeric fontSize={{ base: 'xs', md: 'sm' }}>Inserts</Th>
                          <Th color="surface.400" isNumeric fontSize={{ base: 'xs', md: 'sm' }}>Updates</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {dryRunResult.tables.map((table) => (
                          <Tr key={table.tableName}>
                            <Td fontFamily="mono" color="white" fontSize={{ base: 'xs', md: 'sm' }} maxW="150px" isTruncated>{table.tableName}</Td>
                            <Td isNumeric color="surface.300" fontSize={{ base: 'xs', md: 'sm' }} display={{ base: 'none', sm: 'table-cell' }}>{table.sourceRowCount.toLocaleString()}</Td>
                            <Td isNumeric color="surface.300" fontSize={{ base: 'xs', md: 'sm' }} display={{ base: 'none', sm: 'table-cell' }}>{table.targetRowCount.toLocaleString()}</Td>
                            <Td isNumeric color="green.400" fontSize={{ base: 'xs', md: 'sm' }}>{table.inserts.toLocaleString()}</Td>
                            <Td isNumeric color="blue.400" fontSize={{ base: 'xs', md: 'sm' }}>{table.updates.toLocaleString()}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>

                  {dryRunResult.schemaIssues.length > 0 && (
                    <>
                      <Divider borderColor="surface.700" />
                      <Alert status="warning" borderRadius="md">
                        <AlertIcon />
                        <Box>
                          <AlertTitle>Schema Differences Detected</AlertTitle>
                          <AlertDescription>
                            {dryRunResult.schemaIssues.length} table(s) have schema differences. 
                            These may cause sync issues.
                          </AlertDescription>
                        </Box>
                      </Alert>
                    </>
                  )}
                </VStack>
              )}

              {/* Step 6: Confirm */}
              {activeStep === 5 && (
                <VStack spacing={6} align="stretch">
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Ready to Sync</AlertTitle>
                      <AlertDescription>
                        Review your sync configuration and click Start Sync to begin.
                      </AlertDescription>
                    </Box>
                  </Alert>

                  <VStack align="start" spacing={2}>
                    <HStack>
                      <Text color="surface.400" w="120px">Source:</Text>
                      <Badge colorScheme={sourceConnection?.environment === 'production' ? 'red' : 'green'}>
                        {sourceConnection?.name}
                      </Badge>
                    </HStack>
                    <HStack>
                      <Text color="surface.400" w="120px">Target:</Text>
                      <Badge colorScheme={targetConnection?.environment === 'production' ? 'red' : 'green'}>
                        {targetConnection?.name}
                      </Badge>
                    </HStack>
                    <HStack>
                      <Text color="surface.400" w="120px">Direction:</Text>
                      <Text color="white">{direction === 'one_way' ? 'One-Way' : 'Two-Way'}</Text>
                    </HStack>
                    <HStack>
                      <Text color="surface.400" w="120px">Tables:</Text>
                      <Text color="white">{enabledTables.length} tables</Text>
                    </HStack>
                    {dryRunResult && (
                      <>
                        <HStack>
                          <Text color="surface.400" w="120px">Inserts:</Text>
                          <Text color="green.400">{dryRunResult.totalInserts.toLocaleString()}</Text>
                        </HStack>
                        <HStack>
                          <Text color="surface.400" w="120px">Updates:</Text>
                          <Text color="blue.400">{dryRunResult.totalUpdates.toLocaleString()}</Text>
                        </HStack>
                      </>
                    )}
                  </VStack>

                  {targetConnection?.environment === 'production' && (
                    <Alert status="error" borderRadius="md">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Production Target Warning</AlertTitle>
                        <AlertDescription>
                          You are about to sync data TO a production database. 
                          You will need to type the database name to confirm.
                        </AlertDescription>
                      </Box>
                    </Alert>
                  )}
                </VStack>
              )}
            </CardBody>
          </Card>
        </MotionBox>

        {/* Navigation Buttons */}
        <Flex 
          justify="space-between" 
          mt={6} 
          gap={3}
          direction={{ base: 'column-reverse', sm: 'row' }}
        >
          <Button
            leftIcon={<ArrowLeftIcon />}
            variant="ghost"
            onClick={handleBack}
            isDisabled={activeStep === 0}
            size={{ base: 'md', md: 'md' }}
            w={{ base: '100%', sm: 'auto' }}
          >
            Back
          </Button>

          {activeStep < 5 ? (
            <Button
              rightIcon={activeStep === 1 || activeStep === 3 ? undefined : <ArrowRightIcon />}
              colorScheme="teal"
              onClick={handleNext}
              isDisabled={!canProceed()}
              isLoading={isValidating || isDryRunning}
              loadingText={activeStep === 1 ? 'Validating...' : 'Analyzing...'}
              size={{ base: 'md', md: 'md' }}
              w={{ base: '100%', sm: 'auto' }}
            >
              {activeStep === 1 ? 'Validate' : activeStep === 3 ? 'Analyze' : 'Next'}
            </Button>
          ) : (
            <Button
              leftIcon={<CheckIcon />}
              colorScheme={targetConnection?.environment === 'production' ? 'red' : 'teal'}
              onClick={handleStartSync}
              isLoading={isCreating}
              loadingText="Starting..."
              size={{ base: 'md', md: 'md' }}
              w={{ base: '100%', sm: 'auto' }}
            >
              Start Sync
            </Button>
          )}
        </Flex>
      </Container>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={onConfirmClose}
        onConfirm={createAndStartSync}
        isLoading={isCreating}
        loadingStatus={creatingStatus || 'Starting...'}
        type={targetConnection?.environment === 'production' ? 'production' : 
              (validationResult?.validation?.summary?.high || 0) > 0 ? 'high_risk' : 'standard'}
        targetName={targetConnection?.name || ''}
        targetEnvironment={targetConnection?.environment || 'development'}
        issues={validationResult?.validation?.issues}
        summary={validationResult?.validation?.summary}
        syncStats={dryRunResult ? {
          tables: enabledTables.length,
          inserts: dryRunResult.totalInserts,
          updates: dryRunResult.totalUpdates,
        } : undefined}
      />
    </Box>
  );
}
