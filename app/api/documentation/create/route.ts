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
    const { title, description, category, dateTaken, photoUrl, publicId, organizationId, type } = body

    // Validate required fields (photos required)
    if (!title || !description || !category || !photoUrl || !organizationId || !type) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Validate permission
    if (!checkCanAccessDocumentation(userRole, type)) {
      return NextResponse.json({ error: 'You do not have permission to create documentation for this organization' }, { status: 403 })
    }

    // Validate photo URLs
    const urls = photoUrl.split(',')
    for (const url of urls) {
      if (!url.trim().includes('cloudinary.com')) {
        return NextResponse.json({ error: 'Invalid photo URL' }, { status: 400 })
      }
    }

    // Build photos JSON array
    const publicIds = publicId ? publicId.split(',') : []
    const photosArray = urls.map((url: string, i: number) => ({
      url: url.trim(),
      publicId: (publicIds[i] || '').trim(),
    }))

    const doc = await prisma.documentation.create({
      data: {
        title,
        description,
        category,
        dateTaken: dateTaken ? new Date(dateTaken) : new Date(),
        photos: photosArray,
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
