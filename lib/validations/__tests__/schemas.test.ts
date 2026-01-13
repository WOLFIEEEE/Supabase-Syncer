/**
 * Validation Schemas Tests
 * 
 * Tests for Zod validation schemas.
 */

import {
  ConnectionInputSchema,
  SyncJobInputSchema,
  PaginationSchema,
  validateInput,
} from '../schemas';

describe('Validation Schemas', () => {
  describe('ConnectionInputSchema', () => {
    it('should validate correct input', () => {
      const input = {
        name: 'My Database',
        databaseUrl: 'postgresql://user:pass@localhost:5432/mydb',
        environment: 'development',
      };

      const result = ConnectionInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const input = {
        name: '',
        databaseUrl: 'postgresql://user:pass@localhost:5432/mydb',
        environment: 'development',
      };

      const result = ConnectionInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject name exceeding 100 characters', () => {
      const input = {
        name: 'a'.repeat(101),
        databaseUrl: 'postgresql://user:pass@localhost:5432/mydb',
        environment: 'development',
      };

      const result = ConnectionInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid database URL', () => {
      const input = {
        name: 'Test',
        databaseUrl: 'not-a-valid-url',
        environment: 'development',
      };

      const result = ConnectionInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject MySQL URL', () => {
      const input = {
        name: 'Test',
        databaseUrl: 'mysql://user:pass@localhost:3306/mydb',
        environment: 'development',
      };

      const result = ConnectionInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid environment', () => {
      const input = {
        name: 'Test',
        databaseUrl: 'postgresql://user:pass@localhost:5432/mydb',
        environment: 'staging', // not allowed
      };

      const result = ConnectionInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('SyncJobInputSchema', () => {
    const validInput = {
      sourceConnectionId: '123e4567-e89b-12d3-a456-426614174000',
      targetConnectionId: '123e4567-e89b-12d3-a456-426614174001',
      direction: 'one_way',
      tables: [{ tableName: 'users', enabled: true }],
    };

    it('should validate correct input', () => {
      const result = SyncJobInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject same source and target connection', () => {
      const input = {
        ...validInput,
        targetConnectionId: validInput.sourceConnectionId,
      };

      const result = SyncJobInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject empty tables array', () => {
      const input = {
        ...validInput,
        tables: [],
      };

      const result = SyncJobInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID format', () => {
      const input = {
        ...validInput,
        sourceConnectionId: 'not-a-uuid',
      };

      const result = SyncJobInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid direction', () => {
      const input = {
        ...validInput,
        direction: 'bidirectional', // not allowed
      };

      const result = SyncJobInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid table name', () => {
      const input = {
        ...validInput,
        tables: [{ tableName: '123invalid', enabled: true }], // can't start with number
      };

      const result = SyncJobInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('PaginationSchema', () => {
    it('should use defaults when not provided', () => {
      const result = PaginationSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBeDefined();
        expect(result.data.offset).toBeDefined();
      }
    });

    it('should accept valid pagination', () => {
      const result = PaginationSchema.safeParse({ limit: 10, offset: 20 });
      expect(result.success).toBe(true);
    });

    it('should reject negative offset', () => {
      const result = PaginationSchema.safeParse({ offset: -1 });
      expect(result.success).toBe(false);
    });
  });

  describe('validateInput helper', () => {
    it('should return success with valid data', () => {
      const result = validateInput(ConnectionInputSchema, {
        name: 'Test',
        databaseUrl: 'postgresql://localhost/db',
        environment: 'development',
      });

      expect(result.success).toBe(true);
    });

    it('should return errors with invalid data', () => {
      const result = validateInput(ConnectionInputSchema, {
        name: '',
        databaseUrl: 'invalid',
        environment: 'invalid',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });
});
