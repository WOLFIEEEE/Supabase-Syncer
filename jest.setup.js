/**
 * Jest Setup
 * 
 * This file runs before each test file.
 * Used for setting up test utilities and global mocks.
 */

// Import jest-dom for DOM assertions
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import {
  ReadableStream,
  WritableStream,
  TransformStream,
  TextEncoderStream,
  TextDecoderStream,
} from 'stream/web';
import { serialize, deserialize } from 'v8';

// Polyfill TextEncoder/TextDecoder first (required by edge primitives)
if (typeof global.TextEncoder === 'undefined' || typeof global.TextDecoder === 'undefined') {
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

if (
  typeof global.ReadableStream === 'undefined' ||
  typeof global.WritableStream === 'undefined' ||
  typeof global.TransformStream === 'undefined' ||
  typeof global.TextEncoderStream === 'undefined' ||
  typeof global.TextDecoderStream === 'undefined'
) {
  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;
  global.TransformStream = TransformStream;
  global.TextEncoderStream = TextEncoderStream;
  global.TextDecoderStream = TextDecoderStream;
}

if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (value) => deserialize(serialize(value));
}

// Polyfill Fetch API globals required by `next/server` in Jest
if (typeof global.Request === 'undefined' || typeof global.Response === 'undefined' || typeof global.Headers === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const edgePrimitives = require('next/dist/compiled/@edge-runtime/primitives');
  global.Request = edgePrimitives.Request;
  global.Response = edgePrimitives.Response;
  global.Headers = edgePrimitives.Headers;
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
  useParams: () => ({}),
}));

// Mock environment variables for tests
process.env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  // AES-256 requires 32 bytes = 64 hex characters
  ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
};

// Mock fetch globally
global.fetch = jest.fn();

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Suppress console errors in tests (optional)
// const originalError = console.error;
// beforeAll(() => {
//   console.error = (...args) => {
//     if (args[0]?.includes?.('Warning:')) return;
//     originalError.call(console, ...args);
//   };
// });
// afterAll(() => {
//   console.error = originalError;
// });

// Mock crypto for Node.js environment
if (typeof global.crypto === 'undefined') {
  global.crypto = {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  };
}
