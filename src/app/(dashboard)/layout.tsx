import { ReactNode } from 'react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

interface DashboardLayoutProps {
  children: ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    /*
     * Outer shell: full-screen flex row
     * Sidebar sits on the left (fixed on mobile, relative on md+)
     * Main column fills remaining space with its own scroll
     */
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Sidebar — handles its own responsive behaviour internally */}
      <Sidebar />

      {/* Main column: header + scrollable page content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>

    </div>
  )
}