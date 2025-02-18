import { kv } from '@vercel/kv';

interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
}

interface RateLimiterResult {
  success: boolean;
  remaining: number;
  timeToReset: number;
}

export class RateLimiter {
  readonly windowMs: number;
  readonly maxRequests: number;

  constructor(options: RateLimiterOptions) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
  }

  async check(key: string): Promise<RateLimiterResult> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    try {
      // Use Vercel KV's atomic operations
      const multi = kv.multi();
      
      // Remove requests older than the window
      multi.zremrangebyscore(key, 0, windowStart);
      
      // Add current request
      multi.zadd(key, { score: now, member: now.toString() });
      
      // Get count of requests in window
      multi.zcount(key, windowStart, now);
      
      // Set expiry on the key
      multi.expire(key, Math.ceil(this.windowMs / 1000));
      
      const [, , count] = await multi.exec();
      
      const requestCount = count as number;
      const remaining = Math.max(0, this.maxRequests - requestCount);
      const success = requestCount <= this.maxRequests;
      
      // Calculate time until window resets
      const oldestRequest = await kv.zrange(key, 0, 0, { withScores: true });
      const timeToReset = oldestRequest.length > 0 
        ? Math.max(0, (oldestRequest[0].score as number) + this.windowMs - now)
        : 0;

      return {
        success,
        remaining,
        timeToReset,
      };
    } catch (error) {
      console.error('Rate limiter error:', error);
      // On error, allow the request but log the error
      return {
        success: true,
        remaining: 0,
        timeToReset: 0,
      };
    }
  }

  async reset(key: string): Promise<void> {
    await kv.del(key);
  }
} 