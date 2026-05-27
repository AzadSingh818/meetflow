import { format } from 'date-fns'
import { randomUUID } from 'crypto'
import type { IMeeting } from '@/models/Meeting'
import Meeting from '@/models/Meeting'        // ← STATIC import, not dynamic
import { connectDB } from '@/lib/db'          // ← STATIC import, not dynamic

// ── Brevo config ───────────────────────────────────────────────────────────
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'
const FROM_EMAIL = process.env.EMAIL_FROM ?? 'noreply@meetflow.app'
const FROM_NAME  = process.env.EMAIL_FROM_NAME ?? 'MeetFlow'
const APP_URL    = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

// ── HTML invite template ───────────────────────────────────────────────────
function buildInviteHtml(p: {
  title: string; organizer: string; startTime: Date; endTime: Date
  location?: string; meetLink?: string; description?: string
  acceptUrl: string; declineUrl: string
}) {
  const dateStr = format(p.startTime, 'EEEE, MMMM d, yyyy')
  const timeStr = `${format(p.startTime, 'h:mm a')} – ${format(p.endTime, 'h:mm a')}`

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>body{margin:0;padding:0;background:#F8FAFC;font-family:Helvetica,Arial,sans-serif}</style></head>
<body><table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
<tr><td align="center"><table width="560" cellpadding="0" cellspacing="0"
  style="background:#fff;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden">
  <tr><td style="background:#2563EB;padding:28px 32px">
    <p style="margin:0;font-size:12px;font-weight:600;color:#BFDBFE;letter-spacing:1px;text-transform:uppercase">Meeting Invitation</p>
    <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#fff">${p.title}</h1>
  </td></tr>
  <tr><td style="padding:28px 32px">
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6">
      <strong style="color:#0F172A">${p.organizer}</strong> has invited you to a meeting.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:12px 0;border-top:1px solid #F1F5F9;vertical-align:top;width:28px">
        <span style="font-size:16px">📅</span></td>
        <td style="padding:12px 0 12px 12px;border-top:1px solid #F1F5F9">
          <p style="margin:0;font-size:12px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:0.5px">Date &amp; Time</p>
          <p style="margin:4px 0 0;font-size:15px;color:#0F172A">${dateStr}</p>
          <p style="margin:2px 0 0;font-size:14px;color:#475569">${timeStr}</p>
      </td></tr>
      ${p.location ? `<tr><td style="padding:12px 0;border-top:1px solid #F1F5F9;vertical-align:top;width:28px">
        <span style="font-size:16px">📍</span></td>
        <td style="padding:12px 0 12px 12px;border-top:1px solid #F1F5F9">
          <p style="margin:0;font-size:12px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:0.5px">Location</p>
          <p style="margin:4px 0 0;font-size:15px;color:#0F172A">${p.location}</p>
      </td></tr>` : ''}
      ${p.description ? `<tr><td style="padding:12px 0;border-top:1px solid #F1F5F9;vertical-align:top;width:28px">
        <span style="font-size:16px">📝</span></td>
        <td style="padding:12px 0 12px 12px;border-top:1px solid #F1F5F9">
          <p style="margin:0;font-size:12px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:0.5px">About</p>
          <p style="margin:4px 0 0;font-size:14px;color:#475569;line-height:1.6">${p.description}</p>
      </td></tr>` : ''}
    </table>

    ${p.meetLink ? `<div style="margin:24px 0 0;text-align:center">
      <a href="${p.meetLink}" style="display:inline-block;background:#2563EB;color:#fff;font-size:15px;
         font-weight:600;padding:14px 32px;border-radius:10px;text-decoration:none">Join Meeting</a>
      <p style="margin:10px 0 0;font-size:12px;color:#94A3B8">Or copy: <a href="${p.meetLink}" style="color:#2563EB">${p.meetLink}</a></p>
    </div>` : ''}

    <!-- ── RSVP buttons ── -->
    <div style="margin:28px 0 0;padding:20px;background:#F8FAFC;border-radius:12px;border:1px solid #E2E8F0;text-align:center">
      <p style="margin:0 0 14px;font-size:13px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.5px">
        Will you attend?
      </p>
      <table cellpadding="0" cellspacing="0" style="margin:0 auto">
        <tr>
          <td style="padding-right:10px">
            <a href="${p.acceptUrl}"
               style="display:inline-block;background:#16A34A;color:#fff;font-size:14px;font-weight:600;
                      padding:12px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.2px">
              ✓ &nbsp;Accept
            </a>
          </td>
          <td>
            <a href="${p.declineUrl}"
               style="display:inline-block;background:#fff;color:#DC2626;font-size:14px;font-weight:600;
                      padding:12px 28px;border-radius:8px;text-decoration:none;border:1.5px solid #FECACA;
                      letter-spacing:0.2px">
              ✕ &nbsp;Decline
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:12px 0 0;font-size:11px;color:#94A3B8">
        You can change your response at any time by clicking the link again.
      </p>
    </div>
    <!-- ── end RSVP ── -->

  </td></tr>
  <tr><td style="padding:18px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0">
    <p style="margin:0;font-size:12px;color:#94A3B8;text-align:center">
      Sent via <strong style="color:#64748B">MeetFlow</strong> · You received this as a meeting attendee.
    </p>
  </td></tr>
</table></td></tr></table></body></html>`
}

// ── Helper: send one email via Brevo REST API ─────────────────────────────
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'accept':       'application/json',
      'content-type': 'application/json',
      'api-key':      process.env.BREVO_API_KEY!,
    },
    body: JSON.stringify({
      sender:      { name: FROM_NAME, email: FROM_EMAIL },
      to:          [{ email: to }],
      subject,
      htmlContent: html,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Brevo API error ${res.status}: ${error}`)
  }
}

// ── Send invites to all attendees ─────────────────────────────────────────
export async function sendMeetingInvites(meeting: IMeeting, organizerName: string) {
  if (!process.env.BREVO_API_KEY) {
    console.warn('[email] BREVO_API_KEY not set — skipping invite emails')
    return
  }

  await connectDB()

  // ── Step 1: Load current meeting from DB ──────────────────────────────
  const currentMeeting = await Meeting.findById(meeting._id)
  if (!currentMeeting) {
    console.error('[email] Meeting not found — aborting invites')
    return
  }

  console.log('[email] attendees loaded:', currentMeeting.attendees.map((a: any) => ({
    email: a.email, existingToken: a.rsvpToken
  })))

  // ── Step 2: Build $set payload with one token per attendee ────────────
  const tokenUpdates: Record<string, string> = {}

  currentMeeting.attendees.forEach((attendee: any, idx: number) => {
    if (!attendee.email) return
    const token = (attendee.rsvpToken as string | undefined) ?? randomUUID()
    tokenUpdates[`attendees.${idx}.rsvpToken`] = token
  })

  console.log('[email] writing tokens:', tokenUpdates)

  // ── Step 3: Write tokens directly to MongoDB ──────────────────────────
  const updateResult = await Meeting.updateOne(
    { _id: currentMeeting._id },
    { $set: tokenUpdates }
  )

  console.log('[email] updateOne result:', JSON.stringify(updateResult))

  // ── Step 4: Reload to confirm tokens persisted ────────────────────────
  const freshMeeting = await Meeting.findById(currentMeeting._id)
  if (!freshMeeting) {
    console.error('[email] Meeting not found after token save — aborting')
    return
  }

  console.log('[email] tokens confirmed in DB:', freshMeeting.attendees.map((a: any) => ({
    email: a.email, token: a.rsvpToken
  })))

  // ── Step 5: Send each invite using DB-confirmed tokens ────────────────
  await Promise.allSettled(
    freshMeeting.attendees
      .filter((a: any) => !!a.email)
      .map((attendee: any) => {
        const base       = `${APP_URL}/api/meetings/${freshMeeting._id}/rsvp`
        const acceptUrl  = `${base}?token=${attendee.rsvpToken}&action=accept`
        const declineUrl = `${base}?token=${attendee.rsvpToken}&action=decline`

        console.log(`[email] sending to ${attendee.email} with token ${attendee.rsvpToken}`)

        return sendEmail(
          attendee.email,
          `Meeting invite: ${freshMeeting.title}`,
          buildInviteHtml({
            title:       freshMeeting.title,
            organizer:   organizerName,
            startTime:   freshMeeting.startTime,
            endTime:     freshMeeting.endTime,
            location:    freshMeeting.location,
            meetLink:    freshMeeting.meetLink,
            description: freshMeeting.description,
            acceptUrl,
            declineUrl,
          })
        ).catch(err => console.error(`[email] Failed → ${attendee.email}:`, err))
      })
  )
}

// ── Cancellation notice ───────────────────────────────────────────────────
export async function sendCancellationNotice(meeting: IMeeting, organizerName: string) {
  if (!process.env.BREVO_API_KEY) return

  const recipients = meeting.attendees.map(a => a.email).filter(Boolean)
  if (!recipients.length) return

  const html = `
    <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:40px 20px">
      <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:28px 32px">
        <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#DC2626;text-transform:uppercase;letter-spacing:1px">
          Meeting Cancelled
        </p>
        <h2 style="margin:0 0 16px;font-size:20px;color:#0F172A">${meeting.title}</h2>
        <p style="margin:0;font-size:15px;color:#475569;line-height:1.6">
          This meeting scheduled for
          <strong>${format(meeting.startTime, 'MMMM d, yyyy')}</strong>
          has been cancelled by <strong>${organizerName}</strong>.
        </p>
      </div>
      <p style="margin:20px 0 0;font-size:12px;color:#94A3B8;text-align:center">
        Sent via <strong>MeetFlow</strong>
      </p>
    </div>`

  await Promise.allSettled(
    recipients.map(email =>
      sendEmail(email, `Cancelled: ${meeting.title}`, html).catch(console.error)
    )
  )
}