import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
} from 'date-fns'

// =================== Tailwind helper ===================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// =================== Date helpers ===================

export function formatMeetingDate(
  date: Date | string
): string {
  const d = new Date(date)

  if (isToday(d))
    return `Today at ${format(d, 'h:mm a')}`

  if (isTomorrow(d))
    return `Tomorrow at ${format(d, 'h:mm a')}`

  return format(d, 'EEE, MMM d · h:mm a')
}

// Format just the time range e.g. "9:00 AM – 10:00 AM"
export function formatMeetingTime(
  startTime: Date | string,
  endTime: Date | string
): string {
  return `${format(new Date(startTime), 'h:mm a')} – ${format(new Date(endTime), 'h:mm a')}`
}

// Returns duration as a human-readable string e.g. "1h 30m"
export function getMeetingDuration(
  startTime: Date | string,
  endTime: Date | string
): string {
  const start = new Date(startTime)
  const end   = new Date(endTime)
  const mins  = Math.round((end.getTime() - start.getTime()) / 60000)

  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

// added because EventPopover expects it
export function formatDateTime(
  date: Date | string
): string {
  return format(new Date(date), 'PPP p')
}

export function formatRelative(
  date: Date | string
): string {
  return formatDistanceToNow(
    new Date(date),
    { addSuffix: true }
  )
}

// existing duration formatter (kept for backward compat)
export function formatDuration(
  startTime: Date | string,
  endTime: Date | string
): string {
  const start = new Date(startTime)
  const end   = new Date(endTime)
  const mins  = Math.round((end.getTime() - start.getTime()) / 60000)

  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

// added because EventPopover expects it
export function getDuration(
  startTime: Date | string,
  endTime: Date | string
): number {
  const start = new Date(startTime)
  const end   = new Date(endTime)
  return Math.round((end.getTime() - start.getTime()) / 60000)
}

// =================== Colors ===================

export const MEETING_COLORS = [
  { label: 'Blue',   value: '#2563EB' },
  { label: 'Purple', value: '#7C3AED' },
  { label: 'Green',  value: '#059669' },
  { label: 'Orange', value: '#EA580C' },
  { label: 'Red',    value: '#DC2626' },
  { label: 'Teal',   value: '#0D9488' },
  { label: 'Pink',   value: '#DB2777' },
]

// =================== String helpers ===================

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + '...' : str
}