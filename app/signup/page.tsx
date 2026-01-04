'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const { signUp } = useAuth();

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

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(email, password);

      if (error) {
        toast({
          title: 'Sign up failed',
          description: error.message || 'Failed to create account',
          status: 'error',
          duration: 3000,
        });
      } else {
        setEmailSent(true);
      }
    } catch (error) {
      toast({
        title: 'Sign up failed',
        description: 'An error occurred',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <Box 
        minH="100vh" 
        className="gradient-mesh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={{ base: 4, md: 4 }}
      >
        <Container maxW="md">
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box
              bg="surface.800"
              p={8}
              borderRadius="2xl"
              borderWidth="1px"
              borderColor="surface.700"
              textAlign="center"
            >
              <Box color="green.400" mb={4}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto' }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </Box>
              <Heading size="lg" mb={4}>Check your email</Heading>
              <Text color="surface.400" mb={6}>
                We've sent a confirmation link to <strong>{email}</strong>. 
                Please check your inbox and click the link to verify your account.
              </Text>
              <Button onClick={() => router.push('/login')} colorScheme="teal">
                Back to Login
              </Button>
            </Box>
          </MotionBox>
        </Container>
      </Box>
    );
  }

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
                Create Account
              </Heading>
              <Text color="surface.400" textAlign="center" fontSize={{ base: 'sm', md: 'md' }} px={4}>
                Get started with Supabase Syncer
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
                      placeholder="Create a password"
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

                <FormControl>
                  <FormLabel color="surface.300" fontSize="sm" fontWeight="medium">
                    Confirm Password
                  </FormLabel>
                  <InputGroup size="lg">
                    <InputLeftElement pointerEvents="none" color="surface.500">
                      <LockIcon />
                    </InputLeftElement>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      bg="surface.900"
                      borderColor="surface.600"
                      _hover={{ borderColor: 'surface.500' }}
                      _focus={{ 
                        borderColor: 'brand.500',
                        boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)'
                      }}
                      pr={12}
                    />
                  </InputGroup>
                </FormControl>

                <Button
                  type="submit"
                  size="lg"
                  width="full"
                  isLoading={isLoading}
                  loadingText="Creating account..."
                  bg="brand.500"
                  color="white"
                  _hover={{ bg: 'brand.400' }}
                  _active={{ bg: 'brand.600' }}
                  mt={2}
                >
                  Create Account
                </Button>
              </VStack>
            </form>

            <Text color="surface.400" fontSize="sm" textAlign="center" mt={6}>
              Already have an account?{' '}
              <Link href="/login" color="brand.400" _hover={{ color: 'brand.300' }}>
                Sign in
              </Link>
            </Text>
          </Box>
        </MotionBox>
      </Container>
    </Box>
  );
}

