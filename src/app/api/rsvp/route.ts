import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Meeting from '@/models/Meeting'
import { verifyRsvpToken } from '@/lib/rsvp-token'

/**
 * GET /api/rsvp?meetingId=xxx&email=yyy&status=accepted&sig=zzz
 * Public endpoint — no session required.
 * Verifies the HMAC signature then updates the attendee status.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const parsed = verifyRsvpToken({
    meetingId: searchParams.get('meetingId'),
    email:     searchParams.get('email'),
    status:    searchParams.get('status'),
    sig:       searchParams.get('sig'),
  })

  if (!parsed) {
    return NextResponse.redirect(
      new URL('/rsvp?result=invalid', req.url)
    )
  }

  try {
    await connectDB()

    const meeting = await Meeting.findById(parsed.meetingId)
    if (!meeting) {
      return NextResponse.redirect(new URL('/rsvp?result=notfound', req.url))
    }

    if (meeting.status === 'cancelled') {
      return NextResponse.redirect(new URL('/rsvp?result=cancelled', req.url))
    }

    const idx = meeting.attendees.findIndex(
      (a: { email: string }) => a.email === parsed.email
    )

    if (idx === -1) {
      return NextResponse.redirect(new URL('/rsvp?result=notattendee', req.url))
    }

    meeting.attendees[idx].status = parsed.status
    await meeting.save()

    const params = new URLSearchParams({
      result:    'success',
      status:    parsed.status,
      title:     meeting.title,
      startTime: meeting.startTime.toISOString(),
    })
    return NextResponse.redirect(new URL(`/rsvp?${params}`, req.url))
  } catch (err) {
    console.error('[GET /api/rsvp]', err)
    return NextResponse.redirect(new URL('/rsvp?result=error', req.url))
  }
}
