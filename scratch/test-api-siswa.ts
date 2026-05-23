import { NextRequest } from 'next/server'
import { GET } from '../app/api/siswa/route'

async function run() {
  try {
    const req = new NextRequest('http://localhost:3000/api/siswa?ekskul=programming', {
      headers: {
        'x-user-id': '1',
        'x-user-nama': 'Test User',
        'x-user-role': 'admin_programming',
      },
    })
    const res = await GET(req)
    console.log('Status:', res.status)
    const body = await res.json()
    console.log('Body:', JSON.stringify(body, null, 2))
  } catch (err) {
    console.error('API call failed:', err)
  }
}

run()
