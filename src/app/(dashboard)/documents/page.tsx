import type { Metadata } from 'next'
import FileUploader from '@/components/documents/FileUploader'
import DocumentList from '@/components/documents/DocumentList'

export const metadata: Metadata = { title: 'Documents' }

export default function DocumentsPage() {
  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Documents</h1>
        <p className="text-sm text-gray-500 mt-1">Upload resumes, reports, and other files to your workspace</p>
      </div>

      {/* Upload card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Upload a file</h2>
        <FileUploader />
      </div>

      {/* Files list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Your files</h2>
        <DocumentList />
      </div>
    </div>
  )
}
