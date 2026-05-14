import { getServerUser } from '@/lib/server-utils'
import { redirect } from 'next/navigation'
import HapusPesertaClient from './HapusPesertaClient'

export default async function HapusPesertaPage() {
  const user = await getServerUser('administrator')

  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'administrator') {
    redirect('/dashboard')
  }

  return <HapusPesertaClient user={user} />
}
