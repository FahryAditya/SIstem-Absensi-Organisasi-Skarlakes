import ScanWawancaraClient from './ScanWawancaraClient'

export default function ScanWawancaraPage({ searchParams }: { searchParams: { sesi?: string; token?: string } }) {
  return <ScanWawancaraClient sesiId={searchParams.sesi || ''} token={searchParams.token || ''} />
}
