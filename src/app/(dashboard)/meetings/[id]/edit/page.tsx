'use client'

import { useParams, useRouter } from 'next/navigation'
import { useMeeting } from '@/hooks/useMeetings'
import EditMeetingClient from '@/components/meetings/EditMeetingClient'
import { Loader2, ArrowLeft } from 'lucide-react'

export default function EditMeetingPage() {
  const params = useParams()
  const router = useRouter()
  const { data: meeting, isLoading, error } = useMeeting(params.id as string)

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-500">Loading meeting details...</p>
      </div>
    )
  }

  if (error || !meeting) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-500 mb-4">Meeting not found or you don't have permission to edit it.</p>
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Go back
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Edit meeting</h1>
        <p className="text-sm text-gray-500 mt-1">
          Update the details below. All attendees will be notified of changes.
        </p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <EditMeetingClient meeting={meeting} />
      </div>
    </div>
  )
}