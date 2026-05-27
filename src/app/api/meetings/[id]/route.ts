import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Meeting from '@/models/Meeting'
import { createMeetingSchema } from '@/lib/validations'
import { ZodError } from 'zod'
import mongoose from 'mongoose'

interface Params { params: { id: string } }

function isValidId(id: string) {
  return mongoose.Types.ObjectId.isValid(id)
}

// ── GET /api/meetings/[id] ────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isValidId(params.id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

    await connectDB()

    const meeting = await Meeting
      .findById(params.id)
      .populate('organizer', 'name email image')
      .lean()

    if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })

    // Allow organizer or attendees to view
    const isOrganizer = meeting.organizer._id?.toString() === session.user.id
    const isAttendee  = meeting.attendees?.some(
      (a: { email: string }) => a.email === session.user.email
    )

    if (!isOrganizer && !isAttendee) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(meeting)
  } catch (err) {
    console.error('[GET /api/meetings/:id]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── PUT /api/meetings/[id] ────────────────────────────────────────────────
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isValidId(params.id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

    await connectDB()

    const meeting = await Meeting.findById(params.id)
    if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    if (meeting.organizer.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Only the organizer can edit this meeting' }, { status: 403 })
    }

    const body = await req.json()
    const data = createMeetingSchema._def.schema.partial().parse(body)

    const updated = await Meeting
      .findByIdAndUpdate(params.id, { $set: data }, { new: true, runValidators: true })
      .populate('organizer', 'name email image')
      .lean()

    return NextResponse.json(updated)
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    console.error('[PUT /api/meetings/:id]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── DELETE /api/meetings/[id] ─────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isValidId(params.id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

    await connectDB()

    const meeting = await Meeting.findById(params.id)
    if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    if (meeting.organizer.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Only the organizer can delete this meeting' }, { status: 403 })
    }

    await Meeting.findByIdAndDelete(params.id)
    return NextResponse.json({ message: 'Meeting deleted successfully' })
  } catch (err) {
    console.error('[DELETE /api/meetings/:id]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}