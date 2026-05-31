'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Menu, Search, X, Calendar, FileText, Loader2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useEffect, useRef, useState, useCallback } from 'react'

// ─── Page title map ───────────────────────────────────────────────────────────

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':       'Dashboard',
  '/meetings':        'Meetings',
  '/meetings/create': 'New Meeting',
  '/documents':       'Documents',
  '/teams':           'Teams',
  '/analytics':       'Analytics',
  '/profile':         'Profile',
}

function getTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  if (pathname.startsWith('/meetings/') && pathname.endsWith('/edit')) return 'Edit Meeting'
  if (pathname.startsWith('/meetings/')) return 'Meeting Details'
  return 'MeetFlow'
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchResult {
  _id:      string
  type:     'meeting' | 'document'
  title:    string
  subtitle: string
  href:     string
  openNew?: boolean
}

// ─── Clock ────────────────────────────────────────────────────────────────────

function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  return (
    // Visible on ALL screen sizes — compact on mobile, full on lg+
    <div className="text-right flex-shrink-0">
      {/* Date — hide on very small screens to save space */}
      <p className="hidden sm:block text-xs font-medium text-gray-900">
        {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
      </p>
      {/* Time — always visible */}
      <p className="text-xs text-gray-400">
        {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  )
}

// ─── Shared search logic hook ─────────────────────────────────────────────────

function useSearch() {
  const router = useRouter()
  const [query,     setQuery]     = useState('')
  const [results,   setResults]   = useState<SearchResult[]>([])
  const [loading,   setLoading]   = useState(false)
  const [open,      setOpen]      = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setActiveIdx(-1) }, [results])

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return }
    setLoading(true)
    setOpen(true)
    try {
      const [meetRes, docRes] = await Promise.allSettled([
        fetch(`/api/meetings?search=${encodeURIComponent(q)}`),
        fetch(`/api/documents?search=${encodeURIComponent(q)}`),
      ])

      const meetings: SearchResult[]  = []
      const documents: SearchResult[] = []

      if (meetRes.status === 'fulfilled' && meetRes.value.ok) {
        const data = await meetRes.value.json()
        const arr  = Array.isArray(data) ? data : (data.meetings ?? [])
        arr.slice(0, 5).forEach((m: any) => {
          meetings.push({
            _id:      m._id,
            type:     'meeting',
            title:    m.title ?? 'Untitled meeting',
            subtitle: m.startTime
              ? new Date(m.startTime).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })
              : '',
            href: `/meetings/${m._id}`,
          })
        })
      }

      if (docRes.status === 'fulfilled' && docRes.value.ok) {
        const data = await docRes.value.json()
        const arr  = Array.isArray(data) ? data : (data.documents ?? [])
        arr.slice(0, 5).forEach((d: any) => {
          documents.push({
            _id:      d._id,
            type:     'document',
            title:    d.name ?? d.title ?? 'Untitled document',
            subtitle: d.updatedAt
              ? `Updated ${new Date(d.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
              : '',
            href:    d.url ?? '/documents',
            openNew: !!d.url,
          })
        })
      }

      setResults([...meetings, ...documents])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = (val: string) => {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 300)
  }

  const handleClear = () => { setQuery(''); setResults([]); setOpen(false) }

  const handleResultClick = (result: SearchResult) => {
    setOpen(false)
    setQuery('')
    setResults([])
    if (result.openNew) {
      window.open(result.href, '_blank', 'noopener,noreferrer')
    } else {
      router.push(result.href)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIdx >= 0 && results[activeIdx]) {
      handleResultClick(results[activeIdx])
    }
  }

  return {
    query, results, loading, open, activeIdx,
    handleChange, handleClear, handleResultClick, handleKeyDown,
    setOpen,
  }
}

// ─── Results dropdown (shared between desktop + mobile) ───────────────────────

function ResultsDropdown({
  query, results, loading, activeIdx, onResultClick,
}: {
  query: string
  results: SearchResult[]
  loading: boolean
  activeIdx: number
  onResultClick: (r: SearchResult) => void
}) {
  return (
    <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl border
                    border-gray-100 shadow-xl z-50 overflow-hidden">
      {!loading && results.length === 0 && query.trim() && (
        <div className="py-8 text-center">
          <Search className="h-7 w-7 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">
            No results for{' '}
            <span className="font-medium text-gray-600">"{query}"</span>
          </p>
        </div>
      )}

      {results.length > 0 && (
        <>
          {results.filter(r => r.type === 'meeting').length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                Meetings
              </p>
              {results.filter(r => r.type === 'meeting').map(r => (
                <button
                  key={r._id}
                  onClick={() => onResultClick(r)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                    ${activeIdx === results.indexOf(r) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                    {r.subtitle && <p className="text-xs text-gray-400 truncate">{r.subtitle}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {results.filter(r => r.type === 'document').length > 0 && (
            <div className="border-t border-gray-50">
              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                Documents
              </p>
              {results.filter(r => r.type === 'document').map(r => (
                <button
                  key={r._id}
                  onClick={() => onResultClick(r)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                    ${activeIdx === results.indexOf(r) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="h-7 w-7 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                    {r.subtitle && <p className="text-xs text-gray-400 truncate">{r.subtitle}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
            <p className="text-xs text-gray-400">
              {results.length} result{results.length !== 1 ? 's' : ''}
              <span className="hidden sm:inline ml-2 text-gray-300">
                ↑↓ navigate · Enter to open · Esc to close
              </span>
            </p>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Desktop search (sm and up) ───────────────────────────────────────────────

function DesktopSearch() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const s = useSearch()

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        s.setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') { s.setOpen(false); s.handleClear() }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <div ref={wrapRef} className="relative hidden sm:block flex-shrink-0">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={s.query}
          onChange={e => s.handleChange(e.target.value)}
          onKeyDown={s.handleKeyDown}
          onFocus={() => { if (s.query.trim() && s.results.length > 0) s.setOpen(true) }}
          placeholder="Search meetings, docs…"
          className="h-9 w-48 lg:w-72 rounded-lg border border-gray-200 pl-9 pr-8 text-sm
                     text-gray-700 placeholder:text-gray-400 bg-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                     transition-all"
        />
        {s.loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 animate-spin" />
        )}
        {!s.loading && s.query && (
          <button
            onClick={s.handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {s.open && (
        <div className="absolute top-full mt-2 right-0 w-80 lg:w-96">
          <ResultsDropdown
            query={s.query}
            results={s.results}
            loading={s.loading}
            activeIdx={s.activeIdx}
            onResultClick={s.handleResultClick}
          />
        </div>
      )}
    </div>
  )
}

// ─── Mobile search overlay ────────────────────────────────────────────────────

function MobileSearch() {
  const [overlayOpen, setOverlayOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const s = useSearch()

  // Auto-focus input when overlay opens
  useEffect(() => {
    if (overlayOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      s.handleClear()
    }
  }, [overlayOpen])

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') setOverlayOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleResultClick = (r: SearchResult) => {
    s.handleResultClick(r)
    setOverlayOpen(false)
  }

  return (
    <>
      {/* Search icon button — mobile only */}
      <button
        onClick={() => setOverlayOpen(true)}
        className="sm:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100
                   transition-colors flex-shrink-0"
        aria-label="Search"
      >
        <Search className="h-5 w-5" />
      </button>

      {/* Full-screen overlay */}
      {overlayOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col sm:hidden">
          {/* Top bar */}
          <div className="flex items-center gap-2 px-4 h-16 border-b border-gray-100 flex-shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={s.query}
                onChange={e => s.handleChange(e.target.value)}
                onKeyDown={s.handleKeyDown}
                placeholder="Search meetings, docs…"
                className="h-10 w-full rounded-lg border border-gray-200 pl-9 pr-8 text-sm
                           text-gray-700 placeholder:text-gray-400 bg-gray-50
                           focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
              {s.loading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 animate-spin" />
              )}
              {!s.loading && s.query && (
                <button
                  onClick={s.handleClear}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => setOverlayOpen(false)}
              className="text-sm font-medium text-blue-600 flex-shrink-0 px-1"
            >
              Cancel
            </button>
          </div>

          {/* Results — scrollable */}
          <div className="flex-1 overflow-y-auto">
            {/* Empty state before typing */}
            {!s.query && (
              <div className="flex flex-col items-center justify-center h-48 gap-2">
                <Search className="h-8 w-8 text-gray-200" />
                <p className="text-sm text-gray-400">Search meetings and documents</p>
              </div>
            )}

            {s.query && (
              <div className="relative px-4 pt-2">
                <ResultsDropdown
                  query={s.query}
                  results={s.results}
                  loading={s.loading}
                  activeIdx={s.activeIdx}
                  onResultClick={handleResultClick}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

export default function Header() {
  const pathname      = usePathname()
  const toggleSidebar = useAppStore(s => s.toggleSidebar)

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center
                       px-4 sm:px-6 gap-2 sm:gap-3 flex-shrink-0">

      {/* Hamburger — mobile only */}
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100
                   transition-colors md:hidden flex-shrink-0"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Page title */}
      <h1 className="text-base sm:text-lg font-semibold text-gray-900 mr-auto truncate">
        {getTitle(pathname)}
      </h1>

      {/* Mobile search icon → overlay */}
      <MobileSearch />

      {/* Desktop inline search */}
      <DesktopSearch />

      {/* Clock — visible on all sizes */}
      <Clock />

    </header>
  )
}