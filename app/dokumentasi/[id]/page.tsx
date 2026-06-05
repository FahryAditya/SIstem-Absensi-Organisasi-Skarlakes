import { getUserSession } from '@/lib/server-utils'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Calendar, Tag, User, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import DocumentationGallery from '@/components/documentation/DocumentationGallery'
import { getDocumentationPhotoFields } from '@/lib/documentation'

export default async function DokumentasiDetailPage({ params }: { params: { id: string } }) {
  const user = await getUserSession()
  const guestUser = { id: 0, nama: 'Tamu', email: '', role: 'guest' }
  const id = parseInt(params.id)

  const doc = await prisma.documentation.findUnique({
    where: { id },
    include: {
      creator: { select: { nama: true } },
      organization: true
    }
  })

  if (!doc || doc.deletedAt) {
    notFound()
  }

  const { photoUrl } = getDocumentationPhotoFields(doc.photos)

  return (
    <DashboardLayout user={user || guestUser} pageTitle={doc.title}>
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        <Link 
          href="/dokumentasi"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-persian-blue font-bold transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Galeri
        </Link>

        <div className="bg-deep-navy border border-white/10 rounded-[2.5rem] shadow-sm p-6 sm:p-8 space-y-8">
          {/* Image Gallery */}
          <DocumentationGallery photoUrl={photoUrl} title={doc.title} />

          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <span className="bg-persian-blue/10 text-persian-blue px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-persian-blue/20">
                  <Tag className="w-3.5 h-3.5" />
                  {doc.category}
                </span>
                <span className="bg-white/5 text-slate-400 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-white/10">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(doc.dateTaken).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                {doc.title}
              </h1>
            </div>

            <div className="prose prose-slate max-w-none">
              <p className="text-lg text-slate-300 leading-relaxed whitespace-pre-wrap">
                {doc.description}
              </p>
            </div>

            <div className="pt-8 border-t border-white/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-persian-blue flex items-center justify-center text-white text-lg font-black shadow-lg shadow-persian-blue/20">
                {doc.creator.nama.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diterbitkan oleh</div>
                <div className="text-sm font-extrabold text-white">{doc.creator.nama}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
