import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Meeting from '@/models/Meeting'

function esc(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

function toUtc(dt: Date | string) {
  const d = new Date(dt)
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mi = String(d.getUTCMinutes()).padStart(2, '0')
  const ss = String(d.getUTCSeconds()).padStart(2, '0')
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`
}

function buildIcal(meetings: any[], productName = 'MeetFlow') {
  const now = toUtc(new Date())
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${productName}//${productName} Calendar//EN`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  for (const meeting of meetings) {
    const start = meeting?.startTime ? toUtc(meeting.startTime) : now
    const end = meeting?.endTime ? toUtc(meeting.endTime) : start
    const uid = String(meeting?._id || `${start}-${Math.random().toString(36).slice(2)}`)
    const title = esc(String(meeting?.title || 'Meeting'))
    const description = esc(String(meeting?.description || ''))
    const location = esc(String(meeting?.location || ''))

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}@meetflow`,
      `DTSTAMP:${now}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      'END:VEVENT'
    )
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const meetings = await Meeting.find({
      $or: [
        { organizer: session.user.id },
        { 'attendees.email': session.user.email },
      ],
    })
      .sort({ startTime: 1 })
      .lean()

    const ical = meetings.length > 0
      ? buildIcal(meetings as any, 'MeetFlow')
      : [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//MeetFlow//MeetFlow Calendar//EN',
          'CALSCALE:GREGORIAN',
          'METHOD:PUBLISH',
          'END:VCALENDAR',
        ].join('\r\n')

    // IMPORTANT:
    //   Content-Type  → tells the OS this is a calendar file
    //   Content-Disposition: attachment  → forces download, never opens mail
    //   The actual "open in Calendar app" happens on the client side when
    //   the browser downloads the .ics and the OS opens it with the default
    //   calendar application (Calendar on Mac/iOS, Outlook on Windows, etc.)
    return new NextResponse(ical, {
      status: 200,
      headers: {
        'Content-Type':              'text/calendar; charset=utf-8',
        'Content-Disposition':       'attachment; filename="meetflow.ics"',
        'Cache-Control':             'no-store, no-cache',
        'X-Content-Type-Options':    'nosniff',
      },
    })
  } catch (err) {
    console.error('[GET /api/meetings/export]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}