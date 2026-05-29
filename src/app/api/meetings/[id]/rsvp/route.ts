import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Meeting from '@/models/Meeting'
import { verifyRsvpToken } from '@/lib/rsvp-token'
import { z } from 'zod'
import mongoose from 'mongoose'

const rsvpSchema = z.object({
  status: z.enum(['accepted', 'declined']),
})

interface Params { params: { id: string } }

function isValidId(id: string) {
  return mongoose.Types.ObjectId.isValid(id)
}

const APP_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

// ── GET /api/meetings/[id]/rsvp?email=xxx&action=accept|decline&sig=yyy ───
// Called when attendee clicks Accept/Decline in their email (no session needed)
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { searchParams } = new URL(req.url)

    // Verify the HMAC signature
    const verified = verifyRsvpToken({
      meetingId: params.id,
      email:     searchParams.get('email'),
      action:    searchParams.get('action'),
      sig:       searchParams.get('sig'),
    })

    if (!verified) {
      return NextResponse.redirect(`${APP_URL}/rsvp-error?reason=invalid_link`)
    }

    if (!isValidId(params.id)) {
      return NextResponse.redirect(`${APP_URL}/rsvp-error?reason=invalid_link`)
    }

    await connectDB()

    const meeting = await Meeting.findById(params.id)
    if (!meeting) {
      return NextResponse.redirect(`${APP_URL}/rsvp-error?reason=not_found`)
    }

    // Find attendee by email
    const attendees = meeting.attendees as any[]
    const attendeeIdx = attendees.findIndex(
      (a) => a.email.toLowerCase() === verified.email.toLowerCase()
    )

    if (attendeeIdx === -1) {
      return NextResponse.redirect(`${APP_URL}/rsvp-error?reason=not_attendee`)
    }

    meeting.attendees[attendeeIdx].status = verified.status
    await meeting.save()

    const attendeeEmail = encodeURIComponent(verified.email)
    return NextResponse.redirect(
      `${APP_URL}/rsvp-confirmed?status=${verified.status}&meeting=${encodeURIComponent(meeting.title)}&email=${attendeeEmail}`
    )
  } catch (err) {
    console.error('[GET /api/meetings/:id/rsvp]', err)
    return NextResponse.redirect(`${APP_URL}/rsvp-error?reason=server_error`)
  }
}

// ── POST /api/meetings/[id]/rsvp ──────────────────────────────────────────
// Called from the in-app RSVPButtons (session required)
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isValidId(params.id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

    const body = await req.json()
    const { status } = rsvpSchema.parse(body)

    await connectDB()

    const meeting = await Meeting.findById(params.id)
    if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })

    const attendees   = meeting.attendees as any[]
    const attendeeIdx = attendees.findIndex(
      (a) => a.email === session.user.email
    )

    if (attendeeIdx === -1) {
      return NextResponse.json({ error: 'You are not an attendee' }, { status: 400 })
    }

    meeting.attendees[attendeeIdx].status = status
    await meeting.save()

    const updated = await Meeting.findById(params.id)
      .populate('organizer', 'name email image')
      .lean()

    return NextResponse.json(updated)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    console.error('[POST /api/meetings/:id/rsvp]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}