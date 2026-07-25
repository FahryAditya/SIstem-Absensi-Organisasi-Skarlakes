import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import SettingsClient from './SettingsClient'

export default async function OrgSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const org = await prisma.organization.findUnique({
    where: { slug }
  })

  if (!org) notFound()

  return <SettingsClient org={org} />
}
