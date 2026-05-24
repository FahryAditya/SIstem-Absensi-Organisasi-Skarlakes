import { PrismaClient } from '@prisma/client';

/**
 * Script untuk sinkronisasi data dari Supabase ke Neon PostgreSQL.
 * Pastikan NEON_DATABASE_URL sudah diatur di .env.
 */

const supabaseUrl = process.env.DATABASE_URL;
const neonUrl = process.env.NEON_DATABASE_URL;

async function sync() {
  if (!supabaseUrl || !neonUrl) {
    console.error('❌ Error: DATABASE_URL (Supabase) atau NEON_DATABASE_URL tidak ditemukan.');
    process.exit(1);
  }

  const supabase = new PrismaClient({ datasources: { db: { url: supabaseUrl } } });
  const neon = new PrismaClient({ datasources: { db: { url: neonUrl } } });

  console.log('--- STARTING DATA SYNC (SUPABASE -> NEON) ---');

  const tableToModel: Record<string, string> = {
    'users': 'user',
    'siswa': 'siswa',
    'absensi': 'absensi',
    'anggota_osis': 'anggotaOsis',
    'anggota_mpk': 'anggotaMpk',
    'absensi_organisasi': 'absensiOrganisasi',
    'log_aktivitas': 'logAktivitas',
    'pengeluaran_kas': 'pengeluaranKas',
    'sesi_wawancara': 'sesiWawancara',
    'qr_wawancara': 'qrWawancara',
    'antrian_wawancara': 'antrianWawancara',
    'hasil_wawancara': 'hasilWawancaraTable',
    'chat_wawancara': 'chatWawancara',
    'system_updates': 'systemUpdate',
    'dokumentasi_foto': 'dokumentasiFoto',
    'pencapaian': 'pencapaian',
    'siswa_pencapaian': 'siswaPencapaian',
    'materi_hari_ini': 'materiHariIni',
    'jadwal_kegiatan': 'jadwalKegiatan',
    'exp_log': 'expLog'
  };

  try {
    for (const [tableName, modelName] of Object.entries(tableToModel)) {
      console.log(`Checking table "${tableName}"...`);
      
      try {
        const rows: any[] = await supabase.$queryRawUnsafe(`SELECT * FROM "${tableName}"`);
        
        if (rows.length === 0) {
          console.log(`Table "${tableName}" is empty. Skipping.`);
          continue;
        }

        console.log(`Migrating ${rows.length} rows to Neon model "${modelName}"...`);
        
        for (const row of rows) {
          try {
            await (neon as any)[modelName].upsert({
              where: { id: row.id },
              update: row,
              create: row,
            });
          } catch (upsertErr: any) {
            console.error(`❌ Upsert failed for ${modelName} ID ${row.id}:`, upsertErr.message);
          }
        }
        console.log(`✅ Finished migrating "${tableName}".`);
      } catch (fetchErr: any) {
        if (fetchErr.message.includes('does not exist')) {
          console.log(`⚠️ Table "${tableName}" does not exist in Supabase. Skipping.`);
        } else {
          console.error(`❌ Error fetching "${tableName}":`, fetchErr.message);
        }
      }
    }

    console.log('🔄 Resetting sequences in Neon...');
    for (const tableName of Object.keys(tableToModel)) {
      try {
        await neon.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), COALESCE(MAX(id), 1)) FROM "${tableName}"`);
      } catch (e) {}
    }

    console.log('✨ DATA SYNC COMPLETED ✨');

  } finally {
    await supabase.$disconnect();
    await neon.$disconnect();
  }
}

sync().catch(err => {
  console.error('❌ Sync script failed:', err);
  process.exit(1);
});
