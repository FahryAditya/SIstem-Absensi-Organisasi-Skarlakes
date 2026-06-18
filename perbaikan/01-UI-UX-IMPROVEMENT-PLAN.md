# 🎨 Planning Perbaikan UI/UX — Sistem Ekstrakurikuler (Artemis Series)

## Analisis Kondisi Saat Ini

Website sudah memiliki dark theme yang konsisten, komponen reusable (Button, Card, Table, Modal), dan responsive layout dasar. Namun ada banyak area yang bisa ditingkatkan untuk kemudahan penggunaan, aksesibilitas, dan kenyamanan visual.

---

## 🔴 Prioritas Tinggi (Critical UX Issues)

### Task 1: Perbaikan Kontras & Keterbacaan Teks
**Masalah:**
- Banyak teks `text-slate-400` dan `text-white/50` yang terlalu terang di background gelap (`#000B18`)
- Label form `text-[10px] font-black text-slate-500` sangat sulit dibaca
- Teks `text-slate-600` di placeholder hampir tidak terlihat
- Warna `text-red-600`, `text-green-600`, `text-amber-600` di elemen gelap sulit dibedakan

**Solusi:**
- Naikkan kontras semua teks sekunder: ganti `text-slate-400` → `text-slate-300`, `text-slate-500` → `text-slate-400`
- Minimum font size untuk label: `text-[11px]` dengan `text-slate-300`
- Gunakan warna pastel/bright untuk status badge agar tetap terbaca di dark mode
- Pastikan rasio kontras minimal 4.5:1 (WCAG AA)

**File terkait:** `globals.css`, semua `*Client.tsx`

---

### Task 2: Loading States & Skeleton yang Lebih Baik
**Masalah:**
- Loading hanya berupa spinner + teks "Memuat..." yang membosankan dan membingungkan
- Tidak ada skeleton screen di halaman utama (Dashboard, Daftar Anggota, Absensi)
- User tidak tahu berapa lama proses akan selesai

**Solusi:**
- Tambahkan skeleton screen di Dashboard (stat cards, chart area, leaderboard)
- Gunakan progress bar di atas halaman (seperti NProgress) untuk navigasi antar halaman
- Tambahkan estimasi waktu atau persentase untuk proses panjang (import Excel, save bulk absensi)
- Skeleton untuk tabel: tampilkan 5-8 baris placeholder dengan animasi shimmer

**File terkait:** `components/Skeleton.tsx`, `DashboardClient.tsx`, `SiswaClient.tsx`, `AbsensiClient.tsx`

---

### Task 3: Konfirmasi Aksi Destruktif yang Lebih Jelas
**Masalah:**
- Dialog hapus anggota terlalu sederhana, tidak menampilkan dampak
- Tidak ada konfirmasi untuk aksi bulk (import, export, set semua status absensi)
- Tombol "Hapus Peserta" di wawancara langsung redirect ke halaman lain

**Solusi:**
- Tampilkan detail data yang akan dihapus dalam confirm dialog
- Tambahkan input konfirmasi (ketik nama) untuk hapus massal
- Gunakan modal penuh untuk aksi bulk, bukan hanya toast
- Tambahkan undo action setelah hapus (toast dengan tombol "Batalkan")

**File terkait:** `components/ui/ConfirmDialog.tsx`, `SiswaClient.tsx`, `HapusPesertaClient.tsx`

---

### Task 4: Navigasi & Information Architecture
**Masalah:**
- Sidebar memiliki terlalu banyak menu (20+ item) tanpa grouping yang jelas
- Beberapa halaman duplikat fungsi: `/import` dan Quick Add di Dashboard, `/kas` dan `/pengeluaran` terpisah
- Tidak ada breadcrumb untuk mengetahui posisi halaman
- Menu "Tools" terlalu umum, user sulit menemukan fitur

**Solusi:**
- Kurangi menu sidebar dengan menggabungkan halaman terkait:
  - Gabungkan Import ke halaman Anggota (tab Import)
  - Gabungkan Pengeluaran ke Buku Kas (tab Pengeluaran)
- Tambahkan breadcrumb navigation di topbar
- Reorganisasi sidebar menjadi max 4 section dengan sub-menu collapsible
- Tambahkan search/filter di sidebar untuk navigasi cepat (Cmd+K)

**File terkait:** `components/layout/Sidebar.tsx`, `components/layout/Topbar.tsx`, `components/layout/DashboardLayout.tsx`

---

## 🟡 Prioritas Sedang (Important UX Improvements)

### Task 5: Form UX & Validasi Input
**Masalah:**
- Validasi hanya muncul setelah submit (toast error)
- Tidak ada inline validation saat mengetik
- Field required tidak ditandai dengan jelas (hanya label `*` di beberapa form)
- Format input tidak dijelaskan (contoh: format NIS, format tanggal)

**Solusi:**
- Tambahkan real-time inline validation (border merah saat input salah)
- Tambahkan helper text di bawah setiap field penting
- Tandai semua field required dengan asterisk merah yang konsisten
- Tambahkan input masking untuk NIS (angka saja), uang kas (format rupiah), tanggal
- Auto-focus ke field pertama saat modal terbuka
- Tambahkan keyboard shortcut: Enter = submit, Escape = tutup modal

**File terkait:** Semua form di `*Client.tsx`, `components/ui/Modal.tsx`

---

### Task 6: Responsive & Mobile Experience
**Masalah:**
- Tabel absensi sangat lebar (5 kolom) tidak bisa di-scroll horizontal dengan baik di mobile
- Sidebar mobile overlay menutupi seluruh layar, tidak ada swipe-to-close
- Form Quick Add di dashboard tidak optimal di layar kecil
- Tombol-tombol aksi di tabel wawancara terlalu banyak untuk mobile
- Animasi dimatikan total di mobile, tapi tidak ada alternatif transisi yang lebih halus

**Solusi:**
- Ubah tabel absensi menjadi card layout di mobile (stacked)
- Tambahkan swipe gesture untuk buka/tutup sidebar mobile
- Buat bottom navigation bar untuk mobile (Dashboard, Absensi, Anggota, Kas, Profile)
- Tombol aksi di tabel: gunakan dropdown menu (icon "⋮") di mobile
- Tambahkan transisi halaman yang lightweight di mobile (fade only, no blur)
- Pastikan semua tombol minimal 44x44px (touch target)

**File terkait:** `globals.css`, `AbsensiClient.tsx`, `WawancaraClient.tsx`, `components/layout/Sidebar.tsx`

---

### Task 7: Empty States & Onboarding
**Masalah:**
- Empty state hanya teks "Belum ada data" tanpa panduan
- User baru tidak tahu harus mulai dari mana
- Tidak ada tooltip atau bantuan kontekstual

**Solusi:**
- Tambahkan ilustrasi menarik di empty state (bukan hanya icon)
- Sertakan CTA (Call to Action) di empty state: "Tambah Anggota Pertama" atau "Import Data Excel"
- Tambahkan guided tour / onboarding checklist untuk admin baru
- Tambahkan tooltip (?) di header setiap halaman yang menjelaskan fungsi halaman tersebut
- Tambahkan "Getting Started" card di dashboard untuk user baru

**File terkait:** `components/ui/Table.tsx`, `DashboardClient.tsx`, semua halaman dengan empty state

---

### Task 8: Notifikasi & Feedback System
**Masalah:**
- Semua notifikasi muncul sebagai toast di kanan atas (mudah terlewat)
- Tidak ada notifikasi real-time untuk event penting (peserta baru scan QR, anggota baru mendaftar)
- Toast error sering muncul bersamaan dan bertumpuk
- Tidak ada notifikasi jika ada error background (Pusher disconnect, API gagal)

**Solusi:**
- Tambahkan notification center / bell icon di topbar dengan badge counter
- Kelompokkan notifikasi: real-time events, system alerts, activity log
- Queue toast notifications (jangan tampilkan semua sekaligus)
- Tambahkan banner di atas halaman untuk warning penting (koneksi terputus, maintenance)
- Sound notification opsional untuk event kritis (sesi wawancara akan berakhir)

**File terkait:** `components/layout/Topbar.tsx`, buat `components/NotificationCenter.tsx`

---

## 🟢 Prioritas Rendah (Nice to Have)

### Task 9: Visual Polish & Micro-interactions
**Masalah:**
- Beberapa animasi terasa berlebihan (glow effects, multiple gradients)
- Konsistensi visual antar halaman masih rendah (beberapa pakai framer-motion, beberapa tidak)
- Chart warna tidak konsisten antar halaman
- Hover states tidak konsisten

**Solusi:**
- Standarkan animasi: gunakan CSS transitions saja, hapus framer-motion dari halaman non-login
- Buat design tokens yang konsisten untuk spacing, colors, border-radius
- Tambahkan hover preview (misal: hover anggota → tampilkan card profil mini)
- Perhalus page transition dengan fade + slide ringan yang konsisten
- Kurangi decorative elements yang tidak fungsional

**File terkait:** `globals.css`, `tailwind.config.js`

---

### Task 10: Keyboard Navigation & Accessibility (A11y)
**Masalah:**
- Tidak ada keyboard shortcut untuk navigasi
- Form tidak bisa di-submit dengan Enter di beberapa tempat
- Modal tidak trap focus (tab keluar dari modal)
- Tidak ada aria-label di banyak tombol icon
- Skip navigation link tidak ada

**Solusi:**
- Tambahkan keyboard shortcuts global:
  - `Ctrl+K` = Command palette / search
  - `Ctrl+N` = Tambah anggota baru
  - `Escape` = Tutup modal/dropdown
  - `G → D` = Go to Dashboard
  - `G → A` = Go to Absensi
- Tambahkan focus trap di semua Modal
- Tambahkan aria-label di semua tombol icon
- Tambahkan skip-to-content link
- Pastikan semua interaktif elemen bisa diakses via Tab

**File terkait:** `components/layout/DashboardLayout.tsx`, `components/ui/Modal.tsx`, buat `components/CommandPalette.tsx`

---

### Task 11: Data Display & Information Density
**Masalah:**
- Dashboard terlalu padat (9+ stat cards sekaligus)
- Informasi penting tersebar, user harus scroll banyak
- Tidak ada opsi untuk kustomisasi tampilan dashboard
- Tabel wawancara memiliki 9 kolom — terlalu banyak untuk dibaca sekaligus

**Solusi:**
- Buat dashboard yang bisa dikustomisasi (drag & drop reorder cards, hide/show sections)
- Stat cards: tampilkan 4-5 yang paling penting, sisanya di "Lihat Semua"
- Tabel wawancara: tambahkan kolom visibility toggle
- Tambahkan "Compact Mode" untuk tabel (lebih banyak data per layar)
- Tambahkan sticky header di tabel panjang

**File terkait:** `DashboardClient.tsx`, `WawancaraClient.tsx`, `components/ui/Table.tsx`

---

### Task 12: Performance & Perceived Speed
**Masalah:**
- Dashboard memuat 4 API calls terpisah (stats, charts, logs, request_stats)
- Chart library (Recharts) di-load via dynamic import tapi tetap berat
- Beberapa halaman tidak menggunakan cached data
- Tidak ada optimistic update untuk aksi umum

**Solusi:**
- Prefetch data saat hover di sidebar link (siapkan data sebelum halaman dibuka)
- Tambahkan optimistic update untuk aksi yang sering dilakukan (absensi, setor kas)
- Gunakan React Suspense boundaries untuk streaming data (tampilkan yang siap dulu)
- Kurangi re-render yang tidak perlu dengan React.memo di komponen statis
- Tambahkan stale-while-revalidate caching strategy

**File terkait:** `DashboardClient.tsx`, `lib/client-cache.ts`, `components/providers/QueryProvider.tsx`

---

### Task 13: Dark/Light Theme & Color Consistency
**Masalah:**
- Hanya ada dark theme, tidak ada opsi light theme
- Beberapa warna tidak konsisten (green-600 vs emerald-600, red-600 vs red-400)
- Warna `bg-persian-blue/10` muncul di banyak tempat tapi dengan konteks berbeda
- Chart grid lines menggunakan warna terang (`#f1f5f9`) yang aneh di dark background

**Solusi:**
- Pertimbangkan menambahkan light theme (atau minimal auto light/dark based on system)
- Standarkan palette warna di CSS variables (sudah ada tapi belum konsisten dipakai)
- Perbaiki chart grid: gunakan warna gelap yang cocok dengan dark theme
- Pastikan semua komponen menggunakan design tokens, bukan hardcode warna

**File terkait:** `globals.css`, `tailwind.config.js`, `DashboardClient.tsx` (chart config)

---

### Task 14: Search & Filter Experience
**Masalah:**
- Search di tabel anggota menggunakan debounce 500ms (terasa lambat)
- Tidak ada filter advanced (berdasarkan kelas, jurusan, status)
- Tidak ada sort di kolom tabel
- Filter di wawancara (hasil, kelas, validasi) tersebar dan membingungkan

**Solusi:**
- Turunkan debounce ke 300ms atau gunakan instant search dengan virtual scroll
- Tambahkan filter chips/badges yang menunjukkan filter aktif
- Tambahkan sortable columns (klik header = sort asc/desc)
- Gabungkan filter di wawancara menjadi filter bar yang lebih intuitif
- Tambahkan "Clear all filters" button

**File terkait:** `SiswaClient.tsx`, `KasClient.tsx`, `WawancaraClient.tsx`, `components/ui/Table.tsx`

---

### Task 15: Error Handling & Recovery (Frontend)
**Masalah:**
- Error hanya ditampilkan sebagai toast yang cepat hilang
- Tidak ada error boundary untuk crash di level komponen
- Tidak ada retry mechanism untuk failed API calls
- Pesan error terlalu teknis ("Gagal memuat data") tanpa saran perbaikan

**Solusi:**
- Tambahkan React Error Boundary dengan UI fallback yang informatif
- Tambahkan tombol "Coba Lagi" di setiap error state
- Tampilkan pesan error yang lebih spesifik dan actionable
- Tambahkan error logging ke monitoring service
- Offline detection: tampilkan banner "Koneksi terputus" dengan auto-reconnect indicator

**File terkait:** Buat `components/ErrorBoundary.tsx`, semua `*Client.tsx`

---

## 📋 Ringkasan Prioritas Implementasi

| No | Task | Dampak | Effort | Prioritas |
|----|------|--------|--------|-----------|
| 1 | Kontras & Keterbacaan | 🔴 Tinggi | 🟢 Rendah | **P1** |
| 2 | Loading States & Skeleton | 🔴 Tinggi | 🟡 Sedang | **P1** |
| 3 | Konfirmasi Aksi Destruktif | 🔴 Tinggi | 🟢 Rendah | **P1** |
| 4 | Navigasi & Information Architecture | 🔴 Tinggi | 🔴 Tinggi | **P1** |
| 5 | Form UX & Validasi | 🟡 Sedang | 🟡 Sedang | **P2** |
| 6 | Mobile Experience | 🟡 Sedang | 🔴 Tinggi | **P2** |
| 7 | Empty States & Onboarding | 🟡 Sedang | 🟡 Sedang | **P2** |
| 8 | Notifikasi & Feedback | 🟡 Sedang | 🟡 Sedang | **P2** |
| 9 | Visual Polish | 🟢 Rendah | 🟡 Sedang | **P3** |
| 10 | Keyboard & A11y | 🟡 Sedang | 🟡 Sedang | **P3** |
| 11 | Data Display & Density | 🟡 Sedang | 🟡 Sedang | **P3** |
| 12 | Performance | 🟡 Sedang | 🔴 Tinggi | **P3** |
| 13 | Theme Consistency | 🟢 Rendah | 🟡 Sedang | **P3** |
| 14 | Search & Filter | 🟡 Sedang | 🟡 Sedang | **P3** |
| 15 | Error Handling | 🟡 Sedang | 🟡 Sedang | **P3** |

---

## 🚀 Urutan Implementasi

**Sprint 1 (Quick Wins — 1-2 hari):**
- Task 1: Perbaikan kontras teks
- Task 3: Konfirmasi aksi destruktif
- Task 9 (partial): Standarkan animasi

**Sprint 2 (Core UX — 3-5 hari):**
- Task 2: Skeleton loading screens
- Task 5: Form validation inline
- Task 7: Empty states dengan CTA
- Task 15: Error boundary & retry

**Sprint 3 (Navigation — 3-5 hari):**
- Task 4: Reorganisasi sidebar + breadcrumb
- Task 10: Keyboard shortcuts
- Task 14: Search & filter improvement

**Sprint 4 (Mobile & Polish — 5-7 hari):**
- Task 6: Bottom nav + responsive tables
- Task 8: Notification center
- Task 11: Dashboard customization
- Task 12: Performance optimization
- Task 13: Theme consistency

---

*Planning UI/UX — Artemis Series v20.6.12 Pro Series*
*Dibuat: 18 Juni 2026*
