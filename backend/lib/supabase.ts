import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const anonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function makeClient(key: string) {
  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}

const globalForSupabase = globalThis as unknown as {
  supabase?: SupabaseClient
  supabaseAdmin?: SupabaseClient
}

export const supabase: SupabaseClient = globalForSupabase.supabase ?? makeClient(anonKey)

export const supabaseAdmin: SupabaseClient =
  globalForSupabase.supabaseAdmin ?? makeClient(serviceRoleKey)

if (process.env.NODE_ENV !== 'production') {
  globalForSupabase.supabase = supabase
  globalForSupabase.supabaseAdmin = supabaseAdmin
}
