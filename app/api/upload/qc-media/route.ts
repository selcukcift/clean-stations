import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { getAuthUser } from '@/lib/auth'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const mediaType = formData.get('mediaType') as string || 'photo'
    const orderId = formData.get('orderId') as string
    const itemId = formData.get('itemId') as string // QC template item ID for reference

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type based on media type
    const allowedTypes: Record<string, string[]> = {
      photo: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      video: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'],
      audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'],
      document: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ]
    }

    const validTypes = allowedTypes[mediaType] || allowedTypes.photo
    
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: `Invalid file type for ${mediaType}` },
        { status: 400 }
      )
    }

    // Validate file size based on media type
    const maxSizes: Record<string, number> = {
      photo: 10 * 1024 * 1024,    // 10MB
      video: 100 * 1024 * 1024,   // 100MB
      audio: 20 * 1024 * 1024,    // 20MB
      document: 10 * 1024 * 1024  // 10MB
    }

    const maxSize = maxSizes[mediaType] || maxSizes.photo
    
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: `File too large (max ${maxSize / 1024 / 1024}MB for ${mediaType})` },
        { status: 400 }
      )
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'uploads', 'qc-media', mediaType)
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch {
      // Directory might already exist, which is fine
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${timestamp}_${randomString}.${fileExtension}`
    const filePath = join(uploadDir, fileName)

    // Save file
    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    // Create FileUpload record
    const fileUpload = await prisma.fileUpload.create({
      data: {
        filename: fileName,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        path: `/uploads/qc-media/${mediaType}/${fileName}`,
        uploadedById: user.id,
        metadata: {
          mediaType,
          orderId,
          itemId,
          uploadContext: 'qc-inspection'
        }
      }
    })

    return NextResponse.json({
      success: true,
      fileUpload: {
        id: fileUpload.id,
        filename: fileUpload.filename,
        originalName: fileUpload.originalName,
        size: fileUpload.size,
        mimeType: fileUpload.mimeType,
        path: fileUpload.path,
        mediaType
      },
      message: 'File uploaded successfully'
    })

  } catch (error) {
    console.error('Error uploading QC media:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE endpoint to remove QC media
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const fileUploadId = searchParams.get('fileUploadId')

    if (!fileUploadId) {
      return NextResponse.json(
        { success: false, message: 'File upload ID required' },
        { status: 400 }
      )
    }

    // Find the file upload
    const fileUpload = await prisma.fileUpload.findUnique({
      where: { id: fileUploadId },
      include: {
        qcItemResultAttachments: true
      }
    })

    if (!fileUpload) {
      return NextResponse.json(
        { success: false, message: 'File not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to delete (must be uploader or admin)
    if (fileUpload.uploadedById !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Permission denied' },
        { status: 403 }
      )
    }

    // Delete file from filesystem
    try {
      const { promises: fs } = await import('fs')
      const filePath = join(process.cwd(), fileUpload.path)
      await fs.unlink(filePath)
    } catch (error) {
      console.warn('Could not delete file from filesystem:', error)
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database (cascade will handle QcItemResultMediaAttachment records)
    await prisma.fileUpload.delete({
      where: { id: fileUploadId }
    })

    return NextResponse.json({
      success: true,
      message: 'QC media file deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting QC media:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}