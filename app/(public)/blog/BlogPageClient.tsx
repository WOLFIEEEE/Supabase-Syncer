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
  Badge,
  SimpleGrid,
  Input,
  InputGroup,
  InputLeftElement,
  Flex,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { ScrollReveal, GlassCard } from '@/components/animations';

const MotionBox = motion(Box);

const BookIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const categories = [
  { id: 'all', label: 'All Articles', count: 12 },
  { id: 'tutorials', label: 'Tutorials', count: 5 },
  { id: 'tips', label: 'Tips & Tricks', count: 4 },
  { id: 'updates', label: 'Product Updates', count: 2 },
  { id: 'guides', label: 'Guides', count: 1 },
];

const blogPosts = [
  {
    id: 1,
    title: 'Getting Started with Supabase Database Synchronization',
    excerpt: 'Learn how to sync data between your production and development Supabase databases safely and efficiently.',
    category: 'tutorials',
    readTime: '5 min read',
    date: '2024-01-15',
    featured: true,
  },
  {
    id: 2,
    title: 'Preventing Supabase Free Tier Database Pausing',
    excerpt: 'Discover strategies to keep your Supabase databases active and prevent automatic pausing on the free tier.',
    category: 'tips',
    readTime: '3 min read',
    date: '2024-01-10',
    featured: true,
  },
  {
    id: 3,
    title: 'Schema Validation Best Practices',
    excerpt: 'Understand how to validate database schemas before syncing to avoid breaking changes and data loss.',
    category: 'guides',
    readTime: '7 min read',
    date: '2024-01-05',
    featured: false,
  },
  {
    id: 4,
    title: 'Automated Migration Generation Explained',
    excerpt: 'Learn how automatic SQL migration scripts are generated to fix schema differences between databases.',
    category: 'tutorials',
    readTime: '6 min read',
    date: '2024-01-01',
    featured: false,
  },
  {
    id: 5,
    title: 'One-Way vs Two-Way Database Sync',
    excerpt: 'Compare one-way and two-way synchronization strategies and choose the right approach for your use case.',
    category: 'tips',
    readTime: '4 min read',
    date: '2023-12-28',
    featured: false,
  },
  {
    id: 6,
    title: 'Secure Database Connection Management',
    excerpt: 'Best practices for encrypting and managing database connection strings securely in your applications.',
    category: 'tips',
    readTime: '5 min read',
    date: '2023-12-25',
    featured: false,
  },
  {
    id: 7,
    title: 'Understanding Conflict Resolution in Database Sync',
    excerpt: 'Explore different conflict resolution strategies when syncing data between databases with overlapping changes.',
    category: 'tutorials',
    readTime: '8 min read',
    date: '2023-12-20',
    featured: false,
  },
  {
    id: 8,
    title: 'Product Update: Enhanced Schema Comparison',
    excerpt: 'We\'ve improved our schema comparison tool with better visualization and more detailed difference detection.',
    category: 'updates',
    readTime: '2 min read',
    date: '2023-12-15',
    featured: false,
  },
  {
    id: 9,
    title: 'Database Health Monitoring Guide',
    excerpt: 'Set up automated health checks and monitoring for your Supabase databases to ensure reliability.',
    category: 'guides',
    readTime: '6 min read',
    date: '2023-12-10',
    featured: false,
  },
  {
    id: 10,
    title: 'Quick Tips: Optimizing Sync Performance',
    excerpt: 'Simple techniques to improve the speed and efficiency of your database synchronization operations.',
    category: 'tips',
    readTime: '3 min read',
    date: '2023-12-05',
    featured: false,
  },
  {
    id: 11,
    title: 'Product Update: New Keep-Alive Scheduling',
    excerpt: 'Introducing flexible scheduling options for database keep-alive operations with custom intervals.',
    category: 'updates',
    readTime: '2 min read',
    date: '2023-12-01',
    featured: false,
  },
  {
    id: 12,
    title: 'Step-by-Step: Setting Up Your First Sync',
    excerpt: 'A comprehensive walkthrough for setting up and running your first database synchronization job.',
    category: 'tutorials',
    readTime: '10 min read',
    date: '2023-11-28',
    featured: false,
  },
];

export default function BlogPageClient() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = blogPosts.filter((post) => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPosts = filteredPosts.filter((post) => post.featured);
  const regularPosts = filteredPosts.filter((post) => !post.featured);

  return (
    <Box
      minH="100vh"
      bg="rgba(9, 9, 11, 1)"
      position="relative"
      overflow="hidden"
    >
      {/* Animated Background Particles */}
      <MotionBox
        position="absolute"
        top="20%"
        left="10%"
        w="300px"
        h="300px"
        bgGradient="radial(circle, rgba(62, 207, 142, 0.1) 0%, transparent 70%)"
        borderRadius="full"
        filter="blur(60px)"
        pointerEvents="none"
        zIndex={0}
        animate={{
          scale: [1, 1.5, 1],
          x: [0, 100, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <MotionBox
        position="absolute"
        bottom="20%"
        right="10%"
        w="400px"
        h="400px"
        bgGradient="radial(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)"
        borderRadius="full"
        filter="blur(60px)"
        pointerEvents="none"
        zIndex={0}
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -100, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 5,
        }}
      />

      <Container maxW="6xl" py={{ base: 12, md: 20 }} px={{ base: 4, md: 6 }} position="relative" zIndex={1}>
        <VStack spacing={12} align="stretch">
          {/* Header */}
          <ScrollReveal direction="fade" delay={0.2}>
            <VStack spacing={6} align="center" textAlign="center">
              <Badge
                colorScheme="teal"
                px={4}
                py={2}
                borderRadius="full"
                fontSize="sm"
                fontWeight="700"
                letterSpacing="0.1em"
                textTransform="uppercase"
                bgGradient="linear(to-r, teal.500/20, teal.400/20)"
                borderWidth="1px"
                borderColor="teal.400/30"
              >
                BLOG & ARTICLES
              </Badge>
              <Heading
                fontSize={{ base: '4xl', md: '6xl', lg: '7xl' }}
                fontWeight="800"
                color="white"
                fontFamily="mono"
                letterSpacing="-0.03em"
                lineHeight="1.1"
              >
                <Text
                  as="span"
                  bgGradient="linear(to-r, teal.400, purple.400)"
                  bgClip="text"
                  sx={{
                    WebkitTextFillColor: 'transparent',
                    WebkitBackgroundClip: 'text',
                  }}
                >
                  Learn & Grow
                </Text>
              </Heading>
              <Text
                color="surface.400"
                fontSize={{ base: 'lg', md: 'xl' }}
                maxW="3xl"
                lineHeight="1.7"
              >
                Tutorials, tips, and guides to help you master Supabase database management and synchronization.
              </Text>
            </VStack>
          </ScrollReveal>

          {/* Search and Filters */}
          <ScrollReveal direction="up" delay={0.3}>
            <VStack spacing={6} align="stretch">
              <InputGroup size="lg">
                <InputLeftElement pointerEvents="none" color="surface.400">
                  <SearchIcon />
                </InputLeftElement>
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  bg="surface.800"
                  borderColor="surface.700"
                  color="white"
                  _placeholder={{ color: 'surface.500' }}
                  _focus={{
                    borderColor: 'teal.400',
                    boxShadow: '0 0 0 1px var(--chakra-colors-teal-400)',
                  }}
                />
              </InputGroup>

              <Flex wrap="wrap" gap={3} justify="center">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    size="sm"
                    variant={selectedCategory === category.id ? 'solid' : 'outline'}
                    colorScheme="teal"
                    onClick={() => setSelectedCategory(category.id)}
                    borderRadius="full"
                    px={4}
                    fontSize="sm"
                    fontWeight="600"
                    bg={selectedCategory === category.id ? 'teal.500' : 'transparent'}
                    borderColor={selectedCategory === category.id ? 'teal.500' : 'teal.400/40'}
                    color={selectedCategory === category.id ? 'white' : 'teal.400'}
                    _hover={{
                      bg: selectedCategory === category.id ? 'teal.400' : 'teal.400/10',
                      borderColor: 'teal.400',
                    }}
                  >
                    {category.label} ({category.count})
                  </Button>
                ))}
              </Flex>
            </VStack>
          </ScrollReveal>

          {/* Featured Posts */}
          {featuredPosts.length > 0 && (
            <ScrollReveal direction="up" delay={0.4}>
              <VStack spacing={4} align="stretch">
                <Heading size="lg" color="white" fontWeight="700">
                  Featured Articles
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  {featuredPosts.map((post, index) => (
                    <ScrollReveal key={post.id} delay={0.5 + index * 0.1} direction="up">
                      <GlassCard
                        p={6}
                        cursor="pointer"
                        onClick={() => router.push(`/blog/${post.id}`)}
                        bgGradient="linear(to-br, teal.500/10, purple.500/10)"
                        borderColor="teal.400/30"
                        borderWidth="2px"
                        h="100%"
                      >
                        <VStack spacing={4} align="start" h="100%">
                          <HStack spacing={3} w="full" justify="space-between">
                            <Badge
                              colorScheme="teal"
                              fontSize="xs"
                              px={3}
                              py={1}
                              borderRadius="full"
                              textTransform="uppercase"
                            >
                              {post.category}
                            </Badge>
                            <Text color="surface.500" fontSize="xs">
                              {post.readTime}
                            </Text>
                          </HStack>
                          <Heading size="md" color="white" fontWeight="700" lineHeight="1.3">
                            {post.title}
                          </Heading>
                          <Text color="surface.300" fontSize="sm" lineHeight="1.7" flex={1}>
                            {post.excerpt}
                          </Text>
                          <HStack spacing={2} color="teal.400" fontSize="sm" fontWeight="600">
                            <Text>Read more</Text>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                          </HStack>
                        </VStack>
                      </GlassCard>
                    </ScrollReveal>
                  ))}
                </SimpleGrid>
              </VStack>
            </ScrollReveal>
          )}

          {/* Regular Posts */}
          {regularPosts.length > 0 && (
            <ScrollReveal direction="up" delay={0.6}>
              <VStack spacing={4} align="stretch">
                <Heading size="lg" color="white" fontWeight="700">
                  All Articles
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {regularPosts.map((post, index) => (
                    <ScrollReveal key={post.id} delay={0.7 + index * 0.05} direction="up">
                      <GlassCard
                        p={6}
                        cursor="pointer"
                        onClick={() => router.push(`/blog/${post.id}`)}
                        h="100%"
                      >
                        <VStack spacing={4} align="start" h="100%">
                          <HStack spacing={3} w="full" justify="space-between">
                            <Badge
                              colorScheme="teal"
                              fontSize="xs"
                              px={3}
                              py={1}
                              borderRadius="full"
                              textTransform="uppercase"
                            >
                              {post.category}
                            </Badge>
                            <Text color="surface.500" fontSize="xs">
                              {post.readTime}
                            </Text>
                          </HStack>
                          <Heading size="sm" color="white" fontWeight="700" lineHeight="1.3">
                            {post.title}
                          </Heading>
                          <Text color="surface.300" fontSize="sm" lineHeight="1.7" flex={1}>
                            {post.excerpt}
                          </Text>
                          <HStack spacing={2} color="teal.400" fontSize="sm" fontWeight="600">
                            <Text>Read more</Text>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                          </HStack>
                        </VStack>
                      </GlassCard>
                    </ScrollReveal>
                  ))}
                </SimpleGrid>
              </VStack>
            </ScrollReveal>
          )}

          {/* Empty State */}
          {filteredPosts.length === 0 && (
            <ScrollReveal direction="up" delay={0.4}>
              <GlassCard p={12} textAlign="center">
                <VStack spacing={4}>
                  <Box color="surface.500">
                    <BookIcon />
                  </Box>
                  <Heading size="md" color="white">
                    No articles found
                  </Heading>
                  <Text color="surface.400">
                    Try adjusting your search or filter criteria.
                  </Text>
                </VStack>
              </GlassCard>
            </ScrollReveal>
          )}
        </VStack>
      </Container>
    </Box>
  );
}
