import { Redis } from '@upstash/redis';
import { RateLimiter } from '../rate-limiter';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock Redis client
vi.mock('@upstash/redis', () => {
  const mockRedis = {
    multi: vi.fn(),
    del: vi.fn(),
    zrange: vi.fn(),
  };
  return { Redis: vi.fn(() => mockRedis) };
});

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;
  let mockRedis: { 
    multi: ReturnType<typeof vi.fn>;
    del: ReturnType<typeof vi.fn>;
    zrange: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Create a new rate limiter instance
    rateLimiter = new RateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 10, // 10 requests per minute
    });

    // Get the mocked Redis instance
    mockRedis = (rateLimiter as unknown as { redis: typeof mockRedis }).redis;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('check', () => {
    it('should allow requests within rate limit', async () => {
      // Mock Redis multi command responses
      const mockMulti = {
        zremrangebyscore: vi.fn().mockReturnThis(),
        zadd: vi.fn().mockReturnThis(),
        zcount: vi.fn().mockReturnThis(),
        expire: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([null, null, 5]), // 5 requests in current window
      };

      mockRedis.multi.mockReturnValue(mockMulti);
      mockRedis.zrange.mockResolvedValue([{ score: Date.now() - 30000, member: 'test' }]);

      const result = await rateLimiter.check('test-key');

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(5); // 10 max - 5 current = 5 remaining
      expect(result.timeToReset).toBeGreaterThan(0);
      expect(result.timeToReset).toBeLessThanOrEqual(60000);
    });

    it('should block requests over rate limit', async () => {
      // Mock Redis multi command responses for over-limit scenario
      const mockMulti = {
        zremrangebyscore: vi.fn().mockReturnThis(),
        zadd: vi.fn().mockReturnThis(),
        zcount: vi.fn().mockReturnThis(),
        expire: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([null, null, 11]), // 11 requests (over limit)
      };

      mockRedis.multi.mockReturnValue(mockMulti);
      mockRedis.zrange.mockResolvedValue([{ score: Date.now() - 30000, member: 'test' }]);

      const result = await rateLimiter.check('test-key');

      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.timeToReset).toBeGreaterThan(0);
    });

    it('should handle Redis errors gracefully', async () => {
      // Mock Redis error
      mockRedis.multi.mockImplementation(() => {
        throw new Error('Redis connection error');
      });

      const result = await rateLimiter.check('test-key');

      // Should allow request but log error
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(0);
      expect(result.timeToReset).toBe(0);
    });

    it('should clean up old requests correctly', async () => {
      const now = Date.now();
      const mockMulti = {
        zremrangebyscore: vi.fn().mockReturnThis(),
        zadd: vi.fn().mockReturnThis(),
        zcount: vi.fn().mockReturnThis(),
        expire: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([null, null, 3]), // 3 requests in current window
      };

      mockRedis.multi.mockReturnValue(mockMulti);
      mockRedis.zrange.mockResolvedValue([{ score: now - 50000, member: 'test' }]);

      const result = await rateLimiter.check('test-key');

      expect(mockMulti.zremrangebyscore).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(7); // 10 max - 3 current = 7 remaining
    });

    it('should set correct expiry on rate limit key', async () => {
      const mockMulti = {
        zremrangebyscore: vi.fn().mockReturnThis(),
        zadd: vi.fn().mockReturnThis(),
        zcount: vi.fn().mockReturnThis(),
        expire: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([null, null, 1]),
      };

      mockRedis.multi.mockReturnValue(mockMulti);
      mockRedis.zrange.mockResolvedValue([{ score: Date.now(), member: 'test' }]);

      await rateLimiter.check('test-key');

      expect(mockMulti.expire).toHaveBeenCalledWith('test-key', 60); // 60 seconds for 1-minute window
    });
  });

  describe('reset', () => {
    it('should reset rate limit for a key', async () => {
      mockRedis.del.mockResolvedValue(1);

      await rateLimiter.reset('test-key');

      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
    });

    it('should handle Redis errors during reset', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis error'));

      await expect(rateLimiter.reset('test-key')).rejects.toThrow('Redis error');
    });
  });

  it('should prevent too many requests', async () => {
    const rateLimiter = new RateLimiter({
      windowMs: 1000, // 1 second window
      maxRequests: 3  // Only allow 3 requests per second
    });

    const key = 'test-user-123';
    
    // First 3 requests should succeed
    const result1 = await rateLimiter.check(key);
    const result2 = await rateLimiter.check(key);
    const result3 = await rateLimiter.check(key);
    
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result3.success).toBe(true);
    
    // 4th request should be blocked
    const result4 = await rateLimiter.check(key);
    expect(result4.success).toBe(false);
    
    // Wait for the window to reset
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // Should allow requests again
    const result5 = await rateLimiter.check(key);
    expect(result5.success).toBe(true);
  });
}); 