'use client';

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
  Divider,
  SimpleGrid,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export default function PricingPageClient() {
  const router = useRouter();

  const features = [
    'Unlimited database connections',
    'Schema synchronization',
    'Data sync between environments',
    'Keep-alive service',
    'Migration script generation',
    'Schema validation',
    'Real-time sync monitoring',
    'Encrypted credential storage',
    'Email support',
  ];

  return (
    <Box minH="100vh">
      <Container maxW="6xl" py={{ base: 8, md: 12 }}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <VStack spacing={4} align="center" textAlign="center">
            <Heading
              size={{ base: 'xl', md: '2xl' }}
              fontFamily="mono"
              bgGradient="linear(to-r, brand.300, brand.500)"
              bgClip="text"
            >
              Pricing
            </Heading>
            <Text color="surface.400" fontSize={{ base: 'md', md: 'lg' }} maxW="2xl">
              suparbase is currently in <strong>beta testing phase</strong> and is <strong>completely free</strong> to use.
            </Text>
          </VStack>

          {/* Beta Notice */}
          <Box
            bg="brand.500"
            bgGradient="linear(to-r, brand.500, brand.600)"
            p={6}
            borderRadius="xl"
            textAlign="center"
            borderWidth="1px"
            borderColor="brand.400"
          >
            <VStack spacing={3}>
              <Badge colorScheme="white" fontSize="md" px={3} py={1} borderRadius="full">
                BETA TESTING PHASE
              </Badge>
              <Heading size="lg" color="white">
                Free During Beta
              </Heading>
              <Text color="white" fontSize="md" maxW="2xl">
                We're currently in beta testing and all features are available at no cost. 
                Help us improve suparbase by using it and sharing your feedback!
              </Text>
            </VStack>
          </Box>

          <Divider borderColor="surface.700" />

          {/* Pricing Card */}
          <Box display="flex" justifyContent="center">
            <Card
              bg="surface.800"
              borderColor="brand.500"
              borderWidth="2px"
              maxW="md"
              w="full"
            >
              <CardBody p={8}>
                <VStack spacing={6} align="stretch">
                  <VStack spacing={2} align="start">
                    <HStack spacing={3}>
                      <Heading size="lg" color="white">
                        Beta Plan
                      </Heading>
                      <Badge colorScheme="green" fontSize="sm" px={2} py={1}>
                        FREE
                      </Badge>
                    </HStack>
                    <HStack spacing={2} align="baseline">
                      <Heading size="3xl" color="brand.400">
                        $0
                      </Heading>
                      <Text color="surface.400" fontSize="lg">
                        /month
                      </Text>
                    </HStack>
                    <Text color="surface.400" fontSize="sm">
                      During beta testing phase
                    </Text>
                  </VStack>

                  <Divider borderColor="surface.700" />

                  <List spacing={3}>
                    {features.map((feature, index) => (
                      <ListItem key={index} color="surface.300">
                        <HStack align="start" spacing={3}>
                          <ListIcon as={CheckIcon} color="brand.400" mt={0.5} />
                          <Text fontSize="sm">{feature}</Text>
                        </HStack>
                      </ListItem>
                    ))}
                  </List>

                  <Button
                    size="lg"
                    colorScheme="teal"
                    width="full"
                    onClick={() => router.push('/signup')}
                    mt={4}
                  >
                    Get Started Free
                  </Button>

                  <Text color="surface.500" fontSize="xs" textAlign="center">
                    No credit card required
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </Box>

          {/* Future Pricing Note */}
          <Box
            bg="surface.800"
            p={6}
            borderRadius="xl"
            borderWidth="1px"
            borderColor="surface.700"
          >
            <VStack spacing={3} align="start">
              <Heading size="md" color="white">
                Future Pricing
              </Heading>
              <Text color="surface.400" fontSize="sm">
                Once we exit beta, we plan to offer a free tier with essential features and paid plans 
                for advanced usage. Beta users will receive special early adopter benefits. 
                We'll notify all users well in advance of any pricing changes.
              </Text>
            </VStack>
          </Box>

          {/* CTA */}
          <Box textAlign="center">
            <VStack spacing={4}>
              <Text color="surface.400">
                Questions about pricing? Check out our FAQ or contact us.
              </Text>
              <HStack spacing={4} justify="center" flexWrap="wrap">
                <Button
                  variant="outline"
                  onClick={() => router.push('/faq')}
                  minH="48px"
                >
                  View FAQ
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/benefits')}
                  minH="48px"
                >
                  See Benefits
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/contact')}
                  minH="48px"
                >
                  Contact Us
                </Button>
              </HStack>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}

