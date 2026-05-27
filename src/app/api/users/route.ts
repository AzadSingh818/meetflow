import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  timezone: z.string().optional(),
  image: z.string().url().optional(),
})

// ─────────────────────────────────────────────────────────────
// GET /api/users
// ─────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    // FIX:
    // Use email instead of session.user.id
    // because id is missing/null in your session
    const user = await User.findOne({
      email: session.user.email,
    }).lean()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (err) {
    console.error('[GET /api/users]', err)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────
// PUT /api/users
// ─────────────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()

    const data = updateSchema.parse(body)

    await connectDB()

    // FIX:
    // Update using email instead of session.user.id
    const user = await User.findOneAndUpdate(
      {
        email: session.user.email,
      },
      {
        $set: data,
      },
      {
        new: true,
        runValidators: true,
      }
    ).lean()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0].message },
        { status: 400 }
      )
    }

    console.error('[PUT /api/users]', err)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}