'use client';

import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Code,
  useToast,
  Spinner,
  Input,
  Flex,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Collapse,
  Progress,
} from '@chakra-ui/react';
import type { ValidationIssue } from '@/types';

// Icons
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

const ArrowLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const WrenchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

interface SchemaFixWizardProps {
  sourceConnectionId: string;
  targetConnectionId: string;
  targetConnectionName: string;
  targetEnvironment: string;
  tables: string[];
  issues: ValidationIssue[];
  onRevalidate: () => void;
  isRevalidating: boolean;
}

interface MigrationResult {
  statement: string;
  success: boolean;
  error?: string;
  rowsAffected?: number;
}

type WizardStep = 'review' | 'generate' | 'execute' | 'complete';

export default function SchemaFixWizard({
  sourceConnectionId,
  targetConnectionId,
  targetConnectionName,
  targetEnvironment,
  tables,
  issues,
  onRevalidate,
  isRevalidating,
}: SchemaFixWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('review');
  const [migrationScript, setMigrationScript] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [executionResults, setExecutionResults] = useState<MigrationResult[]>([]);
  const [executionSummary, setExecutionSummary] = useState<{ total: number; success: number; failed: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const isProduction = targetEnvironment === 'production';

  // Step 1: Generate migration script
  const generateMigration = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/sync/generate-migration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceConnectionId,
          targetConnectionId,
          tables,
        }),
      });

      const data = await response.json();
      
      if (data.success && data.data?.fullScript) {
        setMigrationScript(data.data.fullScript);
        setCurrentStep('generate');
        toast({
          title: 'Migration script generated',
          status: 'success',
          duration: 2000,
        });
      } else {
        toast({
          title: 'Failed to generate script',
          description: data.error || 'No migration needed or error occurred',
          status: 'warning',
          duration: 4000,
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to generate migration',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Step 2: Execute migration
  const executeMigration = async () => {
    if (isProduction && confirmationInput !== targetConnectionName) {
      toast({
        title: 'Confirmation required',
        description: `Type "${targetConnectionName}" to confirm execution on production`,
        status: 'warning',
        duration: 4000,
      });
      return;
    }

    setIsExecuting(true);
    setCurrentStep('execute');
    
    try {
      const response = await fetch(`/api/connections/${targetConnectionId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql: migrationScript,
          confirmationPhrase: isProduction ? confirmationInput : undefined,
        }),
      });

      const data = await response.json();
      
      if (data.success || data.data) {
        setExecutionResults(data.data?.results || []);
        setExecutionSummary({
          total: data.data?.totalStatements || 0,
          success: data.data?.successfulStatements || 0,
          failed: data.data?.failedStatements || 0,
        });
        setCurrentStep('complete');
        
        if (data.success) {
          toast({
            title: 'Migration completed successfully!',
            description: data.data?.message,
            status: 'success',
            duration: 5000,
          });
        } else {
          toast({
            title: 'Migration completed with errors',
            description: data.data?.message,
            status: 'warning',
            duration: 5000,
          });
        }
      } else {
        toast({
          title: 'Migration failed',
          description: data.error,
          status: 'error',
          duration: 5000,
        });
        setCurrentStep('generate');
      }
    } catch (error) {
      toast({
        title: 'Execution failed',
        status: 'error',
        duration: 3000,
      });
      setCurrentStep('generate');
    } finally {
      setIsExecuting(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(migrationScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copied to clipboard',
      status: 'success',
      duration: 2000,
    });
  };

  const resetWizard = () => {
    setCurrentStep('review');
    setMigrationScript('');
    setExecutionResults([]);
    setExecutionSummary(null);
    setConfirmationInput('');
  };

  return (
    <Box borderWidth="2px" borderColor="red.500" borderRadius="lg" overflow="hidden">
      {/* Header */}
      <Box bg="red.900" p={4}>
        <HStack justify="space-between" align="start">
          <VStack align="start" spacing={1}>
            <HStack>
              <WrenchIcon />
              <Text color="white" fontWeight="bold" fontSize="lg">
                Schema Fix Wizard
              </Text>
            </HStack>
            <Text color="red.200" fontSize="sm">
              {issues.length} critical issue{issues.length !== 1 ? 's' : ''} must be fixed before syncing
            </Text>
          </VStack>
          <HStack>
            {['review', 'generate', 'execute', 'complete'].map((step, idx) => (
              <Box
                key={step}
                w="24px"
                h="24px"
                borderRadius="full"
                bg={
                  currentStep === step ? 'teal.400' :
                  ['review', 'generate', 'execute', 'complete'].indexOf(currentStep) > idx ? 'green.400' :
                  'surface.600'
                }
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="xs"
                fontWeight="bold"
                color="white"
              >
                {['review', 'generate', 'execute', 'complete'].indexOf(currentStep) > idx ? <CheckIcon /> : idx + 1}
              </Box>
            ))}
          </HStack>
        </HStack>
      </Box>

      <Box p={4} bg="surface.900">
        {/* Step 1: Review Issues */}
        {currentStep === 'review' && (
          <VStack align="stretch" spacing={4}>
            <Box>
              <Text color="teal.300" fontWeight="bold" fontSize="sm" mb={3}>
                STEP 1: Review Critical Issues
              </Text>
              <VStack align="start" spacing={2}>
                {issues.map((issue, idx) => (
                  <Box 
                    key={issue.id} 
                    p={3} 
                    bg="red.900" 
                    borderRadius="md" 
                    w="100%" 
                    borderLeftWidth="4px" 
                    borderLeftColor="red.400"
                  >
                    <HStack justify="space-between" mb={1}>
                      <Badge colorScheme="red" fontSize="xs">#{idx + 1}</Badge>
                      <Code fontSize="xs" bg="transparent" color="red.200">
                        {issue.tableName}{issue.columnName && `.${issue.columnName}`}
                      </Code>
                    </HStack>
                    <Text color="white" fontSize="sm" fontWeight="medium">{issue.message}</Text>
                    <Text color="red.300" fontSize="xs" mt={1}>💡 {issue.recommendation}</Text>
                  </Box>
                ))}
              </VStack>
            </Box>

            <Button
              colorScheme="teal"
              size="lg"
              onClick={generateMigration}
              isLoading={isGenerating}
              loadingText="Generating..."
              leftIcon={<WrenchIcon />}
              w="100%"
            >
              Generate Fix Script
            </Button>
          </VStack>
        )}

        {/* Step 2: Review & Execute Migration */}
        {currentStep === 'generate' && (
          <VStack align="stretch" spacing={4}>
            <Box>
              <HStack justify="space-between" mb={3}>
                <Text color="teal.300" fontWeight="bold" fontSize="sm">
                  STEP 2: Review & Execute Migration
                </Text>
                <Button
                  size="xs"
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
                p={3} 
                borderRadius="md" 
                maxH="300px" 
                overflowY="auto"
                fontFamily="mono"
                fontSize="xs"
              >
                <Code 
                  display="block" 
                  whiteSpace="pre-wrap" 
                  bg="transparent" 
                  color="green.300"
                >
                  {migrationScript}
                </Code>
              </Box>
            </Box>

            {/* Production confirmation */}
            {isProduction && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <Box flex={1}>
                  <AlertTitle fontSize="sm">⚠️ Production Database</AlertTitle>
                  <AlertDescription fontSize="xs">
                    <Text mb={2}>Type the connection name to confirm:</Text>
                    <Input
                      size="sm"
                      placeholder={targetConnectionName}
                      value={confirmationInput}
                      onChange={(e) => setConfirmationInput(e.target.value)}
                      bg="surface.800"
                      borderColor={confirmationInput === targetConnectionName ? 'green.500' : 'red.500'}
                    />
                  </AlertDescription>
                </Box>
              </Alert>
            )}

            <HStack spacing={3}>
              <Button
                variant="ghost"
                onClick={resetWizard}
                flex={1}
                leftIcon={<ArrowLeftIcon />}
              >
                Back
              </Button>
              <Button
                colorScheme={isProduction ? 'red' : 'teal'}
                size="lg"
                onClick={executeMigration}
                isDisabled={isProduction && confirmationInput !== targetConnectionName}
                leftIcon={<PlayIcon />}
                flex={2}
              >
                Run Migration on {isProduction ? 'PRODUCTION' : 'Target'}
              </Button>
            </HStack>

            <Text color="surface.500" fontSize="xs" textAlign="center">
              Or copy the script and run it manually in psql / Supabase SQL Editor
            </Text>
          </VStack>
        )}

        {/* Step 3: Executing */}
        {currentStep === 'execute' && (
          <VStack spacing={6} py={8}>
            <Spinner size="xl" color="teal.400" thickness="4px" />
            <VStack spacing={2}>
              <Text color="white" fontWeight="bold">Executing Migration...</Text>
              <Text color="surface.400" fontSize="sm">Please wait while the SQL is being executed</Text>
            </VStack>
            <Progress size="xs" isIndeterminate w="200px" colorScheme="teal" />
          </VStack>
        )}

        {/* Step 4: Complete */}
        {currentStep === 'complete' && executionSummary && (
          <VStack align="stretch" spacing={4}>
            <Box textAlign="center" py={4}>
              <Box
                w="60px"
                h="60px"
                borderRadius="full"
                bg={executionSummary.failed === 0 ? 'green.500' : 'yellow.500'}
                display="flex"
                alignItems="center"
                justifyContent="center"
                mx="auto"
                mb={3}
              >
                {executionSummary.failed === 0 ? (
                  <CheckIcon />
                ) : (
                  <Text fontSize="xl">⚠️</Text>
                )}
              </Box>
              <Text color="white" fontWeight="bold" fontSize="lg">
                {executionSummary.failed === 0 ? 'Migration Complete!' : 'Migration Completed with Issues'}
              </Text>
              <HStack justify="center" spacing={4} mt={2}>
                <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
                  {executionSummary.success} Successful
                </Badge>
                {executionSummary.failed > 0 && (
                  <Badge colorScheme="red" fontSize="sm" px={3} py={1}>
                    {executionSummary.failed} Failed
                  </Badge>
                )}
              </HStack>
            </Box>

            {/* Results Details */}
            {executionResults.length > 0 && (
              <Box maxH="200px" overflowY="auto" bg="surface.800" borderRadius="md" p={3}>
                <VStack align="stretch" spacing={2}>
                  {executionResults.map((result, idx) => (
                    <HStack key={idx} spacing={2} fontSize="xs">
                      <Box color={result.success ? 'green.400' : 'red.400'}>
                        {result.success ? <CheckIcon /> : <XIcon />}
                      </Box>
                      <Code 
                        bg="transparent" 
                        color={result.success ? 'surface.300' : 'red.300'}
                        fontSize="xs"
                        flex={1}
                        isTruncated
                      >
                        {result.statement}
                      </Code>
                      {result.error && (
                        <Text color="red.400" fontSize="xs">{result.error}</Text>
                      )}
                    </HStack>
                  ))}
                </VStack>
              </Box>
            )}

            <Divider borderColor="surface.700" />

            <Button
              colorScheme="teal"
              size="lg"
              onClick={onRevalidate}
              isLoading={isRevalidating}
              loadingText="Validating..."
              leftIcon={<RefreshIcon />}
              w="100%"
            >
              Re-validate Schema
            </Button>

            <Text color="surface.500" fontSize="xs" textAlign="center">
              Re-validate to confirm all issues are resolved and continue with sync
            </Text>
          </VStack>
        )}
      </Box>
    </Box>
  );
}

