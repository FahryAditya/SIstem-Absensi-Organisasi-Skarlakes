import AbsensiClient from './AbsensiClient'

export default function AbsensiPage({ params }: { params: { slug: string } }) {
  return <AbsensiClient slug={params.slug} />
}
