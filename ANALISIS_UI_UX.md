# Analisis UI/UX — Sistem Ekstrakurikuler (Artemis Series)

> **Tanggal**: 26 Juli 2026
> **Tipe**: Audit UI/UX menyeluruh ke semua halaman
> **Tujuan**: Mendokumentasikan ketidakkonsistenan, masalah desain, dan rekomendasi perbaikan

---

## Daftar Isi

1. [Inkonsistensi Tema & Warna](#1-inkonsistensi-tema--warna)
2. [Inkonsistensi Tipografi](#2-inkonsistensi-tipografi)
3. [Inkonsistensi Komponen](#3-inkonsistensi-komponen)
4. [Masalah Per Halaman](#4-masalah-per-halaman)
5. [Masalah Aksesibilitas](#5-masalah-aksesibilitas)
6. [Masalah Responsif](#6-masalah-responsif)
7. [Masalah UX Flow](#7-masalah-ux-flow)
8. [Rekomendasi Prioritas](#8-rekomendasi-prioritas)

---

## 1. Inkonsistensi Tema & Warna

### 1.1 Dua Tema Berbeda Bercampur

Aplikasi menggunakan **2 tema yang sangat berbeda** tanpa transisi yang jelas:

| Area | Tema | Warna Dominan |
|------|------|--------------|
| Login (`/login`) | Dark | `#000B18`, `#001F3F` |
| Dashboard (`/dashboard`) | Light | `bg-slate-50`, `white` cards |
| Jadwal (`/jadwal`) | Dark | `#0f1117` |
| Materi (`/materi`) | Dark | `#0f1117` |
| Leaderboard (`/leaderboard`) | Dark | `#0f1117` |
| Pendaftaran (`/registration*`) | Dark | `#000B18` |
| Admin Panel (`/admin*`) | Light | `bg-slate-50`, `white` cards |
| Wawancara (`/wawancara`) | Light | `bg-slate-50`, `white` cards |
| Kas/Pengeluaran (`/kas`, `/pengeluaran`) | Light | `bg-slate-50`, `white` cards |
| Siswa (`/siswa`) | Light | `bg-slate-50`, `white` cards |

**Masalah**: Pengguna merasa seperti berpindah aplikasi setiap kali navigasi. Halaman jadwal, materi, dan leaderboard adalah standalone pages tanpa DashboardLayout, sehingga tiba-tiba berubah total dari theme light ke dark.

### 1.2 Palet Biru Tidak Konsisten

Ada terlalu banyak variasi biru yang digunakan bergantian:

| Variabel | Warna |
|----------|-------|
| `persian-blue` | `#1E90FF` |
| `deep-navy` | `#001F3F` |
| `blue-500` (Tailwind) | `#3b82f6` |
| `blue-600` | `#2563eb` |
| `blue-400` | `#60a5fa` |
| `blue-300` | `#93c5fd` |
| `from-blue-600 to-indigo-600` (gradien) | - |
| `from-blue-500 to-cyan-500` (gradien Programming) | - |

**Masalah**: Tidak ada sistem warna yang baku. Satu halaman pakai `persian-blue`, halaman lain `blue-500`, halaman lain pakai gradien. Tombol "Simpan" di halaman berbeda punya warna biru yang berbeda.

### 1.3 Background Cards & Container

| Lokasi | Style |
|--------|-------|
| Dashboard stat cards | `bg-white rounded-xl border border-slate-200` |
| Login card | `bg-[#000B18]/60 backdrop-blur-2xl border border-white/10` |
| Registration cards | `bg-white/[0.03] backdrop-blur-3xl border border-white/10` |
| Jadwal cards | `bg-white/5 border border-white/10 rounded-2xl` |
| Leaderboard cards | `bg-white/5 rounded-[2rem] border border-white/10` |
| Wawancara queue items | `bg-deep-navy` (dark card di light bg) |

---

## 2. Inkonsistensi Tipografi

### 2.1 Ukuran & Style Label

| Halaman | Style |
|---------|-------|
| Login | `text-[11px] font-bold uppercase tracking-widest text-slate-300` |
| Dashboard (via `.label`) | `text-[11px] font-bold text-slate-500 uppercase tracking-widest` |
| Jadwal/Materi | `text-xs text-slate-400` (plain, no uppercase) |
| Registration form | `text-[10px] font-black uppercase tracking-widest text-slate-500` |

### 2.2 Judul Halaman

| Halaman | Style |
|---------|-------|
| Dashboard | `page-title` (`text-xl font-bold text-slate-800`) |
| Admin | `text-xl font-black text-white` (dark text di dark bg?) |
| Kas | `text-2xl font-black text-white` |
| Pengeluaran | `text-2xl font-black text-white` |
| Laporan | `text-2xl font-black text-white` |
| Jadwal | `text-2xl font-bold` |
| Materi | `text-2xl font-bold` |
| Wawancara | `page-title` |

**Masalah**: Tidak ada hierarki heading yang konsisten. Halaman yang pakai DashboardLayout punya `pageTitle` di Topbar, tapi juga punya judul di konten sendiri (double heading).

### 2.3 Font

- `globals.css` tidak mendefinisikan font-family untuk semua elemen secara eksplisit
- `layout.tsx` pakai `Plus_Jakarta_Sans` via CSS variable `--font-sans`
- Registration success page punya `@import url('...')` inline untuk Plus Jakarta Sans (duplikat)
- Beberapa halaman standalone tidak menggunakan font variable dari root layout secara konsisten

---

## 3. Inkonsistensi Komponen

### 3.1 Tombol (Button)

|| `.btn-primary` (globals.css) | Login | Registration | Jadwal/Materi |
|---|---|---|---|---|
| Style | `bg-blue-500 text-white` | `bg-gradient-to-r from-blue-600 to-blue-500` | `bg-gradient-to-r from-blue-600 to-indigo-600` | `bg-gradient-to-r ... text-white` (warna dinamis) |
| Hover | `hover:bg-blue-600` | Ada di gradient | Ada di gradient | `hover:opacity-90` |
| Padding | `px-4 py-2` | `py-4` | `py-4` | `px-4 py-2` |

### 3.2 Modal / Dialog

| Halaman | Library | Animasi |
|---------|---------|---------|
| Dashboard | `createPortal` + CSS | CSS `fadeIn` |
| Admin/Siswa | `Modal` component (shadcn-based) | via framer-motion |
| Kas | Inline `<div>` | Inline `@keyframes` (CSS native) |
| Pengeluaran | Inline `<div>` | Inline CSS class |
| Jadwal | Inline `<div>` | None |
| Materi | Inline `<div>` | None |
| Wawancara | `Modal` component | via framer-motion |
| Pencapaian | `Modal` component | via framer-motion |

**Masalah**: Ada 3 pendekatan berbeda untuk modal. Halaman tertentu (jadwal, materi, kas, pengeluaran) tidak menggunakan komponen `Modal` yang sudah tersedia.

### 3.3 Tabel

|| Pakai `<Table>` component | Pakai `<table>` mentah |
|---|---|---|
| Dashboard | - | `<table>` di absensi (inline) |
| Admin | ✅ | - |
| Siswa | ✅ | - |
| Organisasi | ✅ | - |
| Absensi (riwayat) | ✅ | `<table>` di mode input |
| Kas | ✅ | - |
| Pengeluaran | - | `<table>` mentah |
| Wawancara | - | `<table>` mentah |
| Pencapaian | ✅ | - |

### 3.4 Select / Dropdown

| Halaman | Pakai `Select` component | Custom |
|---------|--------------------------|--------|
| Admin | ✅ | - |
| Siswa | ✅ | - |
| Dashboard | ✅ | - |
| Kas | - | Dropdown custom dengan search |
| Pengeluaran | ✅ | - |
| Laporan | - | `CoolSelect` custom (CSS-only) |
| Pencapaian | ✅ | - |
| Wawancara | ✅ | - |

**Masalah**: Kas dan Laporan punya dropdown custom sendiri yang tidak konsisten dengan `Select` component yang sudah ada.

### 3.5 Konfirmasi Hapus

| Halaman | Pakai `ConfirmDialog` | Native `confirm()` |
|---------|----------------------|-------------------|
| Admin | ✅ | - |
| Siswa | ✅ | - |
| Pengeluaran | - | `confirm('...')` |
| Jadwal | - | `confirm('...')` |
| Materi | - | `confirm('...')` |
| QR Code | ✅ | - |
| Pencapaian | ✅ | - |

**Masalah**: Jadwal, Materi, dan Pengeluaran menggunakan browser native `confirm()` yang tidak konsisten dengan desain sistem.

### 3.6 Input Form

| Halaman | `.input` class | Inline style |
|---------|--------------|--------------|
| Dashboard | ✅ | - |
| Admin | ✅ | - |
| Siswa | ✅ | - |
| Login | - | `bg-white/5 border border-white/10 rounded-xl text-white` |
| Registration | - | `bg-white/[0.03] border border-white/10 text-white` |
| Jadwal | - | `bg-white/5 border border-white/10 rounded-xl text-white` |
| Materi | - | `bg-white/5 border border-white/10 rounded-xl text-white` |

---

## 4. Masalah Per Halaman

### 4.1 Login (`/login`)

| No | Masalah | Detail |
|----|---------|--------|
| 1 | **Password autocomplete** | `autoComplete="new-password"` salah konteks — seharusnya `current-password` |
| 2 | **Storing password di localStorage** | `localStorage.setItem('last_login', ...)` menyimpan password plaintext — security risk |
| 3 | **Responsive padding** | Container pakai `p-6` — terlalu sempit di mobile |
| 4 | **Carbon fibre texture** | Background texture dari transparanttextures.com — tidak konsisten dengan gaya modern lainnya |
| 5 | **Focus tidak terlihat** | Input focus hanya mengubah ring color — tidak ada outline yang jelas |

### 4.2 Dashboard (`/dashboard`)

| No | Masalah | Detail |
|----|---------|--------|
| 1 | **Terlalu banyak data** | 5 stat cards + Quick Add + 2 charts + Leaderboard + Aktivitas + Request Stats — overload informasi |
| 2 | **Loading state tidak seragam** | Ada 5+ loading state terpisah (stats, charts, logs, requestStats, leaderboard) — tampilan terlihat berkedip |
| 3 | **Welcome modal muncul terus** | `sessionStorage.getItem('welcome_shown')` untuk non-admin — tapi tetap muncul setiap session baru |
| 4 | **Quick Add di dashboard** | Form CRUD di halaman utama — seharusnya cukup link ke halaman siswa |
| 5 | **Double heading** | Topbar punya `pageTitle` + halaman punya judul sendiri |

### 4.3 Admin Panel (`/admin`)

| No | Masalah | Detail |
|----|---------|--------|
| 1 | **No organization filter** | Halaman admin user tidak punya filter organisasi — susah jika banyak user |
| 2 | **Password field confusion** | Saat edit, label "Password Baru (kosongkan jika tidak diubah)" — cukup jelas tapi UX bisa lebih baik dengan placeholder "Biarkan kosong" |
| 3 | **Cleanup interview tanpa konfirmasi visual** | Konfirmasi hanya berupa input "HAPUS PERMANEN" tanpa progress bar |
| 4 | **Tabel user: kolom password** | Menampilkan status hash `(Teracak)` di kolom — seharusnya tidak perlu ada kolom password di tabel |
| 5 | **Org count di card tidak auto-refresh** | Perlu refresh manual untuk update jumlah organisasi |

### 4.4 Absensi (`/absensi`)

| No | Masalah | Detail |
|----|---------|--------|
| 1 | **Row hover tidak terlihat** | `hover:bg-white/5` di atas bg putih — hampir tidak ada perubahan visual |
| 2 | **Pagination tidak ada** | Jika anggota >100, state `PAGE_SIZE=100` tapi tidak ada pagination control di mode input |
| 3 | **Set all status button tidak ada feedback** | Klik "Hadir" set all langsung berubah tanpa konfirmasi |
| 4 | **Empty state redundan** | Menampilkan "Belum ada anggota" dan "Silakan pilih organisasi" — bisa digabung |
| 5 | **Bulk date picker tidak ada shortcut** | Tidak ada tombol "Hari Ini" untuk quick-select tanggal |

### 4.5 Siswa (`/siswa`)

| No | Masalah | Detail |
|----|---------|--------|
| 1 | **Column selection tidak jelas** | Checkbox di header untuk select all — UX kurang intuitif |
| 2 | **Bulk delete tanpa undo** | Tidak ada mekanisme undo setelah hapus massal |
| 3 | **XP modal tidak ada penjelasan** | Tidak ada tooltip yang jelas tentang dampak XP |
| 4 | **Search debounce 500ms** | Terlalu lambat untuk pengguna yang mengetik cepat |
| 5 | **Tidak ada filter per organisasi** | Tergantung dari activeOrgId di Topbar — tidak bisa filter lintas organisasi |

### 4.6 Wawancara (`/wawancara`)

| No | Masalah | Detail |
|----|---------|--------|
| 1 | **Code complexity** | 1144 baris dalam satu file — sangat sulit dipelihara |
| 2 | **Polling fallback tanpa user feedback** | Tidak ada indikator bahwa chat mode fallback polling aktif |
| 3 | **Inconsistent table** | Tabel manual (bukan `<Table>` component) — tidak punja sorting/responsive |
| 4 | **Filter menu bertumpuk** | Filter hasil, filter kelas, filter validasi — semuanya di baris yang sama |
| 5 | **Overflow di halaman kecil** | 9 kolom tabel + action buttons di layar 1366px ke bawah |
| 6 | **Warning toast tidak dismissible** | Toast 10 menit & 5 menit muncul terus tanpa bisa dismiss |

### 4.7 Kas (`/kas`)

| No | Masalah | Detail |
|----|---------|--------|
| 1 | **Modal custom (bukan component)** | Tidak menggunakan `Modal` component — duplikasi kode |
| 2 | **Animasi inline** | `style={{ animation: 'fadeIn 0.15s ease' }}` — tidak konsisten dengan framer-motion di tempat lain |
| 3 | **Dropdown anggota custom** | Tidak pakai `Select` component — padahal sudah ada |
| 4 | **Tidak ada pagination di dropdown anggota** | Tidak bisa mencari di antara 200+ anggota |
| 5 | **Button "Setor Kas" di inline** | Tombol "Tarik Kas" me-link ke halaman `/pengeluaran` — navigasi terputus dari flow |

### 4.8 Pengeluaran (`/pengeluaran`)

| No | Masalah | Detail |
|----|---------|--------|
| 1 | **Native confirm()** | `confirm('...')` untuk hapus — tidak konsisten |
| 2 | **Tidak menggunakan Table component** | Manual `<table>` — tidak ada sorting, responsive, atau pagination |
| 3 | **Modal custom (bukan component)** | Sama seperti Kas — duplikasi |
| 4 | **Over-budget warning pakai confirm()** | `confirm()` saat nominal > saldo — seharusnya jadi peringatan visual |
| 5 | **Filter org hanya untuk admin** | Non-admin tidak bisa lihat semua transaksi — padahal bisa berguna |

### 4.9 Jadwal (`/jadwal`) & Materi (`/materi`)

| No | Masalah | Detail |
|----|---------|--------|
| 1 | **Theme dark standalone** | Tiba-tiba dark theme — tidak nyambung dengan DashboardLayout light |
| 2 | **Tidak pakai komponen bersama** | Padahal struktur hampir identik (tabs, list, modal, CRUD) — duplikasi kode besar |
| 3 | **Native confirm()** | `confirm('Hapus jadwal/materi ini?')` |
| 4 | **Modal tidak pakai komponen Modal** | Manual inline modal |
| 5 | **Edit & Delete muncul di hover** | Tombol aksi tersembunyi (`opacity-0 group-hover:opacity-100`) — tidak accessible di mobile |
| 6 | **Double "Kembali" button** | Ada tombol "Kembali" di halaman + browser back button — membingungkan |
| 7 | **Gradient warna tidak konsisten** | Warna tab dinamis via `getGradColor()` — tapi tidak cocok dengan warna sidebar |
| 8 | **Tidak ada loading skeleton** | Hanya `animate-pulse` generic — tidak merepresentasikan layout konten |

### 4.10 Halaman Pendaftaran (`/registration*`)

| No | Masalah | Detail |
|----|---------|--------|
| 1 | **CSS @import** | `@import url('...')` di halaman success — blocking render |
| 2 | **Tidak ada validasi real-time** | Tidak ada indikator kevalidan form sebelum submit |
| 3 | **Org tidak bisa dipilih** | Hanya menampilkan cards — tidak ada search/filter |
| 4 | **Back button rusak** | `router.push('/registration')` — state hilang |
| 5 | **Loading state hanya spinner** | Tidak ada skeleton atau placeholder |

### 4.11 Laporan (`/laporan`)

| No | Masalah | Detail |
|----|---------|--------|
| 1 | **Custom CoolSelect (CSS-only)** | Tidak pakai `Select` component — tidak konsisten |
| 2 | **Material Symbols loading via `<link>`** | Inline `<link rel="stylesheet" href="...">` di tengah komponen — tidak sesuai React best practice |
| 3 | **Font loading dari Google Fonts** | `jspdf` font hardcoded Helvetica — tidak pakai font aplikasi |
| 4 | **Icon "print" dari Material Symbols** | Campur aduk ikon: Lucide + React Icons + Material Symbols |
| 5 | **Loading state tidak granular** | Semua data di-load via satu fetch — tidak modular |

### 4.12 Leaderboard (`/leaderboard`)

| No | Masalah | Detail |
|----|---------|--------|
| 1 | **Theme dark standalone** | Tidak nyambung dengan DashboardLayout yang light |
| 2 | **Back button manual** | `router.back()` — tidak konsisten dengan navigasi sidebar |
| 3 | **Tidak ada pagination** | `limit=10` — hardcoded |
| 4 | **Pusher subscription di halaman** | Subscribe langsung di page — seharusnya di provider level |
| 5 | **Skeleton tidak akurat** | `animate-pulse` generic — tidak menggambarkan layout |

### 4.13 QR Code (`/qr-code`)

| No | Masalah | Detail |
|----|---------|--------|
| 1 | **Inline style blur** | Tidak menggunakan class utility |
| 2 | **Riwayat QR tidak punya pagination** | Semua QR muncul di list — bisa penuh |
| 3 | **Bahaya Vercel preview** | Peringatan "Bahaya: Menggunakan Link Preview Vercel" — seharusnya tidak perlu muncul jika deployment production |
| 4 | **Delete QR mode** | UI delete mode cukup membingungkan (perlu klik tombol "Pilih QR" pertama) |

### 4.14 Pencapaian (`/pencapaian`)

| No | Masalah | Detail |
|----|---------|--------|
| 1 | **Award success toast terlalu kompleks** | Toast pakai JSX (`toast.success(<div>...)`) — bisa gagal render |
| 2 | **Filter tab tidak accessible** | Tab di dalam card — tidak ada focus indicator yang jelas |
| 3 | **Load members setiap modal award dibuka** | Tidak ada cache — fetch ulang setiap kali |
| 4 | **Exp reward preview** | Live preview keren tapi tidak ada tombol "Apply to all selected" |

---

## 5. Masalah Aksesibilitas

| No | Masalah | Lokasi |
|----|---------|--------|
| 1 | **Focus indicator hilang** | Beberapa halaman punya `outline: none` tanpa fallback ring | Global |
| 2 | **Label tanpa htmlFor** | Banyak form tidak mengasosiasikan label dengan input | Semua form |
| 3 | **Button tanpa role** | `<div>` diklik seperti button tanpa `role="button"` | Kas, Laporan |
| 4 | **Icon-only button tanpa aria-label** | Button hanya berisi icon tanpa teks | Tersebar |
| 5 | **Color contrast** | Teks putih di atas bg putih/light — rasio kontras rendah | Beberapa card |
| 6 | **Keyboard navigation** | Tidak semua interactive element bisa di-tab | Jadwal/Materi (hover-only actions) |
| 7 | **Reduced motion tidak konsisten** | Ada `prefers-reduced-motion` di globals.css tapi tidak semua animasi dihormati | Global |
| 8 | **Table tanpa scope/th** | Beberapa `<th>` manual tidak pakai scope | Absensi, Pengeluaran |

---

## 6. Masalah Responsif

| No | Masalah | Lokasi |
|----|---------|--------|
| 1 | **Tabel overflow** | Tabel dengan >6 kolom di layar <768px tanpa horizontal scroll | Wawancara (9 kolom!), Absensi, Siswa |
| 2 | **Dashboard stat cards** | 5 kolom di grid — terlalu banyak untuk tablet | Dashboard |
| 3 | **Tombol aksi tersembunyi** | Hover-only action buttons tidak bisa diakses di touch device | Jadwal, Materi |
| 4 | **Sidebar collapsible** | Sidebar light menyisakan space kosong saat collapsed | DashboardLayout |
| 5 | **Modal ukuran tetap** | Beberapa modal pakai `max-w-md` — terlalu sempit untuk form panjang | Admin (form award) |
| 6 | **Font-size terlalu kecil** | `text-[10px]`, `text-[11px]` di banyak tempat — sulit dibaca di mobile | Global |
| 7 | **Touch targets terlalu kecil** | `w-7 h-7`, `w-8 h-8` untuk icon buttons — di bawah minimum 44px | Tersebar |

---

## 7. Masalah UX Flow

| No | Masalah | Detail |
|----|---------|--------|
| 1 | **Navigasi pindah tema** | Sidebar light → halaman dark (jadwal/materi) → kembali ke light — disorientasi visual |
| 2 | **Double back button** | "Kembali" di halaman + browser back — user bingung harus pakai yang mana | Jadwal, Materi, Leaderboard |
| 3 | **Penyebaran fitur terkait** | Kas, Pengeluaran, Laporan keuangan ada di 3 halaman terpisah — seharusnya bisa di satu area |
| 4 | **Topbar org switcher** | Ganti organisasi trigger refresh — state hilang (halaman kembali ke page 1) |
| 5 | **Redirect tanpa feedback** | `/` redirect ke `/login` tanpa loading/transition |
| 6 | **Absensi mode input & riwayat** | Toggle mode dengan tombol — user bisa kehilangan data input yang belum disimpan saat switch |
| 7 | **Filter di beberapa halaman** | Filter tersebar di beberapa tempat (sidebar, topbar, halaman) — tidak terpusat |
| 8 | **Export/import flow** | Export ke Excel ada di halaman Laporan + Wawancara — tidak ada export hub terpusat |

---

## 8. Rekomendasi Prioritas

### 🔴 High Priority (Segera)

1. **Satukan tema** — Pilih satu tema (light atau dark) untuk dashboard, konsisten di semua halaman. Halaman standalone (jadwal, materi, leaderboard) harusnya menggunakan DashboardLayout yang sama.
2. **Hapus komponen duplikasi** — Semua halaman harus pakai `Modal`, `Table`, `Select`, `ConfirmDialog` yang sudah tersedia.
3. **Replace native confirm()** — Ganti semua `confirm()` dengan `ConfirmDialog` component.
4. **Hapus penyimpanan password plaintext** — `localStorage.setItem('last_login', ...)` menyimpan password.
5. **Standardisasi palet warna** — Pilih satu warna biru sebagai primary (misal `persian-blue: #1E90FF`) dan gunakan secara konsisten.

### 🟡 Medium Priority

6. **Satukan gaya tombol** — Semua `btn-primary` harus punya style yang sama. Hapus gradient buttons yang tidak konsisten.
7. **Standardisasi input forms** — Semua halaman harus menggunakan `.input` class atau komponen Input.
8. **Perbaiki responsive tables** — Tambahkan `overflow-x-auto` untuk semua tabel dengan >5 kolom.
9. **Gunakan component Modal di semua halaman** — Kas, Pengeluaran, Jadwal, Materi harus pakai Modal component.
10. **Hapus custom dropdown** — Kas (member dropdown) dan Laporan (CoolSelect) harus pakai Select component.

### 🟢 Low Priority

11. **Accessibility pass** — Tambahkan `aria-label`, `htmlFor`, `role="button"` di tempat yang kurang.
12. **Touch targets** — Minimal 44x44px untuk semua interactive element.
13. **Unified export hub** — Buat satu halaman export terpusat.
14. **Hapus Material Symbols** — Gunakan Lucide icons secara konsisten.
15. **Perbaiki animasi** — Pilih satu library animasi (Framer Motion atau CSS) dan gunakan secara konsisten.

---

## Ringkasan

| Kategori | Jumlah Masalah |
|----------|---------------|
| Inkonsistensi Tema | ~8 |
| Inkonsistensi Komponen | ~15 |
| Masalah Per Halaman | ~40 |
| Aksesibilitas | ~8 |
| Responsif | ~7 |
| UX Flow | ~8 |
| **Total** | **~86 masalah** |
