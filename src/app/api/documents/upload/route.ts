import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import cloudinary from '@/lib/cloudinary'
import MeetDocument from '@/models/MeetDocument'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await req.formData()

    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()

    const buffer = Buffer.from(bytes)

    const uploadResult: any = await new Promise(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: 'auto',
              folder: 'meetflow-documents',
            },
            (error, result) => {
              if (error) reject(error)
              else resolve(result)
            }
          )
          .end(buffer)
      }
    )

    await connectDB()

    const doc = await MeetDocument.create({
      owner: session.user.id,
      name: file.name,
      type: 'other',
      url: uploadResult.secure_url,
      storagePath: uploadResult.public_id,
      size: file.size,
      mimeType: file.type,
    })

    return NextResponse.json(doc)
  } catch (err) {
    console.error(err)

    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}