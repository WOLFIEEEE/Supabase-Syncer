'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Grid,
  GridItem,
  Card,
  CardBody,
  Badge,
  Flex,
  Icon,
  SimpleGrid,
  Divider,
} from '@chakra-ui/react';
import { motion, useScroll, useTransform } from 'framer-motion';

const MotionBox = motion.create(Box);

// Icons
const SyncIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const CodeIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </svg>
);

const ZapIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const BookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const features = [
  {
    icon: SyncIcon,
    title: 'One-Click Sync',
    description: 'Synchronize data between production and development databases with a single click. No manual export/import needed.',
    color: 'teal.400',
  },
  {
    icon: ShieldIcon,
    title: 'Schema Validation',
    description: 'Automatic schema comparison with critical issue detection. We warn you before breaking changes hit production.',
    color: 'purple.400',
  },
  {
    icon: CodeIcon,
    title: 'Migration Generator',
    description: 'Generate idempotent SQL scripts to fix schema differences automatically. Copy-paste ready for your CI/CD.',
    color: 'cyan.400',
  },
  {
    icon: ZapIcon,
    title: 'Real-time Execution',
    description: 'Execute migrations directly from the UI with production safety confirmations and real-time logs.',
    color: 'brand.400',
  },
];

const benefits = [
  'Works with any PostgreSQL database',
  'Supabase-optimized with RLS awareness',
  'Encrypted connection storage (AES-256-GCM)',
  'No external dependencies required',
  'Simple password-based authentication',
  'Mobile-responsive interface',
];

export default function HomePageClient() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const targetRef = useRef(null);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, -100]);

  return (
    <Box position="relative" overflow="hidden">
      {/* Background Orbs */}
      <Box
        position="absolute"
        top="-10%"
        left="-5%"
        w="40vw"
        h="40vw"
        bg="brand.500"
        filter="blur(150px)"
        opacity="0.15"
        zIndex="-1"
        borderRadius="full"
      />
      <Box
        position="absolute"
        bottom="20%"
        right="-5%"
        w="30vw"
        h="30vw"
        bg="purple.500"
        filter="blur(150px)"
        opacity="0.1"
        zIndex="-1"
        borderRadius="full"
      />

      {/* Hero Section */}
      <Box ref={targetRef} minH="90vh" display="flex" alignItems="center" pt={{ base: 20, md: 0 }}>
        <Container maxW="7xl">
          <Grid templateColumns={{ base: '1fr', lg: '1.2fr 1fr' }} gap={12} alignItems="center">
            <GridItem>
              <MotionBox
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ opacity, scale, y }}
              >
                <VStack align="start" spacing={8}>
                  <HStack spacing={2}>
                    <Badge 
                      colorScheme="teal" 
                      px={3} 
                      py={1} 
                      borderRadius="full" 
                      fontSize="xs"
                      textTransform="uppercase"
                      letterSpacing="0.1em"
                    >
                      v1.0.0 is live
                    </Badge>
                    <Badge 
                      variant="outline" 
                      color="surface.400" 
                      px={3} 
                      py={1} 
                      borderRadius="full" 
                      fontSize="xs"
                    >
                      Open Source
                    </Badge>
                  </HStack>

                  <VStack align="start" spacing={4}>
                    <Heading
                      as="h1"
                      fontSize={{ base: '4xl', md: '6xl', lg: '7xl' }}
                      fontWeight="800"
                      lineHeight="1.1"
                      letterSpacing="-0.03em"
                      color="white"
                    >
                      Database sync for{' '}
                      <Text 
                        as="span" 
                        bgGradient="linear(to-r, brand.300, brand.500, purple.400)" 
                        bgClip="text"
                      >
                        modern teams
                      </Text>
                    </Heading>
                    <Text 
                      fontSize={{ base: 'lg', md: 'xl' }} 
                      color="surface.300" 
                      maxW="2xl"
                      lineHeight="1.6"
                    >
                      Safely synchronize schemas and data between your Supabase environments. 
                      Stop worrying about manual migrations and focus on building features.
                    </Text>
                  </VStack>

                  <HStack spacing={4} flexWrap="wrap">
                    <Button
                      size="lg"
                      height="64px"
                      px={10}
                      fontSize="md"
                      colorScheme="teal"
                      bgGradient="linear(to-r, brand.500, brand.600)"
                      _hover={{ 
                        bgGradient: 'linear(to-r, brand.400, brand.500)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 20px rgba(62, 207, 142, 0.3)'
                      }}
                      onClick={() => router.push('/login')}
                    >
                      Get Started Free
                    </Button>
                    <Button
                      size="lg"
                      height="64px"
                      px={10}
                      fontSize="md"
                      variant="outline"
                      borderColor="surface.600"
                      _hover={{ bg: 'surface.800', borderColor: 'surface.400' }}
                      leftIcon={<BookIcon />}
                      onClick={() => router.push('/guide')}
                    >
                      Documentation
                    </Button>
                  </HStack>

                  <HStack spacing={6} pt={4}>
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="700" fontSize="2xl" color="white">100%</Text>
                      <Text fontSize="xs" color="surface.500" textTransform="uppercase">Type Safe</Text>
                    </VStack>
                    <Divider orientation="vertical" h="40px" borderColor="surface.700" />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="700" fontSize="2xl" color="white">Zero</Text>
                      <Text fontSize="xs" color="surface.500" textTransform="uppercase">Dependencies</Text>
                    </VStack>
                    <Divider orientation="vertical" h="40px" borderColor="surface.700" />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="700" fontSize="2xl" color="white">Secure</Text>
                      <Text fontSize="xs" color="surface.500" textTransform="uppercase">AES-256</Text>
                    </VStack>
                  </HStack>
                </VStack>
              </MotionBox>
            </GridItem>

            <GridItem position="relative">
              <MotionBox
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
                style={{ opacity, scale, y }}
              >
                {/* Abstract UI Elements */}
                <Box
                  position="relative"
                  w="100%"
                  h={{ base: '300px', md: '500px' }}
                  borderRadius="2xl"
                  bg="surface.800"
                  borderWidth="1px"
                  borderColor="surface.700"
                  boxShadow="2xl"
                  overflow="hidden"
                >
                  <Box bg="surface.700" px={4} py={2} display="flex" gap={2}>
                    <Box w={3} h={3} borderRadius="full" bg="red.500" />
                    <Box w={3} h={3} borderRadius="full" bg="yellow.500" />
                    <Box w={3} h={3} borderRadius="full" bg="green.500" />
                  </Box>
                  <Box p={6} fontFamily="mono" fontSize="sm">
                    <Text color="brand.400"># Schema Comparison</Text>
                    <Text color="surface.400" mt={2}>Detecting differences between dev and prod...</Text>
                    <Box mt={4} p={3} bg="surface.900" borderRadius="md">
                      <HStack justify="space-between">
                        <Text color="red.300">- table "users" missing column "bio"</Text>
                        <Badge colorScheme="red">CRITICAL</Badge>
                      </HStack>
                      <HStack justify="space-between" mt={2}>
                        <Text color="yellow.300">~ column "settings" type mismatch</Text>
                        <Badge colorScheme="yellow">WARNING</Badge>
                      </HStack>
                    </Box>
                    <Text color="green.400" mt={6}>$ npx suparbase-syncer sync --target prod</Text>
                    <Text color="surface.200" mt={2}>Generating migration script...</Text>
                    <Text color="surface.500" mt={1}>[OK] Migration created: 20240106_add_bio.sql</Text>
                  </Box>
                </Box>

                {/* Floating elements */}
                <MotionBox
                  position="absolute"
                  top="-20px"
                  right="-20px"
                  bg="brand.500"
                  p={4}
                  borderRadius="xl"
                  boxShadow="xl"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <SyncIcon />
                </MotionBox>
                <MotionBox
                  position="absolute"
                  bottom="40px"
                  left="-30px"
                  bg="purple.600"
                  p={4}
                  borderRadius="xl"
                  boxShadow="xl"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                >
                  <ShieldIcon />
                </MotionBox>
              </MotionBox>
            </GridItem>
          </Grid>
        </Container>
      </Box>

      {/* Feature Grid - Funky Layout */}
      <Box py={24} bg="rgba(9, 9, 11, 0.5)">
        <Container maxW="7xl">
          <VStack spacing={16}>
            <VStack spacing={4} textAlign="center" maxW="2xl">
              <Heading as="h2" size="2xl" color="white" letterSpacing="-0.02em">
                Stop fighting with database drift
              </Heading>
              <Text color="surface.400" fontSize="lg">
                We built suparbase to solve the headache of keeping disparate Supabase projects in sync.
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8}>
              {features.map((feature, idx) => (
                <MotionBox
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <Card 
                    bg="surface.800" 
                    borderColor="surface.700" 
                    h="100%" 
                    _hover={{ 
                      borderColor: feature.color, 
                      transform: 'translateY(-8px)',
                      boxShadow: `0 12px 30px rgba(0, 0, 0, 0.5)`
                    }}
                    transition="all 0.3s ease"
                  >
                    <CardBody p={8}>
                      <VStack align="start" spacing={6}>
                        <Box 
                          p={3} 
                          bg="surface.900" 
                          borderRadius="lg" 
                          color={feature.color}
                          boxShadow={`0 0 20px ${feature.color}33`}
                        >
                          <feature.icon />
                        </Box>
                        <VStack align="start" spacing={2}>
                          <Heading as="h3" size="md" color="white">
                            {feature.title}
                          </Heading>
                          <Text color="surface.400" fontSize="sm" lineHeight="1.6">
                            {feature.description}
                          </Text>
                        </VStack>
                      </VStack>
                    </CardBody>
                  </Card>
                </MotionBox>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Bento Grid section */}
      <Box py={24}>
        <Container maxW="7xl">
          <Grid
            templateColumns={{ base: '1fr', lg: 'repeat(3, 1fr)' }}
            templateRows={{ base: 'auto', lg: 'repeat(2, 1fr)' }}
            gap={6}
          >
            <GridItem colSpan={{ base: 1, lg: 2 }} rowSpan={1}>
              <Card bg="surface.800" borderColor="surface.700" h="100%">
                <CardBody p={8}>
                  <HStack spacing={6} align="center" h="100%">
                    <VStack align="start" spacing={4} flex={1}>
                      <Heading size="lg" color="white">Designed for Developers</Heading>
                      <Text color="surface.400">
                        Built by developers who were tired of manual schema updates. 
                        Works seamlessly with your existing Supabase workflow.
                      </Text>
                      <Button variant="link" color="teal.400" rightIcon={<ArrowRightIcon />}>
                        Explore Features
                      </Button>
                    </VStack>
                    <Box 
                      display={{ base: 'none', md: 'block' }}
                      bg="surface.900" 
                      p={4} 
                      borderRadius="xl"
                      fontFamily="mono"
                      fontSize="xs"
                    >
                      <Text color="brand.400">export default async function</Text>
                      <Text color="white">  sync(options) {"{"}</Text>
                      <Text color="surface.500">    // Safety first</Text>
                      <Text color="white">    await validate(options);</Text>
                      <Text color="white">{"  }"}</Text>
                    </Box>
                  </HStack>
                </CardBody>
              </Card>
            </GridItem>
            <GridItem colSpan={1} rowSpan={{ base: 1, lg: 2 }}>
              <Card bgGradient="linear(to-br, surface.800, brand.900)" borderColor="surface.700" h="100%">
                <CardBody p={8} display="flex" flexDir="column" justifyContent="center">
                  <VStack align="start" spacing={6}>
                    <Box bg="whiteAlpha.200" p={4} borderRadius="2xl">
                      <ZapIcon />
                    </Box>
                    <Heading size="lg" color="white">Keep-Alive Service</Heading>
                    <Text color="surface.200">
                      Prevent your Supabase free tier databases from pausing automatically. 
                      Our service pings them regularly to keep them ready for action.
                    </Text>
                    <Divider borderColor="whiteAlpha.300" />
                    <SimpleGrid columns={1} spacing={4} w="100%">
                      {benefits.slice(0, 4).map((b, i) => (
                        <HStack key={i} spacing={2}>
                          <Box color="brand.400"><CheckIcon /></Box>
                          <Text fontSize="sm" color="whiteAlpha.800">{b}</Text>
                        </HStack>
                      ))}
                    </SimpleGrid>
                  </VStack>
                </CardBody>
              </Card>
            </GridItem>
            <GridItem colSpan={1}>
              <Card bg="surface.800" borderColor="surface.700" h="100%">
                <CardBody p={8}>
                  <VStack align="start" spacing={4}>
                    <Heading size="md" color="white">Secure by Default</Heading>
                    <Text color="surface.400" fontSize="sm">
                      Connection strings are encrypted using AES-256-GCM before being stored. 
                      Your data security is our top priority.
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            </GridItem>
            <GridItem colSpan={1}>
              <Card bg="surface.800" borderColor="surface.700" h="100%">
                <CardBody p={8}>
                  <VStack align="start" spacing={4}>
                    <Heading size="md" color="white">Open Source</Heading>
                    <Text color="surface.400" fontSize="sm">
                      Self-host it on your own infrastructure. Full control over your data 
                      and tools. Check us out on GitHub.
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            </GridItem>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box py={32}>
        <Container maxW="4xl">
          <MotionBox
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card 
              bg="surface.800" 
              borderColor="brand.500" 
              borderWidth="1px"
              overflow="hidden"
              position="relative"
            >
              {/* Decorative background for CTA */}
              <Box
                position="absolute"
                top="-50%"
                right="-10%"
                w="300px"
                h="300px"
                bg="brand.500"
                filter="blur(100px)"
                opacity="0.1"
                borderRadius="full"
              />
              
              <CardBody p={{ base: 10, md: 16 }} textAlign="center">
                <VStack spacing={8}>
                  <Heading as="h2" size="2xl" color="white" letterSpacing="-0.02em">
                    Ready to sync?
                  </Heading>
                  <Text color="surface.300" fontSize="xl" maxW="lg">
                    Join developers who trust suparbase for their database synchronization.
                  </Text>
                  <HStack spacing={4}>
                    <Button
                      size="lg"
                      height="64px"
                      px={12}
                      colorScheme="teal"
                      onClick={() => router.push('/login')}
                    >
                      Start Now
                    </Button>
                    <Button
                      size="lg"
                      height="64px"
                      px={12}
                      variant="ghost"
                      onClick={() => router.push('/guide')}
                    >
                      Read Docs
                    </Button>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          </MotionBox>
        </Container>
      </Box>

      {/* Footer */}
      <Box py={16} borderTopWidth="1px" borderColor="surface.800">
        <Container maxW="7xl">
          <Flex 
            justify="space-between" 
            align={{ base: 'start', md: 'center' }}
            direction={{ base: 'column', md: 'row' }}
            gap={8}
          >
            <VStack align="start" spacing={4}>
              <HStack spacing={3}>
                <Image src="/logo.png" alt="logo" width={32} height={32} />
                <Text color="white" fontWeight="700" letterSpacing="0.05em">SUPARBASE</Text>
              </HStack>
              <Text color="surface.500" fontSize="sm" maxW="xs">
                The ultimate companion for Supabase developers. 
                Keep your environments in perfect harmony.
              </Text>
              <Text color="surface.600" fontSize="xs">
                © {new Date().getFullYear()} suparbase • MIT License
              </Text>
            </VStack>
            
            <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} spacing={12}>
              <VStack align="start" spacing={4}>
                <Text color="white" fontWeight="600" fontSize="sm">Product</Text>
                <Button variant="link" size="sm" color="surface.400" onClick={() => router.push('/features')}>Features</Button>
                <Button variant="link" size="sm" color="surface.400" onClick={() => router.push('/pricing')}>Pricing</Button>
                <Button variant="link" size="sm" color="surface.400" onClick={() => router.push('/status')}>Status</Button>
              </VStack>
              <VStack align="start" spacing={4}>
                <Text color="white" fontWeight="600" fontSize="sm">Resources</Text>
                <Button variant="link" size="sm" color="surface.400" onClick={() => router.push('/guide')}>Documentation</Button>
                <Button variant="link" size="sm" color="surface.400" onClick={() => router.push('/faq')}>FAQ</Button>
              </VStack>
              <VStack align="start" spacing={4}>
                <Text color="white" fontWeight="600" fontSize="sm">Company</Text>
                <Button variant="link" size="sm" color="surface.400" onClick={() => router.push('/about')}>About</Button>
                <Button variant="link" size="sm" color="surface.400" onClick={() => router.push('/contact')}>Contact</Button>
              </VStack>
              <VStack align="start" spacing={4}>
                <Text color="white" fontWeight="600" fontSize="sm">Legal</Text>
                <Button variant="link" size="sm" color="surface.400" onClick={() => router.push('/privacy')}>Privacy</Button>
                <Button variant="link" size="sm" color="surface.400" onClick={() => router.push('/terms')}>Terms</Button>
              </VStack>
            </SimpleGrid>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
}
