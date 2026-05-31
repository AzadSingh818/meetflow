import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // If logged in, redirect away from auth pages
    if (token && (
      pathname === '/login' ||
      pathname === '/register' ||
      pathname === '/' ||
      pathname.startsWith('/forgot-password') ||
      pathname.startsWith('/reset-password')
    )) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const { pathname } = req.nextUrl

        // Public routes — no login required
        if (
          pathname.startsWith('/login') ||
          pathname.startsWith('/register') ||
          pathname.startsWith('/forgot-password') ||  // ← added
          pathname.startsWith('/reset-password') ||   // ← added
          pathname.startsWith('/rsvp') ||
          pathname.startsWith('/rsvp-confirmed') ||
          pathname.startsWith('/rsvp-error') ||
          pathname.startsWith('/_next') ||
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/api/auth/forgot-password') || // ← added
          pathname.startsWith('/api/auth/reset-password') ||  // ← added
          pathname === '/favicon.ico'
        ) {
          return true
        }

        // All other routes require a token
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}