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
  Divider,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';

interface FAQItem {
  category: string;
  questions: {
    question: string;
    answer: string;
  }[];
}

const faqData: FAQItem[] = [
  {
    category: 'Getting Started',
    questions: [
      {
        question: 'What is suparbase?',
        answer: 'suparbase is an open-source tool for syncing Supabase databases between environments, managing schema migrations, and preventing free tier databases from pausing due to inactivity. It provides a web interface for database management tasks.',
      },
      {
        question: 'How do I get started?',
        answer: 'Simply sign up for a free account, add your database connections, and start syncing. No credit card required. Check out our guide page for detailed instructions.',
      },
      {
        question: 'Is suparbase free?',
        answer: 'Yes! suparbase is currently in beta testing phase and is completely free to use. We\'ll notify all users well in advance if we introduce pricing in the future.',
      },
    ],
  },
  {
    category: 'Features',
    questions: [
      {
        question: 'What databases does suparbase support?',
        answer: 'suparbase works with any PostgreSQL database, with special optimizations for Supabase. It understands Supabase-specific features like Row Level Security (RLS) policies.',
      },
      {
        question: 'How does the keep-alive service work?',
        answer: 'The keep-alive service automatically sends periodic health checks to your Supabase databases to prevent them from pausing due to inactivity. This is especially useful for free tier databases that pause after periods of inactivity.',
      },
      {
        question: 'Can I sync data between production and development?',
        answer: 'Yes! suparbase allows you to sync data between any two PostgreSQL databases. It validates schema compatibility before syncing and provides safety checks to prevent accidental data loss.',
      },
      {
        question: 'How does schema validation work?',
        answer: 'Schema validation compares the structure of two databases and identifies differences. It categorizes issues by severity (critical, warning, info) and can generate migration scripts to fix schema differences automatically.',
      },
    ],
  },
  {
    category: 'Security & Privacy',
    questions: [
      {
        question: 'How are my database credentials stored?',
        answer: 'All database credentials are encrypted using AES-256-GCM encryption before being stored. We never store your actual database data - only connection information is stored securely.',
      },
      {
        question: 'Is my data safe?',
        answer: 'Yes. suparbase only stores encrypted connection credentials. Your actual database data is never stored on our servers. All data transfers happen directly between your databases.',
      },
      {
        question: 'Can I use suparbase with production databases?',
        answer: 'Yes, but we recommend using it with caution. Always test syncs in development first, use the dry-run feature to preview changes, and ensure you have backups before syncing production data.',
      },
    ],
  },
  {
    category: 'Technical',
    questions: [
      {
        question: 'What is the difference between schema sync and data sync?',
        answer: 'Schema sync compares and synchronizes the structure of your databases (tables, columns, indexes, etc.). Data sync transfers actual data rows between databases. Both can be used together or independently.',
      },
      {
        question: 'How do migration scripts work?',
        answer: 'Migration scripts are automatically generated SQL statements that can fix schema differences between databases. They are designed to be idempotent, meaning they can be run multiple times safely.',
      },
      {
        question: 'Can I customize sync behavior?',
        answer: 'Yes, you can select which tables to sync, configure sync schedules, and set up filters. The interface provides options to customize your sync jobs according to your needs.',
      },
    ],
  },
  {
    category: 'Pricing & Beta',
    questions: [
      {
        question: 'How long will suparbase be free?',
        answer: 'suparbase is currently in beta testing phase and will remain free during this period. We\'ll provide advance notice before any pricing changes. Beta users will receive special early adopter benefits.',
      },
      {
        question: 'What happens when beta ends?',
        answer: 'We plan to offer a free tier with essential features and paid plans for advanced usage. All beta users will be notified and may receive special pricing or features as early adopters.',
      },
      {
        question: 'Are there any usage limits?',
        answer: 'During beta, there are no usage limits. You can create unlimited connections, sync jobs, and use all features without restrictions.',
      },
    ],
  },
];

export default function FAQPageClient() {
  const router = useRouter();

  return (
    <Box minH="100vh">
      <Container maxW="4xl" py={{ base: 8, md: 12 }}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <VStack spacing={4} align="center" textAlign="center">
            <Heading
              size={{ base: 'xl', md: '2xl' }}
              fontFamily="mono"
              bgGradient="linear(to-r, brand.300, brand.500)"
              bgClip="text"
            >
              Frequently Asked Questions
            </Heading>
            <Text color="surface.400" fontSize={{ base: 'md', md: 'lg' }} maxW="2xl">
              Find answers to common questions about suparbase
            </Text>
          </VStack>

          <Divider borderColor="surface.700" />

          {/* FAQ Sections */}
          <VStack spacing={8} align="stretch">
            {faqData.map((section, sectionIndex) => (
              <Box key={sectionIndex}>
                <Heading size="lg" color="white" mb={4}>
                  {section.category}
                </Heading>
                <Accordion allowToggle>
                  {section.questions.map((item, itemIndex) => (
                    <AccordionItem
                      key={itemIndex}
                      borderColor="surface.700"
                      bg="surface.800"
                      mb={2}
                      borderRadius="md"
                      borderWidth="1px"
                    >
                      <AccordionButton
                        _hover={{ bg: 'surface.700' }}
                        py={4}
                      >
                        <Box flex="1" textAlign="left">
                          <Text fontWeight="semibold" color="white">
                            {item.question}
                          </Text>
                        </Box>
                        <AccordionIcon color="brand.400" />
                      </AccordionButton>
                      <AccordionPanel pb={4}>
                        <Text color="surface.400" fontSize="sm" lineHeight="tall">
                          {item.answer}
                        </Text>
                      </AccordionPanel>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Box>
            ))}
          </VStack>

          {/* Still Have Questions */}
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
                Still have questions?
              </Heading>
              <Text color="surface.400">
                Can't find what you're looking for? Check out our guide or contact us directly.
              </Text>
              <HStack spacing={4} justify="center" flexWrap="wrap">
                <Button
                  variant="outline"
                  onClick={() => router.push('/troubleshooting')}
                  minH="48px"
                >
                  Troubleshooting Guide
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/best-practices')}
                  minH="48px"
                >
                  Best Practices
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/guide')}
                  minH="48px"
                >
                  Full Documentation
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

