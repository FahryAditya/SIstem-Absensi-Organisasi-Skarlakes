import { prisma } from '@/lib/prisma';
import { getAccessibleOrgs } from '@/lib/auth-shared';

export async function getAccessibleOrganizations(userId: number, role: string) {
  const cleanRole = (role || '').trim().toLowerCase();
  
  // 1. Get organizations from hardcoded roles
  const hardcodedSlugs = getAccessibleOrgs(role);
  
  // 2. Get organizations where the user is explicitly an admin
  const explicitAdmins = await prisma.organizationAdmin.findMany({
    where: { user_id: userId },
    include: { organization: true }
  });
  
  const explicitSlugs = explicitAdmins.map(ea => ea.organization.slug).filter(Boolean) as string[];
  
  // 3. If administrator, get ALL organizations
  if (cleanRole === 'administrator') {
    const allOrgs = await prisma.organization.findMany({
      select: { slug: true, nama: true, school_origin: true }
    });
    return allOrgs.map(o => ({ slug: o.slug!, nama: o.nama, school_origin: o.school_origin }));
  }
  
  // Combine slugs and fetch details
  const allSlugs = Array.from(new Set([...hardcodedSlugs, ...explicitSlugs]));
  
  const orgs = await prisma.organization.findMany({
    where: {
      slug: { in: allSlugs }
    },
    select: { slug: true, nama: true, school_origin: true }
  });
  
  return orgs.map(o => ({ slug: o.slug!, nama: o.nama, school_origin: o.school_origin }));
}
