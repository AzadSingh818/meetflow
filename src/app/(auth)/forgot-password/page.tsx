'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import { Video } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email,       setEmail]       = useState('')
  const [submitted,   setSubmitted]   = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Something went wrong')
      }

      setSubmitted(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Video className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">MeetFlow</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {submitted ? (
            /* ── Success state ───────────────────────────────────────────── */
            <div className="p-8 flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Check your inbox</h1>
              <p className="text-sm text-gray-500 leading-relaxed mb-2">
                If an account exists for <strong className="text-gray-700">{email}</strong>,
                we've sent a password reset link.
              </p>
              <p className="text-xs text-gray-400 mb-8">
                The link expires in 1 hour. Check your spam folder if you don't see it.
              </p>
              <Link
                href="/login"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          ) : (
            /* ── Email form ──────────────────────────────────────────────── */
            <div className="p-8">
              <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900">Forgot your password?</h1>
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                  Enter your account email and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError('') }}
                      placeholder="you@example.com"
                      autoFocus
                      className="h-11 w-full pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                 placeholder:text-gray-400"
                    />
                  </div>
                  {error && (
                    <p className="mt-1.5 text-xs text-red-600">{error}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60
                             text-white font-semibold rounded-xl text-sm transition-colors
                             flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send reset link
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}