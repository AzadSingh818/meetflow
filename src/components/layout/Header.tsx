'use client'

import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':       'Dashboard',
  '/meetings':        'Meetings',
  '/meetings/create': 'New Meeting',
  '/documents':       'Documents',
  '/profile':         'Profile',
}

function getTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  if (pathname.startsWith('/meetings/') && pathname.endsWith('/edit')) return 'Edit Meeting'
  if (pathname.startsWith('/meetings/')) return 'Meeting Details'
  return 'MeetFlow'
}

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 flex-shrink-0">
      <h1 className="text-lg font-semibold text-gray-900 mr-auto">{getTitle(pathname)}</h1>

      {/* Search */}
      <div className="hidden sm:block">
        <input
          type="text"
          placeholder="Search..."
          className="h-9 w-64 rounded-lg border border-gray-200 px-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
      </div>

      {/* Notifications */}
      {/* <button className="relative h-9 w-9 flex items-center justify-center rounded-lg
                         hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors">
        <Bell className="h-[18px] w-[18px]" />
        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
      </button> */}

      {/* Date/time */}
      <div className="hidden lg:block text-right">
        <p className="text-xs font-medium text-gray-900">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </p>
        <p className="text-xs text-gray-400">
          {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </header>
  )
}
