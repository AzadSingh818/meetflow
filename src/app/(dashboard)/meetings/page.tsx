'use client'

import { useState } from 'react'
import { useMeetings } from '@/hooks/useMeetings'
import { MeetingCard } from '@/components/meetings/MeetingCard'
import { Plus, Search, Calendar, Inbox } from 'lucide-react'
import Link from 'next/link'
import type { Meeting } from '@/types/meeting'

type Filter = 'all' | 'upcoming' | 'past' | 'cancelled'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'upcoming',  label: 'Upcoming' },
  { key: 'past',      label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
]

function filterMeetings(meetings: Meeting[], filter: Filter, query: string): Meeting[] {
  const now = new Date()
  let result = meetings

  if (filter === 'upcoming')  result = result.filter(m => new Date(m.startTime) >= now && m.status === 'scheduled')
  if (filter === 'past')      result = result.filter(m => new Date(m.endTime)   <  now && m.status !== 'cancelled')
  if (filter === 'cancelled') result = result.filter(m => m.status === 'cancelled')

  if (query.trim()) {
    const q = query.toLowerCase()
    result = result.filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.description?.toLowerCase().includes(q) ||
      m.location?.toLowerCase().includes(q) ||
      m.attendees.some(a => a.email.includes(q) || a.name?.toLowerCase().includes(q))
    )
  }

  return result.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
}

export default function MeetingsPage() {
  const { meetings = [], isLoading } = useMeetings()
  const [filter, setFilter] = useState<Filter>('upcoming')
  const [query, setQuery]   = useState('')

  const filtered = filterMeetings(meetings, filter, query)

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search meetings…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="h-10 pl-9 pr-4 w-full bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <Link
          href="/meetings/create"
          className="flex items-center gap-2 h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          New meeting
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 h-8 text-sm font-medium rounded-md transition-all ${
              filter === f.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f.label}
            {f.key === 'upcoming' && meetings.filter((m: { startTime: string | number | Date; status: string }) => new Date(m.startTime) >= new Date() && m.status === 'scheduled').length > 0 && (
              <span className="ml-1.5 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                {meetings.filter((m: { startTime: string | number | Date; status: string }) => new Date(m.startTime) >= new Date() && m.status === 'scheduled').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="h-3 w-3 rounded-full bg-gray-200 mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
            {query ? <Search className="h-7 w-7 text-gray-300" /> : <Inbox className="h-7 w-7 text-gray-300" />}
          </div>
          <h3 className="font-semibold text-gray-900">
            {query ? 'No results found' : `No ${filter === 'all' ? '' : filter} meetings`}
          </h3>
          <p className="text-sm text-gray-400 mt-1 mb-6">
            {query
              ? `No meetings match "${query}"`
              : filter === 'upcoming'
                ? 'Schedule your next meeting to get started'
                : 'Nothing here yet'
            }
          </p>
          {!query && filter !== 'cancelled' && filter !== 'past' && (
            <Link
              href="/meetings/create"
              className="flex items-center gap-2 h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create meeting
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(m => <MeetingCard key={m._id} meeting={m} />)}
        </div>
      )}
    </div>
  )
}
