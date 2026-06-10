# 📚 Fitur: Tahun Ajaran Baru - Class Progression & Purna Tugas

**Date**: 10 Juni 2026  
**Feature Type**: Administrative Management System  
**Priority**: HIGH  
**Complexity**: MEDIUM-HIGH  
**Estimated Implementation Time**: 4-5 weeks

---

## 📑 Daftar Isi

1. [Overview & Business Logic](#overview--business-logic)
2. [User Stories & Workflows](#user-stories--workflows)
3. [UI/UX Design & Screens](#uiux-design--screens)
4. [Data Structure & Database Changes](#data-structure--database-changes)
5. [Business Rules & Validation](#business-rules--validation)
6. [Animation & Transitions](#animation--transitions)
7. [State Management & Logic Flow](#state-management--logic-flow)
8. [Admin Controls & Safety Measures](#admin-controls--safety-measures)
9. [Reporting & Archive](#reporting--archive)
10. [Testing Scenarios](#testing-scenarios)
11. [Implementation Roadmap](#implementation-roadmap)

---

## Overview & Business Logic

### 📖 Background & Context

**Current System**:
- Setiap siswa punya `class` field (X, XI, XII)
- No automatic progression saat tahun ajaran baru
- No mechanism untuk handle graduated students (purna tugas)

**New Feature Goals**:
1. **Class Progression**: Automatically upgrade X → XI, XI → XII pada tahun ajaran baru
2. **Purna Tugas Handling**: XII → Graduate, dipindahkan ke "Purna Tugas" status
3. **Celebratory UX**: Visual feedback & animations untuk engagement
4. **Data Segregation**: All organizations (OSIS, MPK, English, Programming) dihandle
5. **Safety & Auditability**: Reversible operations, complete history tracking

### 🎯 Key Objectives

| Goal | Description |
|------|-------------|
| **Automation** | Zero manual updates, one-click class progression |
| **Visualization** | Celebrate transitions dengan animations & welcome screens |
| **Safety** | Prevent accidental overrides, allow rollback |
| **Transparency** | Show who's graduating, who's advancing |
| **Efficiency** | Bulk operation, quick execution |

---

## User Stories & Workflows

### 👤 User Story 1: Super Admin Access New School Year Page

**As a** Super Administrator  
**I want to** access a dedicated "Tahun Ajaran Baru" page yang show all organizations  
**So that** I can perform class progression & graduation ceremonies

**Acceptance Criteria**:
- [ ] Page accessible dari Admin Dashboard
- [ ] Display all organizations (OSIS, MPK, English, Programming)
- [ ] Show member counts per organization & per class (X, XI, XII)
- [ ] Show list of XII students yang akan graduate
- [ ] Display statistics: Total members, graduates, promoted students
- [ ] "Naik Kelas" button visible & obvious

---

### 👤 User Story 2: Admin Initiates Class Progression

**As a** Super Administrator  
**I want to** click "Naik Kelas" button dan sistem automatically promote all students  
**So that** I don't have to manually update each student's class

**Acceptance Criteria**:
- [ ] Button triggers confirmation dialog
- [ ] Dialog shows detailed summary:
  - X akan jadi XI: N students
  - XI akan jadi XII: N students
  - XII akan di-declare purna tugas: N students
- [ ] "Continue" button untuk proceed
- [ ] "Cancel" button untuk abort
- [ ] Progress indicator during operation (don't allow multiple clicks)

---

### 👤 User Story 3: Witness Graduation Ceremony

**As a** Super Administrator  
**I want to** see dramatic visualization of graduating students  
**So that** I feel the ceremonial moment of class progression

**Acceptance Criteria**:
- [ ] Full-screen modal/overlay displayed
- [ ] Teks "Selamat Datang Tahun Ajaran 2026-2027" muncul dengan fade-in animation
- [ ] List nama-nama OSIS yang purna tugas ditampilkan
- [ ] Transition ke MPK purna tugas dengan animation
- [ ] Then show OSIS class X students naik ke XI dengan animation
- [ ] Then show MPK class X students naik ke XI dengan animation
- [ ] Class numbers dalam badges update dengan smooth animation (X → XI)
- [ ] Final success message: "✅ Class progression selesai!"
- [ ] Option untuk share/screenshot hasil

---

### 👤 User Story 4: View Promoted Students

**As a** Organization Admin  
**I want to** see which students dalam my organization yang promoted  
**So that** I can verify the progression happened correctly

**Acceptance Criteria**:
- [ ] "Class Progression History" page ada
- [ ] Filter by organization, school year, action (promoted/graduated)
- [ ] Show: Student name, old class, new class, date, actor (who performed)
- [ ] Downloadable report (CSV/PDF)

---

## UI/UX Design & Screens

### 📱 Screen 1: Tahun Ajaran Baru - Main Dashboard (New)

**Location**: `/admin/school-year-management` atau `/admin/new-school-year`

**Layout Overview**:
```
┌─────────────────────────────────────────────────────┐
│ 📚 Tahun Ajaran Baru 2026-2027                      │
│ Naik Kelas & Purna Tugas                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ⚠️ INFO: Operasi ini akan mengubah kelas semua     │
│ siswa. Pastikan Anda siap melakukan action ini.    │
│ Action ini DAPAT diundo (rollback 48 jam).         │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 📊 RINGKASAN TAHUN AJARAN SEKARANG                 │
│                                                     │
│ ┌──────────────┐  ┌──────────────┐                │
│ │ OSIS         │  │ MPK          │                │
│ │ Total: 50    │  │ Total: 45    │                │
│ │ Kelas X: 20  │  │ Kelas X: 18  │                │
│ │ Kelas XI: 20 │  │ Kelas XI: 18 │                │
│ │ Kelas XII: 10│  │ Kelas XII: 9 │                │
│ └──────────────┘  └──────────────┘                │
│                                                     │
│ ┌──────────────┐  ┌──────────────┐                │
│ │ English Club │  │ Programming   │                │
│ │ Total: 35    │  │ Total: 28    │                │
│ │ Kelas X: 12  │  │ Kelas X: 10  │                │
│ │ Kelas XI: 15 │  │ Kelas XI: 12 │                │
│ │ Kelas XII: 8 │  │ Kelas XII: 6 │                │
│ └──────────────┘  └──────────────┘                │
│                                                     │
├─────────────────────────────────────────────────────┤
│ 👥 YANG AKAN PURNA TUGAS (Kelas XII)              │
│                                                     │
│ OSIS (10 orang):                                   │
│  • Fahry Aditya                                    │
│  • Adi Pratama                                     │
│  • [8 more names...]                               │
│                                                     │
│ MPK (9 orang):                                     │
│  • Budi Santoso                                    │
│  • [8 more names...]                               │
│                                                     │
│ [Similar untuk English Club & Programming]         │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│        [ 🔄 Naik Kelas ]  [ 📊 Lihat Laporan ]    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Components**:
1. **Header & Warning Banner**
   - Title: "Tahun Ajaran Baru 2026-2027"
   - Warning text tentang irreversibility (tapi bisa rollback)
   - School year selector dropdown (jika multi-year support)

2. **Statistics Cards**
   - 4 cards (satu per organization)
   - Setiap card show: Total members + breakdown by class
   - Color-coded: X (biru), XI (hijau), XII (oranye/merah)
   - Click card → Show detail list

3. **Graduating Students List**
   - Group by organization
   - Show names yang akan di-declare purna tugas
   - Expandable sections
   - Search/filter capability

4. **Action Buttons**
   - "🔄 Naik Kelas" - Main action button, large & prominent
   - "📊 Lihat Laporan" - View progression history
   - "↩️ Undo" - Rollback jika ada mistake (disabled jika sudah 48 jam)

---

### 📱 Screen 2: Confirmation Dialog (Pre-Action)

**Triggered when**: User click "Naik Kelas" button

**Layout**:
```
┌──────────────────────────────────────────┐
│ ⚠️  Konfirmasi Naik Kelas                │
├──────────────────────────────────────────┤
│                                          │
│ Anda akan melakukan class progression   │
│ untuk semua organisasi.                 │
│                                          │
│ RINGKASAN PERUBAHAN:                    │
│                                          │
│ 📌 OSIS                                  │
│    • 20 siswa Kelas X → XI              │
│    • 20 siswa Kelas XI → XII            │
│    • 10 siswa Kelas XII → PURNA TUGAS   │
│                                          │
│ 📌 MPK                                   │
│    • 18 siswa Kelas X → XI              │
│    • 18 siswa Kelas XI → XII            │
│    • 9 siswa Kelas XII → PURNA TUGAS    │
│                                          │
│ [Similar untuk English Club & Programming]
│                                          │
│ TOTAL PERUBAHAN:                         │
│    • 60 siswa naik kelas                │
│    • 42 siswa akan purna tugas          │
│                                          │
│ ⏱️  Estimasi waktu: 5-10 detik          │
│                                          │
├──────────────────────────────────────────┤
│ Aksi ini DAPAT diundo dalam 48 jam.     │
│                                          │
│ [ Batal ]  [ 🔄 Lanjutkan ]             │
└──────────────────────────────────────────┘
```

**Content Details**:
- Detailed summary per organization
- Total counts of all changes
- Estimated execution time
- Clear warning tentang consequences
- Rollback window info (48 hours)

**Buttons**:
- "Batal" - Close dialog, no action
- "Lanjutkan" - Proceed dengan class progression

---

### 📱 Screen 3: Class Progression Animation - Ceremony View (Full Screen)

**Triggered when**: User confirm "Lanjutkan" button

**Phase 1: Welcome Screen** (2-3 seconds)

```
┌──────────────────────────────────────────────┐
│                                              │
│                                              │
│          SELAMAT DATANG KE TAHUN AJARAN     │
│                 2026 - 2027                 │
│                                              │
│                                              │
│                                              │
│          [Dengan animasi fade-in & scale]   │
│          [Background: Gradient biru-ungu]   │
│                                              │
└──────────────────────────────────────────────┘
```

**Animation Details**:
- Text dengan opacity 0 → 1 (fade in over 2 seconds)
- Text scale 0.8 → 1 (grow smoothly)
- Background gradient animates slowly
- Background music/sound effect (optional, muted by default)

---

**Phase 2: OSIS Purna Tugas Announcement** (5-7 seconds)

```
┌──────────────────────────────────────────────┐
│                                              │
│        🎓 PURNA TUGAS OSIS 2026              │
│                                              │
│        Terimakasih untuk dedikasi Anda       │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ • Fahry Aditya                       │   │
│  │ • Adi Pratama                        │   │
│  │ • Budi Santoso                       │   │
│  │ • [7 more names...]                  │   │
│  │                                      │   │
│  │    [Names appear one by one]         │   │
│  │    [Each with staggered animation]   │   │
│  └──────────────────────────────────────┘   │
│                                              │
│        Semoga sukses di masa depan! 🌟      │
│                                              │
└──────────────────────────────────────────────┘
```

**Animation Details**:
- Section fade in dengan slide up
- Title dengan typewriter effect atau bounce
- List items slide in dari kiri, staggered (50-100ms gap)
- Closing message appear at bottom
- Color: Warm gold/orange untuk celebrate
- Duration: ~5-7 seconds total

---

**Phase 3: MPK Purna Tugas Announcement** (5-7 seconds)

Same seperti Phase 2, but untuk MPK:

```
┌──────────────────────────────────────────────┐
│                                              │
│        🎓 PURNA TUGAS MPK 2026               │
│                                              │
│        Terimakasih untuk dedikasi Anda       │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ • Nama MPK 1                         │   │
│  │ • Nama MPK 2                         │   │
│  │ • [7 more names...]                  │   │
│  │                                      │   │
│  │    [Names appear one by one]         │   │
│  └──────────────────────────────────────┘   │
│                                              │
│        Semoga sukses di masa depan! 🌟      │
│                                              │
└──────────────────────────────────────────────┘
```

---

**Phase 4: Class Progression - OSIS Kelas X** (3-5 seconds)

```
┌──────────────────────────────────────────────┐
│                                              │
│        OSIS - NAIK KELAS                     │
│                                              │
│        Kelas X menjadi Kelas XI              │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │                                      │   │
│  │  Fahry Aditya                        │   │
│  │  [ Kelas X ] → [ Kelas XI ]         │   │
│  │   ✓ Completed                        │   │
│  │                                      │   │
│  │  [Show 3-4 more names dengan animation]  │
│  │  [Last one belum selesai, animated]      │
│  │                                      │   │
│  │  Adi Pratama                         │   │
│  │  [ Kelas X ]  >  [ Kelas XI ]       │   │ ← animating
│  │   ⏳ Processing...                  │   │
│  │                                      │   │
│  │  [More to come...]                   │   │
│  │                                      │   │
│  └──────────────────────────────────────┘   │
│                                              │
│   Progress: 17 / 20                         │
│   ████████████░░░░░░ (progress bar)        │
│                                              │
└──────────────────────────────────────────────┘
```

**Animation Details**:
- Setiap student name slide in dari kiri
- Kelas badge:
  - Left side: "Kelas X" dengan biru color
  - Middle: Arrow atau animation symbol
  - Right side: "Kelas XI" dengan hijau color
- Dari X ke XI: Badge animates color change (biru → hijau)
- Dari X ke XI: Badge scale slightly untuk emphasis
- Checkbox atau checkmark muncul saat completed
- Progress bar at bottom menunjukkan overall progress
- Stagger animation setiap student

---

**Phase 5: Class Progression - MPK Kelas X** (3-5 seconds)

Same seperti Phase 4, tapi untuk MPK dan dengan different styling/colors.

---

**Phase 6: Success Completion Screen** (3-4 seconds)

```
┌──────────────────────────────────────────────┐
│                                              │
│                                              │
│          ✅ SELESAI!                        │
│                                              │
│    Semua siswa telah naik kelas             │
│                                              │
│   Statistik Perubahan:                      │
│   • 60 siswa naik kelas                     │
│   • 42 siswa purna tugas                    │
│                                              │
│   Total waktu: 35 detik                     │
│                                              │
│                                              │
│      [ 📊 Lihat Laporan Lengkap ]           │
│      [ 🏠 Kembali ke Dashboard ]            │
│                                              │
│                                              │
└──────────────────────────────────────────────┘
```

**Animation Details**:
- Checkmark dengan bounce animation
- Confetti effect (optional, subtle)
- Statistics fade in
- Buttons scale in saat final

---

**Technical Requirements for Animation Screen**:

```
- Full-screen modal/overlay (no background interaction)
- Auto-proceed through phases (atau manual Next button)
- Sound effects (optional, user can mute):
  - Swhoosh untuk transitions
  - Ding untuk completion
  - Celebratory music (subtle)
- Progress indicator (overall, not per phase)
- Can pause/resume (optional)
- Can skip to end (jika user impatient)
- Responsive design (mobile scaling)
```

---

### 📱 Screen 4: Class Progression History / Reports

**Location**: `/admin/class-progression-history` atau tab di school year page

**Layout**:
```
┌─────────────────────────────────────────────┐
│ 📋 Riwayat Naik Kelas                       │
├─────────────────────────────────────────────┤
│                                             │
│ Filter:                                     │
│ [Organization ▼] [School Year ▼] [Action ▼]
│ [Search Student Name...]                    │
│                                             │
├─────────────────────────────────────────────┤
│ Hasil: 102 entries                          │
│                                             │
│ ┌──────┬───────────┬──────┬──────┬────────┐ │
│ │NAMA  │ORG        │FROM  │TO    │DATE    │ │
│ ├──────┼───────────┼──────┼──────┼────────┤ │
│ │Fahry │OSIS       │X     │XI    │10/6/26 │ │
│ │Adi   │OSIS       │X     │XI    │10/6/26 │ │
│ │Budi  │MPK        │X     │XI    │10/6/26 │ │
│ │Siti  │English    │X     │XI    │10/6/26 │ │
│ │[...] │[...]      │[...] │[...] │[...]   │ │
│ │Roni  │OSIS       │XI    │XII   │10/6/26 │ │
│ │Tina  │OSIS       │XI    │XII   │10/6/26 │ │
│ │[...] │[...]      │[...] │[...] │[...]   │ │
│ │Ahmad │OSIS       │XII   │PURNA │10/6/26 │ │
│ │[...] │[...]      │[...] │[...] │[...]   │ │
│ └──────┴───────────┴──────┴──────┴────────┘ │
│                                             │
│ [ ⬇️ Export CSV ] [ 🖨️ Print ]             │
│                                             │
└─────────────────────────────────────────────┘
```

**Features**:
- Table dengan sorting (click column header)
- Filter by organization, school year, action type
- Search student name/email
- Export ke CSV
- Print-friendly layout
- Show actor/admin yang performed action (untuk audit)
- Show timestamp

---

### 📱 Screen 5: Undo/Rollback Confirmation (Optional)

**Location**: Accessible dalam 48 hours dari action

**Layout**:
```
┌──────────────────────────────────────────┐
│ ⚠️  UNDO Naik Kelas                      │
├──────────────────────────────────────────┤
│                                          │
│ Anda yakin ingin undo class progression? │
│ Semua perubahan akan dikembalikan        │
│ ke status sebelumnya.                    │
│                                          │
│ Tanggal Action: 10 Juni 2026, 14:30     │
│ Sisa waktu Undo: 45 jam 30 menit        │
│                                          │
│ PERUBAHAN YANG AKAN DIUNDO:              │
│  • 60 siswa → kembali ke kelas lama      │
│  • 42 siswa purna → kembali ke XII       │
│                                          │
│ ⚠️  Aksi ini TIDAK DAPAT DIUNDO          │
│    setelah selesai.                      │
│                                          │
│ [ Batal ]  [ ↩️  Undo Sekarang ]         │
│                                          │
└──────────────────────────────────────────┘
```

**Conditions untuk Show Undo**:
- Only show dalam 48 jam dari action
- Only show untuk Super Admin
- Hide jika sudah di-undo sebelumnya
- Grey out & disable setelah 48 jam
- Show countdown timer untuk sisa waktu

---

## Data Structure & Database Changes

### 📊 Table: `students` / `users` (Modify)

**New Columns**:
```
- class: ENUM ('X', 'XI', 'XII', 'ALUMNI')
  - Current: ENUM ('X', 'XI', 'XII')
  - New: Add 'ALUMNI' untuk purna tugas
  - OR use separate status field

- purna_tugas_status: BOOLEAN (optional)
  - TRUE = purna tugas (XII yang graduated)
  - FALSE = active student
  - Alternative: Use class='ALUMNI' instead

- graduation_date: TIMESTAMP (optional)
  - When student became purna tugas
  - Useful untuk history & reporting
```

**Option A (Recommended): Add `class` value**
```sql
ALTER TABLE students
ADD COLUMN class ENUM('X', 'XI', 'XII', 'ALUMNI') DEFAULT 'X';

-- Migrate existing:
UPDATE students SET class = 'ALUMNI' 
WHERE old_class = 'XII' AND graduation_date IS NOT NULL;
```

**Option B: Separate Status Field**
```sql
ALTER TABLE students
ADD COLUMN enrollment_status ENUM('ACTIVE', 'ALUMNI', 'INACTIVE') 
  DEFAULT 'ACTIVE';

-- Keep existing class field (X, XI, XII)
-- Use enrollment_status untuk track purna tugas
```

---

### 📊 Table: `class_progression_log` (New - Audit Trail)

**Purpose**: Track every class progression action untuk audit & rollback

**Columns**:
```
- id (PK)
- batch_id (UUID) - Group all students dari satu progression
- student_id (FK to students)
- organization_id (FK to organizations)
- old_class (VARCHAR: X, XI, XII)
- new_class (VARCHAR: X, XI, XII, ALUMNI)
- action (ENUM: 'PROMOTED', 'GRADUATED', 'REVERTED')
- executed_by (FK to admin_users)
- executed_at (TIMESTAMP)
- reverted_at (TIMESTAMP, nullable)
- revert_batch_id (UUID, nullable - if this record was reverted)
- notes (TEXT, optional)
- created_at (TIMESTAMP)
```

**Usage**:
- Every progression action logged here
- Can query by batch_id untuk group related changes
- Can use untuk revert/undo operations
- Audit trail untuk show who did what

---

### 📊 Table: `school_year_progression` (New - Track Operations)

**Purpose**: Track when class progression happens

**Columns**:
```
- id (PK)
- school_year_from (VARCHAR: "2025-2026")
- school_year_to (VARCHAR: "2026-2027")
- status (ENUM: 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'REVERTED')
- batch_id (UUID) - Reference ke class_progression_log
- total_students_promoted (INT)
- total_students_graduated (INT)
- executed_by (FK to admin_users)
- executed_at (TIMESTAMP)
- reverted_at (TIMESTAMP, nullable)
- reverted_by (FK to admin_users, nullable)
- notes (TEXT)
- created_at (TIMESTAMP)
```

**Usage**:
- Track when progression happened
- Reference point untuk revert
- Can mark as REVERTED
- Show history di reports

---

### 📊 Index Requirements

```sql
-- For fast querying
CREATE INDEX idx_students_class ON students(class);
CREATE INDEX idx_students_school_year ON students(school_year);
CREATE INDEX idx_progression_log_batch ON class_progression_log(batch_id);
CREATE INDEX idx_progression_log_student ON class_progression_log(student_id);
CREATE INDEX idx_progression_log_org ON class_progression_log(organization_id);
CREATE INDEX idx_progression_log_executed_at ON class_progression_log(executed_at);
```

---

## Business Rules & Validation

### ✅ Rule 1: Class Progression Mapping

**Rule**:
```
WHEN Admin clicks "Naik Kelas" AND confirms action
THEN:
  FOR EACH student WHERE enrollment_status = "ACTIVE":
    IF class = 'X':
      SET class = 'XI'
      INSERT into class_progression_log: old='X', new='XI', action='PROMOTED'
    
    ELSE IF class = 'XI':
      SET class = 'XII'
      INSERT into class_progression_log: old='XI', new='XII', action='PROMOTED'
    
    ELSE IF class = 'XII':
      SET class = 'ALUMNI'
      SET enrollment_status = 'ALUMNI' (if using separate field)
      SET graduation_date = NOW()
      INSERT into class_progression_log: old='XII', new='ALUMNI', action='GRADUATED'
    
    ELSE IF class = 'ALUMNI':
      SKIP (no change)
```

**Implementation Point**: Di class progression API handler

---

### ✅ Rule 2: Organization Segregation

**Rule**:
```
WHEN Processing class progression
THEN:
  Process OSIS students separately
  Process MPK students separately
  Process English Club students separately
  Process Programming Club students separately
  
  BUT dalam single transaction (atomic operation)
  
  IF any organization fails:
    ROLLBACK semua changes untuk all organizations
    SHOW error message
```

**Rationale**: Jika salah satu org error, jangan partial update

---

### ✅ Rule 3: Visibility Rules untuk Purna Tugas

**Rule**:
```
WHEN Displaying member lists
THEN:
  IF class = 'ALUMNI' OR enrollment_status = 'ALUMNI':
    HIDE dari normal member list
    SHOW ONLY dalam:
      - Purna tugas list (admin view)
      - History/archive (if user search)
      - Reports
  
  WHEN Public/Student views member list:
    NEVER show alumni students
    ONLY show ACTIVE students (X, XI, XII)
  
  WHEN Admin views member list:
    SHOW all students
    WITH filter: "Include Alumni" toggle
```

---

### ✅ Rule 4: No Double Progression

**Rule**:
```
WHEN Admin clicks "Naik Kelas"
THEN:
  Query: SELECT * FROM school_year_progression 
         WHERE status IN ('PENDING', 'IN_PROGRESS')
  
  IF results exist:
    SHOW error: "Class progression sudah berjalan atau pending"
    DO NOT allow duplicate action
  
  PREVENT: Multiple simultaneous progression operations
```

**Implementation**: Advisory lock di database atau flag

---

### ✅ Rule 5: Rollback Window

**Rule**:
```
WHEN Progression completed
THEN:
  Set time window: 48 hours dari execution time
  
  DURING 48 hours:
    Admin dapat click "Undo" button
    System revert semua changes
    Create new log entry: action='REVERTED'
    Set school_year_progression.status = 'REVERTED'
  
  AFTER 48 hours:
    "Undo" button disabled
    Show message: "Rollback window closed"
    PREVENT: Undo operation
```

**Rationale**: Prevent accidental reverts, but allow quick fixes

---

### ✅ Rule 6: Audit Logging

**Rule**:
```
EVERY action logged dengan:
  - WHO did it (admin user ID)
  - WHEN (timestamp)
  - WHAT changed (old vs new values)
  - WHY (optional notes)
  - HOW MANY students affected
  - BATCH ID (group all students dari satu progression)

Immutable log:
  - Cannot delete log entries
  - Only append new entries
  - Encryption recommended untuk sensitive data
```

---

### ✅ Rule 7: Data Validation Before Progression

**Rule**:
```
BEFORE executing class progression:
  1. Check: No students dengan invalid class values
  2. Check: No students dengan NULL class
  3. Check: All students have organization_id
  4. Check: No duplicate student records
  5. Check: Database integrity constraints
  
  IF validation fails:
    SHOW detailed error message
    PREVENT progression
    Suggest manual data cleanup
```

---

## Animation & Transitions

### 🎬 Animation Specifications

#### Animation 1: Welcome Screen Fade-In

**Element**: "Selamat Datang Tahun Ajaran 2026-2027" text

**Specifications**:
```
Duration: 2.5 seconds
Easing: ease-in-out
Keyframes:
  0%:
    opacity: 0
    transform: scale(0.8) translateY(20px)
  50%:
    opacity: 1
  100%:
    opacity: 1
    transform: scale(1) translateY(0)

Background:
  Background Color: Animated gradient
    From: #001a4d (deep blue)
    To: #4d1a7f (purple)
  Animation: 20 seconds, infinite
  Direction: Subtle slow shift
```

**Framework**: Tailwind CSS animations + custom keyframes

---

#### Animation 2: List Items Staggered Slide-In

**Element**: Names dalam purna tugas list

**Specifications**:
```
Duration: 300ms per item
Easing: ease-out
Stagger Delay: 100ms between items

Keyframes:
  0%:
    opacity: 0
    transform: translateX(-30px)
  100%:
    opacity: 1
    transform: translateX(0)

Implementation:
  nth-child(1) { animation-delay: 0ms }
  nth-child(2) { animation-delay: 100ms }
  nth-child(3) { animation-delay: 200ms }
  ... etc
```

---

#### Animation 3: Class Badge Color Transition

**Element**: Badge menunjukkan kelas (X → XI → XII)

**Specifications**:
```
Duration: 800ms
Easing: ease-in-out

Color Change:
  X: #3B82F6 (blue)
  XI: #10B981 (green)
  XII: #F59E0B (amber)

Keyframes:
  0%:
    backgroundColor: #3B82F6 (from)
    transform: scale(1)
  50%:
    transform: scale(1.1) (emphasis)
  100%:
    backgroundColor: #10B981 (to)
    transform: scale(1)
```

---

#### Animation 4: Progress Bar Smooth Increment

**Element**: Progress bar showing students processed

**Specifications**:
```
Duration: 500ms per student
Easing: ease-out

Keyframes:
  0%:
    width: {old_value}%
  100%:
    width: {new_value}%

Animation:
  Increment step by step (smooth, not instant)
  Show count: "17 / 20"
  Count increments dengan progress

Optional: Pulse effect saat processing
```

---

#### Animation 5: Checkmark Bounce

**Element**: ✓ checkmark saat student completed

**Specifications**:
```
Duration: 600ms
Easing: cubic-bezier(0.34, 1.56, 0.64, 1) [bounce]

Keyframes:
  0%:
    opacity: 0
    transform: scale(0) rotate(-45deg)
  100%:
    opacity: 1
    transform: scale(1) rotate(0deg)
```

---

#### Animation 6: Confetti (Optional)

**Element**: Celebratory confetti pada completion

**Specifications**:
```
Duration: 3 seconds
Timing: Start saat success screen appears

Details:
  - 50-100 confetti pieces
  - Random colors (school colors preferred)
  - Fall dari top to bottom
  - Random horizontal movement
  - Fade out saat reach bottom
  - Optional: Can be disabled by user preference
```

---

### 📱 Mobile Animation Adjustments

For mobile devices (< 768px):
```
- Reduce animation duration by 30% (faster)
- Reduce stagger delay to 50ms (less wait)
- Simplify confetti (reduce particle count)
- Ensure animations don't block interaction
- Use `prefers-reduced-motion` untuk accessibility
```

---

### 🔊 Sound Effects (Optional)

**Background Music**:
- Soft, celebratory music (2-3 minutes)
- Subtle, not distracting
- Can be muted (default: muted)
- Play during entire ceremony screen

**Sound Effects**:
- Swoosh sound para transitions (100ms)
- Ding sound untuk completion (100ms)
- Pop sound untuk checkmarks (optional)
- All at low volume, user can adjust

**Accessibility**:
- All sounds optional, visual feedback sufficient
- Captions/subtitle untuk important messages
- High contrast untuk animations

---

## State Management & Logic Flow

### 🔄 State Machine: Class Progression Operation

```
                    ┌─────────────────────────┐
                    │   INITIAL STATE         │
                    │  (Dashboard View)       │
                    └────────────┬────────────┘
                                 │
                    Click "Naik Kelas" button
                                 │
                    ┌────────────▼────────────┐
                    │ SHOWING CONFIRMATION    │
                    │ Dialog displayed        │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                        │
           Click Cancel        Click Continue
                    │                        │
      ┌─────────────▼────────────┐           │
      │ CONFIRMED CANCEL        │           │
      │ Dialog closes           │           │
      │ Back to dashboard       │           │
      └─────────────────────────┘           │
                                            │
                                 ┌──────────▼──────────┐
                                 │ PROCESSING_START    │
                                 │ Disable UI          │
                                 │ Start animation     │
                                 │ API call            │
                                 └──────────┬──────────┘
                                            │
                          ┌─────────────────┴─────────────────┐
                          │                                   │
                          │                                   │
                    Success Response                  Error Response
                          │                                   │
              ┌────────────▼────────────┐        ┌──────────▼──────────┐
              │ PROCESSING_SUCCESS      │        │ PROCESSING_ERROR    │
              │ Show ceremony animation │        │ Show error dialog   │
              │ Animate graduation      │        │ Offer retry         │
              │ Animate class upgrades  │        │ Back to dashboard   │
              └────────────┬────────────┘        └────────────────────┘
                          │
                          │
              ┌────────────▼────────────┐
              │ COMPLETED              │
              │ Show success screen     │
              │ Show report button      │
              │ Show back button        │
              └────────────┬────────────┘
                          │
                    User clicks button
                          │
      ┌───────────────────┴────────────────────┐
      │                                        │
   "Lihat Laporan"                "Back to Dashboard"
      │                                        │
      │                                ┌──────▼─────────┐
      │                                │ BACK_TO_HOME   │
      │                                │ Return to main │
      │                                │ Dashboard      │
      │                                └────────────────┘
      │
      └──────────────────┐
                        │
            ┌───────────▼───────────┐
            │ VIEWING_REPORT        │
            │ Show progression      │
            │ history table         │
            │ Filter & export       │
            └───────────────────────┘
```

---

### 💾 Data Flow: Class Progression Execution

```
Step 1: User Confirmation
  Admin Dashboard
    ↓
  Click "Naik Kelas"
    ↓
  Show Confirmation Dialog
    ↓
  Click "Lanjutkan"
    ↓
  Send API Request

Step 2: Backend Processing
  POST /api/admin/class-progression/start
    ↓
  Validate Authorization (Super Admin only)
    ↓
  Check: No other progression in progress
    ↓
  Create school_year_progression record (status='IN_PROGRESS')
    ↓
  Generate batch_id (UUID)
    ↓
  FOR EACH organization:
    Query active students (enrollment_status != 'ALUMNI')
    Process class progression:
      X → XI, XI → XII, XII → ALUMNI
    Insert into class_progression_log (batch_id)
    Update students table
    ↓
  Update school_year_progression (status='COMPLETED')
    ↓
  Return success response dengan statistics

Step 3: Frontend Animation
  Receive success response
    ↓
  Show full-screen ceremony overlay
    ↓
  Phase 1: Welcome screen
    ↓
  Phase 2: Purna tugas OSIS animation
    ↓
  Phase 3: Purna tugas MPK animation
    ↓
  Phase 4: Class progression OSIS X
    ↓
  Phase 5: Class progression MPK X
    ↓
  Phase 6: Success screen
    ↓
  User can view report or return
    ↓
  After ceremony, data in database is already updated

Step 4: Confirmation
  Update dashboard
    ↓
  Show "Class progression completed"
  Disable "Naik Kelas" button
  Enable "Undo" button (48 hours)
    ↓
  Admin dapat go to reports untuk verify
```

---

### 🔄 Data Flow: Undo/Rollback Operation

```
Step 1: User Initiates Undo
  Admin Dashboard
    ↓
  Click "↩️  Undo" button (if within 48 hours)
    ↓
  Show Undo Confirmation
    ↓
  Click "Undo Sekarang"
    ↓
  Send API Request

Step 2: Backend Rollback
  POST /api/admin/class-progression/undo/{batch_id}
    ↓
  Validate: batch exists & within 48 hour window
    ↓
  Query class_progression_log WHERE batch_id = {id}
    ↓
  FOR EACH log entry:
    Revert student class:
      IF old_class='X': SET class='X'
      IF old_class='XI': SET class='XI'
      IF old_class='XII': SET class='XII' atau enrollment_status='ACTIVE'
    Update student record
    Insert new log entry: action='REVERTED', revert_batch_id={new_batch}
    ↓
  Update school_year_progression: status='REVERTED'
    ↓
  Return success response

Step 3: Frontend Feedback
  Receive success response
    ↓
  Show toast: "✅ Undo successful"
    ↓
  Refresh page / reload data
    ↓
  "Naik Kelas" button enabled again
    ↓
  "Undo" button disabled
    ↓
  Update statistics display
```

---

## Admin Controls & Safety Measures

### 🔒 Safety Measure 1: Role-Based Access

**Rule**:
```
Tahun Ajaran Baru page ONLY accessible by:
  - Super Admin role = FULL access to "Naik Kelas" button
  - Organization Admin = READ-ONLY (view stats, history)
  - Teachers/Staff = NO access (403 Forbidden)
  - Students = NO access (403 Forbidden)

Implementation:
  - Check role middleware di backend
  - Hide button di frontend jika not Super Admin
  - Validate role di API endpoint
```

---

### 🔒 Safety Measure 2: Confirmation Dialog

**Rule**:
```
BEFORE executing class progression:
  1. Show detailed confirmation dialog
  2. Display exact numbers yang akan berubah
  3. List all organizations affected
  4. Show reversal window (48 hours)
  5. Require explicit click to proceed
  6. No keyboard shortcuts, must use button
```

---

### 🔒 Safety Measure 3: Time Window untuk Undo

**Rule**:
```
After class progression:
  - 48 hour window untuk undo
  - Show countdown timer (hours remaining)
  - Auto-close undo option setelah 48 hours
  - Cannot re-undo after undo (one-way operation)
  - Show warning: "This is your last chance"
```

---

### 🔒 Safety Measure 4: Atomic Transactions

**Rule**:
```
Class progression MUST be atomic:
  - All students updated or none
  - All organizations processed together
  - If any part fails: ROLLBACK everything
  - No partial updates allowed
  
Database transaction:
  BEGIN TRANSACTION
    Update students
    Insert logs
    Update school_year record
  COMMIT (all or nothing)
```

---

### 🔒 Safety Measure 5: Duplicate Operation Prevention

**Rule**:
```
PREVENT multiple simultaneous progressions:
  - Check: No other progression in IN_PROGRESS status
  - Lock: Use advisory lock durante operation
  - Flag: Disable "Naik Kelas" button saat processing
  - Status: Show "Processing..." state
  
If concurrent request attempted:
  - Return error: "Operation already in progress"
  - Show estimated completion time
```

---

### 🔒 Safety Measure 6: Complete Audit Trail

**Rule**:
```
EVERY change logged immutably:
  - Who: admin_id from session
  - When: Timestamp (server time, not client)
  - What: Old value → New value
  - Why: Optional notes field
  - How: API endpoint called
  - Batch: Group all changes dari satu progression
  
Cannot be deleted:
  - Logs are append-only
  - Can query history forever
  - Useful untuk audits & compliance
```

---

### 🔒 Safety Measure 7: Pre-Flight Validation

**Rule**:
```
BEFORE showing confirmation dialog:
  1. Validate data integrity
     - No NULL class values
     - No invalid organization IDs
     - No duplicate student records
  2. Check permissions (super admin)
  3. Check: No active progression
  4. Check: All required fields present
  
  IF any validation fails:
    - Show friendly error message
    - Suggest remediation steps
    - Prevent progression
    - Log validation error
```

---

## Reporting & Archive

### 📊 Report 1: Class Progression History

**Location**: `/admin/class-progression-history` 

**Columns**:
- Student Name
- Organization
- Class From → To
- Date Processed
- Admin Who Did It
- Status (Success / Reverted)

**Filters**:
- Organization
- School Year
- Date Range
- Action Type (Promoted / Graduated / Reverted)

**Export Options**:
- CSV
- PDF
- Excel

---

### 📊 Report 2: Alumni/Purna Tugas Archive

**Location**: `/admin/purna-tugas-archive`

**Display**:
- All students dengan class='ALUMNI'
- Grouped by organization
- Show graduation date
- Show previous posisi dalam org
- Show achievements (optional)

**Use Cases**:
- Celebrate alumni achievements
- Contact alumni untuk reunions
- Track organization history
- Report untuk annual review

---

### 📊 Report 3: Progression Statistics

**Location**: Dashboard widget atau `/admin/progression-stats`

**Metrics**:
- Total students per organization
- Breakdown by class (X, XI, XII, Alumni)
- Graduation rate
- Average time-in-class
- Retention statistics

---

## Testing Scenarios

### ✅ Test 1: Basic Class Progression

**Scenario**: Simple progression dengan students dari 1 org

**Setup**:
- 20 students dalam OSIS
- 10 Kelas X, 5 XI, 5 XII
- All dengan status ACTIVE

**Steps**:
1. Admin navigate ke "Tahun Ajaran Baru"
2. Check statistics: Shows correct numbers
3. Click "Naik Kelas"
4. Confirm dialog shows
5. Click "Lanjutkan"
6. Ceremony animation plays
7. Animation shows X→XI transition
8. Success screen appears

**Verification**:
- [ ] Database: All students updated
  - 10 X menjadi XI
  - 5 XI menjadi XII
  - 5 XII menjadi ALUMNI
- [ ] Logs created untuk all 20 students
- [ ] school_year_progression status = COMPLETED
- [ ] History page shows all changes

---

### ✅ Test 2: Multiple Organization Progression

**Scenario**: Progression dengan OSIS, MPK, English, Programming

**Setup**:
- OSIS: 50 students (20 X, 20 XI, 10 XII)
- MPK: 45 students (18 X, 18 XI, 9 XII)
- English: 35 students (12 X, 15 XI, 8 XII)
- Programming: 28 students (10 X, 12 XI, 6 XII)
- Total: 158 students

**Steps**:
1-7. Same seperti Test 1

**Verification**:
- [ ] All 158 students processed
- [ ] Correct mapping per organization
- [ ] Animation shows OSIS & MPK purna
- [ ] Animation shows X→XI untuk both orgs
- [ ] All logs created (158 entries)
- [ ] school_year_progression shows total counts

---

### ✅ Test 3: Undo Within 48 Hours

**Scenario**: Admin realizes mistake & undo within window

**Setup**:
- Class progression just completed
- Within 48 hour window

**Steps**:
1. Admin see class progression completed
2. Admin click "Undo" button
3. Undo confirmation dialog shows
4. Click "Undo Sekarang"
5. Processing animation
6. Success: "Undo complete"

**Verification**:
- [ ] All students reverted to old class
- [ ] New log entries created (action='REVERTED')
- [ ] school_year_progression status = 'REVERTED'
- [ ] Dashboard shows "Not yet progressed"
- [ ] "Naik Kelas" button enabled again

---

### ✅ Test 4: Undo After 48 Hours (Disabled)

**Scenario**: Try to undo AFTER 48 hour window closed

**Setup**:
- Class progression done > 48 hours ago
- Try to undo

**Steps**:
1. Admin open dashboard
2. Look for "Undo" button

**Verification**:
- [ ] "Undo" button NOT visible atau disabled
- [ ] Show message: "Rollback window closed (48 hours)"
- [ ] Cannot click/interact dengan button
- [ ] No API call made if somehow button clicked

---

### ✅ Test 5: Prevent Duplicate Progression

**Scenario**: Try to initiate 2 progressions simultaneously

**Setup**:
- First progression in progress
- Second admin tries to start another

**Steps**:
1. Admin A clicks "Naik Kelas" & confirms
2. While processing, Admin B also clicks "Naik Kelas"
3. Admin B sees confirmation dialog
4. Admin B clicks "Lanjutkan"

**Verification**:
- [ ] Admin B receives error: "Progression already in progress"
- [ ] Second operation does NOT execute
- [ ] Database shows only 1 progression in progress
- [ ] No partial updates

---

### ✅ Test 6: Invalid Data Prevention

**Scenario**: Database has corrupted/invalid data

**Setup**:
- Some students dengan NULL class
- Some dengan invalid org_id

**Steps**:
1. Admin opens "Tahun Ajaran Baru"
2. Click "Naik Kelas"

**Verification**:
- [ ] Pre-flight validation catches errors
- [ ] Dialog shows: "Data integrity check failed"
- [ ] Lists which students have issues
- [ ] Progression does NOT start
- [ ] Admin directed to fix data manually

---

### ✅ Test 7: Animation Responsiveness

**Scenario**: Test animations pada different devices

**Setup**:
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)
- Slow network (throttled)

**Steps**:
1. Complete class progression
2. Watch ceremony animation on each device
3. Try to interact with page durante animation

**Verification**:
- [ ] Animations smooth pada all devices (60fps)
- [ ] Text readable pada all screen sizes
- [ ] Buttons disabled durante animation (no clicks)
- [ ] Can skip animation jika impatient (optional)
- [ ] Mobile animations faster (reduced stagger)
- [ ] Fallback jika animations not supported

---

### ✅ Test 8: Permission & Security

**Scenario**: Non-admin tries to access page

**Setup**:
- Login as Teacher / Student
- Try to navigate to school year page

**Steps**:
1. Try direct URL: `/admin/school-year-management`
2. Try to call API endpoint directly

**Verification**:
- [ ] Frontend: Page not accessible, redirect atau 403
- [ ] Backend: 403 Forbidden response
- [ ] No button/link visible untuk non-super-admin
- [ ] No data leak dalam error messages
- [ ] Log recorded untuk unauthorized access attempt

---

## Implementation Roadmap

### 📅 Phase 1: Planning & Design (1 week)

**Tasks**:
- [ ] Finalize database schema
- [ ] Create detailed UI mockups
- [ ] Plan animation sequences (storyboard)
- [ ] Define API contracts
- [ ] Security threat analysis
- [ ] Get stakeholder approval

**Deliverables**:
- Database schema document
- UI wireframes & mockups
- Animation specifications
- API documentation
- Security checklist

---

### 📅 Phase 2: Backend Development (2 weeks)

**Tasks**:
- [ ] Database migrations
- [ ] Create API endpoints:
  - POST /api/admin/class-progression/start
  - POST /api/admin/class-progression/undo/{batch_id}
  - GET /api/admin/class-progression/history
  - GET /api/admin/class-progression/stats
- [ ] Implement class progression logic
- [ ] Implement undo/rollback logic
- [ ] Audit logging system
- [ ] Validation & error handling
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests

**Deliverables**:
- API endpoints (tested)
- Database migrations (tested)
- Audit logs (working)
- Documentation (API specs)

---

### 📅 Phase 3: Frontend Development (2 weeks)

**Tasks**:
- [ ] Main dashboard page
- [ ] Confirmation dialog component
- [ ] Full-screen ceremony animation component
- [ ] History/reports page
- [ ] Integration dengan API
- [ ] Error handling & edge cases
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Component tests
- [ ] E2E tests

**Deliverables**:
- Pages (responsive)
- Components (tested)
- Animations (smooth)
- Error handling (graceful)

---

### 📅 Phase 4: Integration & Testing (1.5 weeks)

**Tasks**:
- [ ] End-to-end testing
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile device testing (iOS, Android)
- [ ] Performance testing (large datasets)
- [ ] Accessibility testing (WCAG)
- [ ] Security testing (penetration)
- [ ] UAT dengan stakeholders

**Deliverables**:
- Test reports
- Bug list & fixes
- Performance metrics
- UAT sign-off

---

### 📅 Phase 5: Deployment & Monitoring (1 week)

**Tasks**:
- [ ] Database backup
- [ ] Run migrations on production
- [ ] Deploy new code
- [ ] Smoke testing
- [ ] Monitor for errors
- [ ] Prepare rollback plan
- [ ] Train admins

**Deliverables**:
- Deployment checklist
- Monitoring setup
- Admin training materials
- Rollback procedure

---

### 📅 Total Estimated Time: 4-5 weeks

**With**: 2-3 developers (1 backend, 1-2 frontend)

---

## Summary & Key Takeaways

### ✅ What This Feature Accomplishes

✅ **Automation**: Zero manual class updates  
✅ **Efficiency**: One-click progression untuk 100+ students  
✅ **Celebration**: Engaging ceremony animations  
✅ **Transparency**: Full audit trail & history  
✅ **Safety**: Rollback capability within 48 hours  
✅ **Organization**: Proper segregation (OSIS, MPK, etc.)  

### 🎯 Key Features

1. **Dashboard Page** - View all orgs, stats, graduating students
2. **One-Click Progression** - Naik kelas untuk all students
3. **Ceremony Animation** - Celebratory full-screen experience
4. **Purna Tugas Handling** - XII → Alumni dengan proper status
5. **Undo/Rollback** - Revert mistakes within 48 hours
6. **Audit Logging** - Complete history untuk compliance
7. **Reporting** - History, statistics, exports

### 📋 Implementation Checklist

**Planning**:
- [ ] Finalize all specifications dengan team
- [ ] Database design approved
- [ ] UI/UX mockups approved
- [ ] Timeline & resources allocated

**Development**:
- [ ] Database schema created & indexed
- [ ] API endpoints implemented & tested
- [ ] Frontend pages developed & tested
- [ ] Integration completed & tested
- [ ] All tests passing (unit, integration, E2E)

**Deployment**:
- [ ] Database migrations tested on staging
- [ ] Code reviewed & approved
- [ ] Security checklist completed
- [ ] Monitoring setup
- [ ] Admin training done
- [ ] Go-live plan prepared

---

**Estimated Cost**: ~200-250 development hours  
**Estimated Timeline**: 4-5 weeks  
**Risk Level**: MEDIUM (data-critical, needs careful testing)  
**Impact**: HIGH (improves admin efficiency & user engagement)

---

**Last Updated**: 10 Juni 2026  
**Status**: Ready untuk Development  
**Next Steps**: Team review & approval, start Phase 1 (Planning & Design)