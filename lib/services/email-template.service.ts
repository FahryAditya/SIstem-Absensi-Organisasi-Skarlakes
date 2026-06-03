import { prisma } from '@/lib/prisma'

const DEFAULT_TEMPLATES: Record<string, Record<string, { subject: string; body: string }>> = {
  programming: {
    pertemuan: {
      subject: 'Undangan Pertemuan Ekskul Programming - {{nama}}',
      body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #0f172a; margin: 0; padding: 20px; color: #f8fafc; }
    .container { max-width: 600px; margin: 20px auto; background: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.3); border: 1px border-slate-700; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 35px 24px; text-align: center; }
    .title { font-size: 26px; font-weight: 800; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
    .content { padding: 32px 24px; line-height: 1.6; }
    .greeting { font-size: 18px; color: #ffffff; font-weight: 600; margin-bottom: 16px; }
    .info-box { background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; padding: 18px; margin: 24px 0; border-radius: 8px; }
    .info-item { margin: 10px 0; color: #cbd5e1; font-size: 14px; }
    .info-label { font-weight: 600; color: #60a5fa; display: inline-block; width: 100px; }
    .footer { background: #111827; padding: 24px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">📅 Pertemuan Programming</h1>
    </div>
    <div class="content">
      <p class="greeting">Halo {{nama}},</p>
      <p>Kamu diundang untuk menghadiri pertemuan rutin Ekskul Programming. Berikut adalah detail kegiatannya:</p>
      
      <div class="info-box">
        <div class="info-item">
          <span class="info-label">📅 Hari/Tgl:</span> {{tanggal}}
        </div>
        <div class="info-item">
          <span class="info-label">🕐 Waktu:</span> {{waktu}}
        </div>
        <div class="info-item">
          <span class="info-label">📍 Lokasi:</span> {{tempat}}
        </div>
        <div class="info-item">
          <span class="info-label">💬 Pembahasan:</span> {{pembahasan}}
        </div>
      </div>

      <p>Mohon kehadirannya tepat waktu dan persiapkan laptop serta kelengkapan coding kamu. Sampai jumpa di lokasi!</p>
    </div>
    <div class="footer">
      <p>Salam Pembahasan,<br><strong>Pengurus Programming</strong></p>
      <p style="margin-top: 15px; font-size: 11px; color: #64748b;">Email ini dikirim secara otomatis oleh Sistem Absensi Organisasi Skarlakes</p>
    </div>
  </div>
</body>
</html>
      `,
    },
  },
  english: {
    pertemuan: {
      subject: 'English Club Meeting Invitation - {{nama}}',
      body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #064e3b; margin: 0; padding: 20px; color: #f0fdf4; }
    .container { max-width: 600px; margin: 20px auto; background: #065f46; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 35px 24px; text-align: center; }
    .title { font-size: 26px; font-weight: 800; margin: 0; }
    .content { padding: 32px 24px; line-height: 1.6; }
    .greeting { font-size: 18px; color: #ffffff; font-weight: 600; margin-bottom: 16px; }
    .info-box { background: rgba(16, 185, 129, 0.15); border-left: 4px solid #10b981; padding: 18px; margin: 24px 0; border-radius: 8px; }
    .info-item { margin: 10px 0; color: #e6fdf0; font-size: 14px; }
    .info-label { font-weight: 600; color: #a7f3d0; display: inline-block; width: 100px; }
    .footer { background: #022c22; padding: 24px; text-align: center; color: #a7f3d0; font-size: 12px; border-top: 1px solid #047857; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">🇬🇧 English Club Meeting</h1>
    </div>
    <div class="content">
      <p class="greeting">Hi {{nama}},</p>
      <p>You are cordially invited to our weekly English Club session. Please find the details below:</p>
      
      <div class="info-box">
        <div class="info-item"><span class="info-label">📅 Date:</span> {{tanggal}}</div>
        <div class="info-item"><span class="info-label">🕐 Time:</span> {{waktu}}</div>
        <div class="info-item"><span class="info-label">📍 Venue:</span> {{tempat}}</div>
        <div class="info-item"><span class="info-label">💬 Topic:</span> {{pembahasan}}</div>
      </div>

      <p>We highly encourage your active participation to improve your English communication skills. Let's learn and have fun together!</p>
    </div>
    <div class="footer">
      <p>Warm regards,<br><strong>English Club Board</strong></p>
      <p style="margin-top: 15px; font-size: 11px; color: #047857;">This is an automated email from Absensi Organisasi Skarlakes</p>
    </div>
  </div>
</body>
</html>
      `,
    },
  },
  osis: {
    rapat: {
      subject: 'Undangan Rapat Pengurus OSIS - {{nama}}',
      body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #450a0a; margin: 0; padding: 20px; color: #fef2f2; }
    .container { max-width: 600px; margin: 20px auto; background: #7f1d1d; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
    .header { background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); color: white; padding: 35px 24px; text-align: center; }
    .title { font-size: 26px; font-weight: 800; margin: 0; }
    .content { padding: 32px 24px; line-height: 1.6; }
    .greeting { font-size: 18px; color: #ffffff; font-weight: 600; margin-bottom: 16px; }
    .info-box { background: rgba(239, 68, 68, 0.15); border-left: 4px solid #ef4444; padding: 18px; margin: 24px 0; border-radius: 8px; }
    .info-item { margin: 10px 0; color: #fee2e2; font-size: 14px; }
    .info-label { font-weight: 600; color: #fca5a5; display: inline-block; width: 100px; }
    .footer { background: #1e0505; padding: 24px; text-align: center; color: #fca5a5; font-size: 12px; border-top: 1px solid #991b1b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">📋 Rapat Koordinasi OSIS</h1>
    </div>
    <div class="content">
      <p class="greeting">Yth. {{nama}},</p>
      <p>Sehubungan dengan pelaksanaan program kerja, kami mengundang Anda untuk menghadiri rapat pengurus OSIS:</p>
      
      <div class="info-box">
        <div class="info-item"><span class="info-label">📅 Tanggal:</span> {{tanggal}}</div>
        <div class="info-item"><span class="info-label">🕐 Waktu:</span> {{waktu}}</div>
        <div class="info-item"><span class="info-label">📍 Tempat:</span> {{tempat}}</div>
        <div class="info-item"><span class="info-label">📌 Agenda:</span> {{pembahasan}}</div>
        {{#if masalah}}
        <div class="info-item"><span class="info-label">⚠️ Bahasan:</span> {{masalah}}</div>
        {{/if}}
      </div>

      <p>Kehadiran Anda sangat menentukan kelancaran program kerja kita. Mohon datang tepat waktu.</p>
    </div>
    <div class="footer">
      <p>Hormat kami,<br><strong>Pengurus OSIS</strong></p>
      <p style="margin-top: 15px; font-size: 11px; color: #991b1b;">Email ini dikirim secara otomatis oleh Sistem Absensi Organisasi Skarlakes</p>
    </div>
  </div>
</body>
</html>
      `,
    },
  },
  mpk: {
    rapat: {
      subject: 'Undangan Sidang Rapat MPK - {{nama}}',
      body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #2e1065; margin: 0; padding: 20px; color: #faf5ff; }
    .container { max-width: 600px; margin: 20px auto; background: #4c1d95; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
    .header { background: linear-gradient(135deg, #a855f7 0%, #7e22ce 100%); color: white; padding: 35px 24px; text-align: center; }
    .title { font-size: 26px; font-weight: 800; margin: 0; }
    .content { padding: 32px 24px; line-height: 1.6; }
    .greeting { font-size: 18px; color: #ffffff; font-weight: 600; margin-bottom: 16px; }
    .info-box { background: rgba(168, 85, 247, 0.15); border-left: 4px solid #a855f7; padding: 18px; margin: 24px 0; border-radius: 8px; }
    .info-item { margin: 10px 0; color: #f3e8ff; font-size: 14px; }
    .info-label { font-weight: 600; color: #d8b4fe; display: inline-block; width: 100px; }
    .footer { background: #17072c; padding: 24px; text-align: center; color: #d8b4fe; font-size: 12px; border-top: 1px solid #6b21a8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">🏛️ Rapat Paripurna MPK</h1>
    </div>
    <div class="content">
      <p class="greeting">Yth. {{nama}},</p>
      <p>Mengundang pengurus Majelis Perwakilan Kelas untuk hadir dalam Sidang / Rapat MPK:</p>
      
      <div class="info-box">
        <div class="info-item"><span class="info-label">📅 Tanggal:</span> {{tanggal}}</div>
        <div class="info-item"><span class="info-label">🕐 Waktu:</span> {{waktu}}</div>
        <div class="info-item"><span class="info-label">📍 Tempat:</span> {{tempat}}</div>
        <div class="info-item"><span class="info-label">📌 Agenda:</span> {{pembahasan}}</div>
      </div>

      <p>Mohon dipersiapkan dokumen evaluasi serta hadir tepat waktu sesuai jadwal.</p>
    </div>
    <div class="footer">
      <p>Hormat kami,<br><strong>Pengurus MPK</strong></p>
      <p style="margin-top: 15px; font-size: 11px; color: #6b21a8;">Email ini dikirim secara otomatis oleh Sistem Absensi Organisasi Skarlakes</p>
    </div>
  </div>
</body>
</html>
      `,
    },
  },
}

export async function renderEmailTemplate(
  org: string,
  emailType: string,
  data: Record<string, any>
): Promise<{ subject: string; html: string }> {
  const cleanOrg = org.toLowerCase()
  const cleanType = emailType.toLowerCase()

  let subject = ''
  let html = ''

  // 1. Try to load from database first
  try {
    const dbTemplate = await prisma.emailTemplate.findFirst({
      where: {
        organizationType: cleanOrg as any,
        emailType: cleanType,
        isActive: true,
      },
    })
    if (dbTemplate) {
      subject = dbTemplate.subject
      html = dbTemplate.bodyTemplate
    }
  } catch (error) {
    console.error('Error loading template from DB:', error)
  }

  // 2. Fallback to hardcoded defaults
  if (!subject || !html) {
    const group = DEFAULT_TEMPLATES[cleanOrg]
    const template = group ? group[cleanType] || Object.values(group)[0] : null

    if (!template) {
      throw new Error(`Template not found for ${org} - ${emailType}`)
    }
    subject = template.subject
    html = template.body
  }

  // 3. Simple rendering replacing double curly brackets {{key}}
  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    subject = subject.replace(regex, String(value || ''))
    html = html.replace(regex, String(value || ''))
  })

  // Handle simple {{#if key}} ... {{/if}} replacement
  // Specifically for optional fields like 'masalah'
  const ifRegex = /{{#if (\w+)}}([\s\S]*?){{\/if}}/g
  html = html.replace(ifRegex, (match, fieldName, content) => {
    if (data[fieldName]) {
      return content.replace(new RegExp(`{{${fieldName}}}`, 'g'), String(data[fieldName]))
    }
    return ''
  })

  return { subject, html }
}
