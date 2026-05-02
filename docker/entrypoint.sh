#!/bin/sh
set -e

echo "🔄 Running database migrations..."
npx prisma migrate deploy || npx prisma db push --accept-data-loss

echo "🌱 Running database seed..."
npx tsx scripts/seed.ts || echo "⚠️  Seed skipped (mungkin sudah berjalan sebelumnya)"

echo "🚀 Starting application..."
node server.js
