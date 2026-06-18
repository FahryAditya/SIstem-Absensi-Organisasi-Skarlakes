import { getServerUser } from '@/lib/server-utils'
import { redirect } from 'next/navigation'
import HapusPesertaClient from './HapusPesertaClient'

export default async function HapusPesertaPage() {
  const user = await getServerUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'SUPER_ADMIN' && (user.role as string) !== 'administrator') {
    redirect('/dashboard')
  }

  return <HapusPesertaClient user={user} />
}
