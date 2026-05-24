import { execSync } from 'child_process';

/**
 * Script untuk menjalankan migrasi Prisma ke Neon PostgreSQL.
 * Mengambil NEON_DATABASE_URL dan NEON_DIRECT_URL dari environment.
 */

const neonUrl = process.env.NEON_DATABASE_URL;
const neonDirectUrl = process.env.NEON_DIRECT_URL;

if (!neonUrl || !neonDirectUrl) {
  console.error('❌ Error: NEON_DATABASE_URL dan NEON_DIRECT_URL harus diatur di .env');
  console.log('Contoh:');
  console.log('NEON_DATABASE_URL="postgresql://user:pass@ep-host-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"');
  console.log('NEON_DIRECT_URL="postgresql://user:pass@ep-host.us-east-1.aws.neon.tech/neondb?sslmode=require"');
  process.exit(1);
}

console.log('🚀 Menjalankan migrasi ke Neon PostgreSQL...');

try {
  // Override DATABASE_URL dan DIRECT_URL khusus untuk proses ini
  execSync('npx prisma migrate deploy', {
    env: {
      ...process.env,
      DATABASE_URL: neonUrl,
      DIRECT_URL: neonDirectUrl,
    },
    stdio: 'inherit',
  });
  console.log('✅ Migrasi Neon selesai!');
} catch (error) {
  console.error('❌ Migrasi Neon gagal.');
  process.exit(1);
}
