import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import MeetDocument from '@/models/MeetDocument'

// ─────────────────────────────────────────────────────────────
// GET ALL DOCUMENTS
// ─────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const documents = await MeetDocument.find({
      owner: session.user.id,
    })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(documents)

  } catch (error) {
    console.error('[GET /api/documents]', error)

    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────
// CREATE DOCUMENT
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()

    const {
      name,
      type,
      url,
      storagePath,
      size,
      mimeType,
    } = body

    // Validation
    if (!name || !url) {
      return NextResponse.json(
        { error: 'name and url are required' },
        { status: 400 }
      )
    }

    await connectDB()

    const document = await MeetDocument.create({
      owner: session.user.id,
      name,
      type: type || 'other',
      url,
      storagePath: storagePath || '',
      size: size || 0,
      mimeType: mimeType || 'application/octet-stream',
    })

    return NextResponse.json(document, { status: 201 })

  } catch (error) {
    console.error('[POST /api/documents]', error)

    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE DOCUMENT
// ─────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)

    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    await connectDB()

    const document = await MeetDocument.findOne({
      _id: id,
      owner: session.user.id,
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    await MeetDocument.findByIdAndDelete(id)

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    })

  } catch (error) {
    console.error('[DELETE /api/documents]', error)

    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}