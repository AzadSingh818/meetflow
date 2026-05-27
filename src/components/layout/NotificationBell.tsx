'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import Link from 'next/link'

interface UpcomingMeeting {
  _id:       string
  title:     string
  startTime: string
  color?:    string
}

export default function NotificationBell() {
  const [open,     setOpen]     = useState(false)
  const [meetings, setMeetings] = useState<UpcomingMeeting[]>([])
  const [loading,  setLoading]  = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Fetch upcoming meetings when opened
  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch('/api/meetings?status=scheduled&limit=5')
      .then(r => r.json())
      .then((data: UpcomingMeeting[]) => {
        // Filter to only future meetings, sort by soonest
        const upcoming = (Array.isArray(data) ? data : [])
          .filter(m => !isPast(new Date(m.startTime)))
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
          .slice(0, 5)
        setMeetings(upcoming)
      })
      .catch(() => setMeetings([]))
      .finally(() => setLoading(false))
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {/* Unread dot */}
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-500" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-gray-100 shadow-xl z-50 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Upcoming Meetings</p>
            <Link href="/meetings" onClick={() => setOpen(false)}
              className="text-xs text-blue-600 hover:underline">
              View all
            </Link>
          </div>

          {/* List */}
          <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              </div>
            )}

            {!loading && meetings.length === 0 && (
              <div className="py-8 text-center">
                <Bell className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No upcoming meetings</p>
              </div>
            )}

            {!loading && meetings.map(m => (
              <Link key={m._id} href={`/meetings/${m._id}`} onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                {/* Color dot */}
                <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${m.color ?? '#2563EB'}20` }}>
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: m.color ?? '#2563EB' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{m.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {format(new Date(m.startTime), 'EEE, MMM d · h:mm a')}
                  </p>
                </div>
                <span className="text-xs text-blue-500 font-medium flex-shrink-0">
                  {formatDistanceToNow(new Date(m.startTime), { addSuffix: true })}
                </span>
              </Link>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
            <Link href="/meetings/create" onClick={() => setOpen(false)}
              className="text-xs text-blue-600 hover:underline font-medium">
              + Schedule a new meeting
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
