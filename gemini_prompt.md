# 🎨 PROMPT UNTUK GEMINI AI - UPDATE UI/UX

## KONTEKS PROYEK
- **Website:** Sistem Ekstrakulikuler (SMK Airlangga Balikpapan)
- **Current Tech Stack:** Next.js 16, MySQL, Prisma ORM, NextAuth v5, TailwindCSS, Docker
- **Current Design:** Dark navy sidebar (lihat file: 452377.jpg)
- **Target Design Reference:** DashboardKit aesthetic (lihat file:WhatsApp image 2026 / ada di folder sistem ekstrakurikuler
)

---

## ⚠️ PENTING - BATASAN PERUBAHAN
```
❌ JANGAN UBAH:
- API endpoints
- Data structure/schema
- Database queries
- Authentication logic
- Business logic apapun
- Component functionality

✅ HANYA UBAH:
- Visual styling (colors, fonts, spacing)
- UI components appearance
- Layout & grid system
- Icons & graphics
- Animations & transitions
- TailwindCSS classes
- Component presentation layer
```

---

## 🎯 TARGET DESIGN IMPROVEMENTS

### Color Scheme Update
- **Primary:** Dark sidebar (#0F172A atau #1a1f35) - tetap gelap
- **Accent:** Purple/Violet gradients (#7c3aed, #a855f7) - dari DashboardKit
- **Cards:** Light background dengan subtle shadows
- **Charts:** Gradient fills (purple → light purple)
- **Text:** Maintain readability (dark text on light, white on dark)

### Component Styling
1. **Sidebar Navigation**
   - Add hover effects dengan smooth transitions
   - Icons dengan slight gradient atau color
   - Menu items responsive dengan better spacing
   - Section labels dengan typography improvement

2. **Main Content Area**
   - Cards dengan rounded corners (lebih modern)
   - Shadow & depth improvements
   - Grid layout lebih breathable
   - Stats cards dengan icon gradients

3. **Charts & Data Visualization**
   - Gradient fills di area chart
   - Color-coded bar charts
   - Better axis labels
   - Smooth animations on load

4. **Forms & Inputs** (jika ada)
   - Modern input styling
   - Better focus states
   - Color consistency dengan theme

5. **User Profile Section**
   - Top-right user info styling
   - Notifications badge styling
   - Dropdown menu improvements

### Typography & Spacing
- Improve font hierarchy
- Better padding/margin di cards
- More breathing room between sections
- Consistent letter spacing

### Responsive Design
- Sidebar collapse untuk mobile
- Mobile-friendly chart layouts
- Touch-friendly button sizes
- Responsive grid system

---

## 📝 DELIVERY FORMAT

### File Structure Yang Diharapkan:
```
components/
├── Sidebar.tsx (updated styling)
├── Dashboard.tsx (main layout)
├── Card.tsx (reusable card component)
├── Charts.tsx (chart components dengan gradients)
├── Stats.tsx (stats card component)
└── ...existing files

styles/
├── globals.css (Tailwind + custom CSS)
└── variables.css (color variables/theme)
```

### Code Style:
- **Framework:** Next.js React components
- **Styling:** TailwindCSS (dengan custom @apply jika perlu)
- **Icons:** lucide-react atau existing icon library
- **Charts:** Chart library yang sudah dipakai (recharts/chart.js/dll)

---

## 🔍 REFERENSI VISUAL

**Current State:** 452377.jpg (dark navy, minimal, static feel)
**Target Reference 1:** 452376.png (TailAdmin - clean blue theme)
**Target Reference 2:** 452375.png (DashboardKit - purple gradient, modern)

**Pilihan Design:** DashboardKit (Option 2)
- Purple/gradient accents
- Modern card styling
- Better visual hierarchy
- Engaging but professional

---

## 📋 CHECKLIST UNTUK GEMINI

Pastikan respons dari Gemini mencakup:

- [ ] Updated component code (hanya UI/styling)
- [ ] Tailwind color configuration
- [ ] Component structure (tidak mengubah logic)
- [ ] Responsive design consideration
- [ ] Animation/transition guidelines
- [ ] Icon implementation tips
- [ ] Dark mode support (jika applicable)
- [ ] Accessibility considerations (color contrast, etc)

---

## ⚡ PERINTAH KE GEMINI

"Saya punya aplikasi admin dashboard dengan Next.js + TailwindCSS. Saya ingin **redesign HANYA UI/styling-nya** menggunakan aesthetic seperti DashboardKit (modern, purple gradients, better visual hierarchy). 

**PENTING:** Jangan ubah API, database queries, atau business logic apapun - hanya styling dan visual presentation.

Berikut file-file saya:
1. [Upload current screenshot]
2. [Upload target design reference]
3. [Upload existing code jika ada]

Buat updated components dengan styling baru, dan jelaskan:
- Color palette yang baru
- Component structure updates
- Tailwind configuration
- Animation recommendations
- Responsive design approach"

---

## 🚀 NEXT STEPS

1. Copy prompt ini
2. Buka **Google Gemini** (gemini.google.com)
3. Paste prompt + upload file-file
4. Jelaskan context dan batasan perubahan
5. Minta output berupa code components
6. Implementasikan ke Next.js project mu
7. Test untuk memastikan API & data tetap berfungsi

---
