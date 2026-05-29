'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Search, Clock, X, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import type { Meeting } from '@/types/meeting'

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

async function searchMeetings(q: string): Promise<Meeting[]> {
  if (!q || q.length < 2) return []
  const res = await fetch(`/api/meetings/search?q=${encodeURIComponent(q)}&limit=6`)
  if (!res.ok) return []
  return res.json()
}

export default function SearchBar() {
  const router  = useRouter()
  const ref     = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery]   = useState('')
  const [open,  setOpen]    = useState(false)
  const debounced           = useDebounce(query, 300)

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['search', debounced],
    queryFn:  () => searchMeetings(debounced),
    enabled:  debounced.length >= 2,
  })

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (id: string) => {
    setQuery('')
    setOpen(false)
    router.push(`/meetings/${id}`)
  }

  const showDropdown = open && query.length >= 2

  return (
    <div ref={ref} className="relative hidden md:block">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Search meetings…"
          className="h-9 pl-9 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-sm w-56
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     focus:w-72 transition-all duration-200 placeholder:text-gray-400"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false); inputRef.current?.focus() }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full mt-2 left-0 w-80 bg-white rounded-xl border border-gray-200
                        shadow-lg z-50 overflow-hidden">
          {isFetching ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching…
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No meetings found for <strong>"{query}"</strong></p>
            </div>
          ) : (
            <div>
              <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </p>
              {results.map(m => (
                <button
                  key={m._id}
                  onClick={() => handleSelect(m._id)}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                >
                  {/* Color dot */}
                  <div
                    className="h-2.5 w-2.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: m.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{m.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <p className="text-xs text-gray-500">
                        {format(new Date(m.startTime), 'MMM d · h:mm a')}
                      </p>
                    </div>
                    {m.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {m.tags.slice(0, 3).map(t => (
                          <span key={t} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
