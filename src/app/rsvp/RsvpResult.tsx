'use client'

import { useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { CheckCircle2, XCircle, AlertTriangle, Calendar } from 'lucide-react'
import Link from 'next/link'

const MESSAGES = {
  success: null, // handled dynamically
  invalid:     { icon: <AlertTriangle className="h-12 w-12 text-amber-500" />, title: 'Link not valid', body: 'This RSVP link is invalid or has expired. Please ask the organizer to resend the invite.' },
  notfound:    { icon: <AlertTriangle className="h-12 w-12 text-amber-500" />, title: 'Meeting not found', body: 'This meeting no longer exists.' },
  cancelled:   { icon: <XCircle      className="h-12 w-12 text-gray-400"  />, title: 'Meeting cancelled', body: 'This meeting has been cancelled by the organizer.' },
  notattendee: { icon: <AlertTriangle className="h-12 w-12 text-amber-500" />, title: 'Not on the list', body: 'Your email is not in the attendee list for this meeting.' },
  error:       { icon: <AlertTriangle className="h-12 w-12 text-red-500"  />, title: 'Something went wrong', body: 'We could not process your response. Please try again later.' },
}

export default function RsvpResult() {
  const params = useSearchParams()
  const result    = params.get('result')
  const status    = params.get('status')
  const title     = params.get('title')
  const startTime = params.get('startTime')

  if (!result) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center max-w-md w-full">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">No response data</h1>
        <p className="text-gray-500">This page should be accessed from an invite email link.</p>
      </div>
    )
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (result === 'success') {
    const accepted = status === 'accepted'
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-md w-full">
        {/* Colour bar */}
        <div className={`h-2 ${accepted ? 'bg-green-500' : 'bg-red-500'}`} />

        <div className="p-8 flex flex-col items-center text-center">
          {accepted
            ? <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            : <XCircle      className="h-16 w-16 text-red-500   mb-4" />
          }

          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {accepted ? 'You accepted!' : 'You declined'}
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            {accepted
              ? 'Great! Your response has been recorded. See you at the meeting.'
              : 'Got it — the organizer has been notified of your response.'}
          </p>

          {/* Meeting info */}
          {title && (
            <div className={`w-full rounded-xl p-4 mb-6 text-left
              ${accepted ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
              <div className="flex items-start gap-3">
                <Calendar className={`h-5 w-5 mt-0.5 flex-shrink-0 ${accepted ? 'text-green-600' : 'text-red-500'}`} />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{title}</p>
                  {startTime && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {format(new Date(startTime), 'EEEE, MMMM d, yyyy · h:mm a')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 mb-2">Changed your mind?</p>
          <div className="flex gap-3 w-full">
            {accepted
              ? <a href={`?result=success&status=declined&title=${encodeURIComponent(title??'')}&startTime=${encodeURIComponent(startTime??'')}`}
                  className="flex-1 h-9 flex items-center justify-center border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors">
                  Decline instead
                </a>
              : <a href={`?result=success&status=accepted&title=${encodeURIComponent(title??'')}&startTime=${encodeURIComponent(startTime??'')}`}
                  className="flex-1 h-9 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
                  Accept instead
                </a>
            }
          </div>

          <Link href="/login" className="mt-4 text-xs text-blue-600 hover:underline">
            Sign in to MeetFlow →
          </Link>
        </div>
      </div>
    )
  }

  // ── Error states ─────────────────────────────────────────────────────────
  const msg = MESSAGES[result as keyof typeof MESSAGES]
  if (!msg) return null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 flex flex-col items-center text-center max-w-md w-full">
      <div className="mb-4">{msg.icon}</div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">{msg.title}</h1>
      <p className="text-gray-500 text-sm mb-6">{msg.body}</p>
      <Link href="/login"
        className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center">
        Go to MeetFlow
      </Link>
    </div>
  )
}
