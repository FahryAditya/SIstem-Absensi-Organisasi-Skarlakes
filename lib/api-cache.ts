import { NextResponse } from 'next/server'

const privateCacheHeader = 'private, max-age=20, stale-while-revalidate=40'

export function jsonWithPrivateCache<T>(payload: T) {
  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': privateCacheHeader,
    },
  })
}
