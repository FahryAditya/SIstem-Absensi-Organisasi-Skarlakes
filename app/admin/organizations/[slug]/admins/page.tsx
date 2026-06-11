import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import AdminsClient from './AdminsClient'

export default async function OrgAdminsPage({ params }: { params: { slug: string } }) {
  const org = await prisma.organization.findUnique({
    where: { slug: params.slug }
  })

  if (!org) notFound()

  return <AdminsClient slug={params.slug} orgName={org.nama} />
}
