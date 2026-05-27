'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface Props {
  error:  Error & { digest?: string }
  reset:  () => void
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    // Log to your error tracking service here (e.g. Sentry)
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">

        <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-500 mb-2">
          An unexpected error occurred. Please try again or return to the dashboard.
        </p>

        {error.digest && (
          <p className="text-xs text-gray-400 mb-6 font-mono bg-gray-100 px-3 py-1.5 rounded-lg inline-block">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 h-10 px-6 bg-blue-600
                       hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center h-10 px-6 border border-gray-200
                       text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>

      </div>
    </div>
  )
}
