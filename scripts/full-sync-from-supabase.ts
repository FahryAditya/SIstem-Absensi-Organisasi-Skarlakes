// scripts/full-sync-from-supabase.ts
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// ------------------------------------------------------------------
// 1️⃣  Load environment variables (using .env when script is executed)
// ------------------------------------------------------------------
const {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  NEON_DATABASE_URL,
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
} = process.env;

// Provide fallback for backward‑compatibility
const supabaseUrl = SUPABASE_URL || NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY || NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ SUPABASE_URL & SUPABASE_ANON_KEY (or NEXT_PUBLIC_*) must be set.');
  process.exit(1);
}
if (!NEON_DATABASE_URL) {
  console.error('❌ NEON_DATABASE_URL must be set.');
  process.exit(1);
}

// ------------------------------------------------------------------
// 2️⃣  Initialise clients
// ------------------------------------------------------------------
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const prisma = new PrismaClient({
  datasources: { db: { url: NEON_DATABASE_URL } },
});

// ------------------------------------------------------------------
// 3️⃣  Parse Prisma schema to get model names (tables)
// ------------------------------------------------------------------
function getModelNames(): string[] {
  const schemaPath = path.resolve(__dirname, '..', 'prisma', 'schema.prisma');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  return schema
    .split('\n')
    .filter(l => l.trim().startsWith('model '))
    .map(l => l.replace('model', '').trim().split(' ')[0]);
}

// ------------------------------------------------------------------
// 4️⃣  Define insert order (adjust if foreign‑keys exist)
// ------------------------------------------------------------------
const INSERT_ORDER = [
  'User',
  'Siswa',
  'Absen',
  'Kas',
  'AnggotaOsis',
  'AnggotaMpk',
  // add more models if needed
];

// ------------------------------------------------------------------
// 5️⃣  Sync a single table
// ------------------------------------------------------------------
async function syncTable(model: string) {
  console.log(`🔄 Syncing ${model} …`);

  // Supabase table name – assume lower‑case version of model name
  const tableName = model.toLowerCase();
  const { data, error } = await supabase.from(tableName).select('*');
  if (error) {
    console.error(`❌ Error fetching ${model}:`, error.message);
    return;
  }
  if (!data || data.length === 0) {
    console.log(`⚪ No rows in ${model}.`);
    return;
  }

  const prismaModel = (prisma as any)[model];
  if (!prismaModel) {
    console.warn(`⚠️ Prisma model ${model} not found, skipping.`);
    return;
  }

  try {
    await prismaModel.createMany({ data: data as any[], skipDuplicates: true });
    console.log(`✅ Inserted ${data.length} rows into ${model}.`);
  } catch (e: any) {
    console.error(`❌ Insert failed for ${model}:`, e.message);
  }
}

// ------------------------------------------------------------------
// 6️⃣  Main runner
// ------------------------------------------------------------------
async function main() {
  const allModels = getModelNames();
  const ordered = INSERT_ORDER.filter(m => allModels.includes(m));

  for (const model of ordered) {
    await syncTable(model);
  }

  await prisma.$disconnect();
  console.log('🎉 Full sync completed.');
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
