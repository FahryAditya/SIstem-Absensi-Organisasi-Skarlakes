import ScanWawancaraClient from './ScanWawancaraClient'

export default async function ScanWawancaraPage({ searchParams }: { searchParams: Promise<{ sesi?: string; token?: string }> }) {
  const { sesi, token } = await searchParams
  return <ScanWawancaraClient sesiId={sesi || ''} token={token || ''} />
}
