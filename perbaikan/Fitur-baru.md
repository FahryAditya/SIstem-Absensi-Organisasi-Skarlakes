# 📸 Fitur Dokumentasi Organisasi | All-in-One Guide

**Pengganti Halaman Pencapaian | Upload Foto ke Cloudinary | Instruksi untuk Google Gemini**

---

## 📋 OVERVIEW FITUR

Fitur Dokumentasi adalah pengganti halaman Pencapaian. Admin dapat mendokumentasikan kegiatan organisasi dengan foto dan deskripsi detail. Foto disimpan di Cloudinary (cloud storage), link disimpan di database Neon.

**Apa yang bisa dilakukan:**
- Upload foto kegiatan ke Cloudinary
- Input judul, deskripsi, tanggal
- Set kategori kegiatan (sesuai organisasi)
- Edit dan delete dokumentasi
- Lihat semua dokumentasi (public)

**Yang bisa akses:**
- Admin OSIS/MPK: akses OSIS, MPK, Programming, English Club (create, edit, delete)
- Admin Programming: akses Programming ONLY
- Admin English: akses English Club ONLY
- Public: hanya read/lihat semua

---

## 🗄️ DATABASE SCHEMA

**Model Baru: Documentation**

```
Field utama:
- id (String, unique ID via cuid)
- title (String, max 200 chars)
- description (String, Text - bisa panjang)
- photoUrl (String, link dari Cloudinary)
- category (String, contoh: "Pertemuan", "Jumat Berkah", dll)
- organizationId (String, FK ke Organization)
- type (String, tipe org: "OSIS", "Programming", "English", "MPK")
- createdBy (String, FK ke User - admin yang buat)
- createdAt (DateTime, auto)
- updatedAt (DateTime, auto)
- deletedAt (DateTime, optional - untuk soft delete)

Indexes:
- Index pada organizationId (query cepat per org)
- Index pada type (filter by tipe)
- Index pada createdAt (sorting)

Relations:
- Belongs to Organization (many-to-one)
- Belongs to User via createdBy (many-to-one)

Prisma migrate command:
npx prisma migrate dev --name add_documentation
```

**Update Existing Models:**

Di Organization model, tambah:
- documentations Documentation[]

Di User model, tambah:
- documentations Documentation[]

---

## 🔐 PERMISSION RULES

**Admin OSIS/MPK dapat:**
✅ Akses dokumentasi OSIS
✅ Akses dokumentasi MPK
✅ Akses dokumentasi Programming Club
✅ Akses dokumentasi English Club
✅ Create, Edit, Delete di semua tersebut

**Admin Programming Club dapat:**
✅ Akses dokumentasi Programming Club ONLY
❌ Tidak bisa akses OSIS/MPK/English

**Admin English Club dapat:**
✅ Akses dokumentasi English Club ONLY
❌ Tidak bisa akses OSIS/MPK/Programming

**Public/Non-Admin dapat:**
✅ Lihat semua dokumentasi (read-only)
❌ Tidak bisa create, edit, delete

**Implementation:**
Setiap API endpoint perlu middleware/function:
- checkCanAccessDocumentation(userId, organizationId, adminRole)
- Return true jika user bisa akses, false sebaliknya
- Applied di create, update, delete endpoints
- Frontend juga harus check sebelum show edit/delete button

---

## 📂 KATEGORI KEGIATAN

**OSIS/MPK (Fixed + Custom):**
- Jumat Berkah
- Jumat Religius
- Jumat Sehat
- Jumat Kebersihan
- Custom (admin bisa input sendiri)

**Programming Club:**
- Pertemuan
- Kompetisi
- Workshop
- Seminar
- Custom (admin bisa input sendiri)

**English Club:**
- Pertemuan
- Speaking Session
- English Day
- Movie Night
- Custom (admin bisa input sendiri)

**Flow Implementasi Kategori:**
1. Frontend show dropdown dengan fixed categories
2. Ada option "Lainnya" atau "Custom"
3. Jika pilih custom, show text input untuk custom category
4. Saat submit, simpan category ke database (baik fixed atau custom)
5. Saat fetch, query tanpa membedakan (semua disimpan sama)

---

## ☁️ CLOUDINARY SETUP

**Apa itu Cloudinary:**
Cloudinary adalah cloud storage untuk images/media. Admin upload foto, Cloudinary return link permanent yang bisa disimpan ke database.

**Setup Step-by-Step:**

1. Buka cloudinary.com
2. Daftar akun baru (free tier: 25 GB storage, unlimited bandwidth, cukup untuk school)
3. Setelah login, di dashboard pilih "Settings" atau "API Keys"
4. Copy 3 credentials:
   - Cloud Name (contoh: "sms-skarlakes")
   - API Key (contoh: "123456789012345")
   - API Secret (contoh: "abcdefgh1234567890_xyz")
5. Tambah ke .env.local:
   ```
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=sms-skarlakes
   CLOUDINARY_API_KEY=123456789012345
   CLOUDINARY_API_SECRET=abcdefgh1234567890_xyz
   ```
6. Restart dev server

**Important Notes:**
- NEXT_PUBLIC_ prefix = bisa diakses dari frontend
- API Secret = JANGAN expose, hanya backend
- Gunakan untuk upload ke Cloudinary di backend
- Return URL bisa diakses dari frontend

---

## 🔌 API ENDPOINTS

**Endpoint 1: POST /api/documentation/create**

Menerima:
- title (String, required)
- description (String, required)
- category (String, required)
- photoUrl (String, required - dari Cloudinary)
- organizationId (String, required)
- type (String, required - tipe org)

Proses:
1. Validate user adalah admin (check session)
2. Validate user punya akses ke organizationId (check permission)
3. Validate input: title, description, category tidak kosong
4. Validate photoUrl adalah valid Cloudinary URL
5. Create Documentation di database dengan createdBy = userId
6. Return success response dengan dokumentasi ID baru

Response sukses:
```
{
  success: true,
  message: "Dokumentasi berhasil dibuat",
  data: { id, title, photoUrl, createdAt }
}
```

---

**Endpoint 2: GET /api/documentation?organizationId=xxx**

Menerima:
- organizationId (query param, required)
- type (query param, optional - untuk filter by type)
- page (query param, optional - default 1)
- limit (query param, optional - default 10)

Proses:
1. Check user bisa akses org ini (public bisa lihat, admin check permission)
2. Query dokumentasi dari database WHERE organizationId = xxx
3. Jika type diberikan, tambah filter type
4. Exclude deleted (WHERE deletedAt IS NULL)
5. Sort by createdAt DESC
6. Apply pagination (skip, take)
7. Return dengan pagination info

Response:
```
{
  success: true,
  data: [
    { id, title, description, photoUrl, category, createdAt, createdBy },
    ...
  ],
  pagination: { page, limit, total, pages }
}
```

---

**Endpoint 3: PUT /api/documentation/[id]**

Menerima:
- id di URL
- title (optional)
- description (optional)
- category (optional)
- photoUrl (optional)

Proses:
1. Validate user adalah admin yang create dokumentasi ini (check createdBy)
2. Fetch dokumentasi dari database
3. Validate input (jika ada yang diupdate)
4. Jika ada foto lama dan foto baru berbeda, delete foto lama dari Cloudinary
5. Update dokumentasi di database
6. Return success response

---

**Endpoint 4: DELETE /api/documentation/[id]**

Menerima:
- id di URL

Proses:
1. Validate user adalah admin yang create dokumentasi ini
2. Fetch dokumentasi dari database
3. Soft delete: set deletedAt = now() (jangan hard delete)
4. Delete foto dari Cloudinary
5. Return success response

---

**Endpoint 5: POST /api/documentation/upload-photo**

Menerima:
- file (FormData, file upload)

Proses:
1. Validate file:
   - Type: jpg, jpeg, png, gif (whitelist)
   - Size: max 5MB
2. Create FormData dengan file
3. POST ke Cloudinary upload API dengan API key dan secret
4. Get URL dari response
5. Return URL

Response:
```
{
  success: true,
  url: "https://res.cloudinary.com/xxx/image/upload/xxx.jpg"
}
```

---

## 🎨 FRONTEND COMPONENTS

**Component 1: DocumentationForm**

Props:
- organizationId (optional, pre-fill untuk edit)
- initialData (optional, untuk edit mode)
- onSubmit (callback)

State:
- title (String)
- description (String)
- category (String)
- file (File)
- photoUrl (String)
- loading (Boolean)
- message (String, success/error)

Render:
1. Input field untuk title (text input, max 200)
2. Textarea untuk description
3. Dropdown untuk category (fixed options + custom input)
4. File input untuk foto (accept jpg, png, gif)
5. Preview thumbnail setelah file dipilih
6. Upload button (POST ke /api/documentation/upload-photo)
7. Show upload progress/status
8. Submit button (POST/PUT ke /api/documentation/create atau /api/documentation/[id])
9. Success/error message

Logika:
- Jika upload foto berhasil, disable file input, show preview, set photoUrl
- Jika submit berhasil, redirect ke halaman dokumentasi
- Jika error, show error message tapi allow retry
- Field validation: title dan description required

---

**Component 2: DocumentationList**

Props:
- organizationId (String)
- canEdit (Boolean, apakah user bisa edit)

State:
- data (Array of dokumentasi)
- loading (Boolean)
- selectedCategory (String, untuk filter)
- page (Number, untuk pagination)

Render:
1. Grid atau list layout
2. Category filter dropdown/buttons
3. Pagination buttons (prev, next, page numbers)
4. Untuk setiap dokumentasi item, render:
   - Foto thumbnail (clickable untuk full view)
   - Title (bold)
   - Description (truncate jika panjang, show "... baca lebih")
   - Date (format: "15 Feb 2024")
   - Category badge
   - Jika canEdit: show edit dan delete button

Logika:
- Fetch dari /api/documentation?organizationId=xxx saat mount
- Filter by category: query ulang dengan type parameter
- Pagination: query ulang dengan page parameter
- Edit button: navigate ke edit page atau open modal
- Delete button: show confirmation, then DELETE ke API

---

**Component 3: DocumentationDetail**

Props:
- id (String)
- canEdit (Boolean)

State:
- data (Object)
- loading (Boolean)
- isEditMode (Boolean)

Render:
1. Foto full size (clickable untuk lightbox/modal)
2. Title (heading)
3. Category badge
4. Date
5. Deskripsi lengkap
6. Jika canEdit:
   - Edit button (toggle edit mode)
   - Delete button (dengan confirmation)
7. Edit mode: show DocumentationForm dengan data pre-filled

Logika:
- Fetch dokumentasi by ID saat mount
- Show loading spinner saat fetch
- Edit: toggle edit mode, show form dengan current data
- Delete: confirmation dialog, then DELETE ke API, redirect to list
- Back button: navigate ke dokumentasi list

---

**Component 4: PhotoUploadPreview**

Props:
- onUpload (callback, receive photoUrl)

State:
- file (File)
- photoUrl (String)
- loading (Boolean)
- message (String)

Render:
1. Drag & drop zone
2. File input (accept jpg, png, gif)
3. Upload button (POST ke /api/documentation/upload-photo)
4. Show upload progress
5. Preview thumbnail setelah upload
6. Success message dengan URL (optional, untuk copy)

Logika:
- Drag & drop: set file, trigger upload
- File input: set file, trigger upload (atau manual click button)
- Upload: show loading, call API, get URL
- Success: set photoUrl, call onUpload callback, show message
- Error: show error message, allow retry

---

## 📄 PAGES

**Page 1: /dokumentasi atau /dashboard/dokumentasi**

Nama: Dokumentasi List Page

Konten:
1. Heading "Dokumentasi Organisasi"
2. Jika user adalah admin: button "Tambah Dokumentasi Baru"
3. Organization tabs/selector:
   - Tab OSIS (show hanya OSIS docs)
   - Tab MPK (show hanya MPK docs)
   - Tab Programming Club
   - Tab English Club
   - Jika user admin Programming: only show Programming tab
   - Jika user admin English: only show English tab
4. Category filter (dropdown atau buttons)
5. DocumentationList component
6. Pagination

Logika:
- Fetch dokumentasi sesuai tab yang dipilih
- Default tab: tab pertama yang user bisa akses
- Filter kategori: query ulang dengan filter
- Show/hide "Tambah" button sesuai user role

---

**Page 2: /dashboard/dokumentasi/tambah**

Nama: Tambah Dokumentasi Page

Konten:
1. Heading "Tambah Dokumentasi Baru"
2. Organization selector (dropdown):
   - Jika admin OSIS: show OSIS, MPK, Programming, English (pre-select OSIS)
   - Jika admin Programming: show Programming only (auto-select)
   - Jika admin English: show English only (auto-select)
3. Type selector (auto-fill sesuai organization)
4. DocumentationForm component (tanpa initialData)
5. Upload photo preview

Logika:
- Fetch organization sesuai user role
- Auto-fill type sesuai organization dipilih
- Form submit: POST ke /api/documentation/create
- Success: redirect ke /dokumentasi/[id]

---

**Page 3: /dashboard/dokumentasi/[id]/edit**

Nama: Edit Dokumentasi Page

Konten:
1. Heading "Edit Dokumentasi"
2. DocumentationForm dengan data pre-filled
3. Current foto preview
4. Delete button (dengan confirmation)

Logika:
- Fetch dokumentasi by ID
- Validate user adalah creator
- Form submit: PUT ke /api/documentation/[id]
- Success: redirect ke /dokumentasi/[id]
- Delete: DELETE ke API, redirect ke list

---

**Page 4: /dokumentasi/[id]**

Nama: Detail Dokumentasi Page (Public)

Konten:
1. DocumentationDetail component
2. Jika admin: edit dan delete button
3. Foto full size
4. Judul, kategori, tanggal, deskripsi lengkap
5. Related dokumentasi (dari org yang sama)

Logika:
- Fetch dokumentasi by ID
- Publicly accessible (no auth required)
- Show edit/delete hanya jika current user adalah creator

---

## 🎬 WORKFLOW CONTOH

**Scenario: Admin Programming ingin buat dokumentasi Pertemuan**

Step-by-step:
1. Login sebagai Admin Programming
2. Buka /dashboard/dokumentasi
3. Lihat dokumentasi Programming Club ONLY (tidak lihat OSIS/English)
4. Klik tombol "Tambah Dokumentasi Baru"
5. Redirect ke /dashboard/dokumentasi/tambah
6. Organization auto-selected: "Programming Club"
7. Type auto-filled: "Programming"
8. Input form:
   - Title: "Pertemuan Programming 15 Februari 2024"
   - Category: dropdown, pilih "Pertemuan"
   - Description: "Diskusi tentang algoritma sorting, demo code, Q&A session"
   - Foto: drag & drop atau click upload
9. Foto upload ke Cloudinary
10. Show preview + success message
11. Klik "Publish" button
12. Dokumentasi POST ke /api/documentation/create
13. Success: redirect ke /dokumentasi/[id]
14. Lihat dokumentasi yang baru dibuat (foto, title, deskripsi, tanggal)

---

**Scenario: Admin OSIS ingin lihat semua dokumentasi (4 org)**

Step-by-step:
1. Login sebagai Admin OSIS
2. Buka /dokumentasi (halaman publik)
3. Lihat semua dokumentasi dari 4 org (OSIS, MPK, Programming, English)
4. Bisa filter by org tabs
5. Bisa filter by category
6. Klik sebuah dokumentasi
7. Lihat detail (foto full size, title, deskripsi lengkap, tanggal, category)
8. Karena admin OSIS dan creator OSIS doc: show edit & delete button
9. Klik edit: open /dashboard/dokumentasi/[id]/edit
10. Ubah title, deskripsi, atau upload foto baru
11. Klik save: PUT ke /api/documentation/[id]
12. Success: redirect ke detail page

---

**Scenario: Orang biasa lihat dokumentasi**

Step-by-step:
1. User buka /dokumentasi (tanpa login atau login non-admin)
2. Lihat semua dokumentasi dari semua org
3. Filter by org, filter by category
4. Klik sebuah dokumentasi
5. Lihat detail
6. Tidak ada edit/delete button (bukan admin, bukan creator)

---

## ✅ TESTING CHECKLIST

**Create Dokumentasi:**
- [ ] Admin dapat upload foto dengan benar
- [ ] Foto tersimpan di Cloudinary dan dapat diakses
- [ ] URL Cloudinary tersimpan dengan benar di database
- [ ] Form validation bekerja (title dan description required)
- [ ] Category dropdown bekerja
- [ ] Success message muncul setelah publish
- [ ] Redirect ke detail page setelah publish

**Read Dokumentasi:**
- [ ] List dokumentasi tampil dengan benar
- [ ] Foto thumbnail tampil dengan benar
- [ ] Filter by organization tabs bekerja
- [ ] Filter by category bekerja
- [ ] Pagination bekerja (next, prev, page numbers)
- [ ] Detail page menampilkan semua data dengan benar
- [ ] Foto full size tampil di detail

**Permission:**
- [ ] Admin OSIS bisa akses dokumentasi OSIS, MPK, Programming, English
- [ ] Admin Programming hanya akses Programming ONLY
- [ ] Admin English hanya akses English ONLY
- [ ] Non-admin hanya bisa read (tidak ada edit/delete)
- [ ] Edit/delete button hanya muncul untuk creator & authorized admin
- [ ] Cannot delete/edit dokumentasi milik org lain

**Cloudinary:**
- [ ] Foto upload berhasil ke Cloudinary
- [ ] URL valid dan bisa diakses dari frontend
- [ ] Delete foto dari Cloudinary berhasil saat delete dokumentasi
- [ ] File size validation bekerja (max 5MB)
- [ ] File type validation bekerja (jpg, png, gif only)

**Edit & Delete:**
- [ ] Edit dokumentasi: form pre-filled dengan data lama
- [ ] Edit: bisa upload foto baru dan delete foto lama
- [ ] Edit: berhasil disimpan ke database
- [ ] Delete: show confirmation dialog
- [ ] Delete: soft delete (set deletedAt, tidak hard delete)
- [ ] Delete: foto dihapus dari Cloudinary
- [ ] Deleted dokumentasi tidak tampil di list

---

## 🤖 INSTRUKSI UNTUK GOOGLE GEMINI

Gunakan prompt ini saat implementasi:

### PROMPT 1: UNDERSTAND FEATURE
```
Dari file DOKUMENTASI_FITUR.md, jelaskan:
1. Apa itu fitur Dokumentasi dan guna sebenarnya
2. Permission rules: siapa saja yang bisa akses apa
3. Alur upload foto ke Cloudinary (singkat)
Jawab masing-masing 3-4 kalimat saja, tidak perlu panjang
```

### PROMPT 2: DATABASE SETUP
```
Dari file DOKUMENTASI_FITUR.md bagian 'Database Schema':
Buat tabel dengan 3 kolom: Field Name | Type | Description
Tampilkan semua field yang ada di model Documentation
Hanya tabel, tanpa penjelasan panjang
```

### PROMPT 3: IMPLEMENTATION PLAN
```
Saya akan implementasi fitur Dokumentasi. Saya sudah paham overview.
Sekarang saya butuh step-by-step implementation plan.
Dari DOKUMENTASI_FITUR.md, buat checklist lengkap dengan format:
[ ] Task Name | Time Estimate | Dependencies | Notes
Jangan kasih penjelasan, hanya checklist saja
```

### PROMPT 4: CLOUDINARY SETUP
```
Saya sudah daftar Cloudinary dan dapat credentials.
Dari DOKUMENTASI_FITUR.md bagian 'Cloudinary Setup', saya mau:
1. Apa yang ditambah ke .env.local? (list semua variables)
2. Apa yang perlu di-install? (npm packages)
3. Langkah pertama implementasi setelah setup .env? (step 1 saja)
Jawab point-by-point, concise
```

### PROMPT 5: API ROUTES STRUCTURE
```
Konteks: Saya sudah update Prisma schema dan migration berhasil.
Sekarang saya mau buat 5 API endpoints untuk dokumentasi.
Dari DOKUMENTASI_FITUR.md bagian 'API Endpoints', jelaskan:
- Endpoint 1 (POST /api/documentation/create):
  a) Parameter apa? (list semua)
  b) Proses step-by-step (numbered bullet)
  c) Success response (JSON structure)
Jangan kasih actual code, hanya struktur dan logika
```

### PROMPT 6: PERMISSION CHECKING
```
Dari DOKUMENTASI_FITUR.md bagian 'Permission Rules':
Saya butuh middleware/function untuk validate permission.
Buat pseudocode atau logic text untuk:
- Function name & parameters
- Logic step-by-step untuk check:
  a) Admin OSIS: can access 4 org
  b) Admin Programming: can access 1 org only
  c) Non-admin: read-only
- Return value (true/false)
Format: pseudocode, bukan actual code
```

### PROMPT 7: COMPONENT STRUCTURE
```
Dari DOKUMENTASI_FITUR.md bagian 'Frontend Components':
Saya butuh structure untuk DocumentationForm component.
Jelaskan:
1. Props apa yang diterima?
2. State apa yang diperlukan? (list semua)
3. Main functionality (list 5 main features)
4. Validation rules (apa yang harus dicek)
Format: bullet points, singkat
```

### PROMPT 8: TESTING SCENARIOS
```
Dari DOKUMENTASI_FITUR.md bagian 'Testing Checklist':
Saya mau detailed testing scenarios.
Group checklist items menjadi 4 kategori:
1. Create Dokumentasi (6-8 items)
2. Read/View Dokumentasi (6-8 items)
3. Permission (5-7 items)
4. Cloudinary Integration (4-5 items)
Untuk setiap item, tambahkan: "How to test" (1 line instruction)
Format: [ ] Test Name | How to test
```

### PROMPT 9: TROUBLESHOOTING
```
Saya implementasi fitur dokumentasi dan ada masalah:
[DESCRIBE YOUR ERROR/ISSUE]
Dari DOKUMENTASI_FITUR.md dan general knowledge, apa yang harus saya check?
Beri checklist troubleshooting dengan 7-10 items, setiap item:
[ ] Check Name | What to verify
Format: checklist dengan deskripsi singkat
```

### PROMPT 10: WORKFLOW WALKTHROUGH
```
Dari DOKUMENTASI_FITUR.md bagian 'Workflow Contoh', jelaskan:
'Admin Programming ingin buat dokumentasi Pertemuan'
Detailkan setiap step 1-14 dengan:
- Action yang dilakukan
- Expected result
- Data yang dibuat/diubah
Format: numbered list, singkat per step
```

---

## 📊 SUMMARY STATS

| Item | Nilai |
|------|-------|
| Database Models | 1 model baru (Documentation) |
| New Database Fields | 9 fields |
| Database Indexes | 3 indexes |
| API Endpoints | 5 endpoints (create, read, update, delete, upload) |
| Components | 4 components (Form, List, Detail, Upload) |
| Pages | 4 pages (List, Tambah, Edit, Detail) |
| Permission Roles | 3 roles (OSIS, Programming, English) |
| Kategorii Kegiatan | 4 fixed + custom per org |
| Cloudinary Setup | 3 environment variables |
| Estimated Time | 20-30 hours implementation |
| Team Size | 1-2 developers |
| Difficulty Level | Intermediate |

---

## 📌 PENTING DIINGAT

1. **Cloudinary:** Setup credentials SEBELUM mulai coding
2. **Permission:** Validate di API layer DAN frontend layer (double check)
3. **Soft Delete:** Gunakan deletedAt field, JANGAN hard delete
4. **File Validation:** Validate ukuran (max 5MB) dan tipe (jpg, png, gif)
5. **Database Migration:** Jangan lupa jalankan migration setelah update schema
6. **Gemini Prompts:** Gunakan prompt yang sudah disediakan, reference file sections
7. **Testing:** Test setiap role (OSIS, Programming, English) secara terpisah

---

## ⚠️ JANGAN MENINGGALKAN JEJAK BUG SAAT PROSES BUILDING

**Sangat penting untuk quality & production:**

### Type Safety (TypeScript)
- [ ] Jangan abaikan TypeScript errors
- [ ] Jalankan `npm run build` sebelum submit
- [ ] Fix semua TS errors, tidak boleh ada warning
- [ ] Pastikan return types correct di semua functions
- [ ] Generic types jangan `any`, use proper types

### Runtime Errors
- [ ] Test setiap endpoint dengan Postman/Insomnia
- [ ] Test setiap page navigation
- [ ] Check console di browser (F12), tidak boleh ada error
- [ ] Check network tab, semua requests harus 200 atau proper error code
- [ ] Test upload file dengan berbagai ukuran dan tipe (valid & invalid)

### Permission Bugs
- [ ] Test akses sebagai Admin OSIS (harus akses 4 org)
- [ ] Test akses sebagai Admin Programming (harus akses 1 org only)
- [ ] Test akses sebagai Admin English (harus akses 1 org only)
- [ ] Test akses sebagai non-admin (harus read-only)
- [ ] Jangan bisa edit/delete dokumentasi org lain

### Database Issues
- [ ] Jangan ada orphaned records (dokumentasi tanpa organization)
- [ ] Foreign keys harus valid
- [ ] Soft delete bekerja: deletedAt harus terisi saat delete, dokumentasi tidak tampil
- [ ] Timestamps (createdAt, updatedAt) harus terisi otomatis
- [ ] Migration harus bisa di-rollback tanpa error

### Cloudinary Integration
- [ ] Upload foto harus valid URL Cloudinary
- [ ] Delete dokumentasi harus delete foto dari Cloudinary juga
- [ ] Jika upload foto gagal, error message harus jelas
- [ ] Jangan ada broken links (foto tidak accessible)
- [ ] File validation harus block invalid files (size, type)

### Data Validation
- [ ] Form fields required harus validated
- [ ] Title tidak boleh kosong atau hanya spaces
- [ ] Description tidak boleh kosong
- [ ] Category harus valid (dari list atau custom)
- [ ] Email/UUID fields harus properly formatted
- [ ] Trim whitespace dari input (nama, title, dll)

### Error Handling
- [ ] API errors harus return proper HTTP status codes
- [ ] Error messages harus user-friendly (bukan raw database errors)
- [ ] Jangan expose internal system details di error message
- [ ] Console.log errors untuk debugging, tapi remove sebelum production
- [ ] Unhandled promise rejections tidak boleh ada

### Performance
- [ ] Query dengan pagination, jangan fetch semua rows
- [ ] Use indexes untuk fast queries
- [ ] Image uploads tidak blocking (async)
- [ ] Jangan N+1 queries (fetch org terus fetch members terus fetch docs)

### Security
- [ ] Authentication check di setiap admin endpoint
- [ ] Authorization check: apakah user punya akses resource ini
- [ ] Input sanitization untuk mencegah XSS
- [ ] Jangan store passwords atau secrets di database
- [ ] API key (Cloudinary) hanya di backend, tidak di frontend

### Code Quality
- [ ] Jangan ada console.log statements di production code
- [ ] Jangan ada commented-out code, delete atau document why
- [ ] Function names harus meaningful (tidak `func1`, `handle`, dll)
- [ ] Use consistent naming conventions (camelCase untuk JS)
- [ ] Max function length ~50 lines, break ke helper functions

### Testing Sebelum Submit
```
Checklist build process:
- [ ] npm run build --> berhasil tanpa error/warning
- [ ] npm run lint --> tidak ada linting issues
- [ ] Manual test semua user flows
- [ ] Test di incognito/private mode (test session handling)
- [ ] Test dengan network throttling (slow connection)
- [ ] Test mobile responsiveness
- [ ] Check accessibility (keyboard navigation, alt text)
- [ ] Security audit: check env variables tidak di-expose
```

### Bug Yang Sering Terjadi (Hindari!)
1. **Forgot await**: `await fetch(...)`tapi tidak di-await, jadi race condition
2. **Wrong condition**: Permission check: `if (user.role === "ADMIN")` tapi ada typo "ADMI"
3. **Missing validation**: Input dari user tidak di-validate, bisa broken/malicious
4. **Unhandled errors**: API call tanpa try-catch, jika gagal, app crash
5. **Stale data**: Query cache tapi data change, lihat data lama
6. **Type mismatch**: String dikirim ke field Number, atau sebaliknya
7. **Missing fields**: Dokumentasi create tapi lupa set createdBy, atau photoUrl
8. **Hard-coded values**: Cloudinary URL di-hardcode, seharusnya dari response
9. **Race conditions**: Upload foto async, tapi save ke database synchronously
10. **Broken links**: Delete foto tapi URL masih di database, atau sebaliknya

---

**Rules Ketat untuk Building:**
- ✅ No TypeScript errors
- ✅ No console errors/warnings saat runtime
- ✅ All endpoints tested & working
- ✅ All permissions working correctly
- ✅ No broken links atau missing data
- ✅ Error handling proper
- ✅ Code clean (no debug code)

**Jika ada bug terdeteksi saat building, FIX DULU sebelum merge/deploy!**

---

**Status:** Ready for Implementation  
**Difficulty:** Intermediate  
**Estimate:** 20-30 hours  
**Team:** 1-2 developers

**Selamat implementasi! 🚀**
