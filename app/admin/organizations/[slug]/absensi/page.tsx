import AbsensiClient from './AbsensiClient'

export default async function AbsensiPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <AbsensiClient slug={slug} />
}
