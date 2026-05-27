import type { Metadata } from 'next'
import { Suspense } from 'react'
import MeetingForm from '@/components/meetings/MeetingForm'

export const metadata: Metadata = { title: 'New Meeting' }

export default function CreateMeetingPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Schedule a new meeting</h1>
        <p className="text-sm text-gray-500 mt-1">Fill in the details — attendees get email invites automatically</p>
      </div>
      <Suspense>
        <MeetingForm />
      </Suspense>
    </div>
  )
}
