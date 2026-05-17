import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { isAdministrator } from '@/lib/auth-shared'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
  }
}

export async function POST(req: NextRequest) {
  const ctx = getCtx(req)
  if (!isAdministrator(ctx.userRole.trim())) {
    return NextResponse.json(
      { error: 'Hanya Administrator yang dapat melakukan optimasi database' },
      { status: 403 }
    )
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // 1. Prune activity logs older than 30 days (excluding critical DELETE / LOGIN events)
    const prunedLogs = await prisma.logAktivitas.deleteMany({
      where: {
        created_at: { lt: thirtyDaysAgo },
        NOT: {
          aksi: { in: ['DELETE', 'LOGIN'] }
        }
      }
    })

    // 2. Clean expired QR tokens
    const prunedQrs = await prisma.qrWawancara.deleteMany({
      where: {
        valid_until: { lt: new Date() }
      }
    })

    // 3. Clean old chat messages (older than 7 days)
    const prunedChats = await prisma.chatWawancara.deleteMany({
      where: {
        created_at: { lt: sevenDaysAgo }
      }
    })

    // 4. Run ANALYZE to refresh indices statistics
    const tables = ['users', 'siswa', 'absensi', 'anggota_osis', 'anggota_mpk', 'absensi_organisasi', 'log_aktivitas', 'pengeluaran_kas', 'sesi_wawancara', 'antrian_wawancara', 'qr_wawancara', 'hasil_wawancara', 'chat_wawancara', 'system_updates']
    
    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`ANALYZE "${table}";`)
      } catch (tableErr) {
        console.warn(`[WARN] Gagal menganalisis tabel ${table}:`, tableErr)
      }
    }

    // 5. Query live table sizes
    let tableSizes: { table_name: string; total_size: string }[] = []
    try {
      tableSizes = await prisma.$queryRawUnsafe<any[]>(`
        SELECT
          relname AS table_name,
          pg_size_pretty(pg_total_relation_size(pg_class.oid)) AS total_size
        FROM pg_class
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE nspname = 'public' AND relkind = 'r'
        ORDER BY pg_total_relation_size(pg_class.oid) DESC;
      `)
    } catch (sizeErr) {
      console.error('[ERROR] Gagal membaca ukuran tabel:', sizeErr)
    }

    const description = `${ctx.userNama} mengoptimalkan database: membersihkan ${prunedLogs.count} log lama, ${prunedQrs.count} QR kedaluwarsa, ${prunedChats.count} chat lama, dan menyegarkan statistik query planner.`

    await createLog({
      userId: ctx.userId,
      userNama: ctx.userNama,
      aksi: 'UPDATE',
      tabel: 'database',
      deskripsi: description,
      dataBaru: {
        prunedLogs: prunedLogs.count,
        prunedQrs: prunedQrs.count,
        prunedChats: prunedChats.count,
        tableCount: tables.length
      },
      ipAddress: getIp(req),
    })

    return NextResponse.json({
      success: true,
      summary: {
        prunedLogs: prunedLogs.count,
        prunedQrs: prunedQrs.count,
        prunedChats: prunedChats.count,
      },
      tableSizes
    })

  } catch (error: any) {
    console.error('[DB OPTIMIZE ERROR]', error)
    return NextResponse.json(
      { error: 'Gagal mengoptimalkan database: ' + error.message },
      { status: 500 }
    )
  }
}
