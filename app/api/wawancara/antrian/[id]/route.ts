import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdministrator } from '@/lib/auth-shared'
import { createLog, getIp } from '@/lib/log'

export const dynamic = 'force-dynamic'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = getCtx(req)

  if (!isAdministrator(ctx.userRole)) {
    return NextResponse.json({ error: 'Hanya Administrator yang dapat menghapus peserta wawancara' }, { status: 403 })
  }

  const id = parseInt(params.id)
  if (isNaN(id)) {
    return NextResponse.json({ error: 'ID peserta tidak valid' }, { status: 400 })
  }

  const antrian = await prisma.antrianWawancara.findUnique({
    where: { id },
    include: { sesi: true },
  })

  if (!antrian) {
    return NextResponse.json({ error: 'Peserta wawancara tidak ditemukan' }, { status: 404 })
  }

  // Validation: session must be modifiable (SCHEDULED or ACTIVE)
  // Removed this check because Administrator is allowed to delete participants from locked sessions

  // Validation: cannot delete participant currently being interviewed
  if (antrian.status === 'WAWANCARA') {
    return NextResponse.json({ error: 'Peserta sedang dalam proses diwawancarai. Tidak dapat dihapus.' }, { status: 400 })
  }

  // Capture data for log before deletion
  const namaPeserta = antrian.nama
  const kelasPeserta = antrian.kelas
  const nomorAntrian = antrian.nomor_antrian
  const organisasi = antrian.sesi.organisasi_type

  // Delete (cascade will remove hasil_wawancara if exists)
  await prisma.antrianWawancara.delete({
    where: { id },
  })

  // Log activity
  await createLog({
    userId: ctx.userId,
    userNama: ctx.userNama,
    aksi: 'DELETE',
    tabel: 'antrian_wawancara',
    recordId: id.toString(),
    deskripsi: `${ctx.userNama} menghapus peserta wawancara: ${namaPeserta} (${kelasPeserta}), No.${nomorAntrian}, ${organisasi.toUpperCase()}`,
    dataLama: {
      nama: namaPeserta,
      kelas: kelasPeserta,
      nomor_antrian: nomorAntrian,
      status: antrian.status,
      sesi_id: antrian.sesi_id,
      organisasi_type: organisasi,
    },
    ipAddress: getIp(req),
  })

  return NextResponse.json({ success: true, message: 'Peserta berhasil dihapus' })
}
