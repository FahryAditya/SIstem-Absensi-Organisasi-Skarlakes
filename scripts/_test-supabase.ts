import { createClient } from '@supabase/supabase-js'

const combos: { label: string; url: string; key: string }[] = [
  {
    label: 'A: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY',
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  {
    label: 'B: NEXT_PUBLIC_POSTGRES_DATABASE_SUPABASE_URL + POSTGRES_DATABASE_SUPABASE_SERVICE_ROLE_KEY',
    url: process.env.NEXT_PUBLIC_POSTGRES_DATABASE_SUPABASE_URL || '',
    key: process.env.POSTGRES_DATABASE_SUPABASE_SERVICE_ROLE_KEY || '',
  },
  {
    label: 'C: NEXT_PUBLIC_SUPABASE_URL + POSTGRES_DATABASE_SUPABASE_SERVICE_ROLE_KEY',
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    key: process.env.POSTGRES_DATABASE_SUPABASE_SERVICE_ROLE_KEY || '',
  },
  {
    label: 'D: NEXT_PUBLIC_POSTGRES_DATABASE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY',
    url: process.env.NEXT_PUBLIC_POSTGRES_DATABASE_SUPABASE_URL || '',
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
]

async function main() {
  for (const c of combos) {
    if (!c.url || !c.key) {
      console.log(`✗ ${c.label} — key/url kosong`)
      continue
    }
    try {
      const sb = createClient(c.url, c.key, {
        auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      })
      const { data, error } = await sb.auth.admin.listUsers({ perPage: 1 })
      if (error) {
        console.log(`✗ ${c.label}\n    error: ${error.message}`)
      } else {
        console.log(`✓ ${c.label}\n    project OK, total user ≥ ${data.total ?? '?'}`)
      }
    } catch (e: any) {
      console.log(`✗ ${c.label}\n    error: ${e?.message ?? e}`)
    }
  }
}

main()
