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
  Divider,
} from '@chakra-ui/react';

const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

export default function TermsPageClient() {
  const router = useRouter();

  // Structured Data (JSON-LD)
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Terms of Service | suparbase',
    description: 'Terms of Service for suparbase - Read our terms and conditions for using the database synchronization tool.',
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

  return (
    <Box minH="100vh">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <Container maxW="4xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <HStack spacing={4}>
            <Button
              variant="ghost"
              leftIcon={<HomeIcon />}
              onClick={() => router.push('/landing')}
              size="sm"
            >
              Home
            </Button>
          </HStack>

          <VStack spacing={4} align="stretch">
            <Heading as="h1" size="xl" color="white">
              Terms of Service
            </Heading>
            <Text color="surface.400" fontSize="sm">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </VStack>

          <Divider borderColor="surface.700" />

          {/* Content */}
          <VStack spacing={8} align="stretch">
            <Card bg="surface.800" borderColor="surface.700">
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading as="h2" size="lg" color="white" mb={4}>
                      Acceptance of Terms
                    </Heading>
                    <Text color="surface.300" lineHeight="tall">
                      By accessing and using suparbase, you accept and agree to be bound by the terms and provision 
                      of this agreement. If you do not agree to abide by the above, please do not use this service.
                    </Text>
                  </Box>

                  <Divider borderColor="surface.700" />

                  <Box>
                    <Heading as="h2" size="lg" color="white" mb={4}>
                      Description of Service
                    </Heading>
                    <Text color="surface.300" lineHeight="tall" mb={4}>
                      suparbase is an open-source tool that enables users to:
                    </Text>
                    <VStack spacing={3} align="stretch" as="ul" pl={4}>
                      <Text as="li" color="surface.300" lineHeight="tall">
                        Synchronize database schemas between Supabase environments
                      </Text>
                      <Text as="li" color="surface.300" lineHeight="tall">
                        Sync data between databases
                      </Text>
                      <Text as="li" color="surface.300" lineHeight="tall">
                        Generate migration scripts
                      </Text>
                      <Text as="li" color="surface.300" lineHeight="tall">
                        Keep databases alive with automated health checks
                      </Text>
                    </VStack>
                  </Box>

                  <Divider borderColor="surface.700" />

                  <Box>
                    <Heading as="h2" size="lg" color="white" mb={4}>
                      User Responsibilities
                    </Heading>
                    <VStack spacing={4} align="stretch">
                      <Box>
                        <Heading as="h3" size="md" color="white" mb={2}>
                          Account Security
                        </Heading>
                        <Text color="surface.300" lineHeight="tall">
                          You are responsible for maintaining the confidentiality of your account credentials and 
                          for all activities that occur under your account.
                        </Text>
                      </Box>
                      <Box>
                        <Heading as="h3" size="md" color="white" mb={2}>
                          Database Access
                        </Heading>
                        <Text color="surface.300" lineHeight="tall">
                          You are responsible for ensuring you have proper authorization to access and modify the 
                          databases you connect to suparbase. You must comply with all applicable laws and regulations.
                        </Text>
                      </Box>
                      <Box>
                        <Heading as="h3" size="md" color="white" mb={2}>
                          Data Backup
                        </Heading>
                        <Text color="surface.300" lineHeight="tall">
                          We strongly recommend backing up your databases before performing any synchronization 
                          operations. suparbase is not responsible for data loss.
                        </Text>
                      </Box>
                    </VStack>
                  </Box>

                  <Divider borderColor="surface.700" />

                  <Box>
                    <Heading as="h2" size="lg" color="white" mb={4}>
                      Prohibited Uses
                    </Heading>
                    <Text color="surface.300" lineHeight="tall" mb={4}>
                      You may not use suparbase:
                    </Text>
                    <VStack spacing={3} align="stretch" as="ul" pl={4}>
                      <Text as="li" color="surface.300" lineHeight="tall">
                        For any unlawful purpose or to solicit others to perform unlawful acts
                      </Text>
                      <Text as="li" color="surface.300" lineHeight="tall">
                        To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances
                      </Text>
                      <Text as="li" color="surface.300" lineHeight="tall">
                        To infringe upon or violate our intellectual property rights or the intellectual property rights of others
                      </Text>
                      <Text as="li" color="surface.300" lineHeight="tall">
                        To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate
                      </Text>
                      <Text as="li" color="surface.300" lineHeight="tall">
                        To submit false or misleading information
                      </Text>
                    </VStack>
                  </Box>

                  <Divider borderColor="surface.700" />

                  <Box>
                    <Heading as="h2" size="lg" color="white" mb={4}>
                      Disclaimer of Warranties
                    </Heading>
                    <Text color="surface.300" lineHeight="tall">
                      suparbase is provided "as is" and "as available" without any warranties of any kind, either 
                      express or implied. We do not warrant that the service will be uninterrupted, secure, or error-free. 
                      You use the service at your own risk.
                    </Text>
                  </Box>

                  <Divider borderColor="surface.700" />

                  <Box>
                    <Heading as="h2" size="lg" color="white" mb={4}>
                      Limitation of Liability
                    </Heading>
                    <Text color="surface.300" lineHeight="tall">
                      In no event shall suparbase, its developers, or contributors be liable for any indirect, 
                      incidental, special, consequential, or punitive damages, including without limitation, loss 
                      of profits, data, use, goodwill, or other intangible losses, resulting from your use of the service.
                    </Text>
                  </Box>

                  <Divider borderColor="surface.700" />

                  <Box>
                    <Heading as="h2" size="lg" color="white" mb={4}>
                      Open Source License
                    </Heading>
                    <Text color="surface.300" lineHeight="tall" mb={4}>
                      suparbase is open-source software. The source code is available under the MIT License. 
                      You are free to:
                    </Text>
                    <VStack spacing={3} align="stretch" as="ul" pl={4}>
                      <Text as="li" color="surface.300" lineHeight="tall">
                        Use the software for any purpose
                      </Text>
                      <Text as="li" color="surface.300" lineHeight="tall">
                        Modify the software
                      </Text>
                      <Text as="li" color="surface.300" lineHeight="tall">
                        Distribute the software
                      </Text>
                      <Text as="li" color="surface.300" lineHeight="tall">
                        Self-host the application
                      </Text>
                    </VStack>
                  </Box>

                  <Divider borderColor="surface.700" />

                  <Box>
                    <Heading as="h2" size="lg" color="white" mb={4}>
                      Changes to Terms
                    </Heading>
                    <Text color="surface.300" lineHeight="tall">
                      We reserve the right to modify these terms at any time. We will notify users of any material 
                      changes by updating the "Last updated" date. Your continued use of the service after such 
                      modifications constitutes acceptance of the updated terms.
                    </Text>
                  </Box>

                  <Divider borderColor="surface.700" />

                  <Box>
                    <Heading as="h2" size="lg" color="white" mb={4}>
                      Contact Information
                    </Heading>
                    <Text color="surface.300" lineHeight="tall">
                      If you have any questions about these Terms of Service, please contact us through our GitHub 
                      repository or the contact information provided on our website.
                    </Text>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
}

