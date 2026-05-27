import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Providers from '@/components/layout/Providers'
import { Toaster } from 'sonner'
// Suppress TS error about missing type declarations for CSS side-effect import
// @ts-ignore: Implicit any for CSS module import
import './globals.css'

const inter = Inter({
  subsets:  ['latin'],
  variable: '--font-inter',
  display:  'swap',
})

export const metadata: Metadata = {
  title:       { default: 'MeetFlow', template: '%s | MeetFlow' },
  description: 'Professional meeting scheduler — plan, manage and join meetings effortlessly.',
  keywords:    ['meetings', 'scheduler', 'calendar', 'productivity'],
  openGraph: {
    title:       'MeetFlow',
    description: 'Professional meeting scheduler',
    type:        'website',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers session={session}>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  )
}