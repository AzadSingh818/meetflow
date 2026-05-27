import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // If user is logged in and tries to access auth pages, redirect to dashboard
    if (token && (pathname === '/login' || pathname === '/register' || pathname === '/')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      // Return true to allow the middleware function to run,
      // return false to redirect to login automatically
      authorized({ token, req }) {
        const { pathname } = req.nextUrl

        // Always allow access to auth pages and public assets
        if (
          pathname.startsWith('/login') ||
          pathname.startsWith('/register') ||
          pathname.startsWith('/_next') ||
          pathname.startsWith('/api/auth') ||
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
