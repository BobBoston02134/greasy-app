import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// Initialize Redis client (lazy to allow builds without env vars)
let redis: Redis | null = null;
let ratelimiters: Record<string, Ratelimit> | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('[RateLimit] Missing Upstash credentials - rate limiting disabled');
    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}

function getRatelimiters(): Record<string, Ratelimit> | null {
  if (ratelimiters) return ratelimiters;

  const redisClient = getRedis();
  if (!redisClient) return null;

  ratelimiters = {
    // Strict: 5 requests per minute (for sensitive operations like account creation)
    strict: new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
      prefix: 'ratelimit:strict',
    }),

    // Standard: 20 requests per minute (for general API calls)
    standard: new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(20, '1 m'),
      analytics: true,
      prefix: 'ratelimit:standard',
    }),

    // Relaxed: 60 requests per minute (for read operations)
    relaxed: new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(60, '1 m'),
      analytics: true,
      prefix: 'ratelimit:relaxed',
    }),
  };

  return ratelimiters;
}

export type RateLimitTier = 'strict' | 'standard' | 'relaxed';

/**
 * Get client identifier from request headers
 */
function getClientId(request: Request): string {
  // Try to get real IP from various headers (for proxied requests)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfIp = request.headers.get('cf-connecting-ip');

  // Use the first IP in x-forwarded-for chain, or fall back to others
  const ip = forwarded?.split(',')[0]?.trim() || realIp || cfIp || 'unknown';

  return ip;
}

/**
 * Check rate limit for a request
 * Returns null if allowed, or a Response if rate limited
 */
export async function checkRateLimit(
  request: Request,
  tier: RateLimitTier = 'standard'
): Promise<NextResponse | null> {
  const limiters = getRatelimiters();

  // If rate limiting is not configured, allow all requests
  if (!limiters) {
    return null;
  }

  const limiter = limiters[tier];
  const clientId = getClientId(request);

  try {
    const { success, limit, remaining, reset } = await limiter.limit(clientId);

    if (!success) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': reset.toString(),
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    return null;
  } catch (error) {
    // If rate limiting fails, log but allow the request
    console.error('[RateLimit] Error checking rate limit:', error);
    return null;
  }
}

/**
 * Higher-order function to wrap API handlers with rate limiting
 */
export function withRateLimit(
  handler: (request: Request) => Promise<NextResponse>,
  tier: RateLimitTier = 'standard'
) {
  return async (request: Request): Promise<NextResponse> => {
    const rateLimitResponse = await checkRateLimit(request, tier);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    return handler(request);
  };
}
