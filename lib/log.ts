import { prisma } from './prisma'

interface LogParams {
  userId: number
  userNama: string
  aksi: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT'
  tabel: string
  recordId?: string | number
  deskripsi: string
  dataLama?: Record<string, unknown>
  dataBaru?: Record<string, unknown>
  ipAddress?: string
}

export async function createLog(params: LogParams) {
  try {
    await prisma.logAktivitas.create({
      data: {
        user_id: params.userId,
        user_nama: params.userNama,
        aksi: params.aksi,
        tabel: params.tabel,
        record_id: params.recordId?.toString(),
        deskripsi: params.deskripsi,
        data_lama: (params.dataLama as any) ?? undefined,
        data_baru: (params.dataBaru as any) ?? undefined,
        ip_address: params.ipAddress,
      }
    })
  } catch (e) {
    // Log gagal tidak boleh crash aplikasi
    console.error('[LOG ERROR]', e)
  }
}

export function getIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  return forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1'
}
