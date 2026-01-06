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
  HStack,
  Divider,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/supabase/auth-context';

const MotionBox = motion.create(Box);
const MotionVStack = motion.create(VStack);

// Icons
const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
    } catch {
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
                    <polyline points="20 6 9 17 4 12"/>
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
                We&apos;ve sent a password reset link to{' '}
                <Text as="span" fontWeight="600" color="white">{email}</Text>.
                <br />
                Please check your inbox and click the link to reset your password.
              </Text>
              <Button 
                onClick={() => window.location.href = '/login'} 
                size="lg"
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
          <VStack spacing={8} align="stretch">
            {/* Header */}
            <MotionVStack
              spacing={3}
              align="center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Heading 
                size="2xl"
                fontWeight="600"
                color="white"
                textAlign="center"
                letterSpacing="-0.02em"
                fontFamily="'Outfit', sans-serif"
              >
                Reset password
              </Heading>
              <Text 
                color="surface.400" 
                textAlign="center" 
                fontSize="md"
                maxW="sm"
              >
                Enter your email address and we&apos;ll send you a link to reset your password
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
                  <VStack spacing={5}>
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

                    <Button
                      type="submit"
                      size="lg"
                      width="full"
                      isLoading={isLoading}
                      loadingText="Sending..."
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
                      Send reset link
                    </Button>
                  </VStack>
                </form>

                <Divider borderColor="surface.700" my={6} />

                <HStack justify="center">
                  <Link 
                    href="/login" 
                    color="surface.400"
                    fontSize="sm"
                    fontWeight="500"
                    display="flex"
                    alignItems="center"
                    gap={2}
                    _hover={{ color: 'surface.200', textDecoration: 'underline' }}
                  >
                    <ArrowLeftIcon />
                    Back to login
                  </Link>
                </HStack>
              </Box>
            </MotionBox>
          </VStack>
        </MotionBox>
      </Container>
    </Box>
  );
}
