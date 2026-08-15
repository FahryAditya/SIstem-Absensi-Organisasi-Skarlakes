import MembersClient from './MembersClient'

export default async function MembersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <MembersClient slug={slug} />
}
