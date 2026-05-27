import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { registerSchema } from '@/lib/validations'
import { ZodError } from 'zod'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password } = registerSchema.parse(body)

    await connectDB()

    const existing = await User.findOne({ email })
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    const user = await User.create({ name, email, password })

    return NextResponse.json(
      { message: 'Account created successfully', userId: user._id.toString() },
      { status: 201 }
    )
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: err.errors[0].message },
        { status: 400 }
      )
    }
    console.error('[REGISTER]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
