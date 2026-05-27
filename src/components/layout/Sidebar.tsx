'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { format, formatDistanceToNow, isPast } from 'date-fns';

import { cn, getInitials } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

import {
  CalendarDays,
  LayoutDashboard,
  Plus,
  FileText,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard',      label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/meetings',       label: 'Meetings',     icon: CalendarDays    },
  { href: '/meetings/create',label: 'New Meeting',  icon: Plus, accent: true },
  { href: '/documents',      label: 'Documents',    icon: FileText        },
  { href: '/profile',        label: 'Profile',      icon: User            },
];

interface UpcomingMeeting {
  _id:       string
  title:     string
  startTime: string
  color?:    string
}

// ── Notification dropdown (renders above the bell button) ─────────────────
function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const [meetings, setMeetings] = useState<UpcomingMeeting[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    fetch('/api/meetings?status=scheduled')
      .then(r => r.json())
      .then((data: UpcomingMeeting[]) => {
        const upcoming = (Array.isArray(data) ? data : [])
          .filter(m => !isPast(new Date(m.startTime)))
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
          .slice(0, 5)
        setMeetings(upcoming)
      })
      .catch(() => setMeetings([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="absolute bottom-full left-0 mb-2 w-80 bg-white rounded-2xl border border-gray-100
                    shadow-xl z-50 overflow-hidden text-gray-900">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <p className="text-sm font-semibold">Upcoming Meetings</p>
        <Link href="/meetings" onClick={onClose}
          className="text-xs text-blue-600 hover:underline">
          View all
        </Link>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        )}
        {!loading && meetings.length === 0 && (
          <div className="py-8 text-center">
            <Bell className="h-8 w-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No upcoming meetings</p>
          </div>
        )}
        {!loading && meetings.map(m => (
          <Link key={m._id} href={`/meetings/${m._id}`} onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
            <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${m.color ?? '#2563EB'}20` }}>
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: m.color ?? '#2563EB' }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{m.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {format(new Date(m.startTime), 'EEE, MMM d · h:mm a')}
              </p>
            </div>
            <span className="text-xs text-blue-500 font-medium flex-shrink-0">
              {formatDistanceToNow(new Date(m.startTime), { addSuffix: true })}
            </span>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
        <Link href="/meetings/create" onClick={onClose}
          className="text-xs text-blue-600 hover:underline font-medium">
          + Schedule a new meeting
        </Link>
      </div>
    </div>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────
const Sidebar = () => {
  const pathname      = usePathname()
  const { data: session } = useSession()
  const sidebarOpen   = useAppStore(s => s.sidebarOpen)
  const toggleSidebar = useAppStore(s => s.toggleSidebar)

  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <aside className={cn(
      'fixed inset-y-0 left-0 z-40 flex flex-col bg-slate-800 text-white transition-all duration-300',
      sidebarOpen ? 'w-64' : 'w-16'
    )}>

      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
        {sidebarOpen ? (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">MeetFlow</span>
          </Link>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center mx-auto">
            <CalendarDays className="w-4 h-4 text-white" />
          </div>
        )}
        {sidebarOpen && (
          <button onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {!sidebarOpen && (
        <button onClick={toggleSidebar}
          className="mx-auto mt-2 p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, accent }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                active   ? 'bg-blue-600 text-white'
                : accent ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                :          'text-slate-300 hover:bg-white/10'
              )}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-white/10 p-3 space-y-1">

        {/* Notification bell with dropdown */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen(o => !o)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300
                       hover:bg-white/10 transition-colors relative"
          >
            <Bell className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Notifications</span>}
            {/* Unread dot */}
            <span className="absolute top-2 left-6 h-2 w-2 rounded-full bg-blue-400" />
          </button>

          {notifOpen && (
            <NotificationDropdown onClose={() => setNotifOpen(false)} />
          )}
        </div>

        {/* User info */}
        {session?.user && (
          <div className={cn(
            'flex items-center gap-3 px-3 py-2.5',
            !sidebarOpen && 'justify-center'
          )}>
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {session.user.image ? (
                <img src={session.user.image} alt="profile"
                  className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <span className="text-xs font-semibold">
                  {getInitials(session.user.name ?? 'U')}
                </span>
              )}
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{session.user.name}</p>
                <p className="text-xs text-slate-400 truncate">{session.user.email}</p>
              </div>
            )}
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300
                     hover:bg-red-500/20 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {sidebarOpen && <span className="text-sm">Sign Out</span>}
        </button>

      </div>
    </aside>
  )
}

export default Sidebar;