/**
 * SQL Injection Prevention Tests
 * 
 * Tests for SQL injection prevention mechanisms.
 */

import {
  escapeIdentifier,
  buildSafeTableLiteralArray,
  escapeSqlValue,
} from '@/lib/services/security-utils';
import {
  sanitizeTableName,
  sanitizeTableNames,
} from '@/lib/validations/schemas';

describe('SQL Injection Prevention', () => {
  describe('escapeIdentifier', () => {
    it('should properly quote identifiers', () => {
      expect(escapeIdentifier('users')).toBe('"users"');
      expect(escapeIdentifier('user_accounts')).toBe('"user_accounts"');
    });

    it('should escape double quotes', () => {
      expect(escapeIdentifier('table"name')).toBe('"table""name"');
      expect(escapeIdentifier('"quoted"')).toBe('"""quoted"""');
    });

    it('should reject null bytes', () => {
      expect(() => escapeIdentifier('users\x00')).toThrow();
      expect(() => escapeIdentifier('\x00')).toThrow();
    });

    it('should handle special characters', () => {
      // These should be properly quoted
      expect(escapeIdentifier('table-name')).toBe('"table-name"');
      expect(escapeIdentifier('table.name')).toBe('"table.name"');
      expect(escapeIdentifier('table name')).toBe('"table name"');
    });

    it('should handle Unicode', () => {
      expect(escapeIdentifier('用户表')).toBe('"用户表"');
      expect(escapeIdentifier('tëst')).toBe('"tëst"');
    });
  });

  describe('SQL Injection Attack Patterns', () => {
    const attackPatterns = [
      // Classic SQL injection
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "' OR 1=1 --",
      "'; SELECT * FROM users; --",
      
      // UNION-based injection
      "' UNION SELECT * FROM passwords --",
      "' UNION ALL SELECT null, username, password FROM users --",
      
      // Stacked queries
      "'; INSERT INTO users (admin) VALUES (true); --",
      "'; UPDATE users SET admin=true WHERE id=1; --",
      "'; DELETE FROM users; --",
      
      // Comment-based injection
      "admin'--",
      "admin'/*",
      "*/admin",
      
      // Encoding-based injection
      "admin%27%3B%20DROP%20TABLE%20users%3B%20--",
      "admin%00",
      
      // Time-based blind injection
      "' OR SLEEP(5) --",
      "' OR pg_sleep(5) --",
      "'; WAITFOR DELAY '0:0:5'; --",
      
      // Boolean-based blind injection
      "' AND 1=1 --",
      "' AND 1=2 --",
      
      // Error-based injection
      "' AND EXTRACTVALUE(1, CONCAT(0x7e, (SELECT database()))) --",
      "' AND CAST((SELECT version()) AS int) --",
    ];

    it('should safely escape all attack patterns', () => {
      for (const pattern of attackPatterns) {
        // escapeIdentifier should quote them safely
        const escaped = escapeIdentifier(pattern);
        expect(escaped.startsWith('"')).toBe(true);
        expect(escaped.endsWith('"')).toBe(true);
        
        // The result should not contain unescaped quotes
        const inner = escaped.slice(1, -1);
        const quoteCount = (inner.match(/"/g) || []).length;
        expect(quoteCount % 2).toBe(0); // All quotes should be escaped (doubled)
      }
    });

    it('should reject attack patterns in table name validation', () => {
      for (const pattern of attackPatterns) {
        expect(sanitizeTableName(pattern)).toBeNull();
      }
    });
  });

  describe('buildSafeTableLiteralArray', () => {
    it('should build parameterized array', () => {
      const result = buildSafeTableLiteralArray(['users', 'orders', 'products']);
      
      expect(result.sql).toContain('$1');
      expect(result.sql).toContain('$2');
      expect(result.sql).toContain('$3');
      expect(result.params).toEqual(['users', 'orders', 'products']);
    });

    it('should handle empty array', () => {
      const result = buildSafeTableLiteralArray([]);
      expect(result.sql).toBe('');
      expect(result.params).toEqual([]);
    });

    it('should handle single item', () => {
      const result = buildSafeTableLiteralArray(['users']);
      expect(result.sql).toBe('$1');
      expect(result.params).toEqual(['users']);
    });
  });

  describe('escapeSqlValue', () => {
    it('should escape strings', () => {
      expect(escapeSqlValue('hello')).toBe("'hello'");
      expect(escapeSqlValue("it's")).toBe("'it''s'");
    });

    it('should handle numbers', () => {
      expect(escapeSqlValue(42)).toBe('42');
      expect(escapeSqlValue(3.14)).toBe('3.14');
    });

    it('should handle booleans', () => {
      expect(escapeSqlValue(true)).toBe('true');
      expect(escapeSqlValue(false)).toBe('false');
    });

    it('should handle null', () => {
      expect(escapeSqlValue(null)).toBe('NULL');
    });

    it('should handle dates', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const escaped = escapeSqlValue(date);
      expect(escaped).toContain('2024-01-15');
    });

    it('should escape SQL injection in strings', () => {
      const malicious = "'; DROP TABLE users; --";
      const escaped = escapeSqlValue(malicious);
      expect(escaped).not.toContain(';');
      expect(escaped.match(/'/g)?.length).toBeGreaterThan(2); // Quotes are escaped
    });
  });

  describe('Table Name Sanitization', () => {
    it('should accept valid PostgreSQL table names', () => {
      const validNames = [
        'users',
        'user_accounts',
        'UserAccounts',
        '_private',
        'table123',
        'a',
        '_',
      ];

      for (const name of validNames) {
        expect(sanitizeTableName(name)).toBe(name);
      }
    });

    it('should reject invalid table names', () => {
      const invalidNames = [
        '', // Empty
        '123table', // Starts with number
        '-table', // Starts with hyphen
        'table-name', // Contains hyphen
        'table.name', // Contains dot
        'table name', // Contains space
        'table;name', // Contains semicolon
        "table'name", // Contains quote
      ];

      for (const name of invalidNames) {
        expect(sanitizeTableName(name)).toBeNull();
      }
    });

    it('should reject SQL reserved words', () => {
      const reservedWords = [
        'select',
        'SELECT',
        'insert',
        'INSERT',
        'update',
        'UPDATE',
        'delete',
        'DELETE',
        'drop',
        'DROP',
        'alter',
        'ALTER',
        'create',
        'CREATE',
        'table',
        'TABLE',
      ];

      for (const word of reservedWords) {
        expect(sanitizeTableName(word)).toBeNull();
      }
    });
  });

  describe('Batch Table Name Sanitization', () => {
    it('should filter out invalid names', () => {
      const input = [
        'users',
        'orders',
        '; DROP TABLE users',
        'products',
        "' OR '1'='1",
        'categories',
      ];

      const result = sanitizeTableNames(input);
      expect(result).toEqual(['users', 'orders', 'products', 'categories']);
    });

    it('should return empty array for all invalid', () => {
      const input = [
        '; DROP TABLE users',
        "' OR '1'='1",
        'select',
      ];

      const result = sanitizeTableNames(input);
      expect(result).toEqual([]);
    });
  });
});

describe('PostgreSQL Specific Injection Tests', () => {
  it('should handle dollar-quoted strings', () => {
    const dollarQuoted = "$$malicious$$";
    const escaped = escapeIdentifier(dollarQuoted);
    expect(escaped).toBe('"$$malicious$$"');
  });

  it('should handle PostgreSQL-specific functions', () => {
    const patterns = [
      "' || pg_sleep(5) || '",
      "'; COPY (SELECT '') TO PROGRAM 'whoami'; --",
      "'; CREATE EXTENSION IF NOT EXISTS dblink; --",
    ];

    for (const pattern of patterns) {
      expect(sanitizeTableName(pattern)).toBeNull();
    }
  });

  it('should handle schema-qualified names safely', () => {
    // Schema-qualified names should be handled by escaping each part
    const escaped = escapeIdentifier('public.users');
    // This should quote the entire thing, not interpret the dot
    expect(escaped).toBe('"public.users"');
  });
});

