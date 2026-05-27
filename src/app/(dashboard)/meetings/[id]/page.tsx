'use client'

import { useMeeting, useDeleteMeeting } from '@/hooks/useMeetings'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { Clock, MapPin, Link2, Edit2, Trash2, ArrowLeft, ExternalLink,
         Copy, CheckCircle2, RefreshCw, Video } from 'lucide-react'
import Link from 'next/link'
import { AwaitedReactNode, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useState } from 'react'
import RSVPSection from '@/components/meetings/RSVPButtons'
import { useAppStore } from '@/store/useAppStore'

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50   text-red-700   border-red-200',
  completed: 'bg-gray-100 text-gray-600  border-gray-200',
}
export default function MeetingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const addToast = useAppStore(s => s.addToast)
  const { data: meeting, isLoading, error } = useMeeting(params.id as string)
  const { mutate: deleteMeeting, isPending } = useDeleteMeeting()
  const [copied, setCopied] = useState(false)

  const isOrganizer = meeting?.organizer._id === session?.user?.id
  const durationMins = meeting ? Math.round((new Date(meeting.endTime).getTime() - new Date(meeting.startTime).getTime()) / 60000) : 0

  const copyLink = () => {
    if (!meeting?.meetLink) return
    navigator.clipboard.writeText(meeting.meetLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCancel = () => {
    if (!confirm('Cancel this meeting? All attendees will be notified.')) return
    deleteMeeting(params.id as string, {
      onSuccess: () => {
        addToast({ type: 'success', title: 'Meeting cancelled' })
        router.push('/meetings')
      },
    })
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/2" />
        <div className="h-48 bg-gray-100 rounded-xl" />
        <div className="h-32 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  if (error || !meeting) {
    return (
      <div className="p-6 flex flex-col items-center py-20">
        <p className="text-gray-500">Meeting not found.</p>
        <Link href="/meetings" className="mt-4 text-sm text-blue-600 hover:underline">← Back to meetings</Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl space-y-5">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        {isOrganizer && meeting.status === 'scheduled' && (
          <div className="flex items-center gap-2">
            <Link href={`/meetings/${meeting._id}/edit`}
              className="flex items-center gap-1.5 h-9 px-3 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-lg transition-colors">
              <Edit2 className="h-3.5 w-3.5" />
              Edit
            </Link>
            <button onClick={handleCancel} disabled={isPending}
              className="flex items-center gap-1.5 h-9 px-3 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="h-2" style={{ backgroundColor: meeting.color }} />
        <div className="p-6 space-y-6">
          {/* Title + status */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{meeting.title}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Organized by <span className="font-medium text-gray-700">{meeting.organizer.name}</span>
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${STATUS_STYLES[meeting.status]}`}>
              {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
            </span>
          </div>

          {meeting.description && (
            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4">
              {meeting.description}
            </p>
          )}

          {/* Info grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-blue-700 mb-1">Date &amp; Time</p>
                <p className="text-sm font-semibold text-gray-900">
                  {format(new Date(meeting.startTime), 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-sm text-gray-600 mt-0.5">
                  {format(new Date(meeting.startTime), 'h:mm a')} – {format(new Date(meeting.endTime), 'h:mm a')}
                  <span className="text-gray-400 ml-1.5">
                    ({durationMins < 60 ? `${durationMins}m` : `${Math.floor(durationMins/60)}h${durationMins%60 ? ` ${durationMins%60}m` : ''}`})
                  </span>
                </p>
              </div>
            </div>

            {meeting.location && (
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <MapPin className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Location</p>
                  <p className="text-sm font-medium text-gray-900">{meeting.location}</p>
                </div>
              </div>
            )}

            {meeting.meetLink && (
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl sm:col-span-2">
                <Video className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-green-700 mb-1">Meeting link</p>
                  <p className="text-sm text-gray-600 truncate mb-2">{meeting.meetLink}</p>
                  <div className="flex gap-2">
                    <a href={meeting.meetLink} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 h-8 px-3 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Join meeting
                    </a>
                    <button onClick={copyLink}
                      className="flex items-center gap-1.5 h-8 px-3 border border-green-200 text-green-700 hover:bg-green-100 text-xs font-medium rounded-lg transition-colors">
                      {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? 'Copied!' : 'Copy link'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tags + recurrence + reminders */}
          {meeting.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {meeting.tags.map((tag: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined, index: Key | null | undefined) => (
                <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {meeting.recurrence?.enabled && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <RefreshCw className="h-4 w-4 text-gray-400" />
              Repeats {meeting.recurrence.pattern}
              {meeting.recurrence.until && ` until ${format(new Date(meeting.recurrence.until), 'MMM d, yyyy')}`}
            </div>
          )}

          {meeting.reminders.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              Reminders: {meeting.reminders.map((m: number) => m < 60 ? `${m}m` : `${m/60}h`).join(', ')} before
            </div>
          )}
        </div>
      </div>

      {/* RSVP section for attendees */}
      <RSVPSection meeting={meeting} />
    </div>
  )
}
