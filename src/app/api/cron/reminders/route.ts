import { NextRequest, NextResponse } from 'next/server'
import { processReminders } from '@/lib/reminders'

/**
 * GET /api/cron/reminders
 * Called by Vercel Cron every 30 minutes (see vercel.json).
 * Protected by CRON_SECRET so only Vercel can trigger it.
 */
export async function GET(req: NextRequest) {
  // Verify the request comes from Vercel Cron
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const start   = Date.now()
    const results = await processReminders()
    const elapsed = Date.now() - start

    console.log(`[cron/reminders] checked=${results.checked} sent=${results.sent} errors=${results.errors} ms=${elapsed}`)

    return NextResponse.json({
      ok:      true,
      ...results,
      elapsedMs: elapsed,
    })
  } catch (err) {
    console.error('[cron/reminders]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
