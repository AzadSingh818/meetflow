'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

/**
 * Drop this component anywhere you want an export button —
 * Sidebar, analytics page, etc.
 *
 * It fetches the .ics from the API and forces a local file-download
 * via a temporary <a download> element, so the OS opens it in
 * Calendar / Outlook / Google Calendar rather than in the mail app.
 */
export function ExportCalendarButton({
  className,
  label = 'Export calendar',
}: {
  className?: string
  label?: string
}) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/meetings/export')
      if (!res.ok) throw new Error('Export failed')

      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)

      // Create a hidden <a download> and click it — this forces a local
      // file download instead of opening in the browser or mail app.
      const a = document.createElement('a')
      a.href     = url
      a.download = 'meetflow.ics'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      // Free the object URL after a short delay
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } catch (err) {
      console.error(err)
      alert('Could not export calendar. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={className}
    >
      {loading
        ? <Loader2 className="h-4 w-4 animate-spin" />
        : <Download className="h-4 w-4" />
      }
      {label}
    </button>
  )
}