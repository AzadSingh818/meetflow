'use client'

import { usePathname } from 'next/navigation'
import { Menu, Search } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':       'Dashboard',
  '/meetings':        'Meetings',
  '/meetings/create': 'New Meeting',
  '/documents':       'Documents',
  '/profile':         'Profile',
}

export default function Header() {
  const pathname      = usePathname()
  const toggleSidebar = useAppStore(s => s.toggleSidebar)
  const [query, setQuery] = useState('')
  const router = useRouter()

  const title =
    PAGE_TITLES[pathname] ??
    Object.entries(PAGE_TITLES).find(([k]) => pathname.startsWith(k + '/'))?.[1] ??
    'MeetFlow'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/meetings?search=${encodeURIComponent(query.trim())}`)
      setQuery('')
    }
  }

  return (
    <header className="h-16 flex items-center justify-between px-4 bg-white border-b border-gray-100 flex-shrink-0">

      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>

      {/* Right: search only — bell is now in sidebar */}
      <form onSubmit={handleSearch} className="hidden sm:flex items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search meetings..."
            className="h-9 w-56 pl-9 pr-3 rounded-lg border border-gray-200 bg-gray-50 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
          />
        </div>
      </form>

    </header>
  )
}