'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Code,
  useToast,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Tooltip,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Flex,
} from '@chakra-ui/react';

// Icons
const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="9 12 12 15 16 10"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const WrenchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

interface MigrationScript {
  tableName: string;
  description: string;
  sql: string;
  isDestructive: boolean;
  severity: 'safe' | 'caution' | 'dangerous';
}

interface MigrationPlan {
  scripts: MigrationScript[];
  summary: {
    totalScripts: number;
    safeScripts: number;
    cautionScripts: number;
    dangerousScripts: number;
  };
  fullScript: string;
  rollbackScript: string;
}

interface MigrationScriptViewerProps {
  sourceConnectionId: string;
  targetConnectionId: string;
  tables: string[];
  isOpen: boolean;
  onClose: () => void;
}

export default function MigrationScriptViewer({
  sourceConnectionId,
  targetConnectionId,
  tables,
}: MigrationScriptViewerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [migrationPlan, setMigrationPlan] = useState<MigrationPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState<string | null>(null);
  const toast = useToast();

  const generateMigration = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/sync/generate-migration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceConnectionId,
          targetConnectionId,
          tables,
          direction: 'source_to_target',
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMigrationPlan(data.data.migrationPlan);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to generate migration scripts');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, scriptId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedScript(scriptId);
      toast({
        title: 'Copied to clipboard',
        status: 'success',
        duration: 2000,
      });
      setTimeout(() => setCopiedScript(null), 2000);
    } catch {
      toast({
        title: 'Failed to copy',
        status: 'error',
        duration: 2000,
      });
    }
  };

  const downloadScript = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Downloaded',
      description: filename,
      status: 'success',
      duration: 2000,
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'safe': return 'green';
      case 'caution': return 'yellow';
      case 'dangerous': return 'red';
      default: return 'gray';
    }
  };

  if (!migrationPlan && !isLoading && !error) {
    return (
      <Box p={4} bg="surface.900" borderRadius="md">
        <VStack spacing={4} align="stretch">
          <HStack>
            <Box color="brand.400">
              <WrenchIcon />
            </Box>
            <Text color="white" fontWeight="bold">Schema Migration Generator</Text>
          </HStack>
          <Text color="surface.400" fontSize="sm">
            Generate SQL scripts to fix schema differences between your databases.
            The generated scripts use safe, idempotent patterns (IF EXISTS, IF NOT EXISTS).
          </Text>
          <Button
            colorScheme="teal"
            onClick={generateMigration}
            isLoading={isLoading}
            loadingText="Generating..."
          >
            Generate Migration Scripts
          </Button>
        </VStack>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box p={4} bg="surface.900" borderRadius="md">
        <Flex justify="center" align="center" py={8}>
          <VStack spacing={4}>
            <Spinner size="lg" color="brand.400" />
            <Text color="surface.400">Generating migration scripts...</Text>
          </VStack>
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} bg="surface.900" borderRadius="md">
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertTitle>Generation Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button mt={4} onClick={generateMigration}>
          Try Again
        </Button>
      </Box>
    );
  }

  if (!migrationPlan) return null;

  return (
    <Box bg="surface.900" borderRadius="md" overflow="hidden">
      {/* Header */}
      <Box p={4} borderBottomWidth="1px" borderColor="surface.700">
        <HStack justify="space-between">
          <VStack align="start" spacing={1}>
            <HStack>
              <Box color="brand.400">
                <WrenchIcon />
              </Box>
              <Text color="white" fontWeight="bold">Migration Scripts Generated</Text>
            </HStack>
            <HStack spacing={2}>
              <Badge colorScheme="green">{migrationPlan.summary.safeScripts} Safe</Badge>
              {migrationPlan.summary.cautionScripts > 0 && (
                <Badge colorScheme="yellow">{migrationPlan.summary.cautionScripts} Caution</Badge>
              )}
              {migrationPlan.summary.dangerousScripts > 0 && (
                <Badge colorScheme="red">{migrationPlan.summary.dangerousScripts} Dangerous</Badge>
              )}
            </HStack>
          </VStack>
          <Button size="sm" variant="ghost" onClick={generateMigration}>
            Regenerate
          </Button>
        </HStack>
      </Box>

      {/* Warnings */}
      {migrationPlan.summary.dangerousScripts > 0 && (
        <Alert status="error" borderRadius="0">
          <AlertIcon />
          <Box>
            <AlertTitle fontSize="sm">Dangerous Operations Detected</AlertTitle>
            <AlertDescription fontSize="xs">
              Some scripts may cause data loss. Review carefully and backup before running.
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs colorScheme="teal" variant="enclosed-colored" size={{ base: 'sm', md: 'md' }}>
        <TabList px={{ base: 2, md: 4 }} pt={2} bg="surface.800" overflowX="auto" flexWrap={{ base: 'nowrap', md: 'wrap' }}>
          <Tab fontSize={{ base: 'xs', md: 'sm' }} whiteSpace="nowrap">Full</Tab>
          <Tab fontSize={{ base: 'xs', md: 'sm' }} whiteSpace="nowrap">Scripts ({migrationPlan.scripts.length})</Tab>
          <Tab fontSize={{ base: 'xs', md: 'sm' }} whiteSpace="nowrap">Rollback</Tab>
        </TabList>

        <TabPanels>
          {/* Full Script Tab */}
          <TabPanel p={0}>
            <Box position="relative">
              <Flex position="absolute" top={2} right={2} zIndex={1} gap={1} flexWrap="wrap" justify="flex-end">
                <Tooltip label="Copy to clipboard">
                  <Button
                    size={{ base: 'xs', md: 'sm' }}
                    leftIcon={copiedScript === 'full' ? <CheckCircleIcon /> : <CopyIcon />}
                    onClick={() => copyToClipboard(migrationPlan.fullScript, 'full')}
                    colorScheme={copiedScript === 'full' ? 'green' : 'gray'}
                  >
                    {copiedScript === 'full' ? 'Copied' : 'Copy'}
                  </Button>
                </Tooltip>
                <Tooltip label="Download .sql file">
                  <Button
                    size={{ base: 'xs', md: 'sm' }}
                    leftIcon={<DownloadIcon />}
                    onClick={() => downloadScript(
                      migrationPlan.fullScript, 
                      `migration_${new Date().toISOString().split('T')[0]}.sql`
                    )}
                  >
                    Download
                  </Button>
                </Tooltip>
              </Flex>
              <Box 
                p={4} 
                pt={12}
                maxH="400px" 
                overflowY="auto"
                bg="gray.900"
                fontFamily="mono"
                fontSize="xs"
              >
                <Code 
                  display="block" 
                  whiteSpace="pre-wrap" 
                  bg="transparent" 
                  color="green.300"
                  p={0}
                >
                  {migrationPlan.fullScript}
                </Code>
              </Box>
            </Box>
          </TabPanel>

          {/* Individual Scripts Tab */}
          <TabPanel p={0}>
            <Accordion allowMultiple>
              {migrationPlan.scripts.map((script, index) => (
                <AccordionItem key={index} border="none">
                  <AccordionButton 
                    py={3} 
                    px={4}
                    _hover={{ bg: 'surface.700' }}
                  >
                    <HStack flex={1} justify="space-between">
                      <HStack>
                        <Badge colorScheme={getSeverityColor(script.severity)} fontSize="xs">
                          {script.severity}
                        </Badge>
                        <Text color="white" fontSize="sm" fontFamily="mono">
                          {script.tableName}
                        </Text>
                      </HStack>
                      <Text color="surface.400" fontSize="xs" noOfLines={1} maxW="300px">
                        {script.description}
                      </Text>
                    </HStack>
                    <AccordionIcon color="surface.400" ml={2} />
                  </AccordionButton>
                  <AccordionPanel pb={4} bg="gray.900">
                    <Box position="relative">
                      <Tooltip label="Copy script">
                        <Button
                          size="xs"
                          position="absolute"
                          top={2}
                          right={2}
                          leftIcon={copiedScript === `script-${index}` ? <CheckCircleIcon /> : <CopyIcon />}
                          onClick={() => copyToClipboard(script.sql, `script-${index}`)}
                          colorScheme={copiedScript === `script-${index}` ? 'green' : 'gray'}
                        >
                          {copiedScript === `script-${index}` ? 'Copied' : 'Copy'}
                        </Button>
                      </Tooltip>
                      <Code 
                        display="block" 
                        whiteSpace="pre-wrap" 
                        bg="transparent" 
                        color="green.300"
                        fontSize="xs"
                        p={2}
                        pt={8}
                      >
                        {script.sql}
                      </Code>
                    </Box>
                    {script.isDestructive && (
                      <Alert status="warning" mt={2} size="sm" borderRadius="md">
                        <AlertIcon boxSize={4} />
                        <Text fontSize="xs">This operation may cause data loss</Text>
                      </Alert>
                    )}
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
            {migrationPlan.scripts.length === 0 && (
              <Box p={8} textAlign="center">
                <Text color="surface.400">No migration scripts needed</Text>
              </Box>
            )}
          </TabPanel>

          {/* Rollback Tab */}
          <TabPanel p={0}>
            <Box position="relative">
              <HStack position="absolute" top={2} right={2} zIndex={1}>
                <Tooltip label="Copy to clipboard">
                  <Button
                    size="sm"
                    leftIcon={copiedScript === 'rollback' ? <CheckCircleIcon /> : <CopyIcon />}
                    onClick={() => copyToClipboard(migrationPlan.rollbackScript, 'rollback')}
                    colorScheme={copiedScript === 'rollback' ? 'green' : 'gray'}
                  >
                    {copiedScript === 'rollback' ? 'Copied' : 'Copy'}
                  </Button>
                </Tooltip>
                <Tooltip label="Download .sql file">
                  <Button
                    size="sm"
                    leftIcon={<DownloadIcon />}
                    onClick={() => downloadScript(
                      migrationPlan.rollbackScript, 
                      `rollback_${new Date().toISOString().split('T')[0]}.sql`
                    )}
                  >
                    Download
                  </Button>
                </Tooltip>
              </HStack>
              <Box 
                p={4} 
                pt={12}
                maxH="400px" 
                overflowY="auto"
                bg="gray.900"
                fontFamily="mono"
                fontSize="xs"
              >
                <Code 
                  display="block" 
                  whiteSpace="pre-wrap" 
                  bg="transparent" 
                  color="orange.300"
                  p={0}
                >
                  {migrationPlan.rollbackScript}
                </Code>
              </Box>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

