require('dotenv').config()
const { Client } = require('pg')

async function main() {
  const url = process.env.NEON_DATABASE_URL
  if (!url) { console.error('NEON_DATABASE_URL tidak ada'); process.exit(1) }
  const client = new Client({ connectionString: url })
  try {
    await client.connect()
    const tables = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
    )
    console.log('=== TABEL DI NEON (' + tables.rows.length + ') ===')
    console.log(tables.rows.map(r => r.table_name).join(', '))
    for (const name of ['users', 'siswa', 'organizations']) {
      try {
        const cnt = await client.query(`SELECT count(*)::int AS n FROM "${name}"`)
        console.log(`count ${name} = ${cnt.rows[0].n}`)
      } catch (e) { console.log(`count ${name} = TABEL TIDAK ADA`) }
    }
  } finally {
    await client.end()
  }
}
main().catch(e => { console.error('GAGAL KONEKSI NEON:', e.message); process.exit(1) })
