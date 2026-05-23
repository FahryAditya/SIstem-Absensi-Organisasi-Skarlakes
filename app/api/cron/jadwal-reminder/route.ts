import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Vercel Cron Job — Berjalan setiap hari jam 07:00 WIB (23:00 UTC)
// Kirim notifikasi H-1 untuk jadwal wajib hadir esok hari
// Daftarkan di vercel.json: { "path": "/api/cron/jadwal-reminder", "schedule": "0 23 * * *" }

export async function GET(req: NextRequest) {
  // Verifikasi request dari Vercel Cron (bukan request biasa)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  const dayAfter = new Date(tomorrow)
  dayAfter.setDate(dayAfter.getDate() + 1)

  try {
    // Cari jadwal esok hari yang wajib hadir
    const jadwalEsok = await prisma.jadwalKegiatan.findMany({
      where: {
        tanggal: { gte: tomorrow, lt: dayAfter },
        wajib_hadir: true,
      },
    })

    if (jadwalEsok.length === 0) {
      return NextResponse.json({ message: 'Tidak ada jadwal wajib hadir esok', sent: 0 })
    }

    // Kelompokkan per organisasi
    const byOrg: Record<string, typeof jadwalEsok> = {}
    for (const j of jadwalEsok) {
      const org = j.organisasi
      if (!byOrg[org]) byOrg[org] = []
      byOrg[org].push(j)
    }

    // Kirim email ke admin per organisasi menggunakan Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    let totalSent = 0

    for (const [org, jadwals] of Object.entries(byOrg)) {
      // Ambil email admin untuk organisasi ini
      const adminEmails = await getAdminEmails(org)
      if (adminEmails.length === 0) continue

      const jadwalList = jadwals
        .map(j => `• ${j.judul}${j.waktu ? ` pukul ${j.waktu}` : ''}${j.lokasi ? ` di ${j.lokasi}` : ''}`)
        .join('\n')

      const emailBody = {
        from: 'SKARLAKE ARTEMIS <noreply@skarlake.sch.id>',
        to: adminEmails,
        subject: `⚠️ Reminder: ${jadwals.length} Jadwal Wajib Hadir Besok — ${org.toUpperCase()}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e293b;">🔔 Pengingat Jadwal Besok</h2>
            <p>Halo Admin <strong>${org.toUpperCase()}</strong>,</p>
            <p>Berikut jadwal <strong>wajib hadir</strong> untuk besok (${tomorrow.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}):</p>
            <div style="background: #f8fafc; border-left: 4px solid #e11d48; padding: 12px 16px; border-radius: 4px; margin: 16px 0;">
              ${jadwals.map(j => `<p style="margin: 4px 0;"><strong>${j.judul}</strong>${j.waktu ? ` — ${j.waktu}` : ''}${j.lokasi ? ` — ${j.lokasi}` : ''}</p>`).join('')}
            </div>
            <p>Pastikan semua anggota hadir tepat waktu.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #94a3b8; font-size: 12px;">SKARLAKE ARTEMIS — Sistem Manajemen Ekstrakurikuler</p>
          </div>
        `,
      }

      if (RESEND_API_KEY) {
        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(emailBody),
          })
          if (res.ok) totalSent++
        } catch (err) {
          console.error(`[CRON] Gagal kirim email untuk ${org}:`, err)
        }
      }

      console.log(`[CRON] Jadwal reminder untuk ${org}:\n${jadwalList}`)
    }

    return NextResponse.json({
      success: true,
      message: `Reminder terkirim untuk ${Object.keys(byOrg).length} organisasi`,
      jadwalCount: jadwalEsok.length,
      emailSent: totalSent,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[CRON ERROR]', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

async function getAdminEmails(organisasi: string): Promise<string[]> {
  let roleFilter: string[] = ['administrator']
  if (organisasi === 'programming') roleFilter.push('admin_programming')
  else if (organisasi === 'english') roleFilter.push('admin_english')
  else if (organisasi === 'osis' || organisasi === 'mpk') roleFilter.push('admin_osis_mpk')

  const users = await prisma.user.findMany({
    where: { role: { in: roleFilter as any } },
    select: { email: true },
  })
  return users.map(u => u.email)
}
