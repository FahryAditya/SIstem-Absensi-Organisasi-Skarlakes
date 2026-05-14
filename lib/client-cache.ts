'use client'

type CacheEntry<T> = {
  expiresAt: number
  data?: T
  promise?: Promise<T>
}

const cache = new Map<string, CacheEntry<unknown>>()

interface CachedJsonOptions extends RequestInit {
  ttlMs?: number
  force?: boolean
}

export async function fetchJsonCached<T>(key: string, url: string, options: CachedJsonOptions = {}) {
  const { ttlMs = 30_000, force = false, ...fetchOptions } = options
  const now = Date.now()
  const cached = cache.get(key) as CacheEntry<T> | undefined

  if (!force && cached) {
    if (cached.data !== undefined && cached.expiresAt > now) return cached.data
    if (cached.promise) return cached.promise
  }

  const promise = fetch(url, fetchOptions).then(async (res) => {
    const json = await res.json()
    if (!res.ok) {
      throw new Error(json?.error || 'Gagal memuat data')
    }
    cache.set(key, { data: json, expiresAt: Date.now() + ttlMs })
    return json as T
  }).catch((error) => {
    cache.delete(key)
    throw error
  })

  cache.set(key, { promise, expiresAt: now + ttlMs })
  return promise
}

export function fetchJsonCachedUrl<T>(url: string, options: CachedJsonOptions = {}) {
  return fetchJsonCached<T>(url, url, options)
}

export function seedJsonCache<T>(key: string, data: T, ttlMs = 30_000) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs })
}

export function clearJsonCache(key?: string) {
  if (key) cache.delete(key)
  else cache.clear()
}
