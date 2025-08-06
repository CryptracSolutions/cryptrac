// Rate Limiting Middleware for Cryptrac API Endpoints
// This can be imported and used in any API route

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
  keyGenerator?: (request: NextRequest) => string // Custom key generator
  onLimitReached?: (request: NextRequest, key: string) => void // Callback when limit is reached
}

interface RateLimitStore {
  count: number
  resetTime: number
  firstRequest: number
}

// In-memory store for rate limiting (in production, consider Redis)
const rateLimitStore = new Map<string, RateLimitStore>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  // Fix: Use Array.from to convert iterator to array
  for (const [key, store] of Array.from(rateLimitStore.entries())) {
    if (now > store.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export class RateLimiter {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = {
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      keyGenerator: this.defaultKeyGenerator,
      onLimitReached: this.defaultOnLimitReached,
      ...config
    }
  }

  private defaultKeyGenerator(request: NextRequest): string {
    // Use IP address as default key
    return request.headers.get('x-forwarded-for') || 
           request.headers.get('x-real-ip') || 
           request.headers.get('cf-connecting-ip') || 
           'unknown'
  }

  private defaultOnLimitReached(request: NextRequest, key: string): void {
    console.warn(`⚠️ Rate limit exceeded for key: ${key}, URL: ${request.url}`)
  }

  public check(request: NextRequest): { allowed: boolean; limit: number; remaining: number; resetTime: number } {
    const key = this.config.keyGenerator!(request)
    const now = Date.now()
    
    let store = rateLimitStore.get(key)
    
    if (!store || now > store.resetTime) {
      // Create new or reset expired store
      store = {
        count: 1,
        resetTime: now + this.config.windowMs,
        firstRequest: now
      }
      rateLimitStore.set(key, store)
      
      return {
        allowed: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests - 1,
        resetTime: store.resetTime
      }
    }
    
    // Check if limit exceeded
    if (store.count >= this.config.maxRequests) {
      this.config.onLimitReached!(request, key)
      
      return {
        allowed: false,
        limit: this.config.maxRequests,
        remaining: 0,
        resetTime: store.resetTime
      }
    }
    
    // Increment counter
    store.count++
    
    return {
      allowed: true,
      limit: this.config.maxRequests,
      remaining: this.config.maxRequests - store.count,
      resetTime: store.resetTime
    }
  }

  public middleware() {
    return (request: NextRequest) => {
      const result = this.check(request)
      
      if (!result.allowed) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Rate limit exceeded. Please try again later.',
            limit: result.limit,
            remaining: result.remaining,
            resetTime: result.resetTime
          },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': result.limit.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.resetTime.toString(),
              'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
            }
          }
        )
      }
      
      // Add rate limit headers to successful responses
      return {
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString()
        }
      }
    }
  }
}

// Pre-configured rate limiters for different endpoint types
export const rateLimiters = {
  // General API endpoints - 60 requests per minute
  general: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60
  }),

  // Payment creation - 10 requests per minute (more restrictive)
  payment: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10
  }),

  // Status checking - 120 requests per minute (more lenient for polling)
  status: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 120
  }),

  // Webhooks - 100 requests per minute
  webhook: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100
  }),

  // Tax reports - 20 requests per minute (resource intensive)
  reports: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20
  }),

  // Currency loading - 30 requests per minute
  currency: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30
  }),

  // Authentication - 5 requests per minute (very restrictive)
  auth: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5
  })
}

// Helper function to apply rate limiting to any API route
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  limiter: RateLimiter = rateLimiters.general
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const rateLimitResult = limiter.check(request)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded. Please try again later.',
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }
    
    try {
      const response = await handler(request)
      
      // Add rate limit headers to response
      response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
      response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString())
      
      return response
    } catch (error) {
      console.error('❌ Error in rate-limited handler:', error)
      throw error
    }
  }
}

// Advanced rate limiter with user-based limits
export class UserRateLimiter extends RateLimiter {
  constructor(config: RateLimitConfig & { userIdExtractor?: (request: NextRequest) => string | null }) {
    super({
      ...config,
      keyGenerator: (request: NextRequest) => {
        // Try to get user ID first, fallback to IP
        const userId = config.userIdExtractor?.(request)
        if (userId) {
          return `user:${userId}`
        }
        return `ip:${request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'}`
      }
    })
  }
}

// Example usage in API routes:
/*
import { withRateLimit, rateLimiters } from '@/lib/rate-limiting'

export const POST = withRateLimit(async (request: NextRequest) => {
  // Your API logic here
  return NextResponse.json({ success: true })
}, rateLimiters.payment)
*/

// Sliding window rate limiter (more accurate but uses more memory)
export class SlidingWindowRateLimiter {
  private requests = new Map<string, number[]>()
  private windowMs: number
  private maxRequests: number

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
  }

  public check(key: string): { allowed: boolean; remaining: number } {
    const now = Date.now()
    const windowStart = now - this.windowMs
    
    // Get existing requests for this key
    let requests = this.requests.get(key) || []
    
    // Remove requests outside the window
    requests = requests.filter((timestamp: number) => timestamp > windowStart)
    
    // Check if limit exceeded
    if (requests.length >= this.maxRequests) {
      return { allowed: false, remaining: 0 }
    }
    
    // Add current request
    requests.push(now)
    this.requests.set(key, requests)
    
    return { 
      allowed: true, 
      remaining: this.maxRequests - requests.length 
    }
  }

  public cleanup(): void {
    const now = Date.now()
    const windowStart = now - this.windowMs
    
    // Fix: Use Array.from to convert iterator to array
    for (const [key, requests] of Array.from(this.requests.entries())) {
      const validRequests = requests.filter((timestamp: number) => timestamp > windowStart)
      if (validRequests.length === 0) {
        this.requests.delete(key)
      } else {
        this.requests.set(key, validRequests)
      }
    }
  }
}

// Cleanup sliding window requests every 5 minutes
  setInterval(() => {
    // This would need to be called on any SlidingWindowRateLimiter instances
  }, 5 * 60 * 1000)

