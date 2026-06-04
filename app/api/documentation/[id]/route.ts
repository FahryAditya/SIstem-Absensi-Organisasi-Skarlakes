import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { canManageDocumentation } from '@/lib/documentation-auth'
import { createLog, getIp } from '@/lib/log'
import cloudinary from '@/lib/cloudinary'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: (req.headers.get('x-user-role') || '').trim(),
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const doc = await prisma.documentation.findUnique({
      where: { id },
      include: { organization: true }
    })

    if (!doc || doc.deletedAt) {
      return NextResponse.json({ error: 'Documentation not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: doc })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, userNama, userRole } = getCtx(req)
    const id = parseInt(params.id)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const doc = await prisma.documentation.findUnique({
      where: { id }
    })

    if (!doc) {
      return NextResponse.json({ error: 'Documentation not found' }, { status: 404 })
    }

    if (!canManageDocumentation(userRole, doc.createdBy, userId, doc.type)) {
      return NextResponse.json({ error: 'You do not have permission to edit this documentation' }, { status: 403 })
    }

    const body = await req.json()
    const { title, description, category, dateTaken, photoUrl, publicId } = body

    // If photo changed, we might want to delete old photo from Cloudinary
    // Logic for deleting old photo could go here using doc.publicId

    // Actually, for now, let's just update the record.
    const updatedDoc = await prisma.documentation.update({
      where: { id },
      data: {
        title: title ?? undefined,
        description: description ?? undefined,
        category: category ?? undefined,
        dateTaken: dateTaken ? new Date(dateTaken) : undefined,
        // Convert comma‑separated URLs & publicIds into an array of objects for the `photos` JSON field
        photos: photoUrl ? photoUrl.split(',').map((url: string, i: number) => ({
          url: url.trim(),
          publicId: (publicId?.split(',')[i] || '').trim()
        })) : undefined,
      }
    })

    await createLog({
      userId,
      userNama,
      aksi: 'UPDATE',
      tabel: 'documentations',
      recordId: id,
      deskripsi: `Memperbarui dokumentasi: ${updatedDoc.title}`,
      dataLama: doc as any,
      dataBaru: updatedDoc as any,
      ipAddress: getIp(req)
    })

    return NextResponse.json({
      success: true,
      message: 'Dokumentasi berhasil diperbarui',
      data: updatedDoc
    })

  } catch (error: any) {
    console.error('Update documentation error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, userNama, userRole } = getCtx(req)
    const id = parseInt(params.id)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const doc = await prisma.documentation.findUnique({
      where: { id }
    })

    if (!doc) {
      return NextResponse.json({ error: 'Documentation not found' }, { status: 404 })
    }

    if (!canManageDocumentation(userRole, doc.createdBy, userId, doc.type)) {
      return NextResponse.json({ error: 'You do not have permission to delete this documentation' }, { status: 403 })
    }

    // Soft delete
    const deletedDoc = await prisma.documentation.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    })

    await createLog({
      userId,
      userNama,
      aksi: 'DELETE',
      tabel: 'documentations',
      recordId: id,
      deskripsi: `Menghapus dokumentasi (soft delete): ${doc.title}`,
      ipAddress: getIp(req)
    })

    return NextResponse.json({
      success: true,
      message: 'Dokumentasi berhasil dihapus'
    })

  } catch (error: any) {
    console.error('Delete documentation error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
