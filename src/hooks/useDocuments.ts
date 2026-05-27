'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface MeetDocument {
  _id:         string
  name:        string
  type:        'resume' | 'cover_letter' | 'report' | 'other'
  url:         string
  storagePath: string
  size:        number
  mimeType:    string
  createdAt:   string
}

async function fetchDocuments(): Promise<MeetDocument[]> {
  const res = await fetch('/api/documents')
  if (!res.ok) throw new Error('Failed to fetch documents')
  return res.json()
}

async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete document')
}

export function useDocuments() {
  return useQuery({ queryKey: ['documents'], queryFn: fetchDocuments })
}

export function useDeleteDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
}

// ── File size formatter ────────────────────────────────────────────────────
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// ── MIME → friendly label ──────────────────────────────────────────────────
export function mimeLabel(mimeType: string): string {
  if (mimeType.includes('pdf'))  return 'PDF'
  if (mimeType.includes('word') || mimeType.includes('docx')) return 'Word'
  if (mimeType.includes('png'))  return 'PNG'
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'JPG'
  return mimeType.split('/').pop()?.toUpperCase() ?? 'File'
}
