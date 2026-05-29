'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center text-center max-w-md w-full">
            <AlertTriangle className="h-14 w-14 text-amber-500 mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-500 text-sm mb-6">
              An unexpected error occurred. Please try again.
            </p>
            {error.digest && (
              <p className="text-xs text-gray-300 mb-4 font-mono">ID: {error.digest}</p>
            )}
            <button
              onClick={reset}
              className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                         text-sm font-semibold transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
