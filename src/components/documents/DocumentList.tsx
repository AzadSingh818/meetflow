'use client'

import { useDocuments, useDeleteDocument, formatBytes, mimeLabel } from '@/hooks/useDocuments'
import { format } from 'date-fns'
import { FileText, Download, Trash2, File, FileImage, Loader2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

const TYPE_COLORS: Record<string, string> = {
  resume:       'bg-blue-50 text-blue-700 border-blue-200',
  cover_letter: 'bg-purple-50 text-purple-700 border-purple-200',
  report:       'bg-green-50 text-green-700 border-green-200',
  other:        'bg-gray-50 text-gray-600 border-gray-200',
}

function DocIcon({ mime }: { mime: string }) {
  if (mime.includes('image')) return <FileImage className="h-5 w-5 text-blue-500" />
  if (mime.includes('pdf'))   return <FileText   className="h-5 w-5 text-red-500"  />
  return                             <File        className="h-5 w-5 text-gray-400" />
}

export default function DocumentList() {
  const { data: docs = [], isLoading } = useDocuments()
  const { mutate: del, isPending }     = useDeleteDocument()
  const addToast                        = useAppStore(s => s.addToast)

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return
    del(id, {
      onSuccess: () => addToast({ type: 'success', title: 'Document deleted' }),
      onError:   () => addToast({ type: 'error',   title: 'Failed to delete document' }),
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!docs.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
          <FileText className="h-7 w-7 text-gray-300" />
        </div>
        <p className="font-semibold text-gray-900">No documents yet</p>
        <p className="text-sm text-gray-400 mt-1">Upload your first document above</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {docs.map(doc => (
        <div key={doc._id}
          className="flex items-center gap-4 bg-white border border-gray-100 rounded-xl px-4 py-3
                     hover:border-gray-200 hover:shadow-sm transition-all group">
          {/* Icon */}
          <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
            <DocIcon mime={doc.mimeType} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{doc.name}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium border capitalize
                ${TYPE_COLORS[doc.type] ?? TYPE_COLORS.other}`}>
                {doc.type.replace('_',' ')}
              </span>
              <span className="text-xs text-gray-400">{mimeLabel(doc.mimeType)}</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400">{formatBytes(doc.size)}</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400">
                {format(new Date(doc.createdAt), 'MMM d, yyyy')}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <a href={doc.url} target="_blank" rel="noopener noreferrer"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400
                         hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Download">
              <Download className="h-4 w-4" />
            </a>
            <button onClick={() => handleDelete(doc._id, doc.name)} disabled={isPending}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400
                         hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Delete">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
