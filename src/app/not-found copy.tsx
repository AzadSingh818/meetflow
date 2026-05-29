import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-blue-100 mb-4 select-none">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/dashboard"
            className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                       text-sm font-medium transition-colors flex items-center"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/meetings"
            className="h-10 px-6 border border-gray-200 text-gray-600 hover:bg-gray-50
                       rounded-lg text-sm font-medium transition-colors flex items-center"
          >
            View Meetings
          </Link>
        </div>
      </div>
    </div>
  )
}
