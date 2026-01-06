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
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const RocketIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
);

const PackageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v6m0 6v6m9-9h-6M6 12H1m20.364-6.364l-4.243 4.243M7.879 16.121l-4.243 4.243m14.728 0l-4.243-4.243M7.879 7.879L3.636 3.636"/>
  </svg>
);

const LinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const FileTextIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const WrenchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

const CodeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const AlertTriangleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const BarChartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <line x1="12" y1="20" x2="12" y2="10"/>
    <line x1="18" y1="20" x2="18" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="16"/>
  </svg>
);

const sections = [
  { id: 'getting-started', title: 'Getting Started', icon: RocketIcon },
  { id: 'installation', title: 'Installation', icon: PackageIcon },
  { id: 'configuration', title: 'Configuration', icon: SettingsIcon },
  { id: 'connections', title: 'Managing Connections', icon: LinkIcon },
  { id: 'schema-sync', title: 'Schema Sync', icon: FileTextIcon },
  { id: 'data-sync', title: 'Data Sync', icon: RefreshIcon },
  { id: 'safety', title: 'Safety Features', icon: ShieldIcon },
  { id: 'troubleshooting', title: 'Troubleshooting', icon: WrenchIcon },
  { id: 'api-reference', title: 'API Reference', icon: CodeIcon },
];

export default function GuidePageClient() {
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
        onClick={() => router.push('/')}
        mb={4}
      >
        Back to Home
      </Button>
      
      <Text color="surface.500" fontSize="xs" fontWeight="bold" px={3} mb={2}>
        DOCUMENTATION
      </Text>
      
      {sections.map((section) => {
        const IconComponent = section.icon;
        return (
          <Button
            key={section.id}
            variant="ghost"
            justifyContent="flex-start"
            size="sm"
            color={activeSection === section.id ? 'brand.400' : 'surface.300'}
            bg={activeSection === section.id ? 'surface.700' : 'transparent'}
            onClick={() => scrollToSection(section.id)}
            leftIcon={<IconComponent />}
            _hover={{ bg: 'surface.700' }}
          >
            {section.title}
          </Button>
        );
      })}
    </VStack>
  );

  // Structured Data (JSON-LD)
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Getting Started Guide | suparbase',
    description: 'Complete guide to using suparbase for database synchronization and keep-alive. Step-by-step instructions, best practices, and troubleshooting.',
    author: {
      '@type': 'Organization',
      name: 'suparbase',
    },
    publisher: {
      '@type': 'Organization',
      name: 'suparbase',
      logo: {
        '@type': 'ImageObject',
        url: 'https://suparbase.com/logo.png',
      },
    },
    datePublished: '2024-01-01',
    dateModified: new Date().toISOString().split('T')[0],
  };

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Use suparbase for Database Synchronization',
    description: 'Step-by-step guide to synchronizing Supabase databases',
    step: [
      {
        '@type': 'HowToStep',
        name: 'Installation',
        text: 'Clone the repository and install dependencies',
      },
      {
        '@type': 'HowToStep',
        name: 'Configuration',
        text: 'Set up environment variables and encryption keys',
      },
      {
        '@type': 'HowToStep',
        name: 'Add Connections',
        text: 'Add your database connections in the UI',
      },
      {
        '@type': 'HowToStep',
        name: 'Sync Schemas',
        text: 'Compare and sync database schemas between environments',
      },
    ],
  };

  return (
    <Box minH="100vh">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
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
            <HStack spacing={2}>
              <Box color="brand.400">
                <FileTextIcon />
              </Box>
              <Heading size="sm" color="white" fontFamily="mono">
                Documentation
              </Heading>
            </HStack>
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
            <HStack spacing={2} mb={6}>
              <Box color="brand.400">
                <FileTextIcon />
              </Box>
              <Heading size="md" color="white" fontFamily="mono">
                Documentation
              </Heading>
            </HStack>
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
                <Heading as="h1" size="xl" color="white" mb={4}>
                  Getting Started
                </Heading>
                <Text color="surface.300" fontSize="lg" mb={6}>
                  suparbase helps you synchronize database schemas and data between 
                  your Supabase environments (development, staging, production).
                </Text>
                
                <Card bg="surface.800" borderColor="surface.700">
                  <CardBody>
                    <VStack align="stretch" spacing={4}>
                      <Heading as="h3" size="sm" color="white">What You Can Do:</Heading>
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
                <Heading as="h2" size="xl" color="white" mb={4}>
                  Installation
                </Heading>
                
                <VStack align="stretch" spacing={6}>
                  <Box>
                    <Heading as="h3" size="sm" color="white" mb={3}>Step 1: Clone the Repository</Heading>
                    <Code display="block" p={4} bg="gray.900" borderRadius="md" color="green.300">
{`git clone https://github.com/your-repo/supabase-syncer.git
cd supabase-syncer`}
                    </Code>
                  </Box>

                  <Box>
                    <Heading as="h3" size="sm" color="white" mb={3}>Step 2: Install Dependencies</Heading>
                    <Code display="block" p={4} bg="gray.900" borderRadius="md" color="green.300">
{`npm install
# or
yarn install`}
                    </Code>
                  </Box>

                  <Box>
                    <Heading as="h3" size="sm" color="white" mb={3}>Step 3: Configure Environment</Heading>
                    <Code display="block" p={4} bg="gray.900" borderRadius="md" color="green.300">
{`cp .env.example .env.local
# Edit .env.local with your settings`}
                    </Code>
                  </Box>

                  <Box>
                    <Heading as="h3" size="sm" color="white" mb={3}>Step 4: Start the Server</Heading>
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
                <Heading as="h2" size="xl" color="white" mb={4}>
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
                <Heading as="h2" size="xl" color="white" mb={4}>
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
                      <Heading as="h3" size="sm" color="white" mb={3}>PostgreSQL URL Format:</Heading>
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
                <Heading as="h2" size="xl" color="white" mb={4}>
                  Schema Sync
                </Heading>

                <VStack align="stretch" spacing={6}>
                  <Text color="surface.300">
                    Schema Sync compares table structures between databases and generates 
                    migration scripts to make them match.
                  </Text>

                  <Card bg="surface.800" borderColor="surface.700">
                    <CardBody>
                      <Heading as="h3" size="sm" color="white" mb={4}>How to Use:</Heading>
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
                <Heading as="h2" size="xl" color="white" mb={4}>
                  Data Sync
                </Heading>

                <VStack align="stretch" spacing={6}>
                  <Text color="surface.300">
                    Data Sync copies rows between databases. It supports one-way sync 
                    with dry-run preview.
                  </Text>

                  <Card bg="surface.800" borderColor="surface.700">
                    <CardBody>
                      <Heading as="h3" size="sm" color="white" mb={4}>Sync Modes:</Heading>
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
                      <Heading as="h3" size="sm" color="white" mb={4}>Requirements for Syncable Tables:</Heading>
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
                <Heading as="h2" size="xl" color="white" mb={4}>
                  Safety Features
                </Heading>

                <VStack align="stretch" spacing={6}>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Card bg="surface.800" borderColor="surface.700">
                      <CardBody>
                        <HStack spacing={2} mb={2}>
                          <Box color="brand.400">
                            <LockIcon />
                          </Box>
                          <Heading as="h3" size="sm" color="white">Encrypted Storage</Heading>
                        </HStack>
                        <Text color="surface.400" fontSize="sm">
                          Database URLs are encrypted with AES-256-GCM before storage
                        </Text>
                      </CardBody>
                    </Card>
                    <Card bg="surface.800" borderColor="surface.700">
                      <CardBody>
                        <HStack spacing={2} mb={2}>
                          <Box color="yellow.400">
                            <AlertTriangleIcon />
                          </Box>
                          <Heading as="h3" size="sm" color="white">Production Warnings</Heading>
                        </HStack>
                        <Text color="surface.400" fontSize="sm">
                          Extra confirmation required when modifying production databases
                        </Text>
                      </CardBody>
                    </Card>
                    <Card bg="surface.800" borderColor="surface.700">
                      <CardBody>
                        <HStack spacing={2} mb={2}>
                          <Box color="blue.400">
                            <SearchIcon />
                          </Box>
                          <Heading as="h3" size="sm" color="white">Dry Run Preview</Heading>
                        </HStack>
                        <Text color="surface.400" fontSize="sm">
                          See exactly what will change before any data is modified
                        </Text>
                      </CardBody>
                    </Card>
                    <Card bg="surface.800" borderColor="surface.700">
                      <CardBody>
                        <HStack spacing={2} mb={2}>
                          <Box color="green.400">
                            <BarChartIcon />
                          </Box>
                          <Heading as="h3" size="sm" color="white">Schema Validation</Heading>
                        </HStack>
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
                <Heading as="h2" size="xl" color="white" mb={4}>
                  Troubleshooting
                </Heading>

                <VStack align="stretch" spacing={6}>
                  <Card bg="surface.800" borderColor="surface.700">
                    <CardBody>
                      <Heading as="h3" size="sm" color="red.300" mb={2}>Connection Failed</Heading>
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
                      <Heading as="h3" size="sm" color="red.300" mb={2}>Schema Loading Slow</Heading>
                      <Text color="surface.300" fontSize="sm">
                        Large databases may take longer. The system uses estimated row counts 
                        for performance. If it's still slow, check your database connection latency.
                      </Text>
                    </CardBody>
                  </Card>

                  <Card bg="surface.800" borderColor="surface.700">
                    <CardBody>
                      <Heading as="h3" size="sm" color="red.300" mb={2}>Login Not Working</Heading>
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
                <Heading as="h2" size="xl" color="white" mb={4}>
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
                    <Heading as="h2" size="md" color="white">Ready to Start?</Heading>
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

