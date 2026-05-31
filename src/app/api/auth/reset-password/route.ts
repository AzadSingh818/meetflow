export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { verifyResetToken } from '@/lib/reset-token'
import { z } from 'zod'

const schema = z.object({
  token:    z.string().min(1, 'Token is required'),
  password: z.string()
    .min(8,  'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { token, password } = parsed.data

    // Verify and decode the token
    const decoded = verifyResetToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'This reset link is invalid or has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    await connectDB()

    // Fetch user and make sure they still exist
    const user = await User.findById(decoded.userId).select('+password')
    if (!user) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 })
    }

    // Guard: Google OAuth users have no password field
    if (!user.password) {
      return NextResponse.json(
        { error: 'This account uses Google sign-in. Password reset is not available.' },
        { status: 400 }
      )
    }

    // The User model's pre-save hook will hash the new password automatically
    user.password = password
    await user.save()

    return NextResponse.json({ message: 'Password updated successfully. You can now sign in.' })
  } catch (err) {
    console.error('[POST /api/auth/reset-password]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}