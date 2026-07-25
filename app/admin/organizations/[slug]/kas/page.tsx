import KasClient from './KasClient'

export default async function KasPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <KasClient slug={slug} />
}
