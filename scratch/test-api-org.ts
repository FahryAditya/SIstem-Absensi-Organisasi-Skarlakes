import { NextRequest } from 'next/server'
import { GET } from '../app/api/organisasi/route'

async function run() {
  try {
    const req = new NextRequest('http://localhost:3000/api/organisasi?tipe=osis', {
      headers: {
        'x-user-id': '1',
        'x-user-nama': 'Test User',
        'x-user-role': 'admin_osis_mpk',
      },
    })
    const res = await GET(req)
    console.log('Status:', res.status)
    const body = await res.json()
    console.log('Body keys:', Object.keys(body))
    console.log('Total:', body.total)
  } catch (err) {
    console.error('API call failed:', err)
  }
}

run()
