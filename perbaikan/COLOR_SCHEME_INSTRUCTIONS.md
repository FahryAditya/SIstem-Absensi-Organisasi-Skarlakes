# Panduan Color Scheme Website Sistem Manajemen Ekskul

## Daftar Warna Utama

| Elemen | Warna | Hex Code | Penggunaan |
|--------|-------|----------|-----------|
| UI Utama | Deep Navy | #001F3F | Background utama, navbar, header |
| Semua Button | Persian Blue | #1E90FF | Button di seluruh aplikasi |
| Unit OSIS | Palatinate Blue | #3D3DB8 | Section OSIS, badge OSIS, accent OSIS |
| Unit MPK | Classic Crimson | #DC143C | Section MPK, badge MPK, accent MPK |
| Unit English Club | Sapphire | #0F52BA | Section English Club, badge English Club, accent English Club |
| Unit Programming | Golden Amber | #FFB81C | Section Programming, badge Programming, accent Programming |

---

## Aturan Penerapan Warna

### 1. UI Utama (Deep Navy - #001F3F)

**Digunakan untuk:**
- Background halaman utama
- Navigation bar (navbar)
- Header aplikasi
- Footer aplikasi
- Sidebar (jika ada)
- Warna dominan di semua halaman

**Tidak boleh menggunakan warna lain** untuk elemen-elemen utama ini.

---

### 2. Button (Persian Blue - #1E90FF)

**Aturan Ketat:**
- SEMUA button harus menggunakan warna Persian Blue (#1E90FF)
- Ini berlaku untuk:
  - Button primary (submit, save, confirm)
  - Button secondary (cancel, close)
  - Button action (edit, delete, view)
  - Button navigation
  - Button di modal, form, card, dll

**Varian Button yang Diperbolehkan:**
- Normal state: Persian Blue solid (#1E90FF)
- Hover state: Persian Blue lebih gelap (bisa menggunakan opacity atau shade lebih gelap)
- Active/Pressed state: Persian Blue lebih gelap
- Disabled state: Persian Blue dengan opacity lebih rendah atau gray

**Larangan:**
- Jangan gunakan warna unit (OSIS, MPK, English Club, Programming) untuk button
- Jangan gunakan warna Deep Navy untuk button
- Jangan mix warna button - konsisten Persian Blue di semua tempat

---

### 3. Unit OSIS (Palatinate Blue - #3D3DB8)

**Digunakan HANYA untuk:**
- Halaman/section OSIS
- Card OSIS
- Badge dengan label "OSIS"
- Accent color di section OSIS
- Icon/indicator OSIS
- Header sub-section OSIS

**Tidak boleh digunakan untuk:**
- Button (gunakan Persian Blue)
- Main UI background (gunakan Deep Navy)
- Unit lain (MPK, English Club, Programming)

**Konteks Penempatan:**
- Jika ada list unit, baris/card OSIS harus identifiable dengan warna Palatinate Blue
- Tab atau menu OSIS harus menggunakan Palatinate Blue saat active
- Chart/graph data OSIS harus menggunakan Palatinate Blue

---

### 4. Unit MPK (Classic Crimson - #DC143C)

**Digunakan HANYA untuk:**
- Halaman/section MPK
- Card MPK
- Badge dengan label "MPK"
- Accent color di section MPK
- Icon/indicator MPK
- Header sub-section MPK

**Tidak boleh digunakan untuk:**
- Button (gunakan Persian Blue)
- Main UI background (gunakan Deep Navy)
- Unit lain (OSIS, English Club, Programming)

**Konteks Penempatan:**
- Jika ada list unit, baris/card MPK harus identifiable dengan warna Classic Crimson
- Tab atau menu MPK harus menggunakan Classic Crimson saat active
- Chart/graph data MPK harus menggunakan Classic Crimson

---

### 5. Unit English Club (Sapphire - #0F52BA)

**Digunakan HANYA untuk:**
- Halaman/section English Club
- Card English Club
- Badge dengan label "English Club"
- Accent color di section English Club
- Icon/indicator English Club
- Header sub-section English Club

**Tidak boleh digunakan untuk:**
- Button (gunakan Persian Blue)
- Main UI background (gunakan Deep Navy)
- Unit lain (OSIS, MPK, Programming)

**Konteks Penempatan:**
- Jika ada list unit, baris/card English Club harus identifiable dengan warna Sapphire
- Tab atau menu English Club harus menggunakan Sapphire saat active
- Chart/graph data English Club harus menggunakan Sapphire

---

### 6. Unit Programming (Golden Amber - #FFB81C)

**Digunakan HANYA untuk:**
- Halaman/section Programming
- Card Programming
- Badge dengan label "Programming"
- Accent color di section Programming
- Icon/indicator Programming
- Header sub-section Programming

**Tidak boleh digunakan untuk:**
- Button (gunakan Persian Blue)
- Main UI background (gunakan Deep Navy)
- Unit lain (OSIS, MPK, English Club)

**Konteks Penempatan:**
- Jika ada list unit, baris/card Programming harus identifiable dengan warna Golden Amber
- Tab atau menu Programming harus menggunakan Golden Amber saat active
- Chart/graph data Programming harus menggunakan Golden Amber

---

## Skenario Penggunaan Warna

### Skenario 1: Halaman Dashboard Utama
- Background: Deep Navy (#001F3F)
- Navbar: Deep Navy (#001F3F)
- Button di dashboard: Persian Blue (#1E90FF)
- Card/section OSIS: Palatinate Blue (#3D3DB8) untuk accent atau border
- Card/section MPK: Classic Crimson (#DC143C) untuk accent atau border
- Card/section English Club: Sapphire (#0F52BA) untuk accent atau border
- Card/section Programming: Golden Amber (#FFB81C) untuk accent atau border
- Text: White atau light gray (readable di atas Deep Navy)

### Skenario 2: Halaman Detail Unit (Misal: OSIS)
- Background: Deep Navy (#001F3F) (tetap konsisten)
- Header/Section title: Palatinate Blue (#3D3DB8)
- Button: Persian Blue (#1E90FF)
- Tab/Menu active: Palatinate Blue (#3D3DB8)
- Badge/Label: Palatinate Blue (#3D3DB8)
- Text: White atau light gray

### Skenario 3: Modal/Dialog Box
- Background modal: Light gray atau white (untuk contrast)
- Header modal: Deep Navy (#001F3F) atau warna unit (jika modal unit-specific)
- Button di modal: Persian Blue (#1E90FF)
- Border modal: Deep Navy (#001F3F) atau warna unit

### Skenario 4: Form Input
- Background form: Transparent atau light gray
- Border input: Deep Navy (#001F3F) atau light gray
- Focus state: Persian Blue (#1E90FF)
- Button submit: Persian Blue (#1E90FF)
- Label: White atau dark text (tergantung background)

### Skenario 5: Navigation/Tab
- Active tab: Warna unit yang sesuai (OSIS=Palatinate, MPK=Crimson, dll)
- Inactive tab: Gray atau Deep Navy dengan opacity
- Button di navigation: Persian Blue (#1E90FF)

### Skenario 6: List/Table Unit
| Unit | Warna Identifier |
|------|------------------|
| OSIS | Palatinate Blue (#3D3DB8) - border kiri atau background row |
| MPK | Classic Crimson (#DC143C) - border kiri atau background row |
| English Club | Sapphire (#0F52BA) - border kiri atau background row |
| Programming | Golden Amber (#FFB81C) - border kiri atau background row |

---

## Checklist Implementasi

Sebelum push ke repository, pastikan sudah check semua ini:

- [ ] **Deep Navy (#001F3F)** digunakan di navbar, header, background utama
- [ ] **Persian Blue (#1E90FF)** digunakan di SEMUA button (tanpa terkecuali)
- [ ] **Palatinate Blue (#3D3DB8)** HANYA muncul di section/halaman OSIS
- [ ] **Classic Crimson (#DC143C)** HANYA muncul di section/halaman MPK
- [ ] **Sapphire (#0F52BA)** HANYA muncul di section/halaman English Club
- [ ] **Golden Amber (#FFB81C)** HANYA muncul di section/halaman Programming
- [ ] Tidak ada warna unit yang digunakan untuk button
- [ ] Tidak ada warna lain yang digunakan untuk button (hanya Persian Blue)
- [ ] Warna-warna unit tidak tercampur dalam satu section (OSIS section tidak boleh ada warna MPK/English/Programming)
- [ ] Contrast text vs background terjaga (readable)
- [ ] Hover state dan active state terdefinisi dengan baik untuk setiap elemen

---

## Reference Hex Codes (Copy-Paste)

```
Deep Navy:       #001F3F
Persian Blue:    #1E90FF
Palatinate Blue: #3D3DB8
Classic Crimson: #DC143C
Sapphire:        #0F52BA
Golden Amber:    #FFB81C
```

---

## Notes untuk Developer

1. **Konsistensi adalah kunci** - Jika sudah implement warna unit di satu tempat, jangan berubah-ubah
2. **Dark Mode Consideration** - Jika ada dark mode, pastikan warna tetap readable dan consistent
3. **Accessibility** - Pastikan contrast ratio text vs background sudah cukup (WCAG AA minimum)
4. **Branding** - Warna-warna ini adalah identitas aplikasi, jangan tambah warna arbitrer
5. **Component Library** - Jika pakai CSS framework (Tailwind, Bootstrap), extend config dengan warna custom ini

---

## Template CSS Variable (Jika Menggunakan CSS Variables)

```css
:root {
  --color-ui-primary: #001F3F;        /* Deep Navy */
  --color-button: #1E90FF;            /* Persian Blue */
  --color-unit-osis: #3D3DB8;         /* Palatinate Blue */
  --color-unit-mpk: #DC143C;          /* Classic Crimson */
  --color-unit-english: #0F52BA;      /* Sapphire */
  --color-unit-programming: #FFB81C;  /* Golden Amber */
}
```

---

## Panduan Komunikasi ke Codex

**Ketika briefing ke Codex untuk implementation, gunakan template ini:**

> "Implementasikan warna sesuai color scheme berikut:
> - UI Utama: Deep Navy (#001F3F) untuk navbar, header, background
> - Button: Persian Blue (#1E90FF) untuk SEMUA button tanpa terkecuali
> - Unit OSIS: Palatinate Blue (#3D3DB8) - HANYA di section OSIS
> - Unit MPK: Classic Crimson (#DC143C) - HANYA di section MPK
> - Unit English Club: Sapphire (#0F52BA) - HANYA di section English Club
> - Unit Programming: Golden Amber (#FFB81C) - HANYA di section Programming
> 
> Pastikan warna unit tidak digunakan untuk button, dan button hanya menggunakan Persian Blue di semua tempat."
