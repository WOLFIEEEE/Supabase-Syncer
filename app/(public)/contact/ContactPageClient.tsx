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
  Link,
  SimpleGrid,
} from '@chakra-ui/react';

const MailIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const GithubIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
  </svg>
);

const MessageIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

export default function ContactPageClient() {
  const router = useRouter();

  const contactMethods = [
    {
      icon: GithubIcon,
      title: 'GitHub',
      description: 'Report issues, request features, or contribute to the project.',
      action: 'View on GitHub',
      href: 'https://github.com/yourusername/suparbase',
      external: true,
    },
    {
      icon: MessageIcon,
      title: 'Documentation',
      description: 'Find answers to common questions and learn how to use suparbase.',
      action: 'Read the Guide',
      href: '/guide',
      external: false,
    },
    {
      icon: MailIcon,
      title: 'Email Support',
      description: 'For direct support or inquiries, reach out via email.',
      action: 'Send Email',
      href: 'mailto:support@suparbase.com',
      external: true,
    },
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
              Get in Touch
            </Heading>
            <Text color="surface.400" fontSize={{ base: 'md', md: 'lg' }} maxW="2xl">
              Have questions, feedback, or need help? We're here to assist you.
            </Text>
          </VStack>

          <Divider borderColor="surface.700" />

          {/* Contact Methods */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            {contactMethods.map((method, index) => (
              <Card key={index} bg="surface.800" borderColor="surface.700" borderWidth="1px">
                <CardBody>
                  <VStack spacing={4} align="start">
                    <Box color="brand.400">
                      <method.icon />
                    </Box>
                    <Heading size="md" color="white">
                      {method.title}
                    </Heading>
                    <Text color="surface.400" fontSize="sm">
                      {method.description}
                    </Text>
                    {method.external ? (
                      <Link
                        href={method.href}
                        isExternal
                        color="brand.400"
                        _hover={{ color: 'brand.300' }}
                        fontSize="sm"
                        fontWeight="medium"
                      >
                        {method.action} →
                      </Link>
                    ) : (
                      <Button
                        variant="link"
                        color="brand.400"
                        _hover={{ color: 'brand.300' }}
                        fontSize="sm"
                        fontWeight="medium"
                        onClick={() => router.push(method.href)}
                      >
                        {method.action} →
                      </Button>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          {/* FAQ Link */}
          <Box
            bg="surface.800"
            p={8}
            borderRadius="xl"
            borderWidth="1px"
            borderColor="surface.700"
            textAlign="center"
          >
            <VStack spacing={4}>
              <Heading size="md" color="white">
                Common Questions?
              </Heading>
              <Text color="surface.400">
                Check out our FAQ page for answers to frequently asked questions.
              </Text>
              <Button
                variant="outline"
                onClick={() => router.push('/faq')}
              >
                View FAQ
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}

