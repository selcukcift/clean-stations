import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const UPLOAD_DIR = process.env.UPLOADS_DIR || './uploads'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fileId } = await params

    // Get file record from database
    const fileRecord = await prisma.fileUpload.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        filename: true,
        path: true,
        mimeType: true,
        size: true,
        isPublic: true,
        uploadedBy: {
          select: {
            id: true,
            role: true
          }
        }
      }
    })

    if (!fileRecord) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Basic access control - can be enhanced based on requirements
    const user = session.user as { id: string; role: string }
    const canAccess = fileRecord.isPublic || 
                     fileRecord.uploadedBy.id === user.id || 
                     ['ADMIN', 'PRODUCTION_COORDINATOR', 'QC_PERSON'].includes(user.role)

    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if file exists on disk
    const fullFilePath = path.resolve(UPLOAD_DIR, fileRecord.path)
    if (!existsSync(fullFilePath)) {
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
    }

    // Read and return file
    const fileBuffer = await readFile(fullFilePath)
    
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': fileRecord.mimeType || 'application/octet-stream',
        'Content-Length': fileBuffer.length.toString(),
        'Content-Disposition': `inline; filename="${fileRecord.filename}"`,
        'Cache-Control': 'private, max-age=3600'
      }
    })

  } catch (error) {
    console.error('Error viewing file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}