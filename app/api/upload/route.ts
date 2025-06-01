import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

// Authentication helper
async function getAuthenticatedUser(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) {
    throw new Error('Authentication required')
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })
    
    if (!user || !user.isActive) {
      throw new Error('Invalid user')
    }
    
    return user
  } catch (error) {
    throw new Error('Invalid authentication token')
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const orderId = formData.get('orderId') as string
    const docType = formData.get('docType') as string || 'PO_DOCUMENT'

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'File type not allowed' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'File size too large (max 10MB)' },
        { status: 400 }
      )
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'uploads', 'documents')
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
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

    // Store file information in database
    const document = await prisma.associatedDocument.create({
      data: {
        docName: file.name,
        docURL: `/uploads/documents/${fileName}`,
        uploadedBy: user.id,
        docType: docType,
        orderId: orderId || null // orderId can be null for temporary uploads
      }
    })

    return NextResponse.json({
      success: true,
      documentId: document.id,
      fileName: file.name,
      fileUrl: document.docURL,
      message: 'File uploaded successfully'
    })

  } catch (error) {
    console.error('Error uploading file:', error)
    
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

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return NextResponse.json(
        { success: false, message: 'Document ID required' },
        { status: 400 }
      )
    }

    // Find the document
    const document = await prisma.associatedDocument.findUnique({
      where: { id: documentId }
    })

    if (!document) {
      return NextResponse.json(
        { success: false, message: 'Document not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to delete (must be uploader or admin)
    if (document.uploadedBy !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Permission denied' },
        { status: 403 }
      )
    }

    // Delete file from filesystem
    try {
      const fs = require('fs').promises
      const filePath = join(process.cwd(), 'uploads', 'documents', document.docURL.split('/').pop()!)
      await fs.unlink(filePath)
    } catch (error) {
      console.warn('Could not delete file from filesystem:', error)
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await prisma.associatedDocument.delete({
      where: { id: documentId }
    })

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting document:', error)
    
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
