/* Menerapkan index dari prisma/schema.prisma ke Neon (CREATE INDEX IF NOT EXISTS) */
require('dotenv').config()
const { Client } = require('pg')

const statements = [
  // members
  'CREATE INDEX IF NOT EXISTS members_organization_id_status_exp_idx ON members (organization_id, status, exp)',
  'CREATE INDEX IF NOT EXISTS members_email_idx ON members (email)',
  // attendance
  'CREATE INDEX IF NOT EXISTS attendance_organization_id_date_status_idx ON attendance (organization_id, date, status)',
  'CREATE INDEX IF NOT EXISTS attendance_date_status_idx ON attendance (date, status)',
  // cash_transactions
  'CREATE INDEX IF NOT EXISTS cash_transactions_organization_id_type_created_at_idx ON cash_transactions (organization_id, type, created_at)',
  'CREATE INDEX IF NOT EXISTS cash_transactions_member_id_created_at_idx ON cash_transactions (member_id, created_at)',
  // log_aktivitas
  'CREATE INDEX IF NOT EXISTS log_aktivitas_organization_id_created_at_idx ON log_aktivitas (organization_id, created_at)',
  'CREATE INDEX IF NOT EXISTS log_aktivitas_created_at_aksi_idx ON log_aktivitas (created_at, aksi)',
  'CREATE INDEX IF NOT EXISTS log_aktivitas_tabel_idx ON log_aktivitas (tabel)',
  // exp_logs
  'CREATE INDEX IF NOT EXISTS exp_logs_organization_id_member_id_created_at_idx ON exp_logs (organization_id, member_id, created_at)',
  'CREATE INDEX IF NOT EXISTS exp_logs_admin_id_idx ON exp_logs (admin_id)',
  // absensi
  'CREATE INDEX IF NOT EXISTS absensi_tanggal_status_idx ON absensi (tanggal, status)',
  // absensi_organisasi
  'CREATE INDEX IF NOT EXISTS absensi_organisasi_organisasi_type_tanggal_idx ON absensi_organisasi (organisasi_type, tanggal)',
  'CREATE INDEX IF NOT EXISTS absensi_organisasi_status_idx ON absensi_organisasi (status)',
  // registrations
  'CREATE INDEX IF NOT EXISTS registrations_organization_id_status_created_at_idx ON registrations (organization_id, status, created_at)',
  // siswa
  'CREATE INDEX IF NOT EXISTS siswa_nis_idx ON siswa (nis)',
  'CREATE INDEX IF NOT EXISTS siswa_nama_idx ON siswa (nama)',
  'CREATE INDEX IF NOT EXISTS siswa_ekskul_status_idx ON siswa (ekskul, status)',
  'CREATE INDEX IF NOT EXISTS siswa_created_at_idx ON siswa (created_at)',
  // anggota_osis
  'CREATE INDEX IF NOT EXISTS anggota_osis_nis_idx ON anggota_osis (nis)',
  'CREATE INDEX IF NOT EXISTS anggota_osis_nama_idx ON anggota_osis (nama)',
  'CREATE INDEX IF NOT EXISTS anggota_osis_status_idx ON anggota_osis (status)',
  // anggota_mpk
  'CREATE INDEX IF NOT EXISTS anggota_mpk_nis_idx ON anggota_mpk (nis)',
  'CREATE INDEX IF NOT EXISTS anggota_mpk_nama_idx ON anggota_mpk (nama)',
  'CREATE INDEX IF NOT EXISTS anggota_mpk_status_idx ON anggota_mpk (status)',
  // kegiatan
  'CREATE INDEX IF NOT EXISTS kegiatan_tipe_idx ON kegiatan (tipe)',
  'CREATE INDEX IF NOT EXISTS kegiatan_created_at_idx ON kegiatan (created_at)',
  // pengelompokan_kegiatan
  'CREATE INDEX IF NOT EXISTS pengelompokan_kegiatan_kegiatan_id_siswa_id_idx ON pengelompokan_kegiatan (kegiatan_id, siswa_id)',
  'CREATE INDEX IF NOT EXISTS pengelompokan_kegiatan_organisasi_idx ON pengelompokan_kegiatan (organisasi)',
  // sesi_wawancara
  'CREATE INDEX IF NOT EXISTS sesi_wawancara_status_organisasi_type_created_at_idx ON sesi_wawancara (status, organisasi_type, created_at)',
  // qr_wawancara
  'CREATE INDEX IF NOT EXISTS qr_wawancara_sesi_id_idx ON qr_wawancara (sesi_id)',
  // antrian_wawancara
  'CREATE INDEX IF NOT EXISTS antrian_wawancara_sesi_id_status_idx ON antrian_wawancara (sesi_id, status)',
  'CREATE INDEX IF NOT EXISTS antrian_wawancara_sesi_id_created_at_idx ON antrian_wawancara (sesi_id, created_at)',
  'CREATE INDEX IF NOT EXISTS antrian_wawancara_qr_id_idx ON antrian_wawancara (qr_id)',
  'CREATE INDEX IF NOT EXISTS antrian_wawancara_scan_token_idx ON antrian_wawancara (scan_token)',
  // chat_wawancara
  'CREATE INDEX IF NOT EXISTS chat_wawancara_sesi_id_created_at_idx ON chat_wawancara (sesi_id, created_at)',
  'CREATE INDEX IF NOT EXISTS chat_wawancara_sender_id_idx ON chat_wawancara (sender_id)',
  // hasil_wawancara
  'CREATE INDEX IF NOT EXISTS hasil_wawancara_interviewer_id_idx ON hasil_wawancara (interviewer_id)',
  // dokumentasi_foto
  'CREATE INDEX IF NOT EXISTS dokumentasi_foto_organisasi_type_tanggal_idx ON dokumentasi_foto (organisasi_type, tanggal)',
  'CREATE INDEX IF NOT EXISTS dokumentasi_foto_created_by_idx ON dokumentasi_foto (created_by)',
  'CREATE INDEX IF NOT EXISTS dokumentasi_foto_organization_id_created_at_idx ON dokumentasi_foto (organization_id, created_at)',
  // documentations
  'CREATE INDEX IF NOT EXISTS documentations_organization_id_type_created_at_idx ON documentations (organization_id, type, created_at)',
  'CREATE INDEX IF NOT EXISTS documentations_created_by_idx ON documentations (created_by)',
  // member_achievements
  'CREATE INDEX IF NOT EXISTS member_achievements_achievement_id_idx ON member_achievements (achievement_id)',
  'CREATE INDEX IF NOT EXISTS member_achievements_member_id_earned_at_idx ON member_achievements (member_id, earned_at)',
  // organization_admins
  'CREATE INDEX IF NOT EXISTS organization_admins_organization_id_idx ON organization_admins (organization_id)',
  // cash_expenses
  'CREATE INDEX IF NOT EXISTS cash_expenses_organization_id_created_at_idx ON cash_expenses (organization_id, created_at)',
  // pengeluaran_kas
  'CREATE INDEX IF NOT EXISTS pengeluaran_kas_created_by_idx ON pengeluaran_kas (created_by)',
  // materi_hari_ini
  'CREATE INDEX IF NOT EXISTS materi_hari_ini_organisasi_tanggal_idx ON materi_hari_ini (organisasi, tanggal)',
  // jadwal_kegiatan
  'CREATE INDEX IF NOT EXISTS jadwal_kegiatan_created_by_idx ON jadwal_kegiatan (created_by)',
  // class_progression_logs
  'CREATE INDEX IF NOT EXISTS class_progression_logs_progression_id_idx ON class_progression_logs (progression_id)',
  'CREATE INDEX IF NOT EXISTS class_progression_logs_student_id_idx ON class_progression_logs (student_id)',
  // email_logs
  'CREATE INDEX IF NOT EXISTS email_logs_admin_id_created_at_idx ON email_logs (admin_id, created_at)',
  // school_year_progression
  'CREATE INDEX IF NOT EXISTS school_year_progression_status_idx ON school_year_progression (status)',
  // pencapaian
  'CREATE INDEX IF NOT EXISTS pencapaian_organisasi_idx ON pencapaian (organisasi)',
]

async function main() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL
  if (!url) { console.error('DIRECT_URL/DATABASE_URL tidak ada'); process.exit(1) }
  const client = new Client({ connectionString: url })
  await client.connect()
  let ok = 0, fail = 0
  for (const sql of statements) {
    try {
      await client.query(sql)
      ok++
    } catch (e) {
      fail++
      console.log('✗ ' + e.message)
    }
  }
  console.log(`Index selesai: ${ok} berhasil, ${fail} gagal (dari ${statements.length})`)
  await client.end()
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
