import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import RsvpResult from './RsvpResult'

export const metadata: Metadata = { title: 'Meeting RSVP' }

export default function RsvpPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 flex flex-col items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mb-4" />
          <p className="text-gray-500 text-sm">Processing your response…</p>
        </div>
      }>
        <RsvpResult />
      </Suspense>
    </div>
  )
}
