import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
  }
}

export async function POST(req: NextRequest) {
  const { userId } = getCtx(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { updateId } = await req.json()
  if (!updateId) return NextResponse.json({ error: 'Update ID required' }, { status: 400 })

  await prisma.user.update({
    where: { id: userId },
    data: { last_seen_update_id: updateId }
  })

  return NextResponse.json({ success: true })
}
