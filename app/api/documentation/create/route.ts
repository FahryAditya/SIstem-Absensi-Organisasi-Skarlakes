import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkCanAccessDocumentation } from '@/lib/documentation-auth'
import { createLog, getIp } from '@/lib/log'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: (req.headers.get('x-user-role') || '').trim(),
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, userNama, userRole } = getCtx(req)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { title, description, category, photoUrl, publicId, organizationId, type } = body

    if (!title || !description || !category || !photoUrl || !organizationId || !type) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Validate permission
    if (!checkCanAccessDocumentation(userRole, type)) {
      return NextResponse.json({ error: 'You do not have permission to create documentation for this organization' }, { status: 403 })
    }

    // Validate photoUrl is from Cloudinary (optional but recommended)
    if (!photoUrl.includes('cloudinary.com')) {
      return NextResponse.json({ error: 'Invalid photo URL' }, { status: 400 })
    }

    const doc = await prisma.documentation.create({
      data: {
        title,
        description,
        category,
        photoUrl,
        publicId,
        type: type as any,
        organizationId: parseInt(organizationId),
        createdBy: userId,
      }
    })

    await createLog({
      userId,
      userNama,
      aksi: 'CREATE',
      tabel: 'documentations',
      recordId: doc.id,
      deskripsi: `Membuat dokumentasi: ${title}`,
      dataBaru: doc as any,
      ipAddress: getIp(req)
    })

    return NextResponse.json({
      success: true,
      message: 'Dokumentasi berhasil dibuat',
      data: doc
    })

  } catch (error: any) {
    console.error('Create documentation error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
