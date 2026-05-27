import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Sign in' }

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (session) redirect('/dashboard')

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: branding panel */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 text-white">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center font-bold text-lg">
            M
          </div>
          <span className="text-xl font-semibold">MeetFlow</span>
        </Link>

        <div className="space-y-6">
          <blockquote className="text-2xl font-light leading-relaxed">
            "The most productive teams schedule smarter, not harder."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-medium">
              A
            </div>
            <div>
              <p className="font-medium">Team</p>
              <p className="text-blue-200 text-sm">Product Engineering</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 text-center">
          {[
            { value: '10k+', label: 'Meetings scheduled' },
            { value: '500+', label: 'Teams using MeetFlow' },
            { value: '99.9%', label: 'Uptime' },
          ].map(stat => (
            <div key={stat.label}>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-blue-200 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right: form area */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              M
            </div>
            <span className="text-lg font-semibold">MeetFlow</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  )
}
