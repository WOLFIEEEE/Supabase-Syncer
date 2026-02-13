'use client';

import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Code,
  Divider,
  Flex,
  Grid,
  Heading,
  HStack,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  Tabs,
  VStack,
} from '@chakra-ui/react';
import type { Connection, SchemaData } from './types';
import {
  ActivityIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  DatabaseIcon,
  HeartFilledIcon,
  HeartIcon,
  InfoIcon,
  KeyIcon,
  LinkIcon,
  RefreshIcon,
  TableIcon,
  XCircleIcon,
} from './icons';

interface KeepAliveStatus {
  keepAlive: boolean;
  lastPingedAt: string | null;
}

interface SchemaInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedConnection: Connection | null;
  schemaData: SchemaData | null;
  isLoadingSchema: boolean;
  selectedTable: string | null;
  keepAliveStatus: KeepAliveStatus | null;
  isTogglingKeepAlive: boolean;
  isPinging: boolean;
  onSelectTable: (tableName: string) => void;
  onToggleKeepAlive: () => void;
  onManualPing: () => void;
  onRefreshSchema: () => void;
  formatLastPinged: (timestamp: string | null) => string;
}

export default function SchemaInspectorModal({
  isOpen,
  onClose,
  selectedConnection,
  schemaData,
  isLoadingSchema,
  selectedTable,
  keepAliveStatus,
  isTogglingKeepAlive,
  isPinging,
  onSelectTable,
  onToggleKeepAlive,
  onManualPing,
  onRefreshSchema,
  formatLastPinged,
}: SchemaInspectorModalProps) {
  const selectedTableInfo = schemaData?.tables.find((table) => table.name === selectedTable) || null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: 'full', md: '6xl' }} scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
      <ModalContent bg="bg.elevated" borderColor="border.default" maxH="90vh" mx={{ base: 0, md: 4 }} my={{ base: 0, md: 'auto' }}>
        <ModalHeader color="text.primary" pb={2}>
          <HStack spacing={3}>
            <Box p={2} borderRadius="md" bg={selectedConnection?.environment === 'production' ? 'rgba(230, 51, 51, 0.2)' : 'rgba(23, 177, 110, 0.2)'}>
              <DatabaseIcon />
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontSize={{ base: 'md', md: 'lg' }}>{selectedConnection?.name}</Text>
              <Text fontSize="xs" color="text.tertiary" fontWeight="normal">
                Schema Inspector
              </Text>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody pb={6}>
          {isLoadingSchema ? (
            <Flex justify="center" align="center" py={16}>
              <VStack spacing={4}>
                <Spinner size="xl" color="accent.primary" />
                <Text color="text.secondary">Loading schema...</Text>
              </VStack>
            </Flex>
          ) : schemaData ? (
            <VStack spacing={6} align="stretch">
              <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }} gap={4}>
                <Card>
                  <CardBody p={4}>
                    <Stat>
                      <StatLabel color="text.tertiary" fontSize="xs">
                        Tables
                      </StatLabel>
                      <StatNumber color="text.primary" fontSize={{ base: 'xl', md: '2xl' }}>
                        {schemaData.totalTables}
                      </StatNumber>
                      <StatHelpText color="text.tertiary" fontSize="xs">
                        syncable tables
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody p={4}>
                    <Stat>
                      <StatLabel color="text.tertiary" fontSize="xs">
                        Total Rows
                      </StatLabel>
                      <StatNumber color="text.primary" fontSize={{ base: 'xl', md: '2xl' }}>
                        {schemaData.totalRows.toLocaleString()}
                      </StatNumber>
                      <StatHelpText color="text.tertiary" fontSize="xs">
                        across all tables
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
                <Card display={{ base: 'none', md: 'block' }}>
                  <CardBody p={4}>
                    <Stat>
                      <StatLabel color="text.tertiary" fontSize="xs">
                        Environment
                      </StatLabel>
                      <StatNumber fontSize={{ base: 'xl', md: '2xl' }}>
                        <Badge colorScheme={selectedConnection?.environment === 'production' ? 'red' : 'green'} fontSize="md" px={3} py={1}>
                          {selectedConnection?.environment?.toUpperCase()}
                        </Badge>
                      </StatNumber>
                      <StatHelpText color="text.tertiary" fontSize="xs">
                        database type
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </Grid>

              <Card borderWidth="1px">
                <CardBody p={4}>
                  <Flex justify="space-between" align={{ base: 'flex-start', sm: 'center' }} direction={{ base: 'column', sm: 'row' }} gap={3}>
                    <HStack spacing={3} flex={1}>
                      <Box p={2} borderRadius="md" bg={keepAliveStatus?.keepAlive ? 'rgba(23, 177, 110, 0.22)' : 'bg.surface'} color={keepAliveStatus?.keepAlive ? 'success.400' : 'text.tertiary'}>
                        {keepAliveStatus?.keepAlive ? <HeartFilledIcon /> : <HeartIcon />}
                      </Box>
                      <VStack align="start" spacing={0}>
                        <Text color="text.primary" fontWeight="semibold" fontSize="sm">
                          Keep Database Active
                        </Text>
                        <Text color="text.secondary" fontSize="xs">
                          {keepAliveStatus?.keepAlive
                            ? 'Pings daily to prevent Supabase from pausing your database'
                            : 'Enable to prevent Supabase free tier from pausing inactive databases'}
                        </Text>
                      </VStack>
                    </HStack>

                    <HStack spacing={2}>
                      {keepAliveStatus?.keepAlive && (
                        <VStack align="end" spacing={0} mr={2}>
                          <Text color="text.tertiary" fontSize="xs">
                            Last Pinged
                          </Text>
                          <Text color="text.secondary" fontSize="xs" fontWeight="medium">
                            {formatLastPinged(keepAliveStatus.lastPingedAt)}
                          </Text>
                        </VStack>
                      )}

                      <Tooltip label="Ping database now" hasArrow>
                        <IconButton
                          aria-label="Ping database"
                          icon={isPinging ? <Spinner size="sm" /> : <ActivityIcon />}
                          size="sm"
                          variant="outline"
                          colorScheme="teal"
                          onClick={onManualPing}
                          isLoading={isPinging}
                          isDisabled={!keepAliveStatus}
                        />
                      </Tooltip>

                      <Button
                        size="sm"
                        colorScheme={keepAliveStatus?.keepAlive ? 'gray' : 'green'}
                        variant={keepAliveStatus?.keepAlive ? 'outline' : 'solid'}
                        onClick={onToggleKeepAlive}
                        isLoading={isTogglingKeepAlive}
                        isDisabled={!keepAliveStatus}
                        leftIcon={keepAliveStatus?.keepAlive ? <XCircleIcon /> : <HeartFilledIcon />}
                      >
                        {keepAliveStatus?.keepAlive ? 'Disable' : 'Enable'}
                      </Button>
                    </HStack>
                  </Flex>

                  {keepAliveStatus?.keepAlive && (
                    <Box mt={3} pt={3} borderTopWidth="1px" borderColor="border.default">
                      <HStack spacing={2} flexWrap="wrap">
                        <Badge colorScheme="green" variant="subtle">
                          <HStack spacing={1}>
                            <CheckCircleIcon />
                            <Text>Auto-ping enabled</Text>
                          </HStack>
                        </Badge>
                        <Badge colorScheme="blue" variant="subtle">
                          Daily at midnight UTC
                        </Badge>
                        <Badge colorScheme="purple" variant="subtle">
                          Via Vercel Cron
                        </Badge>
                      </HStack>
                    </Box>
                  )}

                  <Accordion allowToggle mt={4}>
                    <AccordionItem border="none">
                      <AccordionButton px={0} py={2} _hover={{ bg: 'transparent' }} color="text.secondary" fontSize="sm">
                        <HStack spacing={2} flex={1}>
                          <InfoIcon />
                          <Text>Learn how Keep-Alive works</Text>
                        </HStack>
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel px={0} pb={4}>
                        <VStack align="stretch" spacing={4} bg="bg.surface" p={4} borderRadius="md" fontSize="sm">
                          <Box>
                            <Text color="accent.primary" fontWeight="semibold" mb={1}>
                              What is Keep-Alive?
                            </Text>
                            <Text color="text.secondary" lineHeight="tall">
                              Supabase automatically pauses free-tier databases after one week of inactivity. Keep-Alive prevents this by running a lightweight health check query so your database stays active and responsive.
                            </Text>
                          </Box>

                          <Box>
                            <Text color="accent.primary" fontWeight="semibold" mb={1}>
                              How it operates
                            </Text>
                            <VStack align="stretch" spacing={1} color="text.secondary" pl={2}>
                              <Text>• A Vercel Cron job executes daily at midnight UTC.</Text>
                              <Text>• The service finds all connections with Keep-Alive enabled.</Text>
                              <Text>• It executes a lightweight <Code fontSize="xs">SELECT 1</Code> health query.</Text>
                              <Text>• Results are logged with status and timestamps for visibility.</Text>
                            </VStack>
                          </Box>
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                </CardBody>
              </Card>

              <Divider borderColor="border.default" />

              <Flex direction={{ base: 'column', lg: 'row' }} gap={4}>
                <Box w={{ base: '100%', lg: '280px' }} flexShrink={0} bg="bg.surface" borderRadius="md" p={3} maxH={{ base: '200px', lg: '500px' }} overflowY="auto">
                  <Text color="text.tertiary" fontSize="xs" fontWeight="bold" mb={2} px={2}>
                    TABLES ({schemaData.tables.length})
                  </Text>
                  <VStack spacing={1} align="stretch">
                    {schemaData.tables.map((table) => (
                      <Button
                        key={table.name}
                        variant={selectedTable === table.name ? 'solid' : 'ghost'}
                        colorScheme={selectedTable === table.name ? 'teal' : 'gray'}
                        size="sm"
                        justifyContent="space-between"
                        onClick={() => onSelectTable(table.name)}
                        px={3}
                      >
                        <HStack spacing={2} flex={1} minW={0}>
                          <TableIcon />
                          <Text isTruncated fontSize="sm">
                            {table.name}
                          </Text>
                        </HStack>
                        <Badge colorScheme="gray" fontSize="xs" ml={2}>
                          {table.rowCount.toLocaleString()}
                        </Badge>
                      </Button>
                    ))}
                  </VStack>
                </Box>

                <Box flex={1} minW={0}>
                  {selectedTableInfo ? (
                    <VStack spacing={4} align="stretch">
                      <HStack justify="space-between" flexWrap="wrap" gap={2}>
                        <HStack spacing={2}>
                          <TableIcon />
                          <Heading size="sm" color="text.primary">
                            {selectedTableInfo.name}
                          </Heading>
                        </HStack>
                        <HStack spacing={2} flexWrap="wrap">
                          <Badge colorScheme="blue">{selectedTableInfo.columns.length} columns</Badge>
                          <Badge colorScheme="purple">{selectedTableInfo.rowCount.toLocaleString()} rows</Badge>
                        </HStack>
                      </HStack>

                      <Tabs colorScheme="teal" size="sm">
                        <TabList overflowX="auto" flexWrap="nowrap">
                          <Tab fontSize={{ base: 'xs', md: 'sm' }}>Columns</Tab>
                          <Tab fontSize={{ base: 'xs', md: 'sm' }}>Keys & Indexes</Tab>
                        </TabList>

                        <TabPanels>
                          <TabPanel px={0}>
                            <Box overflowX="auto" className="responsive-table" style={{ WebkitOverflowScrolling: 'touch' }}>
                              <Table size="sm" variant="simple" minW="100%">
                                <Thead>
                                  <Tr>
                                    <Th>Column</Th>
                                    <Th>Type</Th>
                                    <Th display={{ base: 'none', md: 'table-cell' }}>Nullable</Th>
                                    <Th display={{ base: 'none', lg: 'table-cell' }}>Default</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {selectedTableInfo.columns.map((column) => (
                                    <Tr key={column.name}>
                                      <Td>
                                        <HStack spacing={2}>
                                          {column.isPrimaryKey && (
                                            <Tooltip label="Primary Key" hasArrow>
                                              <Box color="yellow.400">
                                                <KeyIcon />
                                              </Box>
                                            </Tooltip>
                                          )}
                                          {column.isForeignKey && (
                                            <Tooltip label={`FK: ${column.foreignKeyRef}`} hasArrow>
                                              <Box color="blue.400">
                                                <LinkIcon />
                                              </Box>
                                            </Tooltip>
                                          )}
                                          <Code bg="transparent" color="text.primary" fontSize={{ base: 'xs', md: 'sm' }}>
                                            {column.name}
                                          </Code>
                                        </HStack>
                                      </Td>
                                      <Td>
                                        <Code colorScheme="teal" fontSize={{ base: 'xs', md: 'sm' }}>
                                          {column.type}
                                        </Code>
                                      </Td>
                                      <Td display={{ base: 'none', md: 'table-cell' }}>
                                        <Badge colorScheme={column.nullable ? 'gray' : 'orange'} fontSize="xs">
                                          {column.nullable ? 'NULL' : 'NOT NULL'}
                                        </Badge>
                                      </Td>
                                      <Td display={{ base: 'none', lg: 'table-cell' }}>
                                        {column.defaultValue ? (
                                          <Code fontSize="xs" bg="bg.surface" color="text.secondary">
                                            {column.defaultValue.length > 30 ? `${column.defaultValue.substring(0, 30)}...` : column.defaultValue}
                                          </Code>
                                        ) : (
                                          <Text color="text.tertiary" fontSize="xs">
                                            N/A
                                          </Text>
                                        )}
                                      </Td>
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                            </Box>
                          </TabPanel>

                          <TabPanel px={0}>
                            <VStack spacing={4} align="stretch">
                              <Box>
                                <Text color="text.tertiary" fontSize="xs" fontWeight="bold" mb={2}>
                                  PRIMARY KEYS
                                </Text>
                                <HStack spacing={2} flexWrap="wrap">
                                  {selectedTableInfo.primaryKeys.map((pk) => (
                                    <Badge key={pk} colorScheme="yellow" variant="subtle" px={2} py={1}>
                                      <HStack spacing={1}>
                                        <KeyIcon />
                                        <Text>{pk}</Text>
                                      </HStack>
                                    </Badge>
                                  ))}
                                  {selectedTableInfo.primaryKeys.length === 0 && <Text color="text.tertiary" fontSize="sm">No primary keys</Text>}
                                </HStack>
                              </Box>

                              <Box>
                                <Text color="text.tertiary" fontSize="xs" fontWeight="bold" mb={2}>
                                  FOREIGN KEYS
                                </Text>
                                {selectedTableInfo.foreignKeys.length > 0 ? (
                                  <VStack spacing={2} align="stretch">
                                    {selectedTableInfo.foreignKeys.map((foreignKey, index) => (
                                      <HStack key={`${foreignKey.column}-${index}`} spacing={2} flexWrap="wrap">
                                        <Badge colorScheme="blue" variant="subtle" px={2} py={1}>
                                          <HStack spacing={1}>
                                            <LinkIcon />
                                            <Text>{foreignKey.column}</Text>
                                          </HStack>
                                        </Badge>
                                        <Box color="text.tertiary">
                                          <ArrowRightIcon />
                                        </Box>
                                        <Code fontSize="xs" bg="bg.surface" color="text.secondary" px={2} py={1}>
                                          {foreignKey.references}
                                        </Code>
                                      </HStack>
                                    ))}
                                  </VStack>
                                ) : (
                                  <Text color="text.tertiary" fontSize="sm">
                                    No foreign keys
                                  </Text>
                                )}
                              </Box>

                              <Box>
                                <Text color="text.tertiary" fontSize="xs" fontWeight="bold" mb={2}>
                                  INDEXES
                                </Text>
                                {selectedTableInfo.indexes.length > 0 ? (
                                  <VStack spacing={1} align="stretch">
                                    {selectedTableInfo.indexes.map((indexName) => (
                                      <Code key={indexName} fontSize="xs" bg="bg.surface" color="text.secondary" p={2} borderRadius="md">
                                        {indexName}
                                      </Code>
                                    ))}
                                  </VStack>
                                ) : (
                                  <Text color="text.tertiary" fontSize="sm">
                                    No indexes
                                  </Text>
                                )}
                              </Box>
                            </VStack>
                          </TabPanel>
                        </TabPanels>
                      </Tabs>
                    </VStack>
                  ) : (
                    <Flex justify="center" align="center" py={12}>
                      <Text color="text.secondary">Select a table to view details</Text>
                    </Flex>
                  )}
                </Box>
              </Flex>
            </VStack>
          ) : (
            <Flex justify="center" align="center" py={12}>
              <Text color="text.secondary">No schema data available</Text>
            </Flex>
          )}
        </ModalBody>

        <ModalFooter borderTopWidth="1px" borderColor="border.default">
          <HStack spacing={3}>
            <Button leftIcon={<RefreshIcon />} variant="ghost" onClick={onRefreshSchema} isLoading={isLoadingSchema} size={{ base: 'sm', md: 'md' }}>
              Refresh
            </Button>
            <Button onClick={onClose} size={{ base: 'sm', md: 'md' }}>
              Close
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
