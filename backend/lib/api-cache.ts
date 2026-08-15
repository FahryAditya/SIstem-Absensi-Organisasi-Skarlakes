import { NextResponse } from 'next/server'

const privateCacheHeader = 'no-store, max-age=0'

export function jsonWithPrivateCache<T>(payload: T) {
  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': privateCacheHeader,
    },
  })
}
