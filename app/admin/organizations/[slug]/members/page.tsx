import MembersClient from './MembersClient'

export default function MembersPage({ params }: { params: { slug: string } }) {
  return <MembersClient slug={params.slug} />
}
