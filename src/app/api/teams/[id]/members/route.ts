import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Team from '@/models/Team'
import User from '@/models/User'
import { z } from 'zod'

interface Params { params: { id: string } }

const inviteSchema = z.object({
  email: z.string().email(),
  role:  z.enum(['admin','organizer','member']).default('member'),
})

// POST /api/teams/:id/members — invite a user by email
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const team = await Team.findById(params.id)
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

    const isAdmin = team.owner.toString() === session.user.id ||
      team.members.some((m: any) => m.user.toString() === session.user.id && m.role === 'admin')

    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins can invite members' }, { status: 403 })
    }

    const body = await req.json()
    const { email, role } = inviteSchema.parse(body)

    // Check not already a member
    const alreadyMember = team.members.some((m: any) => m.email === email.toLowerCase())
    if (alreadyMember) {
      return NextResponse.json({ error: 'This person is already a member' }, { status: 409 })
    }

    // Look up user by email (they must have an account)
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return NextResponse.json({ error: 'No MeetFlow account found for this email' }, { status: 404 })
    }

    team.members.push({
      user:     user._id,
      email:    user.email,
      name:     user.name,
      role,
      joinedAt: new Date(),
    })
    await team.save()

    const updated = await Team.findById(params.id)
      .populate('owner', 'name email image')
      .populate('members.user', 'name email image')
      .lean()

    return NextResponse.json(updated)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    console.error('[POST /api/teams/:id/members]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/teams/:id/members?email=xxx — remove a member
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const email = new URL(req.url).searchParams.get('email')
    if (!email) return NextResponse.json({ error: 'email param required' }, { status: 400 })

    await connectDB()
    const team = await Team.findById(params.id)
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

    const isAdmin = team.owner.toString() === session.user.id ||
      team.members.some((m: any) => m.user.toString() === session.user.id && m.role === 'admin')
    const isSelf  = session.user.email === email.toLowerCase()

    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
    }

    // Cannot remove the owner
    const ownerMember = team.members.find((m: any) => m.user.toString() === team.owner.toString())
    if (ownerMember?.email === email.toLowerCase()) {
      return NextResponse.json({ error: 'Cannot remove the team owner' }, { status: 400 })
    }

    team.members = team.members.filter((m: any) => m.email !== email.toLowerCase())
    await team.save()

    return NextResponse.json({ message: 'Member removed' })
  } catch (err) {
    console.error('[DELETE /api/teams/:id/members]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}