'use client';

import { useState } from 'react';
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
  Code,
  Divider,
  Flex,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  Badge,
  OrderedList,
  ListItem,
  UnorderedList,
  Alert,
  AlertIcon,
  SimpleGrid,
} from '@chakra-ui/react';

// Icons
const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const sections = [
  { id: 'getting-started', title: 'Getting Started', icon: '🚀' },
  { id: 'installation', title: 'Installation', icon: '📦' },
  { id: 'configuration', title: 'Configuration', icon: '⚙️' },
  { id: 'connections', title: 'Managing Connections', icon: '🔗' },
  { id: 'schema-sync', title: 'Schema Sync', icon: '📋' },
  { id: 'data-sync', title: 'Data Sync', icon: '🔄' },
  { id: 'safety', title: 'Safety Features', icon: '🛡️' },
  { id: 'troubleshooting', title: 'Troubleshooting', icon: '🔧' },
  { id: 'api-reference', title: 'API Reference', icon: '📡' },
];

export default function GuidePage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('getting-started');
  const { isOpen, onOpen, onClose } = useDisclosure();

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    onClose();
  };

  const Sidebar = () => (
    <VStack align="stretch" spacing={1} py={4}>
      <Button
        variant="ghost"
        justifyContent="flex-start"
        leftIcon={<HomeIcon />}
        color="surface.400"
        size="sm"
        onClick={() => router.push('/landing')}
        mb={4}
      >
        Back to Home
      </Button>
      
      <Text color="surface.500" fontSize="xs" fontWeight="bold" px={3} mb={2}>
        DOCUMENTATION
      </Text>
      
      {sections.map((section) => (
        <Button
          key={section.id}
          variant="ghost"
          justifyContent="flex-start"
          size="sm"
          color={activeSection === section.id ? 'brand.400' : 'surface.300'}
          bg={activeSection === section.id ? 'surface.700' : 'transparent'}
          onClick={() => scrollToSection(section.id)}
          leftIcon={<Text>{section.icon}</Text>}
          _hover={{ bg: 'surface.700' }}
        >
          {section.title}
        </Button>
      ))}
    </VStack>
  );

  return (
    <Box minH="100vh">
      {/* Mobile Header */}
      <Box
        display={{ base: 'block', lg: 'none' }}
        position="sticky"
        top={0}
        bg="surface.800"
        borderBottomWidth="1px"
        borderColor="surface.700"
        zIndex={10}
      >
        <Container maxW="full" py={3}>
          <Flex justify="space-between" align="center">
            <Heading size="sm" color="white" fontFamily="mono">
              📚 Documentation
            </Heading>
            <IconButton
              aria-label="Open menu"
              icon={<MenuIcon />}
              variant="ghost"
              onClick={onOpen}
            />
          </Flex>
        </Container>
      </Box>

      {/* Mobile Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="surface.800">
          <DrawerCloseButton color="white" />
          <DrawerBody>
            <Sidebar />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Flex>
        {/* Desktop Sidebar */}
        <Box
          display={{ base: 'none', lg: 'block' }}
          w="280px"
          minH="100vh"
          bg="surface.800"
          borderRightWidth="1px"
          borderColor="surface.700"
          position="fixed"
          overflowY="auto"
          px={4}
        >
          <Box py={6}>
            <Heading size="md" color="white" fontFamily="mono" mb={6}>
              📚 Documentation
            </Heading>
            <Sidebar />
          </Box>
        </Box>

        {/* Main Content */}
        <Box flex={1} ml={{ base: 0, lg: '280px' }}>
          <Container maxW="4xl" py={{ base: 6, md: 10 }} px={{ base: 4, md: 8 }}>
            <VStack spacing={16} align="stretch">
              
              {/* Getting Started */}
              <Box id="getting-started">
                <Badge colorScheme="teal" mb={4}>QUICK START</Badge>
                <Heading size="xl" color="white" mb={4}>
                  Getting Started
                </Heading>
                <Text color="surface.300" fontSize="lg" mb={6}>
                  Supabase Syncer helps you synchronize database schemas and data between 
                  your Supabase environments (development, staging, production).
                </Text>
                
                <Card bg="surface.800" borderColor="surface.700">
                  <CardBody>
                    <VStack align="stretch" spacing={4}>
                      <Heading size="sm" color="white">What You Can Do:</Heading>
                      <UnorderedList color="surface.300" spacing={2} pl={4}>
                        <ListItem>Compare schemas between databases</ListItem>
                        <ListItem>Generate migration scripts automatically</ListItem>
                        <ListItem>Execute migrations directly from the UI</ListItem>
                        <ListItem>Sync data between environments safely</ListItem>
                        <ListItem>Get warnings about breaking changes</ListItem>
                      </UnorderedList>
                    </VStack>
                  </CardBody>
                </Card>
              </Box>

              <Divider borderColor="surface.700" />

              {/* Installation */}
              <Box id="installation">
                <Badge colorScheme="purple" mb={4}>SETUP</Badge>
                <Heading size="xl" color="white" mb={4}>
                  Installation
                </Heading>
                
                <VStack align="stretch" spacing={6}>
                  <Box>
                    <Heading size="sm" color="white" mb={3}>Step 1: Clone the Repository</Heading>
                    <Code display="block" p={4} bg="gray.900" borderRadius="md" color="green.300">
{`git clone https://github.com/your-repo/supabase-syncer.git
cd supabase-syncer`}
                    </Code>
                  </Box>

                  <Box>
                    <Heading size="sm" color="white" mb={3}>Step 2: Install Dependencies</Heading>
                    <Code display="block" p={4} bg="gray.900" borderRadius="md" color="green.300">
{`npm install
# or
yarn install`}
                    </Code>
                  </Box>

                  <Box>
                    <Heading size="sm" color="white" mb={3}>Step 3: Configure Environment</Heading>
                    <Code display="block" p={4} bg="gray.900" borderRadius="md" color="green.300">
{`cp .env.example .env.local
# Edit .env.local with your settings`}
                    </Code>
                  </Box>

                  <Box>
                    <Heading size="sm" color="white" mb={3}>Step 4: Start the Server</Heading>
                    <Code display="block" p={4} bg="gray.900" borderRadius="md" color="green.300">
{`npm run dev
# Open http://localhost:3000`}
                    </Code>
                  </Box>
                </VStack>
              </Box>

              <Divider borderColor="surface.700" />

              {/* Configuration */}
              <Box id="configuration">
                <Badge colorScheme="orange" mb={4}>REQUIRED</Badge>
                <Heading size="xl" color="white" mb={4}>
                  Configuration
                </Heading>
                
                <Text color="surface.300" mb={6}>
                  Create a <Code>.env.local</Code> file with the following variables:
                </Text>

                <Card bg="gray.900" borderColor="surface.700" mb={6}>
                  <CardBody>
                    <Code display="block" whiteSpace="pre-wrap" bg="transparent" color="green.300">
{`# Required: 32-character encryption key for storing database URLs
ENCRYPTION_KEY=your_32_character_secret_key_here

# Required: Session secret (minimum 32 characters)
SESSION_SECRET=your_session_secret_minimum_32_chars

# Optional: Admin password hash (bcrypt)
# If not set, default password "admin123" will work
ADMIN_PASSWORD_HASH=$2a$10$...your_bcrypt_hash...

# Optional: Your own database for persistent storage
# If not set, connections are stored in memory (reset on restart)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Optional: Redis for background job processing
# If not set, sync jobs run in real-time (blocking)
REDIS_URL=redis://localhost:6379`}
                    </Code>
                  </CardBody>
                </Card>

                <Alert status="info" borderRadius="md" mb={4}>
                  <AlertIcon />
                  <Text fontSize="sm">
                    <strong>Tip:</strong> Generate a secure encryption key with: <Code>openssl rand -hex 16</Code>
                  </Text>
                </Alert>

                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <Text fontSize="sm">
                    <strong>Note:</strong> Without DATABASE_URL, connections are stored in memory and will be lost when the server restarts.
                  </Text>
                </Alert>
              </Box>

              <Divider borderColor="surface.700" />

              {/* Managing Connections */}
              <Box id="connections">
                <Badge colorScheme="blue" mb={4}>BASICS</Badge>
                <Heading size="xl" color="white" mb={4}>
                  Managing Connections
                </Heading>

                <VStack align="stretch" spacing={6}>
                  <Text color="surface.300">
                    Before syncing, you need to add your database connections.
                  </Text>

                  <OrderedList color="surface.300" spacing={3} pl={4}>
                    <ListItem>
                      <Text fontWeight="bold" color="white">Go to Connections</Text>
                      <Text>Click "Manage Connections" from the dashboard</Text>
                    </ListItem>
                    <ListItem>
                      <Text fontWeight="bold" color="white">Add a Connection</Text>
                      <Text>Enter a name, select environment (production/development), and paste your PostgreSQL URL</Text>
                    </ListItem>
                    <ListItem>
                      <Text fontWeight="bold" color="white">Test Connection</Text>
                      <Text>The system automatically tests the connection and shows available tables</Text>
                    </ListItem>
                  </OrderedList>

                  <Card bg="surface.800" borderColor="surface.700">
                    <CardBody>
                      <Heading size="sm" color="white" mb={3}>PostgreSQL URL Format:</Heading>
                      <Code display="block" p={3} bg="gray.900" borderRadius="md" color="green.300">
                        postgresql://username:password@host:port/database
                      </Code>
                      <Text color="surface.400" fontSize="sm" mt={2}>
                        For Supabase: Go to Settings → Database → Connection string
                      </Text>
                    </CardBody>
                  </Card>
                </VStack>
              </Box>

              <Divider borderColor="surface.700" />

              {/* Schema Sync */}
              <Box id="schema-sync">
                <Badge colorScheme="green" mb={4}>FEATURE</Badge>
                <Heading size="xl" color="white" mb={4}>
                  Schema Sync
                </Heading>

                <VStack align="stretch" spacing={6}>
                  <Text color="surface.300">
                    Schema Sync compares table structures between databases and generates 
                    migration scripts to make them match.
                  </Text>

                  <Card bg="surface.800" borderColor="surface.700">
                    <CardBody>
                      <Heading size="sm" color="white" mb={4}>How to Use:</Heading>
                      <OrderedList color="surface.300" spacing={3}>
                        <ListItem>Click <Badge colorScheme="purple">Schema Sync</Badge> from the dashboard</ListItem>
                        <ListItem>Select your <strong>Source</strong> (reference schema) database</ListItem>
                        <ListItem>Select your <strong>Target</strong> (to update) database</ListItem>
                        <ListItem>Click <strong>Compare Schemas</strong></ListItem>
                        <ListItem>Review the differences and severity levels</ListItem>
                        <ListItem>Click <strong>Generate Fix Script</strong> to create SQL</ListItem>
                        <ListItem>Review the SQL, then click <strong>Execute</strong> to apply</ListItem>
                      </OrderedList>
                    </CardBody>
                  </Card>

                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Text fontSize="sm">
                      For production databases, you'll need to type the connection name to confirm execution.
                    </Text>
                  </Alert>
                </VStack>
              </Box>

              <Divider borderColor="surface.700" />

              {/* Data Sync */}
              <Box id="data-sync">
                <Badge colorScheme="cyan" mb={4}>FEATURE</Badge>
                <Heading size="xl" color="white" mb={4}>
                  Data Sync
                </Heading>

                <VStack align="stretch" spacing={6}>
                  <Text color="surface.300">
                    Data Sync copies rows between databases. It supports one-way sync 
                    with dry-run preview.
                  </Text>

                  <Card bg="surface.800" borderColor="surface.700">
                    <CardBody>
                      <Heading size="sm" color="white" mb={4}>Sync Modes:</Heading>
                      <VStack align="stretch" spacing={3}>
                        <HStack>
                          <Badge colorScheme="blue">One-Way</Badge>
                          <Text color="surface.300" fontSize="sm">
                            Copy data from source to target (UPSERT)
                          </Text>
                        </HStack>
                        <HStack>
                          <Badge colorScheme="gray">Two-Way</Badge>
                          <Text color="surface.400" fontSize="sm">
                            Coming soon - bidirectional with conflict detection
                          </Text>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card bg="surface.800" borderColor="surface.700">
                    <CardBody>
                      <Heading size="sm" color="white" mb={4}>Requirements for Syncable Tables:</Heading>
                      <UnorderedList color="surface.300" spacing={2}>
                        <ListItem>Must have a primary key column</ListItem>
                        <ListItem>Recommended: <Code>id</Code>, <Code>created_at</Code>, <Code>updated_at</Code> columns</ListItem>
                        <ListItem>Tables in <Code>public</Code> schema only</ListItem>
                      </UnorderedList>
                    </CardBody>
                  </Card>
                </VStack>
              </Box>

              <Divider borderColor="surface.700" />

              {/* Safety Features */}
              <Box id="safety">
                <Badge colorScheme="red" mb={4}>IMPORTANT</Badge>
                <Heading size="xl" color="white" mb={4}>
                  Safety Features
                </Heading>

                <VStack align="stretch" spacing={6}>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Card bg="surface.800" borderColor="surface.700">
                      <CardBody>
                        <Heading size="sm" color="white" mb={2}>🔐 Encrypted Storage</Heading>
                        <Text color="surface.400" fontSize="sm">
                          Database URLs are encrypted with AES-256-GCM before storage
                        </Text>
                      </CardBody>
                    </Card>
                    <Card bg="surface.800" borderColor="surface.700">
                      <CardBody>
                        <Heading size="sm" color="white" mb={2}>⚠️ Production Warnings</Heading>
                        <Text color="surface.400" fontSize="sm">
                          Extra confirmation required when modifying production databases
                        </Text>
                      </CardBody>
                    </Card>
                    <Card bg="surface.800" borderColor="surface.700">
                      <CardBody>
                        <Heading size="sm" color="white" mb={2}>🔍 Dry Run Preview</Heading>
                        <Text color="surface.400" fontSize="sm">
                          See exactly what will change before any data is modified
                        </Text>
                      </CardBody>
                    </Card>
                    <Card bg="surface.800" borderColor="surface.700">
                      <CardBody>
                        <Heading size="sm" color="white" mb={2}>📊 Schema Validation</Heading>
                        <Text color="surface.400" fontSize="sm">
                          Automatic detection of breaking changes and type mismatches
                        </Text>
                      </CardBody>
                    </Card>
                  </SimpleGrid>
                </VStack>
              </Box>

              <Divider borderColor="surface.700" />

              {/* Troubleshooting */}
              <Box id="troubleshooting">
                <Badge colorScheme="yellow" mb={4}>HELP</Badge>
                <Heading size="xl" color="white" mb={4}>
                  Troubleshooting
                </Heading>

                <VStack align="stretch" spacing={6}>
                  <Card bg="surface.800" borderColor="surface.700">
                    <CardBody>
                      <Heading size="sm" color="red.300" mb={2}>Connection Failed</Heading>
                      <UnorderedList color="surface.300" fontSize="sm" spacing={1}>
                        <ListItem>Check your PostgreSQL URL format</ListItem>
                        <ListItem>Ensure the database allows external connections</ListItem>
                        <ListItem>Verify SSL settings (Supabase requires SSL)</ListItem>
                        <ListItem>Check firewall/network restrictions</ListItem>
                      </UnorderedList>
                    </CardBody>
                  </Card>

                  <Card bg="surface.800" borderColor="surface.700">
                    <CardBody>
                      <Heading size="sm" color="red.300" mb={2}>Schema Loading Slow</Heading>
                      <Text color="surface.300" fontSize="sm">
                        Large databases may take longer. The system uses estimated row counts 
                        for performance. If it's still slow, check your database connection latency.
                      </Text>
                    </CardBody>
                  </Card>

                  <Card bg="surface.800" borderColor="surface.700">
                    <CardBody>
                      <Heading size="sm" color="red.300" mb={2}>Login Not Working</Heading>
                      <UnorderedList color="surface.300" fontSize="sm" spacing={1}>
                        <ListItem>Default password is <Code>admin123</Code> if ADMIN_PASSWORD_HASH is not set</ListItem>
                        <ListItem>Ensure SESSION_SECRET is at least 32 characters</ListItem>
                        <ListItem>Clear browser cookies and try again</ListItem>
                      </UnorderedList>
                    </CardBody>
                  </Card>
                </VStack>
              </Box>

              <Divider borderColor="surface.700" />

              {/* API Reference */}
              <Box id="api-reference">
                <Badge colorScheme="gray" mb={4}>ADVANCED</Badge>
                <Heading size="xl" color="white" mb={4}>
                  API Reference
                </Heading>

                <VStack align="stretch" spacing={4}>
                  <Card bg="surface.800" borderColor="surface.700">
                    <CardBody>
                      <HStack mb={2}>
                        <Badge colorScheme="green">GET</Badge>
                        <Code bg="transparent" color="white">/api/connections</Code>
                      </HStack>
                      <Text color="surface.400" fontSize="sm">List all database connections</Text>
                    </CardBody>
                  </Card>

                  <Card bg="surface.800" borderColor="surface.700">
                    <CardBody>
                      <HStack mb={2}>
                        <Badge colorScheme="blue">POST</Badge>
                        <Code bg="transparent" color="white">/api/connections</Code>
                      </HStack>
                      <Text color="surface.400" fontSize="sm">Create a new connection</Text>
                    </CardBody>
                  </Card>

                  <Card bg="surface.800" borderColor="surface.700">
                    <CardBody>
                      <HStack mb={2}>
                        <Badge colorScheme="green">GET</Badge>
                        <Code bg="transparent" color="white">/api/connections/[id]/schema</Code>
                      </HStack>
                      <Text color="surface.400" fontSize="sm">Get full schema for a connection</Text>
                    </CardBody>
                  </Card>

                  <Card bg="surface.800" borderColor="surface.700">
                    <CardBody>
                      <HStack mb={2}>
                        <Badge colorScheme="blue">POST</Badge>
                        <Code bg="transparent" color="white">/api/sync/validate</Code>
                      </HStack>
                      <Text color="surface.400" fontSize="sm">Validate schema compatibility between two connections</Text>
                    </CardBody>
                  </Card>

                  <Card bg="surface.800" borderColor="surface.700">
                    <CardBody>
                      <HStack mb={2}>
                        <Badge colorScheme="blue">POST</Badge>
                        <Code bg="transparent" color="white">/api/sync/generate-migration</Code>
                      </HStack>
                      <Text color="surface.400" fontSize="sm">Generate SQL migration script</Text>
                    </CardBody>
                  </Card>

                  <Card bg="surface.800" borderColor="surface.700">
                    <CardBody>
                      <HStack mb={2}>
                        <Badge colorScheme="orange">POST</Badge>
                        <Code bg="transparent" color="white">/api/connections/[id]/execute</Code>
                      </HStack>
                      <Text color="surface.400" fontSize="sm">Execute SQL on a connection (requires confirmation for production)</Text>
                    </CardBody>
                  </Card>
                </VStack>
              </Box>

              {/* Footer CTA */}
              <Card bg="surface.800" borderColor="brand.500" borderWidth="2px">
                <CardBody p={8} textAlign="center">
                  <VStack spacing={4}>
                    <Heading size="md" color="white">Ready to Start?</Heading>
                    <Text color="surface.400">
                      Login and add your first database connection
                    </Text>
                    <Button colorScheme="teal" size="lg" onClick={() => router.push('/login')}>
                      Go to Dashboard
                    </Button>
                  </VStack>
                </CardBody>
              </Card>

            </VStack>
          </Container>
        </Box>
      </Flex>
    </Box>
  );
}

