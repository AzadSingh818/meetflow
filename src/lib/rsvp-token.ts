/**
 * lib/rsvp-token.ts
 * Signs and verifies one-time RSVP tokens embedded in invite emails.
 * Uses HMAC-SHA256 with NEXTAUTH_SECRET — no extra packages needed.
 */

import { createHmac } from 'crypto'

const SECRET = process.env.NEXTAUTH_SECRET ?? 'fallback-secret-change-me'

function sign(payload: string): string {
  return createHmac('sha256', SECRET).update(payload).digest('hex')
}

/**
 * Build a signed RSVP URL to embed in the email.
 * Format: /api/meetings/[id]/rsvp?email=yyy&action=accept&sig=zzz
 */
export function buildRsvpUrl(
  meetingId: string,
  email:     string,
  status:    'accepted' | 'declined'
): string {
  const action  = status === 'accepted' ? 'accept' : 'decline'
  const payload = `${meetingId}:${email}:${status}`
  const sig     = sign(payload)
  const base    = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const params  = new URLSearchParams({ email, action, sig })
  return `${base}/api/meetings/${meetingId}/rsvp?${params.toString()}`
}

/**
 * Verify a signed RSVP URL query string.
 * Returns the parsed params if valid, null otherwise.
 */
export function verifyRsvpToken(params: {
  meetingId?: string | null
  email?:     string | null
  action?:    string | null
  sig?:       string | null
}): { meetingId: string; email: string; status: 'accepted' | 'declined' } | null {
  const { meetingId, email, action, sig } = params

  if (!meetingId || !email || !action || !sig) return null
  if (action !== 'accept' && action !== 'decline') return null

  const status   = action === 'accept' ? 'accepted' : 'declined'
  const payload  = `${meetingId}:${email}:${status}`
  const expected = sign(payload)

  // Constant-time comparison to prevent timing attacks
  if (expected.length !== sig.length) return null
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
  }
  if (diff !== 0) return null

  return { meetingId, email, status }
}