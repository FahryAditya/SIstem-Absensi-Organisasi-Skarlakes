import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const eskulSchema = z.object({
  organization_id: z.number(),
  nama_peserta: z.string().min(3).max(100),
  kelas: z.string(),
  kejuruan: z.string(),
  email_gmail: z.string().email().refine(email => email.endsWith('@gmail.com'), {
    message: 'Harus menggunakan email @gmail.com'
  }),
  nisn: z.string().optional().nullable(),
  qr_token: z.string().optional().nullable(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = eskulSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { organization_id, email_gmail } = parsed.data

    // 1. Check organization
    const org = await prisma.organization.findUnique({
      where: { id: organization_id }
    })

    if (!org || (org.tipe !== 'programming' && org.tipe !== 'english')) {
      return NextResponse.json({ error: 'Program ekstrakurikuler tidak valid' }, { status: 400 })
    }

    // 2. Check duplicate
    const existing = await prisma.registrationEskul.findFirst({
      where: {
        email_gmail,
        organization_id,
        status: { in: ['MENUNGGU', 'DITERIMA'] }
      }
    })

    if (existing) {
      return NextResponse.json({ 
        error: 'Email sudah terdaftar di program ini',
        code: 'DUPLICATE_EMAIL'
      }, { status: 409 })
    }

    // 3. Save registration
    const registration = await prisma.registrationEskul.create({
      data: {
        ...parsed.data,
        status: 'MENUNGGU'
      }
    })

    // 4. (Optional) Send Confirmation Email Logic here
    console.log(`[REGISTRATION] New registration for ${org.nama}: ${registration.nama_peserta} (${registration.email_gmail})`)

    return NextResponse.json({ 
      success: true, 
      data: registration,
      message: 'Pendaftaran berhasil dikirim. Tunggu konfirmasi admin melalui email.'
    })
  } catch (error: any) {
    console.error('[REGISTRATION ESKUL ERROR]', error)
    return NextResponse.json({ error: 'Terjadi kesalahan saat memproses pendaftaran' }, { status: 500 })
  }
}
