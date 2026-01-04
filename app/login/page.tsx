'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  VStack,
  useToast,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  Link,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/supabase/auth-context';

const MotionBox = motion.create(Box);

// Icons
const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const DatabaseIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { signIn } = useAuth();

  const redirectTo = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Email and password required',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        toast({
          title: 'Login failed',
          description: error.message || 'Invalid credentials',
          status: 'error',
          duration: 3000,
        });
      } else {
        toast({
          title: 'Login successful',
          status: 'success',
          duration: 2000,
        });
        router.push(redirectTo);
        router.refresh();
      }
    } catch (error) {
      toast({
        title: 'Login failed',
        description: 'An error occurred',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box 
      minH="100vh" 
      className="gradient-mesh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={{ base: 4, md: 4 }}
      py={{ base: 8, md: 0 }}
    >
      <Container maxW="md" px={{ base: 0, md: 4 }}>
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <VStack spacing={{ base: 6, md: 8 }} align="center" mb={{ base: 6, md: 8 }}>
            <Box color="brand.400">
              <DatabaseIcon />
            </Box>
            <VStack spacing={2}>
              <Heading 
                size={{ base: 'lg', md: 'xl' }}
                fontFamily="mono"
                bgGradient="linear(to-r, brand.300, brand.500)"
                bgClip="text"
                textAlign="center"
              >
                Supabase Syncer
              </Heading>
              <Text color="surface.400" textAlign="center" fontSize={{ base: 'sm', md: 'md' }} px={4}>
                Sign in to manage your database synchronization
              </Text>
            </VStack>
          </VStack>

          <Box
            bg="surface.800"
            p={{ base: 6, md: 8 }}
            borderRadius={{ base: 'xl', md: '2xl' }}
            borderWidth="1px"
            borderColor="surface.700"
            boxShadow="xl"
            mx={{ base: 2, md: 0 }}
          >
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel color="surface.300" fontSize="sm" fontWeight="medium">
                    Email
                  </FormLabel>
                  <InputGroup size="lg">
                    <InputLeftElement pointerEvents="none" color="surface.500">
                      <MailIcon />
                    </InputLeftElement>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      bg="surface.900"
                      borderColor="surface.600"
                      _hover={{ borderColor: 'surface.500' }}
                      _focus={{ 
                        borderColor: 'brand.500',
                        boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)'
                      }}
                    />
                  </InputGroup>
                </FormControl>

                <FormControl>
                  <FormLabel color="surface.300" fontSize="sm" fontWeight="medium">
                    Password
                  </FormLabel>
                  <InputGroup size="lg">
                    <InputLeftElement pointerEvents="none" color="surface.500">
                      <LockIcon />
                    </InputLeftElement>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      bg="surface.900"
                      borderColor="surface.600"
                      _hover={{ borderColor: 'surface.500' }}
                      _focus={{ 
                        borderColor: 'brand.500',
                        boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)'
                      }}
                      pr={12}
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        icon={showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        color="surface.500"
                        _hover={{ color: 'surface.300' }}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <Box w="full" textAlign="right">
                  <Link 
                    href="/forgot-password" 
                    color="brand.400" 
                    fontSize="sm"
                    _hover={{ color: 'brand.300' }}
                  >
                    Forgot password?
                  </Link>
                </Box>

                <Button
                  type="submit"
                  size="lg"
                  width="full"
                  isLoading={isLoading}
                  loadingText="Signing in..."
                  bg="brand.500"
                  color="white"
                  _hover={{ bg: 'brand.400' }}
                  _active={{ bg: 'brand.600' }}
                >
                  Sign In
                </Button>
              </VStack>
            </form>

            <Text color="surface.400" fontSize="sm" textAlign="center" mt={6}>
              Don't have an account?{' '}
              <Link href="/signup" color="brand.400" _hover={{ color: 'brand.300' }}>
                Sign up
              </Link>
            </Text>
          </Box>

          <Text color="surface.600" fontSize="sm" textAlign="center" mt={6}>
            Production-ready database sync with safety guarantees
          </Text>
        </MotionBox>
      </Container>
    </Box>
  );
}
