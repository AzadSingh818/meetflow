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
 * Format: /rsvp?meetingId=xxx&email=yyy&status=accepted&sig=zzz
 */
export function buildRsvpUrl(
  meetingId: string,
  email: string,
  status: 'accepted' | 'declined'
): string {
  const payload = `${meetingId}:${email}:${status}`
  const sig     = sign(payload)
  const base    = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const params  = new URLSearchParams({ meetingId, email, status, sig })
  return `${base}/rsvp?${params.toString()}`
}

/**
 * Verify a signed RSVP URL query string.
 * Returns the parsed params if valid, null otherwise.
 */
export function verifyRsvpToken(params: {
  meetingId?: string | null
  email?:     string | null
  status?:    string | null
  sig?:       string | null
}): { meetingId: string; email: string; status: 'accepted' | 'declined' } | null {
  const { meetingId, email, status, sig } = params

  if (!meetingId || !email || !status || !sig) return null
  if (status !== 'accepted' && status !== 'declined') return null

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
