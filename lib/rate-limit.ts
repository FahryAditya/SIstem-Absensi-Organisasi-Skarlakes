import { NextRequest } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
}

const store = new Map<string, RateLimitEntry>()

/**
 * Simple in-memory rate limiter for Next.js Middleware or API Routes.
 * 
 * @param key - Unique key (e.g., IP + endpoint)
 * @param limit - Max requests allowed
 * @param windowMs - Time window in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): { 
  success: boolean, 
  remaining: number, 
  reset: number 
} {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetTime) {
    const newEntry = { count: 1, resetTime: now + windowMs }
    store.set(key, newEntry)
    return { success: true, remaining: limit - 1, reset: newEntry.resetTime }
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, reset: entry.resetTime }
  }

  entry.count++
  return { success: true, remaining: limit - entry.count, reset: entry.resetTime }
}

// Cleanup expired entries every hour
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of Array.from(store.entries())) {
    if (now > entry.resetTime) store.delete(key)
  }
}, 3600_000).unref?.()
