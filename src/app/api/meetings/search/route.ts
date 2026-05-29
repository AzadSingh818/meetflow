import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Meeting from '@/models/Meeting'

/**
 * GET /api/meetings/search?q=standup&limit=8
 * Returns meetings matching the search query (title, description, tags).
 * Uses MongoDB $text index.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const q     = searchParams.get('q')?.trim()
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 20)

    if (!q || q.length < 2) {
      return NextResponse.json([])
    }

    await connectDB()

    const meetings = await Meeting.find(
      {
        $text: { $search: q },
        status: { $ne: 'cancelled' },
        $or: [
          { organizer: session.user.id },
          { 'attendees.email': session.user.email },
        ],
      },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .populate('organizer', 'name email')
      .lean()

    return NextResponse.json(meetings)
  } catch (err) {
    console.error('[GET /api/meetings/search]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
