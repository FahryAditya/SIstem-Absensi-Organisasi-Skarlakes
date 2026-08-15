import { createClient } from '@supabase/supabase-js'

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const anon = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''
  const sb = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })
  const { data, error } = await sb.auth.signInWithPassword({
    email: 'Fahryadityasetiawann@gmail.com',
    password: 'AdministratorFahry',
  })
  if (error) {
    console.log('✗ LOGIN GAGAL:', error.message)
    process.exit(1)
  }
  console.log('✓ LOGIN SUPABASE BERHASIL — user:', data.user?.email, '| role:', (data.user?.user_metadata as any)?.role)
}

main().catch(e => { console.log('✗', e?.message ?? e); process.exit(1) })
