import KasClient from './KasClient'

export default function KasPage({ params }: { params: { slug: string } }) {
  return <KasClient slug={params.slug} />
}
