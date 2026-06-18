import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/services/gmail.service'
import { renderEmailTemplate } from '@/lib/services/email-template.service'
import { getSessionFromRequest } from '@/lib/auth'
import { createLog, getIp } from '@/lib/log'

export const dynamic = 'force-dynamic'

function isSuperAdmin(role: string) {
  return role === 'SUPER_ADMIN' || role === 'administrator' || role === 'admin_osis_mpk'
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { orgId, emailType, recipientIds, data } = body

    const targetOrgId = orgId ? parseInt(orgId) : session.activeOrgId

    if (!targetOrgId || !emailType || !recipientIds || !data) {
      return NextResponse.json({ error: 'Parameter input tidak lengkap' }, { status: 400 })
    }

    // RBAC Check
    if (!isSuperAdmin(session.role as string) && !session.orgIds.includes(targetOrgId)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const org = await prisma.organization.findUnique({ where: { id: targetOrgId } })
    if (!org) return NextResponse.json({ error: 'Organisasi tidak ditemukan' }, { status: 404 })

    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      return NextResponse.json({ error: 'Pilih minimal satu penerima' }, { status: 400 })
    }

    const idsInt = recipientIds.map((id: any) => parseInt(id)).filter((id: number) => !isNaN(id))
    
    // Fetch members
    const members = await prisma.member.findMany({
      where: { id: { in: idsInt }, organization_id: targetOrgId },
      select: { id: true, name: true, email: true },
    })

    if (members.length === 0) {
      return NextResponse.json({ error: 'Penerima tidak ditemukan di organisasi ini' }, { status: 404 })
    }

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    let successCount = 0
    const results = []

    for (let i = 0; i < members.length; i++) {
      const member = members[i]
      if (!member.email) {
        results.push({ id: member.id, nama: member.name, status: 'failed', error: 'Alamat email kosong' })
        continue
      }

      try {
        // Render template - mapping org slug for template service if needed
        const { subject, html } = await renderEmailTemplate(org.slug, emailType, {
          ...data,
          nama: member.name,
          pembahasan: data.pembahasan || data.agenda || '',
        })

        // Send email
        const sendResult = await sendEmail({
          to: [member.email],
          subject,
          html,
        })

        // Save email log in DB
        await prisma.emailLog.create({
          data: {
            subject,
            recipient_email: member.email,
            recipient_name: member.name,
            content: html,
            admin_id: session.id,
            status: sendResult.success ? 'sent' : 'failed',
            error_message: sendResult.success ? null : sendResult.error,
            sent_at: sendResult.success ? new Date() : null,
          },
        })

        if (sendResult.success) successCount++

        results.push({
          id: member.id,
          nama: member.name,
          email: member.email,
          status: sendResult.success ? 'sent' : 'failed',
          error: sendResult.success ? null : sendResult.error,
        })

        if (i < members.length - 1) await sleep(1500)
      } catch (err: any) {
        console.error(`Gagal mengirim ke ${member.email}:`, err)
        results.push({
          id: member.id,
          nama: member.name,
          email: member.email,
          status: 'failed',
          error: err.message || 'Error tidak diketahui',
        })
      }
    }

    await createLog({
      userId: session.id,
      userNama: session.nama,
      aksi: 'UPDATE',
      organizationId: targetOrgId,
      tabel: 'email_logs',
      recordId: 0,
      deskripsi: `Kirim email (${emailType}) ke ${successCount}/${members.length} anggota di ${org.nama}`,
      ipAddress: getIp(req),
    })

    return NextResponse.json({
      success: true,
      message: `Email terkirim ke ${successCount} dari ${members.length} penerima`,
      sent: successCount,
      failed: members.length - successCount,
      results,
    })
  } catch (error: any) {
    console.error('Send email API error:', error)
    return NextResponse.json({ error: 'Gagal mengirim email' }, { status: 500 })
  }
}
