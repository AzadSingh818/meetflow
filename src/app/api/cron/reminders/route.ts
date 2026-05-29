import { NextRequest, NextResponse } from 'next/server'
import { processReminders } from '@/lib/reminders'

/**
 * GET /api/cron/reminders
 * Called by GitHub Actions every 30 minutes.
 * Protected by CRON_SECRET header.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // If CRON_SECRET is set, enforce it — always reject if header missing or wrong
  if (!cronSecret) {
    console.warn('[cron/reminders] CRON_SECRET not set — endpoint is unprotected!')
  } else if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[cron/reminders] Unauthorized attempt:', authHeader)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const start   = Date.now()
    const results = await processReminders()
    const elapsed = Date.now() - start

    console.log(
      `[cron/reminders] checked=${results.checked} sent=${results.sent} errors=${results.errors} ms=${elapsed}`
    )

    return NextResponse.json({
      ok:        true,
      ...results,
      elapsedMs: elapsed,
    })
  } catch (err) {
    console.error('[cron/reminders]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}