'use client';

import { useEffect, useState } from 'react';
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
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
  Progress,
  Input,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionBox = motion.div;

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

const DatabaseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);

const CompareIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 3h5v5"/>
    <path d="M8 3H3v5"/>
    <path d="M21 3l-7 7"/>
    <path d="M3 3l7 7"/>
    <path d="M16 21h5v-5"/>
    <path d="M8 21H3v-5"/>
    <path d="M21 21l-7-7"/>
    <path d="M3 21l7-7"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

interface Connection {
  id: string;
  name: string;
  environment: 'production' | 'development';
}

interface ValidationIssue {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  tableName: string;
  columnName?: string;
  message: string;
  recommendation: string;
}

interface ValidationResult {
  isCompatible: boolean;
  summary: string;
  validation: {
    issues: ValidationIssue[];
    summary: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      info: number;
    };
  };
}

interface MigrationResult {
  statement: string;
  success: boolean;
  error?: string;
}

type Step = 'select' | 'compare' | 'fix' | 'complete';

export default function SchemaSyncPage() {
  const router = useRouter();
  const toast = useToast();

  // State
  const [connections, setConnections] = useState<Connection[]>([]);
  const [sourceId, setSourceId] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');
  const [step, setStep] = useState<Step>('select');
  const [isLoading, setIsLoading] = useState(true);
  const [isComparing, setIsComparing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [migrationScript, setMigrationScript] = useState<string>('');
  const [executionResults, setExecutionResults] = useState<MigrationResult[]>([]);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [copied, setCopied] = useState(false);

  const sourceConnection = connections.find(c => c.id === sourceId);
  const targetConnection = connections.find(c => c.id === targetId);
  const isTargetProduction = targetConnection?.environment === 'production';

  // Fetch connections
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const response = await fetch('/api/connections');
        const data = await response.json();
        if (data.success) {
          setConnections(data.data);
        }
      } catch (error) {
        toast({ title: 'Failed to load connections', status: 'error' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchConnections();
  }, []);

  // Compare schemas
  const compareSchemas = async () => {
    if (!sourceId || !targetId) return;

    setIsComparing(true);
    try {
      const response = await fetch('/api/sync/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceConnectionId: sourceId,
          targetConnectionId: targetId,
          tableNames: [], // Compare all tables
        }),
      });

      const data = await response.json();
      if (data.success) {
        setValidationResult(data.data);
        setStep('compare');
        
        if (data.data.isCompatible) {
          toast({
            title: 'Schemas are compatible!',
            description: 'No critical differences found.',
            status: 'success',
            duration: 4000,
          });
        }
      } else {
        toast({ title: 'Comparison failed', description: data.error, status: 'error' });
      }
    } catch (error) {
      toast({ title: 'Comparison failed', status: 'error' });
    } finally {
      setIsComparing(false);
    }
  };

  // Generate migration script
  const generateMigration = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/sync/generate-migration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceConnectionId: sourceId,
          targetConnectionId: targetId,
          tables: [], // All tables
        }),
      });

      const data = await response.json();
      if (data.success && data.data?.fullScript) {
        setMigrationScript(data.data.fullScript);
        setStep('fix');
      } else {
        toast({
          title: 'No migration needed',
          description: data.error || 'Schemas are already in sync',
          status: 'info',
        });
      }
    } catch (error) {
      toast({ title: 'Failed to generate migration', status: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  // Execute migration
  const executeMigration = async () => {
    if (isTargetProduction && confirmationInput !== targetConnection?.name) {
      toast({
        title: 'Confirmation required',
        description: `Type "${targetConnection?.name}" to confirm`,
        status: 'warning',
      });
      return;
    }

    setIsExecuting(true);
    try {
      const response = await fetch(`/api/connections/${targetId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql: migrationScript,
          confirmationPhrase: isTargetProduction ? confirmationInput : undefined,
        }),
      });

      const data = await response.json();
      if (data.data?.results) {
        setExecutionResults(data.data.results);
        setStep('complete');
        
        if (data.success) {
          toast({
            title: 'Migration completed!',
            description: data.data.message,
            status: 'success',
            duration: 5000,
          });
        } else {
          toast({
            title: 'Migration completed with errors',
            description: data.data.message,
            status: 'warning',
            duration: 5000,
          });
        }
      } else {
        toast({ title: 'Migration failed', description: data.error, status: 'error' });
      }
    } catch (error) {
      toast({ title: 'Execution failed', status: 'error' });
    } finally {
      setIsExecuting(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(migrationScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied!', status: 'success', duration: 1500 });
  };

  const reset = () => {
    setStep('select');
    setValidationResult(null);
    setMigrationScript('');
    setExecutionResults([]);
    setConfirmationInput('');
  };

  // Group issues by severity
  const groupedIssues = validationResult?.validation?.issues?.reduce((acc, issue) => {
    if (!acc[issue.severity]) acc[issue.severity] = [];
    acc[issue.severity].push(issue);
    return acc;
  }, {} as Record<string, ValidationIssue[]>) || {};

  const hasCriticalIssues = (validationResult?.validation?.summary?.critical || 0) > 0;

  return (
    <Box minH="100vh" className="gradient-mesh">
      {/* Header */}
      <Box as="header" bg="surface.800" borderBottomWidth="1px" borderColor="surface.700">
        <Container maxW="5xl" py={4} px={{ base: 4, md: 6 }}>
          <Flex justify="space-between" align="center">
            <HStack spacing={4}>
              <IconButton
                aria-label="Back"
                icon={<ArrowLeftIcon />}
                variant="ghost"
                onClick={() => router.push('/')}
              />
              <HStack spacing={2}>
                <Box color="brand.400">
                  <CompareIcon />
                </Box>
                <Heading size="md" color="white" fontFamily="mono">
                  Schema Sync
                </Heading>
              </HStack>
            </HStack>
            
            {/* Step Indicator */}
            <HStack spacing={2} display={{ base: 'none', md: 'flex' }}>
              {['select', 'compare', 'fix', 'complete'].map((s, idx) => (
                <HStack key={s} spacing={1}>
                  <Box
                    w="28px"
                    h="28px"
                    borderRadius="full"
                    bg={
                      step === s ? 'teal.400' :
                      ['select', 'compare', 'fix', 'complete'].indexOf(step) > idx ? 'green.500' :
                      'surface.600'
                    }
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="sm"
                    fontWeight="bold"
                    color="white"
                  >
                    {['select', 'compare', 'fix', 'complete'].indexOf(step) > idx ? <CheckIcon /> : idx + 1}
                  </Box>
                  {idx < 3 && (
                    <Box w="20px" h="2px" bg={['select', 'compare', 'fix', 'complete'].indexOf(step) > idx ? 'green.500' : 'surface.600'} />
                  )}
                </HStack>
              ))}
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Mobile Step Indicator */}
      <Box display={{ base: 'block', md: 'none' }} bg="surface.800" borderBottomWidth="1px" borderColor="surface.700" py={2}>
        <Container maxW="5xl" px={4}>
          <HStack justify="space-between">
            <Text color="surface.400" fontSize="sm">
              Step {['select', 'compare', 'fix', 'complete'].indexOf(step) + 1} of 4
            </Text>
            <Text color="white" fontWeight="bold" fontSize="sm">
              {step === 'select' ? 'Select Databases' : 
               step === 'compare' ? 'Compare Schemas' : 
               step === 'fix' ? 'Apply Fixes' : 'Complete'}
            </Text>
          </HStack>
        </Container>
      </Box>

      <Container maxW="5xl" py={{ base: 4, md: 8 }} px={{ base: 4, md: 6 }}>
        {isLoading ? (
          <Flex justify="center" py={20}>
            <Spinner size="xl" color="brand.400" />
          </Flex>
        ) : (
          <MotionBox
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step 1: Select Databases */}
            {step === 'select' && (
              <Card bg="surface.800" borderColor="surface.700">
                <CardBody p={{ base: 4, md: 8 }}>
                  <VStack spacing={8} align="stretch">
                    <VStack spacing={2} textAlign="center">
                      <Heading size="lg" color="white">Compare & Sync Schemas</Heading>
                      <Text color="surface.400" maxW="lg">
                        Select your source (reference) and target databases to compare schemas 
                        and generate migration scripts to keep them in sync.
                      </Text>
                    </VStack>

                    <Flex 
                      direction={{ base: 'column', md: 'row' }} 
                      gap={6} 
                      align={{ base: 'stretch', md: 'center' }}
                    >
                      {/* Source */}
                      <Box flex={1}>
                        <FormControl>
                          <FormLabel color="surface.300" fontSize="sm">
                            <HStack>
                              <DatabaseIcon />
                              <Text>Source Database (Reference)</Text>
                            </HStack>
                          </FormLabel>
                          <Select
                            placeholder="Select source..."
                            value={sourceId}
                            onChange={(e) => setSourceId(e.target.value)}
                            bg="surface.900"
                            borderColor="surface.600"
                            size="lg"
                          >
                            {connections.map((conn) => (
                              <option key={conn.id} value={conn.id} disabled={conn.id === targetId}>
                                {conn.name} ({conn.environment})
                              </option>
                            ))}
                          </Select>
                          <Text fontSize="xs" color="surface.500" mt={1}>
                            The schema from this database will be used as the reference
                          </Text>
                        </FormControl>
                      </Box>

                      {/* Arrow */}
                      <Box 
                        display="flex" 
                        alignItems="center" 
                        justifyContent="center"
                        py={{ base: 2, md: 0 }}
                      >
                        <Box 
                          bg="teal.500" 
                          borderRadius="full" 
                          p={3}
                          transform={{ base: 'rotate(90deg)', md: 'rotate(0deg)' }}
                        >
                          <ArrowRightIcon />
                        </Box>
                      </Box>

                      {/* Target */}
                      <Box flex={1}>
                        <FormControl>
                          <FormLabel color="surface.300" fontSize="sm">
                            <HStack>
                              <DatabaseIcon />
                              <Text>Target Database (To Update)</Text>
                            </HStack>
                          </FormLabel>
                          <Select
                            placeholder="Select target..."
                            value={targetId}
                            onChange={(e) => setTargetId(e.target.value)}
                            bg="surface.900"
                            borderColor="surface.600"
                            size="lg"
                          >
                            {connections.map((conn) => (
                              <option key={conn.id} value={conn.id} disabled={conn.id === sourceId}>
                                {conn.name} ({conn.environment})
                              </option>
                            ))}
                          </Select>
                          <Text fontSize="xs" color="surface.500" mt={1}>
                            Changes will be applied to this database
                          </Text>
                        </FormControl>
                      </Box>
                    </Flex>

                    {connections.length === 0 && (
                      <Alert status="warning" borderRadius="md">
                        <AlertIcon />
                        <Box>
                          <AlertTitle>No connections found</AlertTitle>
                          <AlertDescription>
                            <Button size="sm" colorScheme="teal" onClick={() => router.push('/connections')} mt={2}>
                              Add Connections
                            </Button>
                          </AlertDescription>
                        </Box>
                      </Alert>
                    )}

                    <Button
                      colorScheme="teal"
                      size="lg"
                      onClick={compareSchemas}
                      isLoading={isComparing}
                      loadingText="Comparing Schemas..."
                      isDisabled={!sourceId || !targetId || sourceId === targetId}
                      leftIcon={<CompareIcon />}
                    >
                      Compare Schemas
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            )}

            {/* Step 2: Compare Results */}
            {step === 'compare' && validationResult && (
              <VStack spacing={6} align="stretch">
                {/* Summary Card */}
                <Card bg="surface.800" borderColor="surface.700">
                  <CardBody p={{ base: 4, md: 6 }}>
                    <HStack spacing={4} mb={4}>
                      <Box 
                        p={3} 
                        borderRadius="lg" 
                        bg={hasCriticalIssues ? 'red.900' : 'green.900'}
                      >
                        <ShieldIcon />
                      </Box>
                      <VStack align="start" spacing={0} flex={1}>
                        <Heading size="md" color="white">
                          {hasCriticalIssues ? 'Schema Differences Found' : 'Schemas Compatible!'}
                        </Heading>
                        <HStack color="surface.400" fontSize="sm" spacing={2}>
                          <Text>{sourceConnection?.name}</Text>
                          <ArrowRightIcon />
                          <Text>{targetConnection?.name}</Text>
                        </HStack>
                      </VStack>
                    </HStack>

                    {/* Summary Badges */}
                    <HStack spacing={2} flexWrap="wrap" mb={4}>
                      {validationResult.validation.summary.critical > 0 && (
                        <Badge colorScheme="red" px={3} py={1}>
                          {validationResult.validation.summary.critical} Critical
                        </Badge>
                      )}
                      {validationResult.validation.summary.high > 0 && (
                        <Badge colorScheme="orange" px={3} py={1}>
                          {validationResult.validation.summary.high} High
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
                      {!hasCriticalIssues && validationResult.validation.summary.critical === 0 && (
                        <Badge colorScheme="green" px={3} py={1}>
                          <HStack spacing={1}>
                            <CheckIcon />
                            <Text>No Critical Issues</Text>
                          </HStack>
                        </Badge>
                      )}
                    </HStack>

                    <Text color="surface.300" fontSize="sm">{validationResult.summary}</Text>
                  </CardBody>
                </Card>

                {/* Issues List */}
                {validationResult.validation.issues.length > 0 && (
                  <Card bg="surface.800" borderColor="surface.700">
                    <CardBody p={{ base: 4, md: 6 }}>
                      <Heading size="sm" color="white" mb={4}>Schema Differences</Heading>
                      
                      <Accordion allowMultiple defaultIndex={hasCriticalIssues ? [0] : []}>
                        {/* Critical */}
                        {groupedIssues['CRITICAL']?.length > 0 && (
                          <AccordionItem border="none" mb={2}>
                            <AccordionButton bg="red.900" borderRadius="md" _hover={{ bg: 'red.800' }}>
                              <HStack flex={1}>
                                <Badge colorScheme="red">{groupedIssues['CRITICAL'].length}</Badge>
                                <Text color="white" fontWeight="bold">Critical Issues</Text>
                              </HStack>
                              <AccordionIcon color="white" />
                            </AccordionButton>
                            <AccordionPanel bg="red.900" borderBottomRadius="md" mt="-1px">
                              <VStack align="stretch" spacing={2}>
                                {groupedIssues['CRITICAL'].map((issue) => (
                                  <Box key={issue.id} p={3} bg="surface.900" borderRadius="md">
                                    <Code color="red.300" bg="transparent" fontSize="xs">
                                      {issue.tableName}{issue.columnName && `.${issue.columnName}`}
                                    </Code>
                                    <Text color="white" fontSize="sm" mt={1}>{issue.message}</Text>
                                    <Text color="red.300" fontSize="xs" mt={1}>💡 {issue.recommendation}</Text>
                                  </Box>
                                ))}
                              </VStack>
                            </AccordionPanel>
                          </AccordionItem>
                        )}

                        {/* High */}
                        {groupedIssues['HIGH']?.length > 0 && (
                          <AccordionItem border="none" mb={2}>
                            <AccordionButton bg="orange.900" borderRadius="md" _hover={{ bg: 'orange.800' }}>
                              <HStack flex={1}>
                                <Badge colorScheme="orange">{groupedIssues['HIGH'].length}</Badge>
                                <Text color="white" fontWeight="bold">High Risk</Text>
                              </HStack>
                              <AccordionIcon color="white" />
                            </AccordionButton>
                            <AccordionPanel bg="orange.900" borderBottomRadius="md" mt="-1px">
                              <VStack align="stretch" spacing={2}>
                                {groupedIssues['HIGH'].map((issue) => (
                                  <Box key={issue.id} p={3} bg="surface.900" borderRadius="md">
                                    <Code color="orange.300" bg="transparent" fontSize="xs">
                                      {issue.tableName}{issue.columnName && `.${issue.columnName}`}
                                    </Code>
                                    <Text color="white" fontSize="sm" mt={1}>{issue.message}</Text>
                                  </Box>
                                ))}
                              </VStack>
                            </AccordionPanel>
                          </AccordionItem>
                        )}

                        {/* Medium/Low/Info */}
                        {(groupedIssues['MEDIUM']?.length > 0 || groupedIssues['LOW']?.length > 0 || groupedIssues['INFO']?.length > 0) && (
                          <AccordionItem border="none">
                            <AccordionButton bg="surface.700" borderRadius="md" _hover={{ bg: 'surface.600' }}>
                              <HStack flex={1}>
                                <Badge colorScheme="gray">
                                  {(groupedIssues['MEDIUM']?.length || 0) + (groupedIssues['LOW']?.length || 0) + (groupedIssues['INFO']?.length || 0)}
                                </Badge>
                                <Text color="white">Other Notices</Text>
                              </HStack>
                              <AccordionIcon color="white" />
                            </AccordionButton>
                            <AccordionPanel bg="surface.700" borderBottomRadius="md" mt="-1px">
                              <VStack align="stretch" spacing={2}>
                                {[...(groupedIssues['MEDIUM'] || []), ...(groupedIssues['LOW'] || []), ...(groupedIssues['INFO'] || [])].map((issue) => (
                                  <Box key={issue.id} p={3} bg="surface.900" borderRadius="md">
                                    <Code color="surface.400" bg="transparent" fontSize="xs">
                                      {issue.tableName}{issue.columnName && `.${issue.columnName}`}
                                    </Code>
                                    <Text color="surface.300" fontSize="sm" mt={1}>{issue.message}</Text>
                                  </Box>
                                ))}
                              </VStack>
                            </AccordionPanel>
                          </AccordionItem>
                        )}
                      </Accordion>
                    </CardBody>
                  </Card>
                )}

                {/* Actions */}
                <HStack spacing={4}>
                  <Button variant="ghost" onClick={reset} flex={1} leftIcon={<ArrowLeftIcon />}>
                    Start Over
                  </Button>
                  <Button
                    colorScheme="teal"
                    size="lg"
                    onClick={generateMigration}
                    isLoading={isGenerating}
                    loadingText="Generating..."
                    flex={2}
                    isDisabled={!hasCriticalIssues && validationResult.validation.issues.length === 0}
                  >
                    Generate Fix Script
                  </Button>
                </HStack>

                {!hasCriticalIssues && validationResult.validation.issues.length === 0 && (
                  <Alert status="success" borderRadius="md">
                    <AlertIcon />
                    <Text>Schemas are already in sync! No migration needed.</Text>
                  </Alert>
                )}
              </VStack>
            )}

            {/* Step 3: Fix */}
            {step === 'fix' && (
              <VStack spacing={6} align="stretch">
                <Card bg="surface.800" borderColor="surface.700">
                  <CardBody p={{ base: 4, md: 6 }}>
                    <HStack justify="space-between" mb={4}>
                      <Heading size="md" color="white">Migration Script</Heading>
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={copied ? <CheckIcon /> : <CopyIcon />}
                        onClick={copyToClipboard}
                        colorScheme={copied ? 'green' : 'gray'}
                      >
                        {copied ? 'Copied!' : 'Copy'}
                      </Button>
                    </HStack>

                    <Box
                      bg="gray.900"
                      p={4}
                      borderRadius="md"
                      maxH="400px"
                      overflowY="auto"
                      fontFamily="mono"
                      fontSize="sm"
                    >
                      <Code display="block" whiteSpace="pre-wrap" bg="transparent" color="green.300">
                        {migrationScript}
                      </Code>
                    </Box>
                  </CardBody>
                </Card>

                {/* Production Warning */}
                {isTargetProduction && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    <Box flex={1}>
                      <AlertTitle>⚠️ Production Database</AlertTitle>
                      <AlertDescription>
                        <Text mb={2}>Type "{targetConnection?.name}" to confirm execution:</Text>
                        <Input
                          value={confirmationInput}
                          onChange={(e) => setConfirmationInput(e.target.value)}
                          placeholder={targetConnection?.name}
                          bg="surface.900"
                          borderColor={confirmationInput === targetConnection?.name ? 'green.500' : 'red.500'}
                        />
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}

                <HStack spacing={4}>
                  <Button variant="ghost" onClick={() => setStep('compare')} flex={1} leftIcon={<ArrowLeftIcon />}>
                    Back
                  </Button>
                  <Button
                    colorScheme={isTargetProduction ? 'red' : 'teal'}
                    size="lg"
                    onClick={executeMigration}
                    isLoading={isExecuting}
                    loadingText="Executing..."
                    isDisabled={isTargetProduction && confirmationInput !== targetConnection?.name}
                    leftIcon={<PlayIcon />}
                    flex={2}
                  >
                    Execute on {targetConnection?.name}
                  </Button>
                </HStack>

                <Text color="surface.500" fontSize="sm" textAlign="center">
                  Or copy the script and run it manually in psql, pgAdmin, or Supabase SQL Editor
                </Text>
              </VStack>
            )}

            {/* Step 4: Complete */}
            {step === 'complete' && (
              <VStack spacing={6} align="stretch">
                <Card bg="surface.800" borderColor="surface.700">
                  <CardBody p={{ base: 6, md: 8 }} textAlign="center">
                    <Box
                      w="80px"
                      h="80px"
                      borderRadius="full"
                      bg={executionResults.every(r => r.success) ? 'green.500' : 'yellow.500'}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      mx="auto"
                      mb={4}
                    >
                      {executionResults.every(r => r.success) ? (
                        <Box transform="scale(2)"><CheckIcon /></Box>
                      ) : (
                        <Text fontSize="3xl">⚠️</Text>
                      )}
                    </Box>

                    <Heading size="lg" color="white" mb={2}>
                      {executionResults.every(r => r.success) ? 'Schema Sync Complete!' : 'Completed with Issues'}
                    </Heading>

                    <HStack justify="center" spacing={4} mb={4}>
                      <Badge colorScheme="green" fontSize="md" px={4} py={2}>
                        {executionResults.filter(r => r.success).length} Successful
                      </Badge>
                      {executionResults.some(r => !r.success) && (
                        <Badge colorScheme="red" fontSize="md" px={4} py={2}>
                          {executionResults.filter(r => !r.success).length} Failed
                        </Badge>
                      )}
                    </HStack>

                    <HStack color="surface.400" spacing={2}>
                      <Text>{sourceConnection?.name}</Text>
                      <ArrowRightIcon />
                      <Text>{targetConnection?.name}</Text>
                    </HStack>
                  </CardBody>
                </Card>

                {/* Results */}
                {executionResults.length > 0 && (
                  <Card bg="surface.800" borderColor="surface.700">
                    <CardBody p={{ base: 4, md: 6 }}>
                      <Heading size="sm" color="white" mb={4}>Execution Details</Heading>
                      <VStack align="stretch" spacing={2} maxH="300px" overflowY="auto">
                        {executionResults.map((result, idx) => (
                          <HStack key={idx} p={2} bg="surface.900" borderRadius="md">
                            <Box color={result.success ? 'green.400' : 'red.400'}>
                              {result.success ? <CheckIcon /> : <XIcon />}
                            </Box>
                            <Code bg="transparent" color={result.success ? 'surface.300' : 'red.300'} fontSize="xs" flex={1} isTruncated>
                              {result.statement}
                            </Code>
                            {result.error && (
                              <Text color="red.400" fontSize="xs">{result.error}</Text>
                            )}
                          </HStack>
                        ))}
                      </VStack>
                    </CardBody>
                  </Card>
                )}

                <HStack spacing={4}>
                  <Button
                    variant="outline"
                    onClick={compareSchemas}
                    isLoading={isComparing}
                    leftIcon={<RefreshIcon />}
                    flex={1}
                  >
                    Verify Sync
                  </Button>
                  <Button colorScheme="teal" onClick={reset} flex={1}>
                    Start New Sync
                  </Button>
                  <Button variant="ghost" onClick={() => router.push('/')} flex={1}>
                    Back to Dashboard
                  </Button>
                </HStack>
              </VStack>
            )}
          </MotionBox>
        )}
      </Container>
    </Box>
  );
}

