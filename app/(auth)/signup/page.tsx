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
  Divider,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/supabase/auth-context';

const MotionBox = motion.create(Box);
const MotionVStack = motion.create(VStack);

// Icons
const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
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
    } catch (_error) {
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
        display="flex"
        alignItems="center"
        justifyContent="center"
        minH="calc(100vh - 80px)"
        px={{ base: 4, md: 6 }}
        py={{ base: 8, md: 12 }}
      >
        <Container maxW={{ base: '100%', sm: 'md' }} px={0}>
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Box
              bg="surface.800"
              p={{ base: 6, md: 8 }}
              borderRadius="2xl"
              borderWidth="1px"
              borderColor="surface.700"
              boxShadow="0 8px 32px rgba(0, 0, 0, 0.4)"
              textAlign="center"
            >
              <Box
                color="brand.400"
                mb={6}
                display="flex"
                justifyContent="center"
              >
                <Box
                  w={16}
                  h={16}
                  borderRadius="full"
                  bg="brand.500"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  boxShadow="0 0 20px rgba(62, 207, 142, 0.3)"
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </Box>
              </Box>
              <Heading
                size="xl"
                mb={3}
                color="white"
                fontWeight="600"
                fontFamily="'Outfit', sans-serif"
                letterSpacing="-0.01em"
              >
                Check your email
              </Heading>
              <Text color="surface.300" mb={6} fontSize="md" lineHeight="1.6">
                We&apos;ve sent a confirmation link to{' '}
                <Text as="span" fontWeight="600" color="white">{email}</Text>.
                <br />
                Please check your inbox and click the link to verify your account.
              </Text>
              <Button
                onClick={() => router.push('/login')}
                size="lg"
                h="48px"
                minH="48px"
                w={{ base: 'full', sm: 'auto' }}
                bgGradient="linear(to-r, brand.500, brand.600)"
                color="white"
                fontWeight="600"
                _hover={{
                  bgGradient: 'linear(to-r, brand.400, brand.500)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(62, 207, 142, 0.4)'
                }}
                _active={{ transform: 'translateY(0)' }}
                transition="all 0.2s"
              >
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
      display="flex"
      alignItems="center"
      justifyContent="center"
      minH="calc(100vh - 80px)"
      px={{ base: 4, md: 6 }}
      py={{ base: 8, md: 12 }}
    >
      <Container maxW="md" px={0}>
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <VStack spacing={{ base: 6, md: 8 }} align="stretch">
            {/* Header */}
            <MotionVStack
              spacing={3}
              align="center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Heading
                size={{ base: 'xl', md: '2xl' }}
                fontWeight="600"
                color="white"
                textAlign="center"
                letterSpacing={{ base: '-0.01em', md: '-0.02em' }}
                fontFamily="'Outfit', sans-serif"
              >
                Create your account
              </Heading>
              <Text
                color="surface.400"
                textAlign="center"
                fontSize="md"
                maxW="sm"
              >
                Get started with database synchronization
              </Text>
            </MotionVStack>

            {/* Form Card */}
            <MotionBox
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Box
                bg="surface.800"
                p={{ base: 6, md: 8 }}
                borderRadius="2xl"
                borderWidth="1px"
                borderColor="surface.700"
                boxShadow="0 8px 32px rgba(0, 0, 0, 0.4)"
                backdropFilter="blur(10px)"
              >
                <form onSubmit={handleSubmit}>
                  <VStack spacing={{ base: 4, md: 5 }}>
                    <FormControl>
                      <FormLabel
                        color="surface.200"
                        fontSize="sm"
                        fontWeight="500"
                        mb={2}
                      >
                        Email address
                      </FormLabel>
                      <InputGroup>
                        <InputLeftElement
                          pointerEvents="none"
                          color="surface.400"
                          height="100%"
                          pl={3}
                        >
                          <MailIcon />
                        </InputLeftElement>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          size="lg"
                          h="48px"
                          bg="surface.900"
                          borderColor="surface.600"
                          color="white"
                          _placeholder={{ color: 'surface.500' }}
                          _hover={{ borderColor: 'surface.500' }}
                          _focus={{
                            borderColor: 'brand.500',
                            boxShadow: '0 0 0 3px rgba(62, 207, 142, 0.1)'
                          }}
                          pl={10}
                        />
                      </InputGroup>
                    </FormControl>

                    <FormControl>
                      <FormLabel
                        color="surface.200"
                        fontSize="sm"
                        fontWeight="500"
                        mb={2}
                      >
                        Password
                      </FormLabel>
                      <InputGroup>
                        <InputLeftElement
                          pointerEvents="none"
                          color="surface.400"
                          height="100%"
                          pl={3}
                        >
                          <LockIcon />
                        </InputLeftElement>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create a strong password"
                          size="lg"
                          h="48px"
                          bg="surface.900"
                          borderColor="surface.600"
                          color="white"
                          _placeholder={{ color: 'surface.500' }}
                          _hover={{ borderColor: 'surface.500' }}
                          _focus={{
                            borderColor: 'brand.500',
                            boxShadow: '0 0 0 3px rgba(62, 207, 142, 0.1)'
                          }}
                          pl={10}
                          pr={12}
                        />
                        <InputRightElement width="3rem" height="100%">
                          <IconButton
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            icon={showPassword ? <EyeOffIcon /> : <EyeIcon />}
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPassword(!showPassword)}
                            color="surface.400"
                            _hover={{ color: 'surface.200', bg: 'surface.700' }}
                          />
                        </InputRightElement>
                      </InputGroup>
                      <Text color="surface.500" fontSize="xs" mt={1.5}>
                        Must be at least 6 characters
                      </Text>
                    </FormControl>

                    <FormControl>
                      <FormLabel
                        color="surface.200"
                        fontSize="sm"
                        fontWeight="500"
                        mb={2}
                      >
                        Confirm password
                      </FormLabel>
                      <InputGroup>
                        <InputLeftElement
                          pointerEvents="none"
                          color="surface.400"
                          height="100%"
                          pl={3}
                        >
                          <LockIcon />
                        </InputLeftElement>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm your password"
                          size="lg"
                          h="48px"
                          bg="surface.900"
                          borderColor="surface.600"
                          color="white"
                          _placeholder={{ color: 'surface.500' }}
                          _hover={{ borderColor: 'surface.500' }}
                          _focus={{
                            borderColor: 'brand.500',
                            boxShadow: '0 0 0 3px rgba(62, 207, 142, 0.1)'
                          }}
                          pl={10}
                          pr={12}
                        />
                        <InputRightElement width="3rem" height="100%">
                          <IconButton
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            icon={showPassword ? <EyeOffIcon /> : <EyeIcon />}
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPassword(!showPassword)}
                            color="surface.400"
                            _hover={{ color: 'surface.200', bg: 'surface.700' }}
                          />
                        </InputRightElement>
                      </InputGroup>
                    </FormControl>

                    <Button
                      type="submit"
                      size="lg"
                      width="full"
                      h="48px"
                      minH="48px"
                      isLoading={isLoading}
                      loadingText="Creating account..."
                      bgGradient="linear(to-r, brand.500, brand.600)"
                      color="white"
                      fontWeight="600"
                      _hover={{
                        bgGradient: 'linear(to-r, brand.400, brand.500)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(62, 207, 142, 0.4)'
                      }}
                      _active={{ transform: 'translateY(0)' }}
                      transition="all 0.2s"
                      mt={2}
                    >
                      Create account
                    </Button>
                  </VStack>
                </form>

                <Divider borderColor="surface.700" my={6} />

                <Text color="surface.400" fontSize="sm" textAlign="center">
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    color="brand.400"
                    fontWeight="500"
                    _hover={{ color: 'brand.300', textDecoration: 'underline' }}
                  >
                    Sign in
                  </Link>
                </Text>
              </Box>
            </MotionBox>
          </VStack>
        </MotionBox>
      </Container>
    </Box>
  );
}
