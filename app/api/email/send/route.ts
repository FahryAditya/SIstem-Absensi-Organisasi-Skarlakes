import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/services/gmail.service'
import { renderEmailTemplate } from '@/lib/services/email-template.service'
import { getAccessibleOrgs } from '@/lib/auth-shared'
import { createLog, getIp } from '@/lib/log'

export const dynamic = 'force-dynamic'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: (req.headers.get('x-user-role') || '').trim(),
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = getCtx(req)
    if (!ctx.userId || !ctx.userRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accessible = getAccessibleOrgs(ctx.userRole)
    if (accessible.length === 0) {
      return NextResponse.json({ error: 'Forbidden: Anda tidak memiliki akses admin' }, { status: 403 })
    }

    const body = await req.json()
    const { organizationType, emailType, recipientIds, data } = body

    if (!organizationType || !emailType || !recipientIds || !data) {
      return NextResponse.json({ error: 'Parameter input tidak lengkap' }, { status: 400 })
    }

    const orgLower = organizationType.toLowerCase() as 'programming' | 'english' | 'osis' | 'mpk'
    if (!accessible.includes(orgLower)) {
      return NextResponse.json({ error: 'Akses ditolak: Anda tidak mengelola organisasi ini' }, { status: 403 })
    }

    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      return NextResponse.json({ error: 'Pilih minimal satu penerima' }, { status: 400 })
    }

    const idsInt = recipientIds.map((id: any) => parseInt(id)).filter((id: number) => !isNaN(id))
    if (idsInt.length === 0) {
      return NextResponse.json({ error: 'ID penerima tidak valid' }, { status: 400 })
    }

    // Fetch members from correct table
    let members: { id: number; nama: string; email: string | null }[] = []
    let tipeAnggota: 'siswa' | 'anggota_osis' | 'anggota_mpk' = 'siswa'

    if (orgLower === 'programming' || orgLower === 'english') {
      const siswa = await prisma.siswa.findMany({
        where: { id: { in: idsInt }, ekskul: orgLower },
        select: { id: true, nama: true, email: true },
      })
      members = siswa
      tipeAnggota = 'siswa'
    } else if (orgLower === 'osis') {
      const osis = await prisma.anggotaOsis.findMany({
        where: { id: { in: idsInt } },
        select: { id: true, nama: true, email: true },
      })
      members = osis
      tipeAnggota = 'anggota_osis'
    } else if (orgLower === 'mpk') {
      const mpk = await prisma.anggotaMpk.findMany({
        where: { id: { in: idsInt } },
        select: { id: true, nama: true, email: true },
      })
      members = mpk
      tipeAnggota = 'anggota_mpk'
    }

    if (members.length === 0) {
      return NextResponse.json({ error: 'Penerima tidak ditemukan di database' }, { status: 404 })
    }

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    let successCount = 0
    const results = []

    for (let i = 0; i < members.length; i++) {
      const member = members[i]
      if (!member.email) {
        results.push({
          id: member.id,
          nama: member.nama,
          status: 'failed',
          error: 'Alamat email kosong',
        })
        continue
      }

      try {
        // Render template
        const { subject, html } = await renderEmailTemplate(orgLower, emailType, {
          ...data,
          nama: member.nama,
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
            recipientEmail: member.email,
            recipientName: member.nama,
            emailType,
            organizationType: orgLower as any,
            content: html,
            tipe_anggota: tipeAnggota,
            siswa_id: tipeAnggota === 'siswa' ? member.id : null,
            anggota_osis_id: tipeAnggota === 'anggota_osis' ? member.id : null,
            anggota_mpk_id: tipeAnggota === 'anggota_mpk' ? member.id : null,
            admin_id: ctx.userId,
            status: sendResult.success ? 'sent' : 'failed',
            error_message: sendResult.success ? null : sendResult.error,
            sent_at: sendResult.success ? new Date() : null,
          },
        })

        if (sendResult.success) {
          successCount++
        }

        results.push({
          id: member.id,
          nama: member.nama,
          email: member.email,
          status: sendResult.success ? 'sent' : 'failed',
          error: sendResult.success ? null : sendResult.error,
        })

        // Throttle request to avoid spam/rate limit blocks by Google SMTP
        if (i < members.length - 1) {
          await sleep(1500)
        }
      } catch (err: any) {
        console.error(`Gagal mengirim ke ${member.email}:`, err)
        results.push({
          id: member.id,
          nama: member.nama,
          email: member.email,
          status: 'failed',
          error: err.message || 'Error tidak diketahui',
        })
      }
    }

    // Write system activity log
    await createLog({
      userId: ctx.userId,
      userNama: ctx.userNama,
      aksi: 'UPDATE',
      tabel: 'email_logs',
      recordId: '0',
      deskripsi: `${ctx.userNama} mengirim email (${emailType}) ke ${successCount}/${members.length} anggota di ${orgLower.toUpperCase()}`,
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
    return NextResponse.json({ error: 'Gagal mengirim email: ' + error.message }, { status: 500 })
  }
}
