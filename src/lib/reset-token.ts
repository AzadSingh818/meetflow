/**
 * lib/reset-token.ts
 */

import { createHmac } from 'crypto'

const SECRET      = process.env.NEXTAUTH_SECRET ?? 'fallback-secret'
const TTL_SECONDS = 60 * 60   // 1 hour

interface TokenPayload {
  userId: string
  email:  string
  exp:    number
}

function sign(data: string): string {
  return createHmac('sha256', SECRET).update(data).digest('hex')
}
function toBase64url(str: string): string {
  return Buffer.from(str).toString('base64url')
}
function fromBase64url(str: string): string {
  return Buffer.from(str, 'base64url').toString('utf8')
}

export function buildResetToken(userId: string, email: string): string {
  const payload: TokenPayload = {
    userId,
    email: email.toLowerCase(),
    exp:   Math.floor(Date.now() / 1000) + TTL_SECONDS,
  }
  const encoded = toBase64url(JSON.stringify(payload))
  const sig     = sign(encoded)
  return `${encoded}.${sig}`
}

export function buildResetUrl(userId: string, email: string): string {
  const token = buildResetToken(userId, email)

  // ✅ FIX 2: strip trailing slash so URL doesn't become /reset-password//reset-password
  const base = (process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '')

  return `${base}/reset-password?token=${encodeURIComponent(token)}`
}

export function verifyResetToken(
  raw: string
): { userId: string; email: string } | null {
  try {
    const dot = raw.lastIndexOf('.')
    if (dot === -1) return null

    const encoded  = raw.slice(0, dot)
    const sig      = raw.slice(dot + 1)
    const expected = sign(encoded)

    if (expected.length !== sig.length) return null
    let diff = 0
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
    }
    if (diff !== 0) return null

    const payload: TokenPayload = JSON.parse(fromBase64url(encoded))

    if (Math.floor(Date.now() / 1000) > payload.exp) return null

    return { userId: payload.userId, email: payload.email }
  } catch {
    return null
  }
}