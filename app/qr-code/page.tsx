import DashboardLayout from '@/components/layout/DashboardLayout'
import { getServerUser } from '@/lib/server-utils'
import { isAdministrator } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import QrCodeClient from './QrCodeClient'

export default async function QrCodePage() {
  const user = await getServerUser()
  if (!isAdministrator(user.role)) redirect('/dashboard')

  const now = new Date()
  const qrItems = await prisma.qrWawancara.findMany({
    where: { valid_until: { gte: now } },
    include: {
      sesi: { select: { id: true, status: true } },
      creator: { select: { nama: true } },
      _count: { select: { antrian: true } },
    },
    orderBy: { created_at: 'desc' },
    take: 20,
  })
  const h = headers()
  const host = h.get('x-forwarded-host') || h.get('host') || ''
  const protocol = h.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
  const baseUrl = host ? `${protocol}://${host}` : ''

  return (
    <DashboardLayout user={user} pageTitle="QR Code Wawancara">
      <QrCodeClient
        baseUrl={baseUrl}
        initialItems={qrItems.map((item) => ({
          ...item,
          valid_from: item.valid_from.toISOString(),
          valid_until: item.valid_until.toISOString(),
          created_at: item.created_at.toISOString(),
        }))}
      />
    </DashboardLayout>
  )
}
