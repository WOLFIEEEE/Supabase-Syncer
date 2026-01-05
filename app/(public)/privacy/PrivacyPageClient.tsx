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

export default function PrivacyPageClient() {
  const router = useRouter();

  // Structured Data (JSON-LD)
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Privacy Policy | suparbase',
    description: 'Privacy Policy for suparbase - Learn how we protect your data, handle database connections, and ensure security.',
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
              Privacy Policy
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
                      Introduction
                    </Heading>
                    <Text color="surface.300" lineHeight="tall">
                      suparbase is an open-source tool designed to help you synchronize database schemas and data 
                      between Supabase environments. We are committed to protecting your privacy and ensuring the 
                      security of your data. This Privacy Policy explains how we handle information when you use our service.
                    </Text>
                  </Box>

                  <Divider borderColor="surface.700" />

                  <Box>
                    <Heading as="h2" size="lg" color="white" mb={4}>
                      Data We Collect
                    </Heading>
                    <VStack spacing={4} align="stretch">
                      <Box>
                        <Heading as="h3" size="md" color="white" mb={2}>
                          Database Connection Information
                        </Heading>
                        <Text color="surface.300" lineHeight="tall">
                          When you add a database connection, we encrypt and store your database connection strings 
                          using AES-256-GCM encryption. These credentials are stored securely and are only used to 
                          establish connections for synchronization purposes.
                        </Text>
                      </Box>
                      <Box>
                        <Heading as="h3" size="md" color="white" mb={2}>
                          Account Information
                        </Heading>
                        <Text color="surface.300" lineHeight="tall">
                          If you create an account, we collect your email address and authentication information 
                          through Supabase Auth. This information is used solely for account management and authentication.
                        </Text>
                      </Box>
                      <Box>
                        <Heading as="h3" size="md" color="white" mb={2}>
                          Usage Data
                        </Heading>
                        <Text color="surface.300" lineHeight="tall">
                          We may collect information about how you use the service, including sync job history, 
                          connection activity, and error logs. This data helps us improve the service and troubleshoot issues.
                        </Text>
                      </Box>
                    </VStack>
                  </Box>

                  <Divider borderColor="surface.700" />

                  <Box>
                    <Heading as="h2" size="lg" color="white" mb={4}>
                      How We Use Your Data
                    </Heading>
                    <VStack spacing={3} align="stretch" as="ul" pl={4}>
                      <Text as="li" color="surface.300" lineHeight="tall">
                        To provide and maintain our service
                      </Text>
                      <Text as="li" color="surface.300" lineHeight="tall">
                        To process synchronization requests between your databases
                      </Text>
                      <Text as="li" color="surface.300" lineHeight="tall">
                        To notify you about changes to our service
                      </Text>
                      <Text as="li" color="surface.300" lineHeight="tall">
                        To provide customer support
                      </Text>
                      <Text as="li" color="surface.300" lineHeight="tall">
                        To monitor and analyze usage patterns
                      </Text>
                    </VStack>
                  </Box>

                  <Divider borderColor="surface.700" />

                  <Box>
                    <Heading as="h2" size="lg" color="white" mb={4}>
                      Data Security
                    </Heading>
                    <Text color="surface.300" lineHeight="tall" mb={4}>
                      We implement industry-standard security measures to protect your data:
                    </Text>
                    <VStack spacing={3} align="stretch" as="ul" pl={4}>
                      <Text as="li" color="surface.300" lineHeight="tall">
                        <strong>Encryption:</strong> All database connection strings are encrypted using AES-256-GCM before storage
                      </Text>
                      <Text as="li" color="surface.300" lineHeight="tall">
                        <strong>Secure Storage:</strong> Data is stored in Supabase with Row Level Security (RLS) policies
                      </Text>
                      <Text as="li" color="surface.300" lineHeight="tall">
                        <strong>No Data Transmission:</strong> We never transmit your database data through our servers; 
                        all synchronization happens directly between your databases
                      </Text>
                      <Text as="li" color="surface.300" lineHeight="tall">
                        <strong>Access Control:</strong> Only you have access to your connections and sync jobs
                      </Text>
                    </VStack>
                  </Box>

                  <Divider borderColor="surface.700" />

                  <Box>
                    <Heading as="h2" size="lg" color="white" mb={4}>
                      Data Retention
                    </Heading>
                    <Text color="surface.300" lineHeight="tall">
                      We retain your data for as long as your account is active or as needed to provide our services. 
                      You can delete your connections and sync jobs at any time. When you delete your account, all 
                      associated data is permanently removed from our systems.
                    </Text>
                  </Box>

                  <Divider borderColor="surface.700" />

                  <Box>
                    <Heading as="h2" size="lg" color="white" mb={4}>
                      Your Rights
                    </Heading>
                    <Text color="surface.300" lineHeight="tall" mb={4}>
                      Under GDPR and other privacy laws, you have the right to:
                    </Text>
                    <VStack spacing={3} align="stretch" as="ul" pl={4}>
                      <Text as="li" color="surface.300" lineHeight="tall">
                        Access your personal data
                      </Text>
                      <Text as="li" color="surface.300" lineHeight="tall">
                        Correct inaccurate data
                      </Text>
                      <Text as="li" color="surface.300" lineHeight="tall">
                        Request deletion of your data
                      </Text>
                      <Text as="li" color="surface.300" lineHeight="tall">
                        Object to processing of your data
                      </Text>
                      <Text as="li" color="surface.300" lineHeight="tall">
                        Data portability
                      </Text>
                    </VStack>
                  </Box>

                  <Divider borderColor="surface.700" />

                  <Box>
                    <Heading as="h2" size="lg" color="white" mb={4}>
                      Third-Party Services
                    </Heading>
                    <Text color="surface.300" lineHeight="tall" mb={4}>
                      We use the following third-party services:
                    </Text>
                    <VStack spacing={3} align="stretch">
                      <Box>
                        <Heading as="h3" size="sm" color="white" mb={1}>
                          Supabase
                        </Heading>
                        <Text color="surface.300" fontSize="sm" lineHeight="tall">
                          We use Supabase for authentication and data storage. Supabase's privacy policy applies 
                          to data stored in their systems.
                        </Text>
                      </Box>
                    </VStack>
                  </Box>

                  <Divider borderColor="surface.700" />

                  <Box>
                    <Heading as="h2" size="lg" color="white" mb={4}>
                      Open Source
                    </Heading>
                    <Text color="surface.300" lineHeight="tall">
                      suparbase is open-source software. You can self-host the application and have complete control 
                      over your data. When self-hosting, all data remains on your infrastructure, and this privacy 
                      policy applies to your own deployment.
                    </Text>
                  </Box>

                  <Divider borderColor="surface.700" />

                  <Box>
                    <Heading as="h2" size="lg" color="white" mb={4}>
                      Changes to This Policy
                    </Heading>
                    <Text color="surface.300" lineHeight="tall">
                      We may update this Privacy Policy from time to time. We will notify you of any changes by 
                      posting the new Privacy Policy on this page and updating the "Last updated" date.
                    </Text>
                  </Box>

                  <Divider borderColor="surface.700" />

                  <Box>
                    <Heading as="h2" size="lg" color="white" mb={4}>
                      Contact Us
                    </Heading>
                    <Text color="surface.300" lineHeight="tall">
                      If you have any questions about this Privacy Policy, please contact us through our GitHub 
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

