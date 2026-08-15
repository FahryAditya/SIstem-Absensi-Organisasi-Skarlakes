/**
 * Sinkronisasi user dari database data (Neon) ke Supabase Auth.
 *
 * Tujuan: dengan skema "auth di Supabase, data di Neon", akun yang sudah ada
 * di tabel `users` (Neon) perlu dibuat di Supabase Auth agar bisa login.
 * Hash bcrypt lama dipertahankan sehingga password user TIDAK berubah.
 *
 * Cara pakai:
 *   node --env-file=.env --import tsx scripts/sync-auth-supabase.ts
 */
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
})

async function main() {
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY harus diatur di .env')
    process.exit(1)
  }

  const users = await prisma.user.findMany()

  // Ambil semua user yang sudah ada di Supabase Auth (sekali saja)
  const existing = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const existingEmails = new Set(
    (existing.data?.users ?? []).map(u => u.email?.toLowerCase()).filter(Boolean)
  )

  let created = 0
  let skipped = 0
  let failed = 0

  for (const user of users) {
    const email = user.email.toLowerCase()

    if (existingEmails.has(email)) {
      console.log(`⊘ ${email} — sudah ada di Supabase Auth`)
      skipped++
      continue
    }

    const { error } = await supabase.auth.admin.createUser({
      email: user.email,
      password_hash: user.password,
      email_confirm: true,
      user_metadata: {
        nama: user.nama,
        app_user_id: user.id,
        role: user.role,
      },
    })

    if (error) {
      console.log(`✗ ${email} — ${error.message}`)
      failed++
    } else {
      console.log(`✓ ${email} — dibuat di Supabase Auth (password dipertahankan)`)
      created++
      existingEmails.add(email)
    }
  }

  console.log('\n=== HASIL ===')
  console.log(`Dibuat di Supabase Auth : ${created}`)
  console.log(`Sudah ada (skip)        : ${skipped}`)
  console.log(`Gagal                   : ${failed}`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
