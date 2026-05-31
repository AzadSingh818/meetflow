import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Team from '@/models/Team'
import { z } from 'zod'
import mongoose from 'mongoose'

interface Params { params: { id: string } }

const updateSchema = z.object({
  name:        z.string().min(2).max(80).optional(),
  description: z.string().max(500).optional(),
})

function isAdminOrOwner(team: any, userId: string) {
  if (team.owner._id?.toString() === userId || team.owner.toString?.() === userId) return true
  return team.members.some((m: any) =>
    (m.user._id?.toString() ?? m.user.toString()) === userId && m.role === 'admin'
  )
}

// GET /api/teams/:id
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    await connectDB()

    const team = await Team.findById(params.id)
      .populate('owner', 'name email image')
      .populate('members.user', 'name email image')
      .lean()

    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

    const isMember = (team.owner as any)._id.toString() === session.user.id ||
      team.members.some((m: any) =>
        (m.user._id?.toString() ?? m.user.toString()) === session.user.id
      )

    if (!isMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    return NextResponse.json(team)
  } catch (err) {
    console.error('[GET /api/teams/:id]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/teams/:id — update (admin only)
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const team = await Team.findById(params.id)
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    if (!isAdminOrOwner(team, session.user.id)) {
      return NextResponse.json({ error: 'Only admins can edit the team' }, { status: 403 })
    }

    const body = await req.json()
    const data = updateSchema.parse(body)

    const updated = await Team.findByIdAndUpdate(params.id, { $set: data }, { new: true })
      .populate('owner', 'name email image')
      .lean()

    return NextResponse.json(updated)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    console.error('[PUT /api/teams/:id]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/teams/:id — owner only
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const team = await Team.findById(params.id)
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

    const ownerId = team.owner.toString()
    if (ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Only the owner can delete the team' }, { status: 403 })
    }

    await Team.findByIdAndDelete(params.id)
    return NextResponse.json({ message: 'Team deleted' })
  } catch (err) {
    console.error('[DELETE /api/teams/:id]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}