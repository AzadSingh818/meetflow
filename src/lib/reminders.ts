import { connectDB } from '@/lib/db'
import Meeting from '@/models/Meeting'
import { sendMeetingReminder } from '@/lib/email'

/**
 * For each reminder interval (e.g. 1440 min = 1 day, 60 min = 1 hour),
 * find meetings that start within a ±5-minute window of that interval
 * and haven't been reminded yet at that interval.
 */
export async function processReminders() {
  await connectDB()

  const now         = new Date()
  const INTERVALS   = [1440, 60] // minutes before: 1 day and 1 hour
  const WINDOW      = 5          // match within ±5 minutes

  const results = { checked: 0, sent: 0, errors: 0 }

  for (const minutes of INTERVALS) {
    const targetTime   = new Date(now.getTime() + minutes * 60 * 1000)
    const windowStart  = new Date(targetTime.getTime() - WINDOW * 60 * 1000)
    const windowEnd    = new Date(targetTime.getTime() + WINDOW * 60 * 1000)

    const meetings = await Meeting.find({
      status:    'scheduled',
      startTime: { $gte: windowStart, $lte: windowEnd },
      reminders: minutes,
      // Only send if we haven't sent this interval yet
      remindersSent: { $nin: [minutes] },
    }).lean()

    results.checked += meetings.length

    for (const meeting of meetings) {
      try {
        await sendMeetingReminder(meeting as any, minutes)

        // Mark this interval as sent so we don't double-send
        await Meeting.findByIdAndUpdate(meeting._id, {
          $addToSet: { remindersSent: minutes },
        })

        results.sent++
      } catch (err) {
        console.error(`[reminders] Failed for meeting ${meeting._id}:`, err)
        results.errors++
      }
    }
  }

  return results
}
