import { PrismaClient } from '@prisma/client'

const AWARDS_DATA: Record<string, { id: number; nama: string; icon: string }[]> = {
  osis: [
    { id: 1, nama: 'Ketua OSIS Terbaik', icon: 'military_tech' },
    { id: 2, nama: 'Program Kerja Terinovatif', icon: 'lightbulb' },
    { id: 3, nama: 'Kegiatan Sosial Terbaik', icon: 'volunteer_activism' },
    { id: 4, nama: 'Organisasi Paling Aktif', icon: 'groups' },
    { id: 5, nama: 'Koordinasi Acara Terbaik', icon: 'event' },
    { id: 6, nama: 'Sekretaris Terbaik', icon: 'description' },
    { id: 7, nama: 'Bendahara Terbaik', icon: 'account_balance_wallet' },
    { id: 8, nama: 'Humas Terbaik', icon: 'campaign' },
    { id: 9, nama: 'Pelopor Kedisiplinan', icon: 'verified' },
    { id: 10, nama: 'Pemimpin Upacara Terbaik', icon: 'flag' },
    { id: 11, nama: 'Penggagas Ide Terbanyak', icon: 'tips_and_updates' },
    { id: 12, nama: 'Divisi Seni & Budaya Terbaik', icon: 'theater_comedy' },
    { id: 13, nama: 'Anggota Paling Berdedikasi', icon: 'workspace_premium' },
    { id: 14, nama: 'Proyek Lingkungan Terbaik', icon: 'eco' },
    { id: 15, nama: 'Ketua Bidang Terbaik', icon: 'star_rate' },
    { id: 16, nama: 'Inovasi Kegiatan Sekolah', icon: 'auto_awesome' },
    { id: 17, nama: 'Pengelola Media Sosial Terbaik', icon: 'share' },
    { id: 18, nama: 'Penggerak Literasi Terbaik', icon: 'import_contacts' },
    { id: 19, nama: 'Pembina Karakter Terbaik', icon: 'self_improvement' },
    { id: 20, nama: 'Pelopor Anti Bullying', icon: 'shield' },
    { id: 21, nama: 'Ketua Panitia Acara Terbaik', icon: 'celebration' },
    { id: 22, nama: 'Penggalang Dana Terbaik', icon: 'savings' },
    { id: 23, nama: 'Divisi Olahraga Terbaik', icon: 'sports' },
    { id: 24, nama: 'Komunikator Terbaik', icon: 'record_voice_over' },
    { id: 25, nama: 'OSIS Paling Inspiratif', icon: 'emoji_events' }
  ],
  mpk: [
    { id: 26, nama: 'Pengawas Kebijakan Terbaik', icon: 'gavel' },
    { id: 27, nama: 'Aspirasi Siswa Terbaik', icon: 'record_voice_over' },
    { id: 28, nama: 'Sidang Musyawarah Terbaik', icon: 'balance' },
    { id: 29, nama: 'Anggota MPK Paling Kritis', icon: 'policy' },
    { id: 30, nama: 'Laporan Evaluasi Terbaik', icon: 'assignment_turned_in' },
    { id: 31, nama: 'Penyusun Tata Tertib Terbaik', icon: 'rule' },
    { id: 32, nama: 'Mediator Konflik Terbaik', icon: 'handshake' },
    { id: 33, nama: 'Notulis Rapat Terbaik', icon: 'notes' },
    { id: 34, nama: 'Advokasi Siswa Terbaik', icon: 'support' },
    { id: 35, nama: 'Pengawas Kegiatan Terbaik', icon: 'visibility' },
    { id: 36, nama: 'Presentasi Laporan Terbaik', icon: 'present_to_all' },
    { id: 37, nama: 'Konsistensi Kehadiran', icon: 'how_to_reg' },
    { id: 38, nama: 'Inisiatif Perubahan Terbaik', icon: 'change_circle' },
    { id: 39, nama: 'Koordinasi Antar Organisasi', icon: 'hub' },
    { id: 40, nama: 'Anggota MPK Teladan', icon: 'emoji_people' },
    { id: 41, nama: 'Pengusul Agenda Terbaik', icon: 'playlist_add' },
    { id: 42, nama: 'Pemantau Tata Tertib Terbaik', icon: 'fact_check' },
    { id: 43, nama: 'Penyampai Rekomendasi Terbaik', icon: 'recommend' },
    { id: 44, nama: 'Anggota Paling Responsif', icon: 'notifications_active' },
    { id: 45, nama: 'Ketua Komisi Terbaik', icon: 'account_tree' },
    { id: 46, nama: 'Pengarsip Dokumen Terbaik', icon: 'folder_special' },
    { id: 47, nama: 'Penyelenggara Pemilu OSIS Terbaik', icon: 'how_to_vote' },
    { id: 48, nama: 'Pengawas Anggaran Terbaik', icon: 'price_check' },
    { id: 49, nama: 'Delegasi Terbaik', icon: 'transfer_within_a_station' },
    { id: 50, nama: 'MPK Paling Berdampak', icon: 'stars' }
  ],
  english: [
    { id: 51, nama: 'Best Speaker', icon: 'mic' },
    { id: 52, nama: 'Best Debater', icon: 'forum' },
    { id: 53, nama: 'Best Essay Writer', icon: 'edit_note' },
    { id: 54, nama: 'Most Improved English', icon: 'trending_up' },
    { id: 55, nama: 'Best Story Telling', icon: 'auto_stories' },
    { id: 56, nama: 'Best News Anchor', icon: 'newspaper' },
    { id: 57, nama: 'Best Pronunciation', icon: 'spatial_audio' },
    { id: 58, nama: 'Best Vocabulary Mastery', icon: 'menu_book' },
    { id: 59, nama: 'Best Drama Performance', icon: 'masks' },
    { id: 60, nama: 'Best English Song Cover', icon: 'music_note' },
    { id: 61, nama: 'Best Poem Recitation', icon: 'history_edu' },
    { id: 62, nama: 'Best Interview Skills', icon: 'chat' },
    { id: 63, nama: 'Best Listening Comprehension', icon: 'headphones' },
    { id: 64, nama: 'Best English Vlog', icon: 'videocam' },
    { id: 65, nama: 'Most Confident Speaker', icon: 'emoji_people' },
    { id: 66, nama: 'Best Public Speaking', icon: 'podium' },
    { id: 67, nama: 'Best English Journal', icon: 'chrome_reader_mode' },
    { id: 68, nama: 'Best Presentation in English', icon: 'present_to_all' },
    { id: 69, nama: 'Best English Skit', icon: 'theaters' },
    { id: 70, nama: 'Best Vocabulary Quiz Champion', icon: 'quiz' },
    { id: 71, nama: 'Most Active Member', icon: 'local_fire_department' },
    { id: 72, nama: 'Best English Poster', icon: 'image' },
    { id: 73, nama: 'Best Pronunciation Contest Winner', icon: 'record_voice_over' },
    { id: 74, nama: 'Best English Newsletter Editor', icon: 'article' },
    { id: 75, nama: 'English Club Most Inspiring', icon: 'auto_awesome' }
  ],
  programming: [
    { id: 76, nama: 'Best Project / App', icon: 'terminal' },
    { id: 77, nama: 'Best Algorithm', icon: 'code' },
    { id: 78, nama: 'Bug Hunter Terbaik', icon: 'bug_report' },
    { id: 79, nama: 'Most Creative UI/UX', icon: 'palette' },
    { id: 80, nama: 'Hackathon Champion', icon: 'emoji_events' },
    { id: 81, nama: 'Best Web Developer', icon: 'language' },
    { id: 82, nama: 'Best Mobile App', icon: 'smartphone' },
    { id: 83, nama: 'Best Database Design', icon: 'storage' },
    { id: 84, nama: 'Best Cybersecurity Awareness', icon: 'security' },
    { id: 85, nama: 'Best Game Developer', icon: 'sports_esports' },
    { id: 86, nama: 'Best AI/ML Project', icon: 'psychology' },
    { id: 87, nama: 'Best Open Source Contributor', icon: 'merge_type' },
    { id: 88, nama: 'Best Documentation', icon: 'folder_open' },
    { id: 89, nama: 'Fastest Problem Solver', icon: 'speed' },
    { id: 90, nama: 'Best Team Collaboration', icon: 'diversity_3' },
    { id: 91, nama: 'Best IoT Project', icon: 'device_hub' },
    { id: 92, nama: 'Best API Integration', icon: 'api' },
    { id: 93, nama: 'Best Cloud Project', icon: 'cloud' },
    { id: 94, nama: 'Best Automation Script', icon: 'smart_toy' },
    { id: 95, nama: 'Best Data Visualization', icon: 'bar_chart' },
    { id: 96, nama: 'Rising Star Programmer', icon: 'rocket_launch' },
    { id: 97, nama: 'Best Version Control (Git)', icon: 'account_tree' },
    { id: 98, nama: 'Best UI Design', icon: 'brush' },
    { id: 99, nama: 'Best Competitive Programming', icon: 'leaderboard' },
    { id: 100, nama: 'Programmer Paling Inspiratif', icon: 'workspace_premium' }
  ]
}

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Memulai sinkronisasi data penghargaan ke database...')

  let createdCount = 0
  let updatedCount = 0

  for (const [org, awards] of Object.entries(AWARDS_DATA)) {
    for (const award of awards) {
      const existing = await prisma.pencapaian.findUnique({
        where: { id: award.id }
      })

      if (existing) {
        await prisma.pencapaian.update({
          where: { id: award.id },
          data: {
            nama: award.nama,
            icon: award.icon,
            organisasi: org,
          }
        })
        updatedCount++
      } else {
        await prisma.pencapaian.create({
          data: {
            id: award.id,
            nama: award.nama,
            icon: award.icon,
            deskripsi: `Penghargaan khusus untuk anggota ${org.toUpperCase()}: ${award.nama}`,
            exp_reward: 50,
            organisasi: org
          }
        })
        createdCount++
      }
    }
  }

  console.log(`✅ Sinkronisasi selesai!`)
  console.log(`✨ Dibuat: ${createdCount}`)
  console.log(`📝 Diperbarui: ${updatedCount}`)
}

main()
  .catch((e) => {
    console.error('❌ Terjadi kesalahan saat sinkronisasi:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
