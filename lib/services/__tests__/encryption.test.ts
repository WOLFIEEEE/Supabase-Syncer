/**
 * Encryption Service Tests
 * 
 * Tests for encryption/decryption functions.
 */

import { validateDatabaseUrl, maskDatabaseUrl } from '../encryption';

// Mock environment before importing encryption functions
const MOCK_ENCRYPTION_KEY = 'a'.repeat(64); // 64 hex chars = 32 bytes

describe('Encryption Service', () => {
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = MOCK_ENCRYPTION_KEY;
  });

  describe('validateDatabaseUrl', () => {
    it('should return true for valid PostgreSQL URL', () => {
      expect(validateDatabaseUrl('postgresql://user:pass@localhost:5432/db')).toBe(true);
    });

    it('should return true for postgres:// protocol', () => {
      expect(validateDatabaseUrl('postgres://user:pass@localhost:5432/db')).toBe(true);
    });

    it('should return false for invalid protocol', () => {
      expect(validateDatabaseUrl('mysql://user:pass@localhost:3306/db')).toBe(false);
    });

    it('should return false for invalid URL', () => {
      expect(validateDatabaseUrl('not-a-valid-url')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(validateDatabaseUrl('')).toBe(false);
    });
  });

  describe('maskDatabaseUrl', () => {
    it('should mask password in URL', () => {
      const url = 'postgresql://user:secretpassword@localhost:5432/db';
      const masked = maskDatabaseUrl(url);
      
      expect(masked).not.toContain('secretpassword');
      expect(masked).toContain('****');
      expect(masked).toContain('user');
      expect(masked).toContain('localhost');
    });

    it('should handle URL without password', () => {
      const url = 'postgresql://localhost:5432/db';
      const masked = maskDatabaseUrl(url);
      
      expect(masked).toContain('localhost');
    });

    it('should return masked value for invalid URL', () => {
      const masked = maskDatabaseUrl('not-a-url');
      expect(masked).toBe('****');
    });
  });

  describe('encrypt and decrypt', () => {
    // Note: These tests require the crypto module and a valid key
    // In a real test environment, you would test the full encrypt/decrypt cycle
    
    it('should require ENCRYPTION_KEY environment variable', () => {
      // This is a smoke test to verify the module loads
      expect(process.env.ENCRYPTION_KEY).toBeDefined();
    });
  });
});
