import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import AdminsClient from './AdminsClient'

export default async function OrgAdminsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const org = await prisma.organization.findUnique({
    where: { slug }
  })

  if (!org) notFound()

  return <AdminsClient slug={slug} orgName={org.nama} />
}
