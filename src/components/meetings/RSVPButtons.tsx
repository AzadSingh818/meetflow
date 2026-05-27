'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/store/useAppStore'
import type { Meeting } from '@/types/meeting'

interface Props {
  meeting: Meeting
}

const STATUS_BADGE = {
  accepted: {
    icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    text: 'Accepted',
    bg: 'bg-green-50 border-green-200',
  },
  declined: {
    icon: <XCircle className="h-4 w-4 text-red-600" />,
    text: 'Declined',
    bg: 'bg-red-50 border-red-200',
  },
  pending: {
    icon: <Clock className="h-4 w-4 text-yellow-600" />,
    text: 'Pending',
    bg: 'bg-yellow-50 border-yellow-200',
  },
}

export default function RSVPSection({ meeting }: Props) {
  const { data: session } = useSession()
  const qc = useQueryClient()
  const addToast = useAppStore(s => s.addToast)
  const [responding, setResponding] = useState(false)

  const currentUser = meeting.attendees.find(a => a.email === session?.user?.email)
  const isOrganizer = meeting.organizer._id === session?.user?.id
  const canRsvp = !isOrganizer && currentUser
  const currentStatus = currentUser?.status ?? 'pending'

  const handleRsvp = async (status: 'accepted' | 'declined') => {
    if (!session?.user?.email) return
    setResponding(true)

    try {
      const res = await fetch(`/api/meetings/${meeting._id}/rsvp`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status }),
      })

      if (!res.ok) throw new Error((await res.json()).error)

      const updated = await res.json()
      qc.setQueryData(['meetings', meeting._id], updated)
      addToast({
        type: 'success',
        title: status === 'accepted' ? 'You accepted the invite' : 'You declined the invite',
      })
    } catch (e: unknown) {
      addToast({
        type: 'error',
        title: 'Failed to respond',
        message: (e as Error).message,
      })
    } finally {
      setResponding(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
      <h2 className="text-base font-semibold text-gray-900">Attendees</h2>

      {/* Your RSVP (if attendee) */}
      {canRsvp && (
        <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
          <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-3">Your Response</p>
          <div className="flex items-center gap-3 mb-4">
            {STATUS_BADGE[currentStatus as keyof typeof STATUS_BADGE]?.icon}
            <span className="text-sm font-medium text-gray-900">
              {STATUS_BADGE[currentStatus as keyof typeof STATUS_BADGE]?.text}
            </span>
          </div>
          {currentStatus === 'pending' && (
            <div className="flex gap-2">
              <button
                onClick={() => handleRsvp('accepted')}
                disabled={responding}
                className="flex-1 h-9 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg
                           text-sm font-medium transition-colors flex items-center justify-center gap-2">
                {responding && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Accept
              </button>
              <button
                onClick={() => handleRsvp('declined')}
                disabled={responding}
                className="flex-1 h-9 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg
                           text-sm font-medium transition-colors disabled:opacity-60">
                Decline
              </button>
            </div>
          )}
          {currentStatus !== 'pending' && (
            <div className="flex gap-2">
              <button
                onClick={() => handleRsvp(currentStatus === 'accepted' ? 'declined' : 'accepted')}
                disabled={responding}
                className="flex-1 h-9 border border-blue-200 text-blue-700 rounded-lg
                           text-sm font-medium hover:bg-blue-50 transition-colors disabled:opacity-60">
                {responding && <Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1" />}
                Change response
              </button>
            </div>
          )}
        </div>
      )}

      {/* Attendee list */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {meeting.attendees.length} attendee{meeting.attendees.length !== 1 ? 's' : ''}
        </p>
        {meeting.attendees.map((a, i) => (
          <div key={i} className={`flex items-center justify-between rounded-xl p-3 border
            ${a.status === 'accepted'  ? 'bg-green-50 border-green-100'
            : a.status === 'declined'  ? 'bg-red-50 border-red-100'
            :                            'bg-gray-50 border-gray-100'}`}>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-xs font-semibold
                              text-gray-600 border border-gray-100">
                {(a.name ?? a.email)[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{a.name ?? a.email.split('@')[0]}</p>
                <p className="text-xs text-gray-400">{a.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {STATUS_BADGE[a.status as keyof typeof STATUS_BADGE]?.icon}
              <span className="text-xs font-medium text-gray-600 capitalize">
                {a.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* RSVP summary */}
      {meeting.attendees.length > 0 && (
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
          {[
            { status: 'accepted', label: 'Accepted', color: 'text-green-700' },
            { status: 'declined',  label: 'Declined',  color: 'text-red-700'   },
            { status: 'pending',   label: 'Pending',   color: 'text-yellow-700' },
          ].map(({ status, label, color }) => {
            const count = meeting.attendees.filter(a => a.status === status).length
            return (
              <div key={status} className="text-center">
                <p className={`text-lg font-bold ${color}`}>{count}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
