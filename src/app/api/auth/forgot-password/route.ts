export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { buildResetUrl } from '@/lib/reset-token'

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'
const FROM = process.env.EMAIL_FROM ?? 'noreply@meetflow.app'
const FROM_NAME = process.env.EMAIL_FROM_NAME ?? 'MeetFlow'

async function sendResetEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) return false

  const res = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: {
        name: FROM_NAME,
        email: FROM,
      },
      to: [
        {
          email: to,
        },
      ],
      subject,
      htmlContent: html,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Brevo API error (${res.status}): ${text}`)
  }

  return true
}

function resetEmailHtml(name: string, resetUrl: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0"
  style="background:#fff;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden">

  <!-- Header -->
  <tr><td style="background:#2563EB;padding:28px 32px">
    <p style="margin:0;font-size:12px;font-weight:600;color:#BFDBFE;letter-spacing:1px;text-transform:uppercase">
      Password Reset
    </p>
    <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#fff">Reset your password</h1>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:32px">
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6">
      Hi <strong style="color:#0F172A">${name}</strong>,
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6">
      We received a request to reset your MeetFlow password.
      Click the button below to choose a new password.
      This link expires in <strong style="color:#0F172A">1 hour</strong>.
    </p>

    <div style="text-align:center;margin:28px 0">
      <a href="${resetUrl}"
        style="display:inline-block;background:#2563EB;color:#fff;font-size:15px;
               font-weight:600;padding:14px 32px;border-radius:10px;text-decoration:none">
        Reset password
      </a>
    </div>

    <p style="margin:0;font-size:13px;color:#94A3B8;line-height:1.6">
      If you didn't request a password reset, you can safely ignore this email —
      your password will not be changed.
    </p>
    <p style="margin:12px 0 0;font-size:12px;color:#CBD5E1;word-break:break-all">
      Or copy this link: ${resetUrl}
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:18px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0">
    <p style="margin:0;font-size:12px;color:#94A3B8;text-align:center">
      Sent via <strong style="color:#64748B">MeetFlow</strong>
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    await connectDB()

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    })

    /*
     * Always return 200 even if the email doesn't exist.
     * This prevents user enumeration attacks.
     */
    if (!user) {
      return NextResponse.json({
        message: 'If that email exists, a reset link has been sent.',
      })
    }

    // Only email/password accounts can reset — Google OAuth users have no password
    if (!user.password) {
      return NextResponse.json({
        message: 'If that email exists, a reset link has been sent.',
      })
    }

    const resetUrl = buildResetUrl(
      user._id.toString(),
      user.email
    )

    if (process.env.BREVO_API_KEY) {
      await sendResetEmail(
        user.email,
        'Reset your MeetFlow password',
        resetEmailHtml(user.name ?? 'there', resetUrl)
      )
    } else {
      // Dev fallback — log the link so you can test without Brevo configured
      console.log('[forgot-password] Reset URL:', resetUrl)
    }

    return NextResponse.json({
      message: 'If that email exists, a reset link has been sent.',
    })
  } catch (err) {
    console.error('[POST /api/auth/forgot-password]', err)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}