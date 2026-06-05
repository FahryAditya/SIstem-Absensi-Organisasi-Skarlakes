import { getServerUser } from '@/lib/server-utils'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ImportMembersForm from '@/components/admin/ImportMembersForm'
import { FileSpreadsheet, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ImportMembersPage() {
  const user = await getServerUser()

  return (
    <DashboardLayout user={user} pageTitle="Impor Anggota">
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="mb-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors w-fit">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-white/50/10 rounded-2xl text-blue-400">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Impor Anggota Organisasi</h1>
            <p className="text-slate-400 text-sm">Tambahkan data anggota massal via file spreadsheet Excel (.xlsx)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Form wrapper */}
          <div className="bg-[#0f1117] border border-white/10 rounded-2xl p-6 shadow-xl">
            <ImportMembersForm user={user} />
          </div>

          {/* Instructions */}
          <div className="bg-[#0f1117]/50 border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Format Pengisian Template Excel</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Pastikan struktur kolom pada file Excel Anda mengikuti format berikut agar data dapat terbaca dengan sukses oleh sistem:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                <span className="text-xs font-bold text-blue-400 block mb-1">Kolom Wajib (Required)</span>
                <ul className="text-[11px] text-slate-400 space-y-1 list-disc pl-4">
                  <li><strong>Nama</strong> - Nama lengkap anggota</li>
                  <li><strong>Kelas</strong> - Kelas/tingkat (contoh: XI PPLG 1)</li>
                  <li><strong>Jabatan</strong> - Jabatan (contoh: Anggota / Ketua)</li>
                  <li><strong>Email / Gmail</strong> - Email aktif (untuk notifikasi)</li>
                </ul>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                <span className="text-xs font-bold text-amber-400 block mb-1">Kolom Opsional (Optional)</span>
                <ul className="text-[11px] text-slate-400 space-y-1 list-disc pl-4">
                  <li><strong>NIS</strong> - Nomor Induk Siswa (jika ada)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
