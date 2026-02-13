'use client';

import {
  Box,
  Container,
  Grid,
  Heading,
  HStack,
  StackProps,
  Text,
  VStack,
} from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface SectionShellProps extends StackProps {
  label?: string;
  title?: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
  maxW?: string;
}

export function SectionShell({
  label,
  title,
  description,
  actions,
  children,
  maxW = '7xl',
  ...rest
}: SectionShellProps) {
  return (
    <Box as="section" py={{ base: 10, md: 16 }} {...rest}>
      <Container maxW={maxW} px={{ base: 4, md: 6 }}>
        <VStack align="stretch" spacing={{ base: 6, md: 8 }}>
          {(label || title || description || actions) && (
            <VStack align="start" spacing={3}>
              {label && (
                <Text textStyle="label" color="accent.primary">
                  {label}
                </Text>
              )}
              {title && (
                <Heading textStyle="h1" color="text.primary">
                  {title}
                </Heading>
              )}
              {description && (
                <Text textStyle="bodyLg" maxW="3xl">
                  {description}
                </Text>
              )}
              {actions && <HStack spacing={3}>{actions}</HStack>}
            </VStack>
          )}
          {children}
        </VStack>
      </Container>
    </Box>
  );
}

interface HeroShellProps {
  label?: string;
  title: ReactNode;
  description: ReactNode;
  actions?: ReactNode;
  rightPane?: ReactNode;
}

export function HeroShell({ label, title, description, actions, rightPane }: HeroShellProps) {
  return (
    <Box as="section" py={{ base: 12, md: 18 }}>
      <Container maxW="7xl" px={{ base: 4, md: 6 }}>
        <Grid
          templateColumns={{ base: '1fr', lg: rightPane ? '1.2fr 0.8fr' : '1fr' }}
          gap={{ base: 10, lg: 10 }}
          alignItems="center"
        >
          <VStack align="start" spacing={5}>
            {label && (
              <Text textStyle="label" color="accent.primary">
                {label}
              </Text>
            )}
            <Heading textStyle="display" color="text.primary">
              {title}
            </Heading>
            <Text textStyle="bodyLg" maxW="2xl">
              {description}
            </Text>
            {actions && <HStack spacing={3} flexWrap="wrap">{actions}</HStack>}
          </VStack>
          {rightPane && (
            <Box className="surface-panel" p={{ base: 5, md: 7 }}>
              {rightPane}
            </Box>
          )}
        </Grid>
      </Container>
    </Box>
  );
}

interface FeatureGridProps {
  children: ReactNode;
  columns?: { base: string; md?: string; lg?: string };
}

export function FeatureGrid({ children, columns }: FeatureGridProps) {
  return (
    <Grid
      templateColumns={columns || { base: '1fr', md: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }}
      gap={{ base: 4, md: 5 }}
    >
      {children}
    </Grid>
  );
}

interface MetricPanelProps {
  label: string;
  value: string;
  helper?: string;
}

export function MetricPanel({ label, value, helper }: MetricPanelProps) {
  return (
    <Box className="surface-panel-muted" p={{ base: 4, md: 5 }}>
      <Text textStyle="label" color="text.tertiary" mb={2}>
        {label}
      </Text>
      <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="700" color="text.primary" lineHeight="1.1">
        {value}
      </Text>
      {helper && (
        <Text textStyle="body" mt={2}>
          {helper}
        </Text>
      )}
    </Box>
  );
}

interface CtaStripProps {
  title: string;
  description: string;
  actions: ReactNode;
}

export function CtaStrip({ title, description, actions }: CtaStripProps) {
  return (
    <Box className="surface-strip" p={{ base: 6, md: 8 }}>
      <VStack align="start" spacing={4}>
        <Heading textStyle="h2">{title}</Heading>
        <Text textStyle="bodyLg" maxW="3xl">
          {description}
        </Text>
        <HStack spacing={3} flexWrap="wrap">
          {actions}
        </HStack>
      </VStack>
    </Box>
  );
}
