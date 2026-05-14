'use client'

import { QueryClient } from '@tanstack/react-query'

export const clientQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

interface CachedJsonOptions extends RequestInit {
  ttlMs?: number
  force?: boolean
}

export async function fetchJsonCached<T>(key: string, url: string, options: CachedJsonOptions = {}) {
  const { ttlMs = 60_000, force = false, ...fetchOptions } = options
  const queryKey = ['client-json', key]

  if (force) clientQueryClient.removeQueries({ queryKey, exact: true })

  return clientQueryClient.fetchQuery({
    queryKey,
    staleTime: ttlMs,
    queryFn: async () => {
      const res = await fetch(url, fetchOptions)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json?.error || 'Gagal memuat data')
      }
      return json as T
    },
  })
}

export function fetchJsonCachedUrl<T>(url: string, options: CachedJsonOptions = {}) {
  return fetchJsonCached<T>(url, url, options)
}

export function seedJsonCache<T>(key: string, data: T, ttlMs = 30_000) {
  clientQueryClient.setQueryData(['client-json', key], data)
  clientQueryClient.setQueryDefaults(['client-json', key], { staleTime: ttlMs })
}

export function clearJsonCache(key?: string) {
  if (key) clientQueryClient.removeQueries({ queryKey: ['client-json', key], exact: true })
  else clientQueryClient.removeQueries({ queryKey: ['client-json'] })
}
