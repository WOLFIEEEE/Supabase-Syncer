/**
 * Input Validation Tests
 * 
 * Tests for input validation and sanitization.
 */

import {
  ConnectionInputSchema,
  SyncJobInputSchema,
  TableConfigSchema,
  validateInput,
  sanitizeTableName,
  sanitizeTableNames,
  validateBodyStructure,
} from '@/lib/validations/schemas';
import {
  escapeIdentifier,
  sanitizeErrorMessage,
  isValidUUID,
} from '@/lib/services/security-utils';

describe('Input Validation', () => {
  describe('ConnectionInputSchema', () => {
    it('should accept valid connection input', () => {
      const valid = {
        name: 'My Database',
        databaseUrl: 'postgresql://user:pass@localhost:5432/db',
        environment: 'development',
      };
      
      const result = validateInput(ConnectionInputSchema, valid);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const invalid = {
        name: '',
        databaseUrl: 'postgresql://user:pass@localhost:5432/db',
        environment: 'development',
      };
      
      const result = validateInput(ConnectionInputSchema, invalid);
      expect(result.success).toBe(false);
    });

    it('should reject invalid database URL', () => {
      const invalidUrls = [
        'not-a-url',
        'mysql://user:pass@localhost/db',
        'ftp://example.com/file',
        'javascript:alert(1)',
      ];

      for (const url of invalidUrls) {
        const result = validateInput(ConnectionInputSchema, {
          name: 'Test',
          databaseUrl: url,
          environment: 'development',
        });
        expect(result.success).toBe(false);
      }
    });

    it('should reject invalid environment', () => {
      const result = validateInput(ConnectionInputSchema, {
        name: 'Test',
        databaseUrl: 'postgresql://user:pass@localhost:5432/db',
        environment: 'staging', // Not allowed
      });
      expect(result.success).toBe(false);
    });
  });

  describe('TableConfigSchema', () => {
    it('should accept valid table config', () => {
      const valid = {
        tableName: 'users',
        enabled: true,
        conflictStrategy: 'last_write_wins',
      };
      
      const result = validateInput(TableConfigSchema, valid);
      expect(result.success).toBe(true);
    });

    it('should reject SQL injection in table name', () => {
      const maliciousNames = [
        'users; DROP TABLE users;',
        "users' OR '1'='1",
        'users--',
        '../../../etc/passwd',
        'users\x00',
        'SELECT * FROM',
      ];

      for (const name of maliciousNames) {
        const result = validateInput(TableConfigSchema, {
          tableName: name,
          enabled: true,
        });
        expect(result.success).toBe(false);
      }
    });

    it('should accept valid table names', () => {
      const validNames = [
        'users',
        'user_accounts',
        'UserAccounts',
        '_private_table',
        'table123',
      ];

      for (const name of validNames) {
        const result = validateInput(TableConfigSchema, {
          tableName: name,
          enabled: true,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('SyncJobInputSchema', () => {
    it('should reject same source and target', () => {
      const result = validateInput(SyncJobInputSchema, {
        sourceConnectionId: '123e4567-e89b-12d3-a456-426614174000',
        targetConnectionId: '123e4567-e89b-12d3-a456-426614174000',
        direction: 'one_way',
        tables: [{ tableName: 'users', enabled: true }],
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty tables array', () => {
      const result = validateInput(SyncJobInputSchema, {
        sourceConnectionId: '123e4567-e89b-12d3-a456-426614174000',
        targetConnectionId: '223e4567-e89b-12d3-a456-426614174001',
        direction: 'one_way',
        tables: [],
      });
      expect(result.success).toBe(false);
    });

    it('should reject too many tables', () => {
      const tables = Array.from({ length: 101 }, (_, i) => ({
        tableName: `table_${i}`,
        enabled: true,
      }));

      const result = validateInput(SyncJobInputSchema, {
        sourceConnectionId: '123e4567-e89b-12d3-a456-426614174000',
        targetConnectionId: '223e4567-e89b-12d3-a456-426614174001',
        direction: 'one_way',
        tables,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('SQL Injection Prevention', () => {
  describe('sanitizeTableName', () => {
    it('should accept valid table names', () => {
      expect(sanitizeTableName('users')).toBe('users');
      expect(sanitizeTableName('user_accounts')).toBe('user_accounts');
      expect(sanitizeTableName('Table123')).toBe('Table123');
    });

    it('should reject reserved words', () => {
      expect(sanitizeTableName('select')).toBeNull();
      expect(sanitizeTableName('INSERT')).toBeNull();
      expect(sanitizeTableName('drop')).toBeNull();
    });

    it('should reject SQL injection patterns', () => {
      expect(sanitizeTableName('users; DROP TABLE')).toBeNull();
      expect(sanitizeTableName("users' OR '1'='1")).toBeNull();
      expect(sanitizeTableName('users--comment')).toBeNull();
    });
  });

  describe('escapeIdentifier', () => {
    it('should escape simple names', () => {
      expect(escapeIdentifier('users')).toBe('"users"');
      expect(escapeIdentifier('user_table')).toBe('"user_table"');
    });

    it('should escape quotes in names', () => {
      expect(escapeIdentifier('user"table')).toBe('"user""table"');
    });

    it('should reject null bytes', () => {
      expect(() => escapeIdentifier('users\x00')).toThrow();
    });

    it('should handle edge cases', () => {
      expect(escapeIdentifier('')).toBe('""');
      expect(escapeIdentifier('a')).toBe('"a"');
    });
  });
});

describe('Body Structure Validation', () => {
  describe('validateBodyStructure', () => {
    it('should accept simple objects', () => {
      const result = validateBodyStructure({ name: 'test', value: 123 });
      expect(result.valid).toBe(true);
    });

    it('should reject deeply nested objects', () => {
      let obj: Record<string, unknown> = { value: 'deep' };
      for (let i = 0; i < 15; i++) {
        obj = { nested: obj };
      }
      
      const result = validateBodyStructure(obj);
      expect(result.valid).toBe(false);
    });

    it('should reject oversized arrays', () => {
      const result = validateBodyStructure({
        items: Array.from({ length: 1001 }, (_, i) => i),
      });
      expect(result.valid).toBe(false);
    });

    it('should reject prototype pollution attempts', () => {
      const malicious = {
        __proto__: { isAdmin: true },
      };
      
      const result = validateBodyStructure(malicious);
      expect(result.valid).toBe(false);
    });

    it('should reject constructor pollution', () => {
      const malicious = {
        constructor: { prototype: { polluted: true } },
      };
      
      const result = validateBodyStructure(malicious);
      expect(result.valid).toBe(false);
    });
  });
});

describe('UUID Validation', () => {
  describe('isValidUUID', () => {
    it('should accept valid UUIDs', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('123e4567-e89b-12d3-a456')).toBe(false);
      expect(isValidUUID('123e4567-e89b-12d3-a456-42661417400g')).toBe(false);
    });

    it('should reject SQL injection in UUID position', () => {
      expect(isValidUUID("'; DROP TABLE users; --")).toBe(false);
      expect(isValidUUID('1 OR 1=1')).toBe(false);
    });
  });
});

describe('Error Message Sanitization', () => {
  describe('sanitizeErrorMessage', () => {
    it('should redact connection strings', () => {
      const message = 'Failed to connect to postgres://user:secret@localhost:5432/db';
      const sanitized = sanitizeErrorMessage(message);
      expect(sanitized).not.toContain('secret');
      expect(sanitized).toContain('[REDACTED]');
    });

    it('should redact file paths', () => {
      const message = 'Error in /Users/admin/project/secrets.json';
      const sanitized = sanitizeErrorMessage(message);
      expect(sanitized).not.toContain('/Users/admin');
    });

    it('should preserve safe error messages', () => {
      const message = 'Connection timeout after 30 seconds';
      const sanitized = sanitizeErrorMessage(message);
      expect(sanitized).toBe(message);
    });
  });
});

