import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAccessibleOrgs } from '@/lib/auth-shared'
import { createLog, getIp } from '@/lib/log'
import { withTransaction } from '@/lib/db-transaction'
import { z } from 'zod'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
  }
}

const schema = z.object({
  id_anggota: z.number().int().positive(),
  org: z.enum(['programming', 'english', 'osis', 'mpk']),
  nominal: z.number().int(), // positif untuk setor, negatif untuk tarik
  keterangan: z.string().min(1, 'Keterangan wajib diisi'),
})

export async function POST(req: NextRequest) {
  try {
    const ctx = getCtx(req)
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { id_anggota, org, nominal, keterangan } = parsed.data
    const accessible = getAccessibleOrgs(ctx.userRole)

    if (!accessible.includes(org)) {
      return NextResponse.json({ error: 'Akses ditolak untuk unit ini' }, { status: 403 })
    }

    if (nominal === 0) {
      return NextResponse.json({ error: 'Nominal tidak boleh nol' }, { status: 400 })
    }

    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    const timeString = `${days[today.getDay()]}, ${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()} ${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`

    const finalKeterangan = `[${timeString}] ${keterangan}`

    // ── Semua operasi baca-tulis dalam satu transaction agar tidak terjadi
    //    double-spending akibat dua admin submit bersamaan. ──────────────────
    let namaAnggota = ''

    await withTransaction(async (tx) => {

      if (org === 'programming' || org === 'english') {
        // Validasi siswa dalam transaksi yang sama
        const siswa = await tx.siswa.findUnique({ where: { id: id_anggota } })
        if (!siswa || siswa.ekskul !== org) throw new Error('INVALID_SISWA')
        namaAnggota = siswa.nama

        // Cari record absensi hari ini (lock row dengan select within transaction)
        const existing = await tx.absensi.findFirst({
          where: { siswa_id: id_anggota, tanggal: { gte: startOfDay, lte: endOfDay } },
        })

        if (existing) {
          // AMAN: increment atomic — tidak ada lost-update meski 2 admin bersamaan
          await tx.absensi.update({
            where: { id: existing.id },
            data: {
              uang_kas: { increment: nominal }, // ← atomic, bukan += read-then-write
              keterangan: existing.keterangan
                ? `${existing.keterangan} | ${finalKeterangan}`
                : finalKeterangan,
              updated_by: ctx.userId,
            },
          })
        } else {
          try {
            await tx.absensi.create({
              data: {
                siswa_id: id_anggota,
                tanggal: startOfDay,
                status: 'kas_saja' as any,
                uang_kas: nominal,
                keterangan: finalKeterangan,
                created_by: ctx.userId,
              },
            })
          } catch (e: any) {
            // Jika admin lain create duluan (P2002 unique constraint),
            // fallback ke update dengan atomic increment
            if (e?.code === 'P2002') {
              const created = await tx.absensi.findFirst({
                where: { siswa_id: id_anggota, tanggal: { gte: startOfDay, lte: endOfDay } },
              })
              if (created) {
                await tx.absensi.update({
                  where: { id: created.id },
                  data: {
                    uang_kas: { increment: nominal },
                    keterangan: created.keterangan
                      ? `${created.keterangan} | ${finalKeterangan}`
                      : finalKeterangan,
                    updated_by: ctx.userId,
                  },
                })
              }
            } else throw e
          }
        }

      } else if (org === 'osis') {
        const anggota = await tx.anggotaOsis.findUnique({ where: { id: id_anggota } })
        if (!anggota) throw new Error('INVALID_ANGGOTA')
        namaAnggota = anggota.nama

        const existing = await tx.absensiOrganisasi.findFirst({
          where: { organisasi_type: 'osis', anggota_osis_id: id_anggota, tanggal: { gte: startOfDay, lte: endOfDay } },
        })

        if (existing) {
          await tx.absensiOrganisasi.update({
            where: { id: existing.id },
            data: {
              uang_kas: { increment: nominal }, // ← atomic increment
              keterangan: existing.keterangan
                ? `${existing.keterangan} | ${finalKeterangan}`
                : finalKeterangan,
              updated_by: ctx.userId,
            },
          })
        } else {
          try {
            await tx.absensiOrganisasi.create({
              data: {
                organisasi_type: 'osis',
                anggota_osis_id: id_anggota,
                tanggal: startOfDay,
                status: 'kas_saja' as any,
                uang_kas: nominal,
                keterangan: finalKeterangan,
                created_by: ctx.userId,
              },
            })
          } catch (e: any) {
            if (e?.code === 'P2002') {
              const created = await tx.absensiOrganisasi.findFirst({
                where: { organisasi_type: 'osis', anggota_osis_id: id_anggota, tanggal: { gte: startOfDay, lte: endOfDay } },
              })
              if (created) {
                await tx.absensiOrganisasi.update({
                  where: { id: created.id },
                  data: {
                    uang_kas: { increment: nominal },
                    keterangan: created.keterangan
                      ? `${created.keterangan} | ${finalKeterangan}`
                      : finalKeterangan,
                    updated_by: ctx.userId,
                  },
                })
              }
            } else throw e
          }
        }

      } else if (org === 'mpk') {
        const anggota = await tx.anggotaMpk.findUnique({ where: { id: id_anggota } })
        if (!anggota) throw new Error('INVALID_ANGGOTA')
        namaAnggota = anggota.nama

        const existing = await tx.absensiOrganisasi.findFirst({
          where: { organisasi_type: 'mpk', anggota_mpk_id: id_anggota, tanggal: { gte: startOfDay, lte: endOfDay } },
        })

        if (existing) {
          await tx.absensiOrganisasi.update({
            where: { id: existing.id },
            data: {
              uang_kas: { increment: nominal }, // ← atomic increment
              keterangan: existing.keterangan
                ? `${existing.keterangan} | ${finalKeterangan}`
                : finalKeterangan,
              updated_by: ctx.userId,
            },
          })
        } else {
          try {
            await tx.absensiOrganisasi.create({
              data: {
                organisasi_type: 'mpk',
                anggota_mpk_id: id_anggota,
                tanggal: startOfDay,
                status: 'kas_saja' as any,
                uang_kas: nominal,
                keterangan: finalKeterangan,
                created_by: ctx.userId,
              },
            })
          } catch (e: any) {
            if (e?.code === 'P2002') {
              const created = await tx.absensiOrganisasi.findFirst({
                where: { organisasi_type: 'mpk', anggota_mpk_id: id_anggota, tanggal: { gte: startOfDay, lte: endOfDay } },
              })
              if (created) {
                await tx.absensiOrganisasi.update({
                  where: { id: created.id },
                  data: {
                    uang_kas: { increment: nominal },
                    keterangan: created.keterangan
                      ? `${created.keterangan} | ${finalKeterangan}`
                      : finalKeterangan,
                    updated_by: ctx.userId,
                  },
                })
              }
            } else throw e
          }
        }
      }
    })

    // Lempar error validasi setelah transaction selesai
    if (!namaAnggota) {
      return NextResponse.json({ error: 'Data anggota tidak valid' }, { status: 400 })
    }

    const actionText = nominal > 0 ? 'menambahkan' : 'mengurangi'
    const absNominal = Math.abs(nominal)

    await createLog({
      userId: ctx.userId,
      userNama: ctx.userNama,
      aksi: 'CREATE',
      tabel: 'transaksi_kas',
      recordId: id_anggota.toString(),
      deskripsi: `${ctx.userNama} ${actionText} kas Rp ${absNominal.toLocaleString('id-ID')} untuk ${namaAnggota} (${org.toUpperCase()}). Ket: ${keterangan}`,
      ipAddress: getIp(req),
    })

    return NextResponse.json({ success: true, message: 'Transaksi kas berhasil disimpan' })
  } catch (e: any) {
    if (e?.message === 'INVALID_SISWA')
      return NextResponse.json({ error: 'Siswa tidak valid' }, { status: 400 })
    if (e?.message === 'INVALID_ANGGOTA')
      return NextResponse.json({ error: 'Anggota tidak valid' }, { status: 400 })

    console.error('[KAS TRANSAKSI ERROR]', e)
    return NextResponse.json({ error: 'Terjadi kesalahan server saat menyimpan kas' }, { status: 500 })
  }
}
