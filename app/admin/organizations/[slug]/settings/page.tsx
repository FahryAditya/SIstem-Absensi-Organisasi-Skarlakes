import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import SettingsClient from './SettingsClient'

export default async function OrgSettingsPage({ params }: { params: { slug: string } }) {
  const org = await prisma.organization.findUnique({
    where: { slug: params.slug }
  })

  if (!org) notFound()

  return <SettingsClient org={org} />
}
