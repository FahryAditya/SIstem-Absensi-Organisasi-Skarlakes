import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { getSessionFromRequest } from '@/lib/auth'
import { pusherServer } from '@/lib/pusher-server'
import { z } from 'zod'


export const dynamic = 'force-dynamic'

function isSuperAdmin(role: string) {
  return role === 'SUPER_ADMIN' || role === 'administrator' || role === 'admin_osis_mpk'
}

const itemSchema = z.object({
  nama: z.string().min(1),
  kelas: z.string().optional().nullable(),
  nis: z.string().optional().nullable(),
  jabatan: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
})

const schema = z.object({
  orgId: z.number().optional(), // Use ID if provided
  orgSlug: z.string().optional(), // Use Slug for legacy compatibility
  data: z.array(itemSchema).min(1, 'Data tidak boleh kosong'),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Format data tidak valid' }, { status: 400 })
    }

    const { orgId, orgSlug, data } = parsed.data

    // Determine target organization
    let targetOrgId = orgId || session.activeOrgId

    if (!targetOrgId && orgSlug) {
      const org = await prisma.organization.findUnique({ where: { slug: orgSlug } })
      targetOrgId = org?.id
    }

    if (!targetOrgId) {
      return NextResponse.json({ error: 'Organisasi tidak ditentukan' }, { status: 400 })
    }

    // RBAC Check
    if (!isSuperAdmin(session.role as string) && !session.orgIds.includes(targetOrgId)) {
      return NextResponse.json({ error: 'Akses ditolak untuk organisasi ini' }, { status: 403 })
    }

    // Pre-filter: Check existing members in this organization by name (case-insensitive)
    const incomingNames = data.map(d => d.nama.trim()).filter(Boolean)
    const existingMembers = await prisma.member.findMany({
      where: {
        organization_id: targetOrgId,
        name: { in: incomingNames, mode: 'insensitive' }
      },
      select: { name: true }
    })
    const existingNameSet = new Set(existingMembers.map(m => m.name.toLowerCase()))

    const uniqueData = data.filter(item => !existingNameSet.has(item.nama.trim().toLowerCase()))
    const skippedCount = data.length - uniqueData.length

    let insertedCount = 0
    if (uniqueData.length > 0) {
      const createData = uniqueData.map(item => ({
        name: item.nama.trim(),
        class: item.kelas || '',
        nis: item.nis || '',
        jabatan: item.jabatan || 'Anggota',
        email: item.email || null,
        organization_id: targetOrgId!,
      }))

      const result = await prisma.member.createMany({
        data: createData,
        skipDuplicates: true,
      })
      insertedCount = result.count
    }

    const org = await prisma.organization.findUnique({ where: { id: targetOrgId } })

    await createLog({
      userId: session.id,
      userNama: session.nama,
      aksi: 'CREATE',
      organizationId: targetOrgId,
      tabel: 'members',
      recordId: 0,
      deskripsi: `Import ${insertedCount} anggota baru ke ${org?.nama || 'organisasi'}${skippedCount > 0 ? ` (${skippedCount} dilewati)` : ''}`,
      ipAddress: getIp(req),
    })

    if (pusherServer && insertedCount > 0) {
      try {
        await pusherServer.trigger('absensi', 'absensi-updated', {
          organizationId: targetOrgId,
          count: insertedCount,
          userNama: session.nama,
        })
      } catch (err) {}
    }

    return NextResponse.json({
      success: true,
      count: insertedCount,
      skipped: skippedCount,
      message: `${insertedCount} data berhasil ditambahkan.${skippedCount > 0 ? ` ${skippedCount} data duplikat dilewati.` : ''}`,
    })
  } catch (e: any) {
    console.error('[IMPORT ERROR]', e)
    return NextResponse.json({ error: 'Terjadi kesalahan server saat import' }, { status: 500 })
  }
}
