'use client';

import { useState } from 'react';
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

const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const toast = useToast();
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: 'Email required',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await resetPassword(email);

      if (error) {
        toast({
          title: 'Failed to send reset email',
          description: error.message,
          status: 'error',
          duration: 3000,
        });
      } else {
        setEmailSent(true);
      }
    } catch (error) {
      toast({
        title: 'Failed to send reset email',
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
        px={4}
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
                We've sent a password reset link to <strong>{email}</strong>. 
                Please check your inbox.
              </Text>
              <Link href="/login" color="brand.400" _hover={{ color: 'brand.300' }}>
                Back to Login
              </Link>
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
      px={4}
    >
      <Container maxW="md">
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box mb={6}>
            <Link 
              href="/login" 
              display="flex" 
              alignItems="center" 
              color="surface.400"
              _hover={{ color: 'surface.300' }}
              gap={2}
            >
              <ArrowLeftIcon />
              Back to login
            </Link>
          </Box>

          <VStack spacing={4} align="center" mb={8}>
            <Heading 
              size="xl"
              fontFamily="mono"
              bgGradient="linear(to-r, brand.300, brand.500)"
              bgClip="text"
            >
              Reset Password
            </Heading>
            <Text color="surface.400" textAlign="center">
              Enter your email address and we'll send you a link to reset your password.
            </Text>
          </VStack>

          <Box
            bg="surface.800"
            p={8}
            borderRadius="2xl"
            borderWidth="1px"
            borderColor="surface.700"
            boxShadow="xl"
          >
            <form onSubmit={handleSubmit}>
              <VStack spacing={6}>
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

                <Button
                  type="submit"
                  size="lg"
                  width="full"
                  isLoading={isLoading}
                  loadingText="Sending..."
                  bg="brand.500"
                  color="white"
                  _hover={{ bg: 'brand.400' }}
                  _active={{ bg: 'brand.600' }}
                >
                  Send Reset Link
                </Button>
              </VStack>
            </form>
          </Box>
        </MotionBox>
      </Container>
    </Box>
  );
}

