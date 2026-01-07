'use client';

import { useState } from 'react';
import {
  Box,
  Code,
  IconButton,
  HStack,
  Text,
  useToast,
  Tooltip,
} from '@chakra-ui/react';

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  showCopy?: boolean;
}

export default function CodeBlock({ code, language, title, showCopy = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast({
        title: 'Copied to clipboard',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Failed to copy',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      position="relative"
      bg="gray.900"
      borderRadius="md"
      borderWidth="1px"
      borderColor="surface.700"
      overflow="hidden"
    >
      {title && (
        <Box
          bg="surface.800"
          px={4}
          py={2}
          borderBottomWidth="1px"
          borderColor="surface.700"
        >
          <Text fontSize="sm" color="surface.400" fontWeight="medium">
            {title}
          </Text>
        </Box>
      )}
      <Box position="relative">
        {showCopy && (
          <HStack
            position="absolute"
            top={2}
            right={2}
            spacing={1}
            zIndex={1}
          >
            <Tooltip label={copied ? 'Copied!' : 'Copy code'} placement="left">
              <IconButton
                aria-label="Copy code"
                icon={copied ? <CheckIcon /> : <CopyIcon />}
                size="sm"
                variant="ghost"
                color={copied ? 'green.400' : 'surface.400'}
                onClick={handleCopy}
                _hover={{ bg: 'surface.700', color: 'white' }}
              />
            </Tooltip>
          </HStack>
        )}
        <Code
          display="block"
          p={4}
          bg="transparent"
          color="green.300"
          fontSize="sm"
          whiteSpace="pre-wrap"
          overflowX="auto"
          fontFamily="mono"
        >
          {code}
        </Code>
      </Box>
    </Box>
  );
}

