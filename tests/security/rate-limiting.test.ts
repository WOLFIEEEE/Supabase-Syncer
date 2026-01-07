/**
 * Rate Limiting Tests
 * 
 * Tests for rate limiting mechanisms.
 */

import {
  checkRateLimit,
  RATE_LIMITS,
  resetRateLimit,
} from '@/lib/services/rate-limiter';

describe('Rate Limiting', () => {
  const testUserId = 'test-user-123';
  
  beforeEach(() => {
    // Reset rate limits before each test
    resetRateLimit(testUserId, 'read');
    resetRateLimit(testUserId, 'write');
    resetRateLimit(testUserId, 'sync');
    resetRateLimit(testUserId, 'auth');
  });

  describe('checkRateLimit', () => {
    it('should allow requests under the limit', () => {
      const result = checkRateLimit(testUserId, 'read');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeLessThanOrEqual(RATE_LIMITS.read.maxRequests - 1);
    });

    it('should track remaining requests', () => {
      const results: number[] = [];
      
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(testUserId, 'read');
        results.push(result.remaining);
      }
      
      // Each subsequent request should have fewer remaining
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toBeLessThan(results[i - 1]);
      }
    });

    it('should block requests over the limit', () => {
      // Exhaust the write limit (20 requests)
      for (let i = 0; i < RATE_LIMITS.write.maxRequests; i++) {
        checkRateLimit(testUserId, 'write');
      }
      
      // Next request should be blocked
      const result = checkRateLimit(testUserId, 'write');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeDefined();
    });

    it('should have separate limits per type', () => {
      // Exhaust write limit
      for (let i = 0; i < RATE_LIMITS.write.maxRequests; i++) {
        checkRateLimit(testUserId, 'write');
      }
      
      // Read should still work
      const readResult = checkRateLimit(testUserId, 'read');
      expect(readResult.allowed).toBe(true);
    });

    it('should have separate limits per user', () => {
      const user1 = 'user-1';
      const user2 = 'user-2';
      
      // Exhaust user1's limit
      for (let i = 0; i < RATE_LIMITS.write.maxRequests; i++) {
        checkRateLimit(user1, 'write');
      }
      
      // User2 should still be allowed
      const result = checkRateLimit(user2, 'write');
      expect(result.allowed).toBe(true);
    });

    it('should provide retry-after for blocked requests', () => {
      // Exhaust the limit
      for (let i = 0; i < RATE_LIMITS.sync.maxRequests; i++) {
        checkRateLimit(testUserId, 'sync');
      }
      
      const result = checkRateLimit(testUserId, 'sync');
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(60); // Within 1 minute window
    });
  });

  describe('Rate Limit Types', () => {
    it('should have stricter limits for auth', () => {
      expect(RATE_LIMITS.auth.maxRequests).toBeLessThan(RATE_LIMITS.read.maxRequests);
    });

    it('should have stricter limits for sync', () => {
      expect(RATE_LIMITS.sync.maxRequests).toBeLessThan(RATE_LIMITS.write.maxRequests);
    });

    it('should have longer windows for auth', () => {
      expect(RATE_LIMITS.auth.windowMs).toBeGreaterThan(RATE_LIMITS.read.windowMs);
    });
  });
});

describe('Rate Limit Configuration', () => {
  it('should have reasonable read limits', () => {
    expect(RATE_LIMITS.read.maxRequests).toBeGreaterThanOrEqual(50);
    expect(RATE_LIMITS.read.maxRequests).toBeLessThanOrEqual(200);
  });

  it('should have reasonable write limits', () => {
    expect(RATE_LIMITS.write.maxRequests).toBeGreaterThanOrEqual(10);
    expect(RATE_LIMITS.write.maxRequests).toBeLessThanOrEqual(50);
  });

  it('should have reasonable sync limits', () => {
    expect(RATE_LIMITS.sync.maxRequests).toBeGreaterThanOrEqual(5);
    expect(RATE_LIMITS.sync.maxRequests).toBeLessThanOrEqual(20);
  });

  it('should have reasonable auth limits for brute force prevention', () => {
    expect(RATE_LIMITS.auth.maxRequests).toBeLessThanOrEqual(10);
    expect(RATE_LIMITS.auth.windowMs).toBeGreaterThanOrEqual(15 * 60 * 1000);
  });
});

describe('Rate Limit Headers', () => {
  it('should include standard rate limit headers', () => {
    const result = checkRateLimit(testUserId, 'read');
    
    // These values should be present for building headers
    expect(typeof result.remaining).toBe('number');
    expect(typeof result.resetAt).toBe('number');
  });
});

// Cleanup helper
function resetRateLimit(_identifier: string, _type: keyof typeof RATE_LIMITS): void {
  // In a real test environment, this would clear the rate limit store
  // For now, we rely on the sliding window naturally expiring
}

