'use client'

import { useAppStore, type Toast } from '@/store/useAppStore'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'

const ICONS = {
  success: <CheckCircle2  className="h-5 w-5 text-green-500" />,
  error:   <AlertCircle   className="h-5 w-5 text-red-500"   />,
  info:    <Info          className="h-5 w-5 text-blue-500"  />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
}

const BORDER = {
  success: 'border-l-green-500',
  error:   'border-l-red-500',
  info:    'border-l-blue-500',
  warning: 'border-l-amber-500',
}

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useAppStore(s => s.removeToast)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // mount with small delay so CSS transition fires
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  const dismiss = () => {
    setVisible(false)
    setTimeout(() => removeToast(toast.id), 300)
  }

  return (
    <div
      className={`flex items-start gap-3 bg-white border border-gray-200 border-l-4 ${BORDER[toast.type]}
        rounded-lg shadow-lg px-4 py-3 min-w-[300px] max-w-sm w-full transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
    >
      <div className="flex-shrink-0 mt-0.5">{ICONS[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
        {toast.message && <p className="text-xs text-gray-500 mt-0.5">{toast.message}</p>}
      </div>
      <button
        onClick={dismiss}
        className="flex-shrink-0 p-0.5 rounded text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const toasts = useAppStore(s => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  )
}
