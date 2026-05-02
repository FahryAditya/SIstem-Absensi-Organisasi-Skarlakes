import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { createLog, getIp } from '@/lib/log'

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
  response.cookies.delete('ekskul_session')
  return response
}
