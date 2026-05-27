import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">

        <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-10 h-10 text-blue-500" />
        </div>

        <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Page not found</h2>
        <p className="text-gray-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center h-10 px-6 bg-blue-600 hover:bg-blue-700
                       text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/meetings"
            className="inline-flex items-center justify-center h-10 px-6 border border-gray-200
                       text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors"
          >
            View Meetings
          </Link>
        </div>

      </div>
    </div>
  )
}
