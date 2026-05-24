import { NextResponse } from 'next/server'

/**
 * Health check endpoint — digunakan oleh Docker healthcheck.
 * Mengembalikan 200 OK jika aplikasi berjalan normal.
 * Sengaja tidak query database agar tidak membebani koneksi pool.
 */
export async function GET() {
  return NextResponse.json(
    { status: 'ok', timestamp: new Date().toISOString() },
    { status: 200 }
  )
}
