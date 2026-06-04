import { NextRequest, NextResponse } from 'next/server'
import cloudinary, { isCloudinaryConfigured } from '@/lib/cloudinary'

export async function POST(req: NextRequest) {
  try {
    if (!isCloudinaryConfigured) {
      return NextResponse.json({ error: 'Cloudinary is not configured' }, { status: 500 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed.' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size too large. Max 5MB allowed.' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`

    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      folder: 'dokumentasi_organisasi',
    })

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id
    })

  } catch (error: any) {
    console.error('Upload photo error:', error)
    return NextResponse.json({ error: 'Failed to upload photo: ' + error.message }, { status: 500 })
  }
}
