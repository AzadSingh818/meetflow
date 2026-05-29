import { format } from 'date-fns'
import type { IMeeting } from '@/models/Meeting'
import { buildRsvpUrl } from '@/lib/rsvp-token'

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'
const FROM = process.env.EMAIL_FROM ?? 'noreply@meetflow.app'
const FROM_NAME = process.env.EMAIL_FROM_NAME ?? 'MeetFlow'

async function sendEmail(params: { to: string; subject: string; html: string }) {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) throw new Error('BREVO_API_KEY not set')

  const response = await fetch(BREVO_API_URL, {
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
      to: [{ email: params.to }],
      subject: params.subject,
      htmlContent: params.html,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Brevo send failed (${response.status}): ${errorText}`)
  }
}

// ── HTML invite template ───────────────────────────────────────────────────
function buildInviteHtml(p: {
  title: string; organizer: string; startTime: Date; endTime: Date
  location?: string; meetLink?: string; description?: string
  acceptUrl: string; declineUrl: string
}) {
  const dateStr = format(p.startTime, 'EEEE, MMMM d, yyyy')
  const timeStr = `${format(p.startTime, 'h:mm a')} \u2013 ${format(p.endTime, 'h:mm a')}`

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body{margin:0;padding:0;background:#F8FAFC;font-family:Helvetica,Arial,sans-serif}
  .btn{display:inline-block;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;text-align:center}
</style></head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0"
  style="background:#fff;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden">

  <!-- Header -->
  <tr><td style="background:#2563EB;padding:28px 32px">
    <p style="margin:0;font-size:12px;font-weight:600;color:#BFDBFE;letter-spacing:1px;text-transform:uppercase">Meeting Invitation</p>
    <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#fff">${p.title}</h1>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:28px 32px">
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6">
      <strong style="color:#0F172A">${p.organizer}</strong> has invited you to a meeting.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:12px 0;border-top:1px solid #F1F5F9;vertical-align:top;width:28px"><span style="font-size:16px">📅</span></td>
        <td style="padding:12px 0 12px 12px;border-top:1px solid #F1F5F9">
          <p style="margin:0;font-size:12px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:0.5px">Date &amp; Time</p>
          <p style="margin:4px 0 0;font-size:15px;color:#0F172A">${dateStr}</p>
          <p style="margin:2px 0 0;font-size:14px;color:#475569">${timeStr}</p>
        </td>
      </tr>
      ${p.location ? `
      <tr>
        <td style="padding:12px 0;border-top:1px solid #F1F5F9;vertical-align:top;width:28px"><span style="font-size:16px">📍</span></td>
        <td style="padding:12px 0 12px 12px;border-top:1px solid #F1F5F9">
          <p style="margin:0;font-size:12px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:0.5px">Location</p>
          <p style="margin:4px 0 0;font-size:15px;color:#0F172A">${p.location}</p>
        </td>
      </tr>` : ''}
      ${p.description ? `
      <tr>
        <td style="padding:12px 0;border-top:1px solid #F1F5F9;vertical-align:top;width:28px"><span style="font-size:16px">📝</span></td>
        <td style="padding:12px 0 12px 12px;border-top:1px solid #F1F5F9">
          <p style="margin:0;font-size:12px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:0.5px">About</p>
          <p style="margin:4px 0 0;font-size:14px;color:#475569;line-height:1.6">${p.description}</p>
        </td>
      </tr>` : ''}
    </table>

    ${p.meetLink ? `
    <div style="margin:24px 0 0;text-align:center">
      <a href="${p.meetLink}" class="btn" style="background:#2563EB;color:#fff">Join Meeting</a>
      <p style="margin:10px 0 0;font-size:12px;color:#94A3B8">Or copy: <a href="${p.meetLink}" style="color:#2563EB">${p.meetLink}</a></p>
    </div>` : ''}

    <!-- RSVP section -->
    <div style="margin:28px 0 0;padding:20px;background:#F8FAFC;border-radius:12px;border:1px solid #E2E8F0;text-align:center">
      <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#0F172A;text-transform:uppercase;letter-spacing:0.5px">Will you attend?</p>
      <table cellpadding="0" cellspacing="0" style="margin:0 auto">
        <tr>
          <td style="padding-right:10px">
            <a href="${p.acceptUrl}" class="btn" style="background:#059669;color:#fff">✓ Accept</a>
          </td>
          <td>
            <a href="${p.declineUrl}" class="btn" style="background:#fff;color:#DC2626;border:2px solid #DC2626">✕ Decline</a>
          </td>
        </tr>
      </table>
      <p style="margin:12px 0 0;font-size:11px;color:#94A3B8">You can change your response at any time by clicking the link again.</p>
    </div>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:18px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0">
    <p style="margin:0;font-size:12px;color:#94A3B8;text-align:center">
      Sent via <strong style="color:#64748B">MeetFlow</strong> &middot; You received this as a meeting attendee.
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`
}

// ── Reminder email template ────────────────────────────────────────────────
function buildReminderHtml(p: {
  title: string; startTime: Date; endTime: Date
  location?: string; meetLink?: string; minutesBefore: number
}) {
  const timeStr   = format(p.startTime, 'h:mm a')
  const dateStr   = format(p.startTime, 'EEEE, MMMM d')
  const timeLabel = p.minutesBefore >= 1440
    ? '1 day'
    : p.minutesBefore >= 60
      ? `${p.minutesBefore / 60} hour${p.minutesBefore / 60 > 1 ? 's' : ''}`
      : `${p.minutesBefore} minutes`

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0"
  style="background:#fff;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden">
  <tr><td style="background:#7C3AED;padding:24px 32px">
    <p style="margin:0;font-size:12px;font-weight:600;color:#DDD6FE;letter-spacing:1px;text-transform:uppercase">
      ⏰ Reminder — Starting in ${timeLabel}
    </p>
    <h1 style="margin:8px 0 0;font-size:20px;font-weight:700;color:#fff">${p.title}</h1>
  </td></tr>
  <tr><td style="padding:24px 32px">
    <p style="margin:0 0 16px;font-size:15px;color:#475569">
      Your meeting <strong style="color:#0F172A">${p.title}</strong> starts
      <strong style="color:#7C3AED">in ${timeLabel}</strong>.
    </p>
    <p style="margin:0;font-size:14px;color:#475569">
      📅 ${dateStr} &middot; ${timeStr}
      ${p.location ? `<br>📍 ${p.location}` : ''}
    </p>
    ${p.meetLink ? `
    <div style="margin:20px 0 0;text-align:center">
      <a href="${p.meetLink}" style="display:inline-block;background:#7C3AED;color:#fff;
         font-size:15px;font-weight:600;padding:12px 28px;border-radius:10px;text-decoration:none">
        Join Now
      </a>
    </div>` : ''}
  </td></tr>
  <tr><td style="padding:16px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0">
    <p style="margin:0;font-size:12px;color:#94A3B8;text-align:center">
      Sent via <strong style="color:#64748B">MeetFlow</strong>
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`
}

// ── Send invites to all attendees ──────────────────────────────────────────
export async function sendMeetingInvites(meeting: IMeeting, organizerName: string) {
  if (!process.env.BREVO_API_KEY) {
    console.warn('[email] BREVO_API_KEY not set — skipping invite emails')
    return
  }

  const recipients = meeting.attendees.filter(a => !!a.email)
  if (!recipients.length) return

  const base = {
    title:       meeting.title,
    organizer:   organizerName,
    startTime:   meeting.startTime,
    endTime:     meeting.endTime,
    location:    meeting.location,
    meetLink:    meeting.meetLink,
    description: meeting.description,
  }

  await Promise.allSettled(
    recipients.map(attendee =>
      sendEmail({
        to:      attendee.email,
        subject: `Meeting invite: ${meeting.title}`,
        html:    buildInviteHtml({
          ...base,
          acceptUrl:  buildRsvpUrl(meeting._id.toString(), attendee.email, 'accepted'),
          declineUrl: buildRsvpUrl(meeting._id.toString(), attendee.email, 'declined'),
        }),
      }).catch((err: any) => console.error(`[email] Failed → ${attendee.email}:`, err))
    )
  )
}

// ── Send reminder to all attendees ─────────────────────────────────────────
export async function sendMeetingReminder(meeting: IMeeting, minutesBefore: number) {
  if (!process.env.BREVO_API_KEY) return

  const recipients = meeting.attendees.map(a => a.email).filter(Boolean)
  if (!recipients.length) return

  const label = minutesBefore >= 1440 ? '1 day' : minutesBefore >= 60 ? `${minutesBefore / 60}h` : `${minutesBefore}m`

  await Promise.allSettled(
    recipients.map(email =>
      sendEmail({
        to:      email,
        subject: `Reminder (${label} away): ${meeting.title}`,
        html:    buildReminderHtml({
          title:        meeting.title,
          startTime:    meeting.startTime,
          endTime:      meeting.endTime,
          location:     meeting.location,
          meetLink:     meeting.meetLink,
          minutesBefore,
        }),
      }).catch(console.error)
    )
  )
}

// ── Send cancellation notice ───────────────────────────────────────────────
export async function sendCancellationNotice(meeting: IMeeting, organizerName: string) {
  if (!process.env.BREVO_API_KEY) return

  const recipients = meeting.attendees.map(a => a.email).filter(Boolean)
  if (!recipients.length) return

  await Promise.allSettled(
    recipients.map(email =>
      sendEmail({
        to:      email,
        subject: `Cancelled: ${meeting.title}`,
        html:    `<p style="font-family:Helvetica,sans-serif;color:#0F172A">
          The meeting <strong>${meeting.title}</strong> scheduled for
          <strong>${format(meeting.startTime, 'MMMM d, yyyy')}</strong>
          has been cancelled by <strong>${organizerName}</strong>.
        </p>`,
      }).catch(console.error)
    )
  )
}
