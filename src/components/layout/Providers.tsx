'use client'

import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import type { Session } from 'next-auth'
import ToastContainer from '@/components/ui/Toast'

interface ProvidersProps {
  children: React.ReactNode
  session:  Session | null
}

export default function Providers({ children, session }: ProvidersProps) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime:            60 * 1000,
          retry:                1,
          refetchOnWindowFocus: false,
        },
      },
    })
  )

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        {children}
        {/* Global toast notifications rendered outside page layout */}
        <ToastContainer />
      </QueryClientProvider>
    </SessionProvider>
  )
}
