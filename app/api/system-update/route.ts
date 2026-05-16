import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
  }
}

export async function GET(req: NextRequest) {
  const { userId } = getCtx(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [latestUpdate, user] = await Promise.all([
    prisma.systemUpdate.findFirst({
      orderBy: { id: 'desc' },
      include: { creator: { select: { nama: true } } }
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { last_seen_update_id: true }
    })
  ])

  return NextResponse.json({
    latestUpdate,
    lastSeenId: user?.last_seen_update_id || 0
  })
}

export async function POST(req: NextRequest) {
  const ctx = getCtx(req)
  if (ctx.userRole !== 'administrator') {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  const { version, content } = await req.json()
  if (!version || !content) {
    return NextResponse.json({ error: 'Versi dan konten wajib diisi' }, { status: 400 })
  }

  const update = await prisma.systemUpdate.create({
    data: {
      version,
      content,
      created_by: ctx.userId
    }
  })

  await createLog({
    userId: ctx.userId,
    userNama: ctx.userNama,
    aksi: 'CREATE',
    tabel: 'system_updates',
    recordId: update.id,
    deskripsi: `${ctx.userNama} memposting update sistem versi ${version}`,
    dataBaru: { version, content },
    ipAddress: getIp(req),
  })

  return NextResponse.json({ data: update }, { status: 201 })
}
