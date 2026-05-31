'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Calendar, CheckCircle2, Clock, TrendingUp,
  Users, XCircle, Loader2,
} from 'lucide-react'

async function fetchAnalytics() {
  const res = await fetch('/api/analytics')
  if (!res.ok) throw new Error('Failed to fetch analytics')
  return res.json()
}

const RSVP_COLORS = ['#059669', '#DC2626', '#D97706']

function formatDuration(minutes: number) {
  if (!minutes) return '0m'
  return minutes < 60
    ? `${minutes}m`
    : `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}`
}

function StatCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  sub?: string
  color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 sm:p-5 flex items-center gap-3">
      <div className={`h-9 w-9 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight truncate">{value}</p>
        <p className="text-[11px] sm:text-sm text-gray-500 truncate leading-tight mt-0.5">{label}</p>
        {sub && <p className="text-[10px] sm:text-xs text-gray-400 truncate">{sub}</p>}
      </div>
    </div>
  )
}

/**
 * Bar chart rendered with SVG — labels never clip, fully responsive,
 * no external dependency.
 */
function DailyBarChart({ daily }: { daily: { date: string; count: number }[] }) {
  const W = 800          // SVG logical width
  const H = 200          // bar area height
  const LABEL_H = 36     // space below bars for rotated labels
  const PAD_L = 28       // left padding for Y-axis numbers
  const PAD_R = 8
  const TOTAL_H = H + LABEL_H

  const maxCount = Math.max(...daily.map(d => d.count), 1)
  const n = daily.length
  const availW = W - PAD_L - PAD_R
  const barW = Math.max(2, availW / n - 2)
  const gap   = availW / n

  // Y grid lines at 0, 25%, 50%, 75%, 100%
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    y: H - f * H,
    label: String(Math.round(f * maxCount)),
  }))

  // Show every Nth label so they don't overlap (~7 max)
  const step = Math.ceil(n / 7)

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${TOTAL_H}`}
        className="w-full h-auto"
        style={{ minHeight: 160 }}
        aria-label="Meetings per day"
      >
        {/* Y grid lines */}
        {gridLines.map(({ y, label }) => (
          <g key={y}>
            <line
              x1={PAD_L} y1={y} x2={W - PAD_R} y2={y}
              stroke="#F1F5F9" strokeWidth="1"
            />
            <text
              x={PAD_L - 4} y={y + 4}
              textAnchor="end"
              fontSize="10"
              fill="#94A3B8"
            >
              {label}
            </text>
          </g>
        ))}

        {/* Bars + tooltips */}
        {daily.map((d, i) => {
          const barH  = d.count > 0 ? Math.max((d.count / maxCount) * H, 6) : 0
          const x     = PAD_L + i * gap + (gap - barW) / 2
          const y     = H - barH
          const showLabel = i % step === 0

          return (
            <g key={d.date}>
              {/* Hover hit area */}
              <rect
                x={PAD_L + i * gap}
                y={0}
                width={gap}
                height={H}
                fill="transparent"
                className="group"
              />
              {/* Bar */}
              {d.count > 0 && (
                <rect
                  x={x} y={y}
                  width={barW} height={barH}
                  rx="3" ry="3"
                  fill="#3B82F6"
                  opacity="0.9"
                >
                  <title>{`${d.date}: ${d.count} meeting${d.count !== 1 ? 's' : ''}`}</title>
                </rect>
              )}
              {/* X-axis label — rotated so it never clips */}
              {showLabel && (
                <text
                  x={PAD_L + i * gap + gap / 2}
                  y={H + 14}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94A3B8"
                  transform={`rotate(-40, ${PAD_L + i * gap + gap / 2}, ${H + 14})`}
                >
                  {d.date}
                </text>
              )}
            </g>
          )
        })}

        {/* X baseline */}
        <line
          x1={PAD_L} y1={H} x2={W - PAD_R} y2={H}
          stroke="#E2E8F0" strokeWidth="1"
        />
      </svg>
    </div>
  )
}

export default function AnalyticsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics'],
    queryFn: fetchAnalytics,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-gray-500 text-sm">Loading analytics…</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-gray-500 text-sm">Failed to load analytics.</p>
      </div>
    )
  }

  const { summary, daily, rsvp, topTags } = data

  const rsvpData = [
    { name: 'Accepted', value: rsvp.accepted },
    { name: 'Declined', value: rsvp.declined },
    { name: 'Pending',  value: rsvp.pending  },
  ].filter(d => d.value > 0)

  const totalRsvp = rsvpData.reduce((s, d) => s + d.value, 0)
  const maxTag    = topTags[0]?.count ?? 1

  return (
    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 w-full max-w-5xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-gray-900">Analytics</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Your meeting activity over the last 30 days
        </p>
      </div>

      {/* Summary cards — 2 cols mobile, 3 cols lg */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
        <StatCard
          icon={<Calendar     className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600"   />}
          label="Total meetings"  value={summary.total}     color="bg-blue-50"
        />
        <StatCard
          icon={<Clock        className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />}
          label="Upcoming"        value={summary.upcoming}  color="bg-purple-50"
        />
        <StatCard
          icon={<TrendingUp   className="h-4 w-4 sm:h-5 sm:w-5 text-green-600"  />}
          label="This week"       value={summary.thisWeek}  color="bg-green-50"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600"   />}
          label="Completed"       value={summary.completed} color="bg-teal-50"
        />
        <StatCard
          icon={<XCircle      className="h-4 w-4 sm:h-5 sm:w-5 text-red-500"    />}
          label="Cancelled"       value={summary.cancelled} color="bg-red-50"
        />
        <StatCard
          icon={<Users        className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600"  />}
          label="Avg duration"    value={formatDuration(summary.avgDuration)}
          sub="per meeting"       color="bg-amber-50"
        />
      </div>

      {/* Daily bar chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
        <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-4">
          Meetings per day (last 30 days)
        </h2>
        {daily && daily.length > 0 ? (
          <DailyBarChart daily={daily} />
        ) : (
          <p className="text-sm text-gray-400 py-10 text-center">No data yet</p>
        )}
      </div>

      {/* RSVP + Top tags */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

        {/* RSVP breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
          <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
            Attendee RSVP breakdown
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            From meetings you organised (last 30 days)
          </p>
          {rsvpData.length > 0 ? (
            <div className="space-y-3">
              {rsvpData.map((item, i) => {
                const pct = totalRsvp ? (item.value / totalRsvp) * 100 : 0
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-600">
                        <span
                          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: RSVP_COLORS[i % RSVP_COLORS.length] }}
                        />
                        {item.name}
                      </span>
                      <span className="font-medium text-gray-900 tabular-nums">
                        {item.value}
                        <span className="text-xs text-gray-400 ml-1">({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: RSVP_COLORS[i % RSVP_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-6 text-center">No RSVP data yet</p>
          )}
        </div>

        {/* Top tags */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
          <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-4">Top tags</h2>
          {topTags.length > 0 ? (
            <div className="space-y-3">
              {topTags.map(({ tag, count }: { tag: string; count: number }) => (
                <div key={tag} className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xs sm:text-sm text-gray-600 w-20 sm:w-24 truncate flex-shrink-0">
                    {tag}
                  </span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${(count / maxTag) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-900 w-5 sm:w-6 text-right tabular-nums flex-shrink-0">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-6 text-center">No tags yet</p>
          )}
        </div>

      </div>
    </div>
  )
}