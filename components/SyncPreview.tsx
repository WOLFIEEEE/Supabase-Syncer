'use client';

import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Progress,
  Divider,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Code,
} from '@chakra-ui/react';

// Icons
const TableIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <line x1="3" y1="9" x2="21" y2="9"/>
    <line x1="3" y1="15" x2="21" y2="15"/>
    <line x1="9" y1="9" x2="9" y2="21"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const AlertTriangleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

interface TableDiff {
  tableName: string;
  inserts: number;
  updates: number;
  sourceRowCount: number;
  targetRowCount: number;
}

interface SchemaIssue {
  tableName: string;
  missingInTarget: boolean;
  missingInSource: boolean;
  columnDifferences: Array<{
    columnName: string;
    sourceType: string | null;
    targetType: string | null;
    issue: string;
  }>;
}

interface SyncPreviewProps {
  tables: TableDiff[];
  schemaIssues: SchemaIssue[];
  totalInserts: number;
  totalUpdates: number;
  estimatedDuration: number;
  warnings: string[];
  sourceConnection: string;
  targetConnection: string;
  targetEnvironment: 'production' | 'development';
}

export function SyncPreview({
  tables,
  schemaIssues,
  totalInserts,
  totalUpdates,
  estimatedDuration,
  warnings,
  sourceConnection,
  targetConnection,
  targetEnvironment,
}: SyncPreviewProps) {
  const totalRows = totalInserts + totalUpdates;
  const hasSchemaIssues = schemaIssues.length > 0;
  const isProduction = targetEnvironment === 'production';
  
  // Format duration
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.ceil(seconds / 60)} minutes`;
    return `${(seconds / 3600).toFixed(1)} hours`;
  };
  
  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Card bg="surface.800" borderColor="surface.700">
        <CardHeader pb={2}>
          <Heading size="md" color="white">Sync Preview</Heading>
        </CardHeader>
        <CardBody>
          <HStack spacing={4} flexWrap="wrap" justify="center">
            <VStack spacing={0}>
              <Text color="surface.400" fontSize="sm">Source</Text>
              <Badge colorScheme="blue" fontSize="sm">{sourceConnection}</Badge>
            </VStack>
            <Box color="surface.500">
              <ArrowRightIcon />
            </Box>
            <VStack spacing={0}>
              <Text color="surface.400" fontSize="sm">Target</Text>
              <Badge 
                colorScheme={isProduction ? 'red' : 'green'} 
                fontSize="sm"
              >
                {targetConnection}
                {isProduction && ' (PROD)'}
              </Badge>
            </VStack>
          </HStack>
        </CardBody>
      </Card>
      
      {/* Production Warning */}
      {isProduction && (
        <Alert status="warning" bg="orange.900" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Production Database</AlertTitle>
            <AlertDescription>
              You are about to sync data to a production database. This operation cannot be undone.
              Please review all changes carefully before proceeding.
            </AlertDescription>
          </Box>
        </Alert>
      )}
      
      {/* Warnings */}
      {warnings.length > 0 && (
        <Card bg="surface.800" borderColor="yellow.700">
          <CardBody>
            <VStack align="stretch" spacing={2}>
              <HStack color="yellow.400">
                <AlertTriangleIcon />
                <Text fontWeight="bold">Warnings</Text>
              </HStack>
              {warnings.map((warning, idx) => (
                <Text key={idx} color="surface.400" fontSize="sm" pl={6}>
                  {warning}
                </Text>
              ))}
            </VStack>
          </CardBody>
        </Card>
      )}
      
      {/* Summary Stats */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <Card bg="surface.800">
          <CardBody>
            <Stat>
              <StatLabel color="surface.400">Total Rows</StatLabel>
              <StatNumber color="white">{totalRows.toLocaleString()}</StatNumber>
              <StatHelpText color="surface.500">to be processed</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg="surface.800">
          <CardBody>
            <Stat>
              <StatLabel color="surface.400">Inserts</StatLabel>
              <StatNumber color="green.400">{totalInserts.toLocaleString()}</StatNumber>
              <StatHelpText color="surface.500">new rows</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg="surface.800">
          <CardBody>
            <Stat>
              <StatLabel color="surface.400">Updates</StatLabel>
              <StatNumber color="blue.400">{totalUpdates.toLocaleString()}</StatNumber>
              <StatHelpText color="surface.500">modified rows</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg="surface.800">
          <CardBody>
            <Stat>
              <StatLabel color="surface.400">Est. Duration</StatLabel>
              <StatNumber color="white" fontSize="lg">
                <HStack spacing={1}>
                  <ClockIcon />
                  <Text>{formatDuration(estimatedDuration)}</Text>
                </HStack>
              </StatNumber>
              <StatHelpText color="surface.500">~500 rows/sec</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>
      
      {/* Schema Issues */}
      {hasSchemaIssues && (
        <Card bg="surface.800" borderColor="red.700">
          <CardHeader>
            <HStack color="red.400">
              <AlertTriangleIcon />
              <Heading size="sm">Schema Differences ({schemaIssues.length})</Heading>
            </HStack>
          </CardHeader>
          <CardBody pt={0}>
            <Accordion allowMultiple>
              {schemaIssues.map((issue, idx) => (
                <AccordionItem key={idx} border="none">
                  <AccordionButton px={0}>
                    <HStack flex="1">
                      <TableIcon />
                      <Text color="white">{issue.tableName}</Text>
                      {issue.missingInTarget && (
                        <Badge colorScheme="red" size="sm">Missing in target</Badge>
                      )}
                      {issue.missingInSource && (
                        <Badge colorScheme="yellow" size="sm">Missing in source</Badge>
                      )}
                    </HStack>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel>
                    {issue.columnDifferences.length > 0 && (
                      <VStack align="stretch" spacing={1}>
                        {issue.columnDifferences.map((col, colIdx) => (
                          <HStack key={colIdx} fontSize="sm" color="surface.400">
                            <Code size="sm">{col.columnName}</Code>
                            <Text>:</Text>
                            <Text>{col.issue}</Text>
                            {col.sourceType && col.targetType && (
                              <Text>
                                ({col.sourceType} vs {col.targetType})
                              </Text>
                            )}
                          </HStack>
                        ))}
                      </VStack>
                    )}
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
          </CardBody>
        </Card>
      )}
      
      {/* Table Details */}
      <Card bg="surface.800">
        <CardHeader>
          <Heading size="sm" color="white">Tables to Sync ({tables.length})</Heading>
        </CardHeader>
        <CardBody pt={0}>
          <Box overflowX="auto">
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th color="surface.400" borderColor="surface.700">Table</Th>
                  <Th color="surface.400" borderColor="surface.700" isNumeric>Source Rows</Th>
                  <Th color="surface.400" borderColor="surface.700" isNumeric>Target Rows</Th>
                  <Th color="surface.400" borderColor="surface.700" isNumeric>Inserts</Th>
                  <Th color="surface.400" borderColor="surface.700" isNumeric>Updates</Th>
                  <Th color="surface.400" borderColor="surface.700">Impact</Th>
                </Tr>
              </Thead>
              <Tbody>
                {tables.map((table) => {
                  const total = table.inserts + table.updates;
                  const impact = total / (totalRows || 1);
                  
                  return (
                    <Tr key={table.tableName}>
                      <Td borderColor="surface.700">
                        <HStack>
                          <TableIcon />
                          <Text color="white">{table.tableName}</Text>
                        </HStack>
                      </Td>
                      <Td borderColor="surface.700" isNumeric color="surface.300">
                        {table.sourceRowCount.toLocaleString()}
                      </Td>
                      <Td borderColor="surface.700" isNumeric color="surface.300">
                        {table.targetRowCount.toLocaleString()}
                      </Td>
                      <Td borderColor="surface.700" isNumeric>
                        <Badge colorScheme="green" variant="subtle">
                          +{table.inserts.toLocaleString()}
                        </Badge>
                      </Td>
                      <Td borderColor="surface.700" isNumeric>
                        <Badge colorScheme="blue" variant="subtle">
                          {table.updates.toLocaleString()}
                        </Badge>
                      </Td>
                      <Td borderColor="surface.700">
                        <Progress 
                          value={impact * 100} 
                          size="sm" 
                          colorScheme={impact > 0.5 ? 'red' : impact > 0.2 ? 'yellow' : 'green'}
                          bg="surface.700"
                          borderRadius="full"
                          w="60px"
                        />
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
        </CardBody>
      </Card>
      
      {/* Sync Limits Info */}
      <Card bg="surface.800" borderColor="surface.700">
        <CardBody>
          <VStack align="stretch" spacing={2}>
            <Text color="surface.400" fontSize="sm" fontWeight="bold">
              Sync Limits
            </Text>
            <SimpleGrid columns={2} spacing={2} fontSize="sm">
              <Text color="surface.500">Max tables per sync:</Text>
              <Text color="white">50</Text>
              <Text color="surface.500">Max concurrent jobs:</Text>
              <Text color="white">3</Text>
              <Text color="surface.500">Batch size:</Text>
              <Text color="white">1,000 rows</Text>
              <Text color="surface.500">Job timeout:</Text>
              <Text color="white">2 hours</Text>
            </SimpleGrid>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
}

export default SyncPreview;




