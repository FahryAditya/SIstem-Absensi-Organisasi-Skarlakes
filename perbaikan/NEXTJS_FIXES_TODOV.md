# Next.js UI/UX Fixes - To Do List

## 📋 Task Overview
Perbaikan sistem Next.js untuk meningkatkan stabilitas UI/UX dan mencegah kesalahan interaksi pengguna.

---

## ✅ Task 1: Hapus Animasi Fade In dari Bawah saat Page Transition
**Tujuan:** Saat berpindah halaman, halaman baru harus muncul langsung tanpa animasi fade in dari bawah.

### Alasan:
- Menghindari salah interpretasi halaman oleh user
- Meningkatkan stabilitas dan responsivitas UI
- Memberikan feedback yang jelas saat navigasi

### Checklist:
- [ ] Identifikasi lokasi animasi fade in (layout.tsx / _app.tsx / CSS modules)
- [ ] Hapus atau disable animasi transisi halaman
- [ ] Test pada semua route untuk memastikan halaman muncul langsung
- [ ] Verify tidak ada animasi yang tertinggal di komponen lain
- [ ] Pastikan loading state tetap berfungsi (jika ada)

### File yang Mungkin Terlibat:
```
- layouts/
- app/layout.tsx atau pages/_app.tsx
- globals.css atau tailwind config
- Komponen page wrapper
```

---

## ✅ Task 2: Perbaiki Menu Sidebar - Scroll State saat Buka Halaman Baru
**Tujuan:** Menu sidebar di sebelah kiri harus kembali ke posisi atas saat membuka halaman baru, bukan tetap di posisi lama.

### Alasan:
- User experience yang konsisten
- Menghindari kebingungan navigasi
- Memastikan menu items yang penting selalu visible

### Checklist:
- [ ] Identifikasi komponen sidebar/menu
- [ ] Cek apakah sidebar memiliki scroll state yang tersimpan
- [ ] Implementasi reset scroll position saat route change
- [ ] Gunakan useEffect + useRouter untuk detect page change
- [ ] Test pada semua halaman untuk memastikan scroll reset bekerja
- [ ] Pastikan scroll position tersimpan dengan benar saat kembali ke halaman lama (optional - history management)

### File yang Mungkin Terlibat:
```
- components/Sidebar.tsx
- components/Layout.tsx
- app/layout.tsx atau pages/_app.tsx
- hooks/useRouterScroll.ts (akan dibuat jika perlu)
```

---

## 🔧 Code Patterns yang Mungkin Dibutuhkan

### Pattern 1: Disable Page Transition Animation
```typescript
// Hapus atau modifikasi:
// - CSS transitions pada page elements
// - Framer Motion animations
// - Next.js page transition effects
```

### Pattern 2: Reset Scroll on Route Change
```typescript
useEffect(() => {
  const handleRouteChange = () => {
    window.scrollTo(0, 0); // Reset window scroll
    // atau
    sidebarRef.current?.scrollTo(0, 0); // Reset sidebar scroll
  };
  
  router.events?.on('routeChangeStart', handleRouteChange);
  return () => router.events?.off('routeChangeStart', handleRouteChange);
}, [router]);
```

---

## 📝 Notes
- Priority: **HIGH** - Affects user experience directly
- Timeline: Tergantung struktur project dan framework yang digunakan
- Testing: Perlu manual testing di berbagai breakpoint dan device

---

## 🚀 Status Progress
- [ ] Task 1: 0%
- [ ] Task 2: 0%

**Selesai:** -
**Dimulai:** -
