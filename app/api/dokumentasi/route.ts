import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAccessibleOrgs } from '@/lib/auth-shared'
import { createLog, getIp } from '@/lib/log'
import cloudinary, { isCloudinaryConfigured } from '@/lib/cloudinary'

export const dynamic = 'force-dynamic'

let isTableChecked = false

async function ensureDokumentasiFotoTable() {
  if (isTableChecked) return
  try {
    // ── Step 1: Create the ENUM type if absent ─────────────────────────────────────
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'OrganisasiType'
        ) THEN
          CREATE TYPE "OrganisasiType" AS ENUM ('programming','english','osis','mpk');
        END IF;
      END $$;
    `)
    // ── Step 2: CREATE TABLE with ENUM column ─────────────────────────────────────
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "dokumentasi_foto" (
        "id"              SERIAL PRIMARY KEY,
        "organisasi_type" "OrganisasiType" NOT NULL,
        "judul"           VARCHAR(150) NOT NULL,
        "deskripsi"       TEXT,
        "image_url"       VARCHAR(255) NOT NULL,
        "public_id"       VARCHAR(100),
        "tanggal"         DATE NOT NULL,
        "created_by"      INTEGER NOT NULL REFERENCES "users"("id"),
        "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)
    // ── Step 3: Upgrade existing column if it was previously VARCHAR/TEXT ───────────
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_attribute
          WHERE attrelid = 'dokumentasi_foto'::regclass
            AND attname    = 'organisasi_type'
            AND NOT attisdropped
        ) THEN
          -- Clean up invalid/null values to 'programming' before altering type to avoid cast errors
          UPDATE "dokumentasi_foto"
          SET "organisasi_type" = 'programming'
          WHERE "organisasi_type" IS NULL 
             OR "organisasi_type"::text NOT IN ('programming','english','osis','mpk');

          ALTER TABLE "dokumentasi_foto"
            ALTER COLUMN "organisasi_type" TYPE "OrganisasiType"
            USING "organisasi_type"::text::"OrganisasiType";
        ELSE
          ALTER TABLE "dokumentasi_foto"
            ADD COLUMN "organisasi_type" "OrganisasiType" NOT NULL DEFAULT 'programming';
        END IF;
      END $$;
    `)

    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "dokumentasi_foto_organisasi_type_idx" ON "dokumentasi_foto"("organisasi_type");')
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "dokumentasi_foto_tanggal_idx" ON "dokumentasi_foto"("tanggal");')
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "dokumentasi_foto_created_at_idx" ON "dokumentasi_foto"("created_at");')
    isTableChecked = true
  } catch (err) {
    console.error('Failed to ensure table dokumentasi_foto:', err)
    // Don't set isTableChecked = true, so we can retry next time, but throw the error to fail fast
    throw err
  }
}



function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: (req.headers.get('x-user-role') || '').trim(),
  }
}

// ─── 1. GET: Ambil Daftar Foto ────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await ensureDokumentasiFotoTable()

    const { userRole } = getCtx(req)
    const { searchParams } = new URL(req.url)
    const orgFilter = searchParams.get('org') || ''

    const accessible = getAccessibleOrgs(userRole)
    
    // Filter pencarian tanggal dan judul
    const queryJudul = searchParams.get('q') || ''
    const dateStart = searchParams.get('start') || ''
    const dateEnd = searchParams.get('end') || ''

    // Tentukan organisasi mana yang bisa dilihat oleh user saat ini
    const allowedOrgs = orgFilter && accessible.includes(orgFilter)
      ? [orgFilter]
      : accessible

    if (allowedOrgs.length === 0) {
      return NextResponse.json({ data: [] })
    }

    const where: any = {
      organisasi_type: { in: allowedOrgs as any[] },
      ...(queryJudul && {
        judul: {
          contains: queryJudul,
          mode: 'insensitive',
        },
      }),
    }

    if (dateStart || dateEnd) {
      const tanggalFilter: any = {}
      if (dateStart) {
        const startDateObj = new Date(dateStart)
        if (!isNaN(startDateObj.getTime())) {
          tanggalFilter.gte = startDateObj
        }
      }
      if (dateEnd) {
        const endDateObj = new Date(dateEnd)
        if (!isNaN(endDateObj.getTime())) {
          tanggalFilter.lte = endDateObj
        }
      }
      if (Object.keys(tanggalFilter).length > 0) {
        where.tanggal = tanggalFilter
      }
    }

    const photos = await prisma.dokumentasiFoto.findMany({
      where,
      orderBy: { tanggal: 'desc' },
      include: {
        creator: {
          select: { nama: true, email: true },
        },
      },
    })

    return NextResponse.json({ data: photos })
  } catch (error: any) {
    console.error('Failed to get photos:', error)
    return NextResponse.json({ error: 'Gagal memuat dokumentasi foto: ' + error.message }, { status: 500 })
  }
}

// ─── 2. POST: Upload Foto Baru ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    await ensureDokumentasiFotoTable()

    const { userId, userNama, userRole } = getCtx(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const judul = formData.get('judul') as string | null
    const deskripsi = formData.get('deskripsi') as string | null
    const organisasiType = formData.get('organisasi_type') as string | null
    const tanggalStr = formData.get('tanggal') as string | null

    if (!file || !judul || !organisasiType || !tanggalStr) {
      return NextResponse.json({ error: 'Semua kolom wajib diisi' }, { status: 400 })
    }

    const tanggalVal = new Date(tanggalStr)
    if (isNaN(tanggalVal.getTime())) {
      return NextResponse.json({ error: 'Format tanggal tidak valid' }, { status: 400 })
    }

    // Pastikan user memiliki hak akses mengunggah ke organisasi ini
    const accessible = getAccessibleOrgs(userRole)
    if (!accessible.includes(organisasiType)) {
      return NextResponse.json({ error: 'Anda tidak memiliki hak akses untuk organisasi ini' }, { status: 403 })
    }

    if (!isCloudinaryConfigured) {
      return NextResponse.json({ error: 'Cloudinary belum dikonfigurasi pada server.' }, { status: 500 })
    }

    let imageUrl = ''
    let publicId = ''

    // UPLOAD ASLI KE CLOUDINARY
    try {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`

      const uploadResult = await cloudinary.uploader.upload(base64Image, {
        folder: 'artemis_dokumentasi',
        resource_type: 'image',
      })

      imageUrl = uploadResult.secure_url
      publicId = uploadResult.public_id
    } catch (uploadError: any) {
      console.error('Cloudinary upload error:', uploadError)
      return NextResponse.json({ error: 'Gagal mengunggah gambar ke cloud storage' }, { status: 500 })
    }

    // Simpan ke Neon PostgreSQL
    const newPhoto = await prisma.dokumentasiFoto.create({
      data: {
        organisasi_type: organisasiType as any,
        judul,
        deskripsi,
        image_url: imageUrl,
        public_id: publicId,
        tanggal: tanggalVal,
        created_by: userId,
      },
      include: {
        creator: {
          select: { nama: true },
        },
      },
    })

    // Log Aktivitas
    await createLog({
      userId,
      userNama,
      aksi: 'CREATE',
      tabel: 'dokumentasi_foto',
      recordId: newPhoto.id.toString(),
      deskripsi: `Mengunggah foto dokumentasi kegiatan "${judul}" untuk organisasi ${organisasiType.toUpperCase()}`,
      ipAddress: getIp(req),
    })

    return NextResponse.json({
      data: newPhoto,
    })
  } catch (error: any) {
    console.error('Failed to create photo record:', error)
    return NextResponse.json({ error: 'Gagal menyimpan dokumentasi foto' }, { status: 500 })
  }
}

// ─── 3. DELETE: Hapus Foto ──────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    await ensureDokumentasiFotoTable()

    const { userId, userNama, userRole } = getCtx(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const idStr = searchParams.get('id')
    if (!idStr) {
      return NextResponse.json({ error: 'ID tidak boleh kosong' }, { status: 400 })
    }

    const id = parseInt(idStr)

    // Ambil rekam data foto
    const photo = await prisma.dokumentasiFoto.findUnique({
      where: { id },
    })

    if (!photo) {
      return NextResponse.json({ error: 'Dokumentasi foto tidak ditemukan' }, { status: 404 })
    }

    // Pastikan user memiliki hak akses terhadap organisasi ini
    const accessible = getAccessibleOrgs(userRole)
    if (!accessible.includes(photo.organisasi_type)) {
      return NextResponse.json({ error: 'Anda tidak memiliki hak akses untuk menghapus foto ini' }, { status: 403 })
    }

    // Hapus dari Cloudinary jika bukan demo placeholder dan Cloudinary dikonfigurasi
    if (photo.public_id && !photo.public_id.startsWith('demo_mode_placeholder_') && isCloudinaryConfigured) {
      try {
        await cloudinary.uploader.destroy(photo.public_id)
      } catch (cloudinaryError: any) {
        console.error('Cloudinary destroy error:', cloudinaryError)
        // Tetap lanjutkan penghapusan dari database jika gagal menghapus dari cloud
      }
    }

    // Hapus dari Neon PostgreSQL
    await prisma.dokumentasiFoto.delete({
      where: { id },
    })

    // Log Aktivitas
    await createLog({
      userId,
      userNama,
      aksi: 'DELETE',
      tabel: 'dokumentasi_foto',
      recordId: id.toString(),
      deskripsi: `Menghapus foto dokumentasi kegiatan "${photo.judul}" organisasi ${photo.organisasi_type.toUpperCase()}`,
      ipAddress: getIp(req),
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to delete photo:', error)
    return NextResponse.json({ error: 'Gagal menghapus dokumentasi foto' }, { status: 500 })
  }
}
