import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jwtVerify } from 'jose'

async function verifyToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

  try {
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch {
    return null
  }
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lng2 - lng1) * Math.PI / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

export async function POST(req: NextRequest) {
  try {
    const payload = await verifyToken(req)
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { 
      antrianId, 
      latitude, 
      longitude, 
      targetLatitude = -7.250445,  // Default SMK Airlangga coordinates
      targetLongitude = 112.768845,
      maxDistanceMeters = 500 // 500 meters default
    } = body

    if (!antrianId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { success: false, message: 'Antrian ID, latitude, dan longitude wajib diisi' },
        { status: 400 }
      )
    }

    // Calculate distance from target location
    const distance = calculateDistance(
      latitude, 
      longitude, 
      targetLatitude, 
      targetLongitude
    )

    const isValid = distance <= maxDistanceMeters
    const statusValidasi = isValid ? 'SAH' : 'TIDAK_SAH'
    const alasanValidasi = isValid 
      ? `Lokasi valid (${Math.round(distance)}m dari lokasi)`
      : `Terlalu jauh (${Math.round(distance)}m dari lokasi, maksimal ${maxDistanceMeters}m)`

    // Update antrian with GPS data
    const updatedAntrian = await prisma.antrianWawancara.update({
      where: { id: antrianId },
      data: {
        gps_lat: latitude,
        gps_lng: longitude,
        jarak_meter: distance,
        status_validasi: statusValidasi,
        alasan_validasi: alasanValidasi,
      },
      include: {
        sesi: {
          select: {
            organisasi_type: true,
            status: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Lokasi berhasil dikirim',
      data: {
        antrianId: updatedAntrian.id,
        latitude,
        longitude,
        distance: Math.round(distance),
        isValid,
        statusValidasi,
        alasanValidasi,
        targetLocation: {
          latitude: targetLatitude,
          longitude: targetLongitude,
        }
      }
    })

  } catch (error) {
    console.error('Send location error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
