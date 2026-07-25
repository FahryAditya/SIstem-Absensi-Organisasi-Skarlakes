import { getServerUser } from '@/lib/server-utils'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, Users, CheckCircle2, Wallet, 
  TrendingUp, Settings, ShieldCheck, ArrowLeft 
} from 'lucide-react'

interface Props {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function OrgWorkspaceLayout({ children, params }: Props) {
  const user = await getServerUser()
  const { slug } = await params
  
  const org = await prisma.organization.findUnique({
    where: { slug }
  })

  if (!org) notFound()

  // Basic RBAC check
  if (user.role !== 'SUPER_ADMIN' && (user.role as string) !== 'administrator') {
    const isOrgAdmin = await prisma.organizationAdmin.findUnique({
      where: {
        user_id_organization_id: {
          user_id: user.id,
          organization_id: org.id
        }
      }
    })
    if (!isOrgAdmin) redirect('/dashboard')
  }

  const navItems = [
    { label: 'Dashboard', href: `/admin/organizations/${org.slug}`, icon: LayoutDashboard },
    { label: 'Data Anggota', href: `/admin/organizations/${org.slug}/members`, icon: Users },
    { label: 'Absensi', href: `/admin/organizations/${org.slug}/absensi`, icon: CheckCircle2 },
    { label: 'Kas', href: `/admin/organizations/${org.slug}/kas`, icon: Wallet },
    { label: 'Progress', href: `/admin/organizations/${org.slug}/progress`, icon: TrendingUp },
  ]

  if (user.role === 'SUPER_ADMIN' || (user.role as string) === 'administrator') {
    navItems.push({ label: 'Administrator', href: `/admin/organizations/${org.slug}/admins`, icon: ShieldCheck })
    navItems.push({ label: 'Pengaturan', href: `/admin/organizations/${org.slug}/settings`, icon: Settings })
  }

  return (
    <DashboardLayout user={user} pageTitle={org.nama}>
      <div className="space-y-6">
        {/* Workspace Nav */}
        <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <Link 
            href="/admin/organizations"
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 transition-all flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 flex-shrink-0">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-slate-100 text-slate-500 hover:text-slate-800 whitespace-nowrap"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {children}
      </div>
    </DashboardLayout>
  )
}
