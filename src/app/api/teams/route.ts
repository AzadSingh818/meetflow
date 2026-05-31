import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Team from '@/models/Team'
import { z } from 'zod'

const createSchema = z.object({
  name:        z.string().min(2).max(80),
  description: z.string().max(500).optional(),
})

// GET /api/teams — list teams the user belongs to
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const teams = await Team.find({
      $or: [
        { owner: session.user.id },
        { 'members.user': session.user.id },
      ],
    })
      .populate('owner', 'name email image')
      .lean()

    return NextResponse.json(teams)
  } catch (err) {
    console.error('[GET /api/teams]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/teams — create a new team
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = createSchema.parse(body)

    await connectDB()

    const team = await Team.create({
      ...data,
      owner:   session.user.id,
      members: [{
        user:     session.user.id,
        email:    session.user.email,
        name:     session.user.name,
        role:     'admin',
        joinedAt: new Date(),
      }],
    })

    const populated = await Team.findById(team._id).populate('owner', 'name email image').lean()
    return NextResponse.json(populated, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    console.error('[POST /api/teams]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}