import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { createLog, getIp } from '@/lib/log'


export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (session) {
    await createLog({
      userId: session.id,
      userNama: session.nama,
      aksi: 'LOGOUT',
      tabel: 'users',
      recordId: session.id,
      deskripsi: `${session.nama} logout dari sistem`,
      ipAddress: getIp(req),
    })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set('ekskul_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}
