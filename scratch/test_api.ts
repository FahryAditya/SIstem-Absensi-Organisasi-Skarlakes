import { SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  'super-secret-jwt-key-change-in-production-min-32-chars'
)

async function signToken(payload: any): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(JWT_SECRET)
}

async function testRole(role: string) {
  console.log(`Testing role: ${role}...`)
  const token = await signToken({
    id: 1,
    nama: 'Test User',
    email: 'test@gmail.com',
    role: role
  })
  const res = await fetch('http://localhost:3000/api/dokumentasi', {
    headers: {
      'Cookie': `ekskul_session=${token}`
    }
  })
  console.log(`Status for ${role}:`, res.status)
  const json = await res.json()
  console.log(`Body for ${role}:`, json)
}

async function main() {
  await testRole('administrator')
  await testRole('admin_programming')
  await testRole('admin_english')
  await testRole('admin_osis_mpk')
  await testRole('student') // invalid role
}

main()
