# INSTRUKSI PERBAIKAN WEBSITE SISTEM EKSTRAKURIKULER

**Target:** Google Gemini / Tim Development
**Prioritas:** High
**Tipe:** Bug Fix & Feature Enhancement

---

## 📋 RINGKASAN MASALAH

Website Sistem Ekstrakurikuler memiliki 4 masalah utama yang perlu diperbaiki:
1. Responsive Design (Kolom Kas terlalu kecil di Mobile)
2. Permission & Data Access (Admin tidak bisa melihat data organisasi lain)
3. Statistik Laporan (Tidak muncul)
4. Feature Access (Kelola Exp tidak bisa diakses Admin)

---

## 🔧 MASALAH #1: RESPONSIVE DESIGN - KOLOM KAS DI MOBILE

### Deskripsi Masalah
Kolom "Kas" (atau table/data kas) terlalu kecil dan tidak terbaca dengan baik ketika diakses dari perangkat mobile. Text mungkin terpotong, angka tidak visible jelas, atau layout berantakan saat di-shrink untuk layar kecil.

#### Konteks Detail:
- **Desktop (1920px)**: Kolom Kas tampil normal dan readable
- **Tablet (768px)**: Kolom Kas mulai menyempit, tapi mungkin masih bisa dibaca
- **Mobile (375px-425px)**: Kolom Kas sangat kecil, text terpotong, number tidak jelas
- **User frustration**: Admin tidak bisa lihat/edit Kas data dari mobile/tablet

### Root Cause / Penyebab Masalah
1. **Fixed Width Columns**: Kolom Kas mungkin punya fixed width yang tidak adjust di mobile
   - CSS tidak responsive (width: 100px, bukan width: 100%)
   
2. **No Media Queries**: Tidak ada CSS media query untuk layar kecil
   - Styling desktop diterapkan ke semua ukuran layar
   
3. **Overflow Hidden/No Wrap**: Text dalam kolom tidak wrap atau overflow di-hide
   - Text terpotong karena space terbatas
   
4. **Table Design**: Jika menggunakan HTML table, tabel tidak bisa horizontal scroll atau collapse di mobile
   - Table terus wide walaupun layar kecil

### Dampak Masalah
- **Accessibility Issue**: Admin tidak bisa pakai aplikasi dari mobile (harus desktop)
- **User Experience Bad**: Frustrasi ketika perlu akses data dari mobile
- **Mobile-First Failed**: Aplikasi seharusnya work di semua device, tapi tidak
- **Productivity Loss**: Admin tidak bisa manage Kas dari on-the-go
- **Support Burden**: Banyak complaints dari user tentang mobile view

### Requirement / Solusi yang Diharapkan

#### Behavior yang Benar:
1. **Desktop (1920px) → Kolom Kas readable dan normal**
   - Semua kolom visible dengan jelas
   - Data lengkap tampil

2. **Tablet (768px) → Kolom Kas still readable**
   - Kolom Kas mungkin lebih sempit tapi masih bisa baca
   - Text tidak terpotong
   - Bisa scroll horizontal jika perlu

3. **Mobile (375px) → Kolom Kas readable**
   - Kolom Kas di-resize sesuai dengan width available
   - Text wrap dan tidak terpotong
   - Atau collapse menjadi card layout (lebih mobile-friendly)
   - Bisa scroll/swipe untuk lihat lebih banyak data

4. **Responsive & Flexible**
   - Layout adjust otomatis sesuai screen size
   - Semua informasi still accessible
   - User bisa interact (read, edit) dari mobile

#### Solusi Teknis:

**CSS/Styling:**
- Hapus/ubah fixed width columns menjadi flexible (%, fr, auto, atau relative units)
- Tambahkan CSS media queries untuk mobile screens (max-width: 768px, max-width: 425px, etc)
- Untuk table kecil: bisa pakai min-width atau allow horizontal scroll
- Untuk table besar: pertimbangkan card layout atau collapse columns di mobile

**Layout Strategy:**
- Option A (Horizontal Scroll): Table tetap wide tapi user bisa scroll horizontal di mobile
- Option B (Card Layout): Ubah table menjadi card-based layout untuk mobile (lebih readable)
- Option C (Collapse Columns): Sembunyikan kolom yang tidak critical di mobile, expand di desktop
- Option D (Responsive Table): Font size shrink, padding reduce, tapi tetap readable

**Mobile Optimization:**
- Reduce padding/margin untuk save space
- Smaller font size di mobile (tapi tetap readable, minimum 12px)
- Touch-friendly buttons/interactive elements (minimum 44px height)
- Ensure color contrast good untuk readability di berbagai lighting

### File yang Perlu Diubah
- **Frontend**:
  - CSS file yang style kolom Kas (add media queries)
  - Component/page yang render tabel Kas (add responsive markup)
  - Mungkin perlu refactor table component (jika current design tidak flexible)

### Action Items
- [ ] Identifikasi file CSS yang style kolom Kas
- [ ] Review current CSS: apakah fixed width? Apakah ada media query?
- [ ] Tentukan responsive strategy: scroll, card layout, atau collapse columns?
- [ ] Implementasi CSS media queries untuk mobile (max-width: 768px minimum)
- [ ] Test di berbagai ukuran: 320px, 375px, 425px, 768px, 1024px, 1920px
- [ ] Pastikan text readable di mobile (font size, contrast, wrapping)
- [ ] Ensure table/data selalu accessible (tidak hidden atau terpotong)
- [ ] Test functionality di mobile: bisa baca data? Bisa scroll? Bisa interact?
- [ ] Browser test: Chrome mobile, Safari iOS, Firefox Android
- [ ] User testing: minta user coba di actual mobile device

---

## 🔓 MASALAH #2: PERMISSION & DATA ACCESS

### Deskripsi Masalah
Admin dari organisasi tertentu (OSIS MPK, English Club, Programming) hanya bisa membuat dan melihat data milik organisasi mereka sendiri. Namun, sistem saat ini tidak memiliki filter atau batasan yang jelas, sehingga menyebabkan confusion dan potensi akses data yang tidak seharusnya.

#### Konteks Detail:
- **Admin OSIS MPK**: 
  - ✅ Bisa membuat Jadwal Rapat untuk OSIS MPK
  - ✅ Bisa membuat Rekap Absen untuk OSIS MPK
  - ❌ Tidak bisa melihat Jadwal Rapat English Club
  - ❌ Tidak bisa melihat Jadwal Rapat Programming
  - ❌ Tidak bisa melihat Rekap Absen English Club
  - ❌ Tidak bisa melihat Rekap Absen Programming

- **Admin ENGLISH CLUB & PROGRAMMING**: Sama seperti OSIS MPK (hanya bisa lihat miliknya)
- **Administrator (Super Admin)**: ✅ Bisa melihat dan kelola semua organisasi

### Root Cause / Penyebab Masalah
1. **Tidak ada filter backend**: Query database mengambil semua data tanpa mempertimbangkan role/organisasi user
2. **Tidak ada validasi permission**: Ketika user membuat atau mengedit data, sistem tidak cek apakah user berhak
3. **Kolom Organisasi tidak visible**: Tidak ada cara untuk user membedakan data dari organisasi mana
4. **Akses control di frontend saja**: Jika ada validasi, hanya di frontend (bisa di-bypass)

### Dampak Masalah
- **Keamanan Data**: Admin dari organisasi lain bisa melihat data rahasia (jadwal rapat internal, daftar absen)
- **Confusion Admin**: Admin tidak tahu mereka hanya bisa lihat organisasi mereka (tidak ada visual indicator)
- **Inkonsistensi**: Beberapa admin mungkin bisa lihat semua (bug), ada yang tidak bisa
- **Potential Data Leak**: Data sensitif bisa diakses oleh pihak yang tidak seharusnya
- **Compliance Issue**: Tidak sesuai dengan business requirement (setiap org harus private)

### Requirement / Solusi yang Diharapkan

#### Behavior yang Benar:
1. **Admin OSIS MPK login → Hanya lihat data OSIS MPK**
   - Tabel Jadwal Rapat hanya tampil data OSIS MPK
   - Tabel Rekap Absen hanya tampil data OSIS MPK
   - Button "Create" hanya bisa buat untuk OSIS MPK
   - Kolom "Organisasi" menunjukkan "OSIS MPK" di setiap baris

2. **Admin ENGLISH CLUB login → Hanya lihat data ENGLISH CLUB**
   - Sama seperti OSIS MPK tapi untuk ENGLISH CLUB

3. **Admin PROGRAMMING login → Hanya lihat data PROGRAMMING**
   - Sama seperti OSIS MPK tapi untuk PROGRAMMING

4. **Administrator (Super Admin) login → Lihat semua organisasi**
   - Bisa lihat Jadwal Rapat dari OSIS MPK, English Club, Programming
   - Bisa lihat Rekap Absen dari semua organisasi
   - Kolom "Organisasi" visible untuk membedakan data mana dari mana

#### Solusi Teknis:

**Di Backend (Server-side):**
- Implementasi permission check di setiap endpoint (Jadwal Rapat, Rekap Absen, dll)
- Sebelum menampilkan data, cek: Apakah user.role = "Administrator" atau user.organisasi = data.organisasi?
- Jika tidak sesuai, return error 403 (Forbidden) atau tampilkan empty list
- Setiap CREATE/UPDATE/DELETE action harus validasi bahwa user punya hak untuk organisasi tersebut

**Di Frontend (Client-side):**
- Tampilkan kolom "Organisasi" di setiap tabel agar user tahu data dari mana
- Conditional rendering: Jika user role = Admin, sembunyikan button "Create" untuk organisasi lain
- Disable atau hide fitur yang tidak user boleh akses
- Show informasi "Anda hanya bisa melihat data OSIS MPK" di UI

### File yang Perlu Diubah
- **Backend**: 
  - Middleware/Service yang handle Jadwal Rapat (pastikan ada permission check)
  - Middleware/Service yang handle Rekap Absen (pastikan ada permission check)
  - Database query yang fetch data (tambahkan filter untuk organisasi)
  
- **Frontend**:
  - Component/Page yang menampilkan tabel Jadwal Rapat (tambahkan kolom Organisasi, add conditional rendering)
  - Component/Page yang menampilkan tabel Rekap Absen (tambahkan kolom Organisasi, add conditional rendering)
  - Breadcrumb atau header yang menunjukkan organisasi current user

### Action Items
- [ ] Review current database query untuk Jadwal Rapat dan Rekap Absen
- [ ] Implementasi role-based filtering di backend (cek user.role & user.organisasi)
- [ ] Tambahkan permission check untuk setiap endpoint yang sensitive
- [ ] Update UI untuk menampilkan kolom "Organisasi" di semua tabel
- [ ] Tambahkan visual indicator (text/badge) yang menunjukkan organisasi current user
- [ ] Test setiap kombinasi role:
  - Login Admin OSIS MPK → hanya lihat OSIS MPK data ✅
  - Login Admin ENGLISH CLUB → hanya lihat ENGLISH CLUB data ✅
  - Login Admin PROGRAMMING → hanya lihat PROGRAMMING data ✅
  - Login Administrator → lihat semua organisasi ✅
  - Coba akses data lain lewat API (harus error 403) ✅

---

## 📊 MASALAH #3: LAPORAN STATISTIK TIDAK MUNCUL

### Deskripsi Masalah
Halaman Laporan Statistik tidak menampilkan data dengan benar. User membuka halaman statistik tapi tidak ada data yang muncul (blank page, error, atau data tidak sesuai).

### Root Cause / Penyebab Masalah (Kemungkinan)
1. **Permission Issue**: Data statistik tidak bisa diakses karena permission check yang salah
   - Admin OSIS MPK tidak bisa lihat statistik OSIS MPK sendiri
   - Sistem tidak filter statistik berdasarkan organisasi
   
2. **API Error**: Endpoint statistik return error atau empty result
   - Database query salah atau tidak return data
   - JOIN table tidak bekerja dengan baik
   
3. **Frontend Rendering Issue**: Component tidak render data walaupun API return data
   - Error di console (parsing error, null reference, dll)
   - Loading state tidak pernah complete
   
4. **Data Missing**: Database belum ada data statistik
   - Statistik belum dibuat oleh admin
   - Query mencari data yang tidak exist

### Dampak Masalah
- **Blind Decision Making**: Admin tidak bisa lihat progress/metrik organisasi mereka
- **Incomplete Dashboard**: Dashboard statistik menjadi tidak berguna/kosong
- **Trust Issue**: Admin mungkin think sistem broken atau data belum di-setup
- **Reporting Disabled**: Tidak bisa buat laporan untuk kepimpinan/rapat
- **Monitoring Loss**: Tidak ada visibility tentang aktivitas ekstrakurikuler

### Requirement / Solusi yang Diharapkan

#### Behavior yang Benar:
1. **Admin membuka halaman Laporan Statistik → Data tampil dengan benar**
   - Data statistik untuk organisasi admin ditampilkan
   - Chart/grafik render tanpa error
   - Informasi jelas dan mudah dipahami

2. **Admin OSIS MPK membuka Statistik → Hanya lihat data OSIS MPK**
   - Grafik menunjukkan kehadiran OSIS MPK
   - Statistik anggota OSIS MPK
   - Aktivitas OSIS MPK saja

3. **Admin ENGLISH CLUB membuka Statistik → Hanya lihat data ENGLISH CLUB**
   - Grafik menunjukkan data ENGLISH CLUB saja

4. **Administrator membuka Statistik → Lihat semua organisasi**
   - Bisa filter atau pilih organisasi mana untuk dilihat statistiknya
   - Atau tampilkan statistik semua organisasi dalam satu dashboard
   - Bisa compare antar organisasi

#### Solusi Teknis:

**Di Backend:**
- Review API endpoint statistik: apakah return data yang benar?
- Implementasi permission filter untuk statistik (seperti Masalah #2)
- Pastikan database query untuk statistik benar dan efficient
- Add error handling: jika data tidak ada, return response yang jelas (bukan null/error 500)
- Cek aggregate query: jika statistik adalah perhitungan (SUM, COUNT, AVG), pastikan grouping benar

**Di Frontend:**
- Add loading state saat fetch data (spinner/skeleton)
- Add error state jika API error (error message yang user-friendly)
- Add empty state jika tidak ada data (bukan blank page)
- Ensure chart library render correctly (beri data yang sesuai format)
- Add permission check: jika user bukan Admin, sembunyikan statistik (atau show "Anda tidak punya akses")

### File yang Perlu Diubah
- **Backend**:
  - Controller/Service Statistik (review logic & permission)
  - Database query untuk statistik (pastikan correct)
  - API endpoint statistik (add error handling)
  
- **Frontend**:
  - Component Statistik (add loading, error, empty states)
  - Chart component (ensure render correctly & data structure)
  - Permission check (hanya admin bisa lihat)

### Action Items
- [ ] Cek browser console untuk error message saat buka statistik
- [ ] Test API endpoint statistik secara langsung (Postman/curl) → return data?
- [ ] Verifikasi database: apakah ada data statistik?
- [ ] Review permission filter: apakah statistik di-filter berdasarkan organisasi?
- [ ] Implementasi loading/error/empty states di frontend
- [ ] Ensure chart library compatible dan data format correct
- [ ] Test setiap role:
  - Admin OSIS MPK buka Statistik → tampil data OSIS MPK ✅
  - Admin ENGLISH CLUB buka Statistik → tampil data ENGLISH CLUB ✅
  - Admin PROGRAMMING buka Statistik → tampil data PROGRAMMING ✅
  - Administrator buka Statistik → tampil data semua atau bisa filter ✅
- [ ] Test error handling: API error → tampil error message (bukan blank page) ✅
- [ ] Test empty data: data kosong → tampil empty state (bukan error) ✅

---

## 🔐 MASALAH #4: ADMIN TIDAK BISA AKSES "KELOLA EXP"

### Deskripsi Masalah
Admin OSIS MPK / ENGLISH CLUB / PROGRAMMING tidak bisa mengakses fitur "Kelola Exp" (Kelola Ekspektasi/Experience Points) sesuai bidang organisasi mereka. Menu atau button "Kelola Exp" tidak muncul atau disabled, atau ketika dicoba akses, return error/forbidden.

#### Konteks Detail:
- Admin OSIS MPK ingin manage Exp untuk member OSIS MPK → ❌ Tidak bisa akses "Kelola Exp"
- Admin ENGLISH CLUB ingin manage Exp untuk member ENGLISH CLUB → ❌ Tidak bisa akses "Kelola Exp"
- Admin PROGRAMMING ingin manage Exp untuk member PROGRAMMING → ❌ Tidak bisa akses "Kelola Exp"
- Administrator (Super Admin) → ✅ Bisa akses semua (atau seharusnya bisa)

### Root Cause / Penyebab Masalah
1. **Permission Gate Terlalu Ketat**: Menu "Kelola Exp" hanya accessible untuk role tertentu (mungkin hanya Super Admin)
   - Admin role tidak include dalam permission list
   
2. **Frontend Permission Check Salah**: UI sembunyikan menu Kelola Exp berdasarkan logic yang salah
   - Cek role hardcoded "Administrator" saja, tidak include "Admin OSIS MPK" dll
   
3. **Backend Endpoint Blocked**: Endpoint Kelola Exp tidak allow Admin role
   - API return 403 Forbidden untuk Admin
   - Hanya Super Admin bisa akses
   
4. **Organisasi Mismatch**: Permission check hanya lihat role, tidak lihat organisasi
   - Admin bisa akses Kelola Exp semua organisasi (bukan hanya miliknya)
   - Atau sebaliknya: Admin tidak bisa akses karena organisasi tidak match

### Dampak Masalah
- **Workflow Broken**: Admin tidak bisa manage Exp sendiri, harus minta Super Admin (tidak scalable)
- **Operational Inefficiency**: Setiap perubahan Exp harus go through Super Admin (bottleneck)
- **Trust Issue**: Admin merasa limited dalam control organisasi mereka
- **Inconsistent Permission**: Setiap masalah perlu escalate ke Super Admin
- **Feature Unused**: Fitur Exp ada tapi tidak bisa digunakan oleh admin level (percuma)

### Requirement / Solusi yang Diharapkan

#### Behavior yang Benar:
1. **Admin OSIS MPK login → Bisa akses Kelola Exp untuk OSIS MPK**
   - Menu "Kelola Exp" visible di sidebar/navbar
   - Bisa buka halaman Kelola Exp
   - Bisa lihat list member OSIS MPK
   - Bisa add/update/delete Exp hanya untuk member OSIS MPK

2. **Admin ENGLISH CLUB login → Bisa akses Kelola Exp untuk ENGLISH CLUB**
   - Sama seperti OSIS MPK tapi untuk ENGLISH CLUB
   - Tidak bisa see/edit Exp untuk OSIS MPK atau PROGRAMMING member

3. **Admin PROGRAMMING login → Bisa akses Kelola Exp untuk PROGRAMMING**
   - Sama seperti OSIS MPK tapi untuk PROGRAMMING

4. **Administrator (Super Admin) login → Bisa akses Kelola Exp semua organisasi**
   - Bisa lihat dan manage Exp untuk semua member dari semua organisasi
   - Bisa filter/pilih organisasi mana untuk manage

#### Solusi Teknis:

**Di Backend:**
- Review permission definition untuk Kelola Exp endpoint
- Implementasi role-based permission: JANGAN hanya Super Admin, INCLUDE juga Admin roles
- Organisasi filter: Pastikan Admin hanya bisa akses Exp untuk member organisasi mereka
- Validasi sebelum update: Pastikan user.organisasi = member.organisasi (untuk Admin role)
- Super Admin tidak perlu organisasi filter (bisa akses semua)

**Di Frontend:**
- Menu "Kelola Exp" harus visible untuk Admin role, tidak hanya Super Admin
- Conditional rendering: Jika user.role = "Admin", show Kelola Exp menu
- Form/table untuk manage Exp harus pre-filtered untuk organisasi user
- Button update/delete hanya bisa trigger untuk member organisasi user (Admin), semua untuk Super Admin
- Add visual indicator: "Anda manage Exp untuk OSIS MPK" (untuk Admin)

### File yang Perlu Diubah
- **Backend**:
  - Permission configuration/middleware untuk Kelola Exp
  - Controller/Service Kelola Exp (implement organisasi-based permission)
  - Database query Kelola Exp (filter berdasarkan organisasi)
  
- **Frontend**:
  - Sidebar/Navbar component (show "Kelola Exp" menu untuk Admin role)
  - Kelola Exp page/component (permission check & organisasi filter)
  - Form/table untuk edit Exp (disable fields untuk data organisasi lain)

### Action Items
- [ ] Review permission configuration: siapa yang boleh akses Kelola Exp endpoint?
- [ ] Cek current role checking: hanya "Administrator" atau include "Admin" roles?
- [ ] Implementasi Admin role dalam permission list untuk Kelola Exp
- [ ] Tambahkan organisasi validation: Admin hanya bisa manage Exp organisasi mereka
- [ ] Update UI: show Kelola Exp menu untuk Admin role (tidak hanya Super Admin)
- [ ] Implementasi organisasi-based filtering di halaman Kelola Exp
- [ ] Test setiap role:
  - Admin OSIS MPK login → Kelola Exp visible ✅
  - Admin OSIS MPK click Kelola Exp → hanya lihat member OSIS MPK ✅
  - Admin OSIS MPK coba edit Exp member ENGLISH CLUB → error/forbidden ✅
  - Admin ENGLISH CLUB login → Kelola Exp visible ✅
  - Admin ENGLISH CLUB click Kelola Exp → hanya lihat member ENGLISH CLUB ✅
  - Admin PROGRAMMING login → Kelola Exp visible ✅
  - Admin PROGRAMMING click Kelola Exp → hanya lihat member PROGRAMMING ✅
  - Administrator login → Kelola Exp visible ✅
  - Administrator click Kelola Exp → lihat semua member semua organisasi ✅
  - Administrator bisa edit Exp member apapun ✅

---

## 🎯 PRIORITAS IMPLEMENTASI

| # | Masalah | Prioritas | Estimasi | Dependencies |
|---|---------|-----------|----------|--------------|
| 1 | Responsive Kas Mobile | Medium | 2-3 jam | Tidak ada |
| 2 | Permission & Data Access | **HIGH** | 4-6 jam | Perlu refactor backend |
| 3 | Laporan Statistik | High | 3-4 jam | Tergantung Masalah #2 |
| 4 | Kelola Exp Access | High | 3-4 jam | Tergantung Masalah #2 |

**Saran Urutan:**
1. **Masalah #2** (Permission) - menjadi foundation untuk #3 & #4
2. **Masalah #3** (Statistik) - setelah permission setup
3. **Masalah #4** (Kelola Exp) - setelah permission setup
4. **Masalah #1** (Responsive) - bisa parallel dengan yang lain

---

## 📝 TESTING CHECKLIST

### User Roles untuk Testing
- [ ] User: Admin OSIS MPK
- [ ] User: Admin ENGLISH CLUB
- [ ] User: Admin PROGRAMMING
- [ ] User: Administrator (Super Admin)
- [ ] User: Member biasa

### Test Cases

#### Masalah #1 - Responsive
- [ ] Buka di mobile (320px) - kolom Kas readable?
- [ ] Buka di tablet (768px) - layout ok?
- [ ] Buka di desktop (1920px) - masih ok?

#### Masalah #2 - Permission
- [ ] Admin OSIS MPK login → hanya lihat OSIS MPK ✅
- [ ] Admin OSIS MPK tidak bisa lihat English Club ✅
- [ ] Admin ENGLISH CLUB login → hanya lihat ENGLISH CLUB ✅
- [ ] Admin PROGRAMMING login → hanya lihat PROGRAMMING ✅
- [ ] Administrator login → lihat semua organisasi ✅
- [ ] Kolom "Organisasi" visible di setiap tabel ✅

#### Masalah #3 - Statistik
- [ ] Admin OSIS MPK lihat statistik OSIS MPK ✅
- [ ] Statistik load tanpa error ✅
- [ ] Chart/grafik render correctly ✅
- [ ] Administrator lihat statistik semua organisasi ✅

#### Masalah #4 - Kelola Exp
- [ ] Admin OSIS MPK bisa buka Kelola Exp OSIS MPK ✅
- [ ] Admin OSIS MPK tidak bisa akses Kelola Exp English Club ✅
- [ ] Admin ENGLISH CLUB bisa buka Kelola Exp ENGLISH CLUB ✅
- [ ] Administrator bisa kelola semua ✅
- [ ] Button update/delete hidden untuk data lain ✅

---

## 📞 INFORMASI PENTING

### Stack Technology (Asumsikan)
- Frontend: React/Vue/Angular
- Backend: Node.js/Laravel/Django
- Database: MySQL/PostgreSQL/MongoDB

### Database Schema (Expected)
```
users table:
  - id
  - name
  - email
  - password
  - role (Admin, Member, Administrator)
  - organisasi (OSIS MPK, ENGLISH CLUB, PROGRAMMING)
  
jadwal_rapat table:
  - id
  - organisasi_id / organisasi_name
  - tanggal
  - keterangan
  
rekap_absen table:
  - id
  - organisasi_id / organisasi_name
  - member_id
  - status
  
statistik table:
  - id
  - organisasi_id / organisasi_name
  - data
  
exp table:
  - id
  - organisasi_id / organisasi_name
  - member_id
  - points
```

### Questions untuk Clarification
1. Framework apa yang digunakan (Frontend & Backend)?
2. Database struktur seperti apa? Ada foreign key ke organisasi?
3. Role & permission system sudah implement atau dari 0?
4. Jadwal launch perbaikan kapan?

---

## 🚀 NEXT STEPS

1. **Review** instruksi ini dengan tim development
2. **Diskusi** teknologi stack & database schema
3. **Mulai dari Masalah #2** (sebagai foundation)
4. **Parallel** kerjakan Masalah #1
5. **Setelah #2 fix** → lanjut #3 & #4
6. **Testing** setiap masalah sebelum merge ke production
7. **Deploy** dengan monitoring

---

**Generated:** Sistem Ekstrakurikuler
**Version:** 1.0
**Status:** Ready untuk Implementation
