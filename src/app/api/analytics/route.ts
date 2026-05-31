import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Meeting from '@/models/Meeting'
import { subDays, startOfDay, format } from 'date-fns'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const userQuery = {
      $or: [
        { organizer: session.user.id },
        { 'attendees.email': session.user.email },
      ],
    }

    const now    = new Date()
    const ago30  = subDays(now, 30)
    const ago7   = subDays(now, 7)

    // ── Summary counts ──────────────────────────────────────────
    const [total, upcoming, thisWeek, completed, cancelled] = await Promise.all([
      Meeting.countDocuments({ ...userQuery }),
      Meeting.countDocuments({ ...userQuery, status: 'scheduled', startTime: { $gte: now } }),
      Meeting.countDocuments({ ...userQuery, startTime: { $gte: ago7, $lte: now } }),
      Meeting.countDocuments({ ...userQuery, status: 'completed' }),
      Meeting.countDocuments({ ...userQuery, status: 'cancelled' }),
    ])

    // ── Meetings per day (last 30 days) ─────────────────────────
    const meetingsLast30 = await Meeting.find({
      ...userQuery,
      startTime: { $gte: ago30 },
    }).select('startTime status').lean()

    // Build a map of date → count
    const dayMap: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      dayMap[format(subDays(now, i), 'MMM d')] = 0
    }
    for (const m of meetingsLast30) {
      const key = format(new Date(m.startTime), 'MMM d')
      if (key in dayMap) dayMap[key]++
    }
    const dailyData = Object.entries(dayMap).map(([date, count]) => ({ date, count }))

    // ── Attendee RSVP breakdown ─────────────────────────────────
    const myMeetings = await Meeting.find({
      organizer: session.user.id,
      startTime: { $gte: ago30 },
    }).select('attendees').lean()

    let rsvpAccepted = 0, rsvpDeclined = 0, rsvpPending = 0
    for (const m of myMeetings) {
      for (const a of m.attendees) {
        if (a.status === 'accepted')  rsvpAccepted++
        else if (a.status === 'declined') rsvpDeclined++
        else rsvpPending++
      }
    }

    // ── Top tags ────────────────────────────────────────────────
    const taggedMeetings = await Meeting.find({ ...userQuery }).select('tags').lean()
    const tagMap: Record<string, number> = {}
    for (const m of taggedMeetings) {
      for (const tag of m.tags) {
        tagMap[tag] = (tagMap[tag] ?? 0) + 1
      }
    }
    const topTags = Object.entries(tagMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag, count]) => ({ tag, count }))

    // ── Average meeting duration ────────────────────────────────
    const durationMeetings = await Meeting.find({ ...userQuery }).select('startTime endTime').lean()
    const avgDuration = durationMeetings.length === 0 ? 0 : Math.round(
      durationMeetings.reduce((sum, m) => {
        return sum + (new Date(m.endTime).getTime() - new Date(m.startTime).getTime()) / 60000
      }, 0) / durationMeetings.length
    )

    return NextResponse.json({
      summary:  { total, upcoming, thisWeek, completed, cancelled, avgDuration },
      daily:    dailyData,
      rsvp:     { accepted: rsvpAccepted, declined: rsvpDeclined, pending: rsvpPending },
      topTags,
    })
  } catch (err) {
    console.error('[GET /api/analytics]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}