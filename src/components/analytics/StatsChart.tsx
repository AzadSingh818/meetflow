'use client'

import { useQuery } from '@tanstack/react-query'
import { Calendar, CheckCircle2, Clock, TrendingUp, Users, XCircle, Loader2 } from 'lucide-react'

async function fetchAnalytics() {
  const res = await fetch('/api/analytics')
  if (!res.ok) throw new Error('Failed to fetch analytics')
  return res.json()
}

const RSVP_COLORS = ['#059669', '#DC2626', '#D97706']

function formatDuration(minutes: number) {
  return minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}`
}

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: number | string; sub?: string; color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics'],
    queryFn:  fetchAnalytics,
  })

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-gray-500 text-sm">Loading analytics…</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return <div className="p-6 text-center text-gray-500">Failed to load analytics.</div>
  }

  const { summary, daily, rsvp, topTags } = data
  const rsvpPieData = [
    { name: 'Accepted',  value: rsvp.accepted  },
    { name: 'Declined',  value: rsvp.declined  },
    { name: 'Pending',   value: rsvp.pending   },
  ].filter(d => d.value > 0)

  const durLabel = formatDuration(summary.avgDuration)
  const maxDaily = Math.max(...daily.map((d: { count: number }) => d.count), 1)
  const totalRsvp = rsvpPieData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Your meeting activity over the last 30 days</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={<Calendar    className="h-5 w-5 text-blue-600"   />} label="Total meetings"    value={summary.total}     color="bg-blue-50"   />
        <StatCard icon={<Clock       className="h-5 w-5 text-purple-600" />} label="Upcoming"          value={summary.upcoming}  color="bg-purple-50" />
        <StatCard icon={<TrendingUp  className="h-5 w-5 text-green-600"  />} label="This week"         value={summary.thisWeek}  color="bg-green-50"  />
        <StatCard icon={<CheckCircle2 className="h-5 w-5 text-teal-600"  />} label="Completed"         value={summary.completed} color="bg-teal-50"   />
        <StatCard icon={<XCircle     className="h-5 w-5 text-red-500"    />} label="Cancelled"         value={summary.cancelled} color="bg-red-50"    />
        <StatCard icon={<Users       className="h-5 w-5 text-amber-600"  />} label="Avg duration" value={durLabel} sub="per meeting" color="bg-amber-50" />
      </div>

      {/* Daily chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-6">Meetings per day (last 30 days)</h2>
        <div className="h-[220px] flex items-end gap-1 overflow-x-auto pb-2">
          {daily.map((d: { date: string; count: number }) => (
            <div key={d.date} className="flex flex-col items-center justify-end flex-1 min-w-[18px] h-full">
              <div
                className="w-full max-w-[18px] bg-blue-500 rounded-t-md"
                style={{ height: `${Math.max((d.count / maxDaily) * 100, d.count > 0 ? 6 : 0)}%` }}
                title={`${d.date}: ${d.count}`}
              />
              <span className="mt-2 text-[10px] text-gray-400 rotate-[-45deg] origin-top-left whitespace-nowrap">
                {d.date}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* RSVP pie */}
        {rsvpPieData.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Attendee RSVP breakdown</h2>
            <p className="text-xs text-gray-400 mb-4">From meetings you organised (last 30 days)</p>
            <div className="space-y-3">
              {rsvpPieData.map((item, i) => {
                const pct = totalRsvp ? (item.value / totalRsvp) * 100 : 0
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-600">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: RSVP_COLORS[i % RSVP_COLORS.length] }} />
                        {item.name}
                      </span>
                      <span className="font-medium text-gray-900">{item.value}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: RSVP_COLORS[i % RSVP_COLORS.length] }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Top tags */}
        {topTags.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Top tags</h2>
            <div className="space-y-3">
              {topTags.map(({ tag, count }: { tag: string; count: number }, i: number) => {
                const max = topTags[0].count
                return (
                  <div key={tag} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-24 truncate">{tag}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-6 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}