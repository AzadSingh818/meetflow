import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Meeting from '@/models/Meeting'
import { createMeetingSchema } from '@/lib/validations'
import { ZodError } from 'zod'
import { sendMeetingInvites } from '@/lib/email'

// GET /api/meetings — list all meetings for current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const { searchParams } = new URL(req.url)
    const status    = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate   = searchParams.get('endDate')

    const query: Record<string, unknown> = {
      $or: [
        { organizer: session.user.id },
        { 'attendees.email': session.user.email },
      ],
    }

    if (status)    query.status    = status
    if (startDate) query.startTime = { ...((query.startTime as object) ?? {}), $gte: new Date(startDate) }
    if (endDate)   query.endTime   = { ...((query.endTime   as object) ?? {}), $lte: new Date(endDate) }

    const meetings = await Meeting
      .find(query)
      .populate('organizer', 'name email image')
      .sort({ startTime: 1 })
      .lean()

    return NextResponse.json(meetings)
  } catch (err) {
    console.error('[GET /api/meetings]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/meetings — create a new meeting
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = createMeetingSchema.parse(body)

    await connectDB()

    const meeting = await Meeting.create({
      ...data,
      organizer: session.user.id,
      startTime: new Date(data.startTime),
      endTime:   new Date(data.endTime),
    })

    // Pass live Mongoose document (no .lean()) so .save() works inside sendMeetingInvites
    const meetingForEmail = await Meeting
      .findById(meeting._id)
      .populate('organizer', 'name email')

    if (meetingForEmail) {
      await sendMeetingInvites(meetingForEmail, session.user.name ?? 'Someone')
    }

    // Separate lean query for the API response
    const populated = await Meeting
      .findById(meeting._id)
      .populate('organizer', 'name email image')
      .lean()

    return NextResponse.json(populated, { status: 201 })
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    console.error('[POST /api/meetings]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}