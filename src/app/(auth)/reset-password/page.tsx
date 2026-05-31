'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react'
import { Video } from 'lucide-react'

// ── Password strength checklist ───────────────────────────────────────────
function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {ok
        ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
        : <XCircle      className="h-3.5 w-3.5 text-gray-300  flex-shrink-0" />
      }
      <span className={`text-xs ${ok ? 'text-green-600' : 'text-gray-400'}`}>{label}</span>
    </div>
  )
}

// ── Inner form (needs useSearchParams so must be inside Suspense) ─────────
function ResetForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const token        = searchParams.get('token') ?? ''

  const [password,    setPassword]    = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [showConf,    setShowConf]    = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState(false)

  const checks = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number:    /[0-9]/.test(password),
    match:     password.length > 0 && password === confirm,
  }
  const allValid = Object.values(checks).every(Boolean)

  // Missing or obviously bad token
  if (!token) {
    return (
      <div className="p-8 flex flex-col items-center text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h1 className="text-lg font-bold text-gray-900 mb-2">Invalid reset link</h1>
        <p className="text-sm text-gray-500 mb-6">
          This link is missing or invalid. Please request a new one.
        </p>
        <Link href="/forgot-password"
          className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center">
          Request new link
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allValid) return
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong')

      setSuccess(true)
      // Redirect to login after 2.5s
      setTimeout(() => router.push('/login'), 2500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="p-8 flex flex-col items-center text-center">
        <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Password updated!</h1>
        <p className="text-sm text-gray-500 mb-1">Your password has been reset successfully.</p>
        <p className="text-xs text-gray-400">Redirecting you to sign in…</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Choose a new password</h1>
        <p className="text-sm text-gray-500 mt-1.5">
          Make it strong — you won't be asked for the old one.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* New password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            New password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="Min. 8 characters"
              className="h-11 w-full pl-10 pr-10 rounded-xl border border-gray-200 bg-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder:text-gray-400"
            />
            <button type="button" onClick={() => setShowPass(x => !x)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Confirm password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type={showConf ? 'text' : 'password'}
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setError('') }}
              placeholder="Repeat your password"
              className="h-11 w-full pl-10 pr-10 rounded-xl border border-gray-200 bg-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder:text-gray-400"
            />
            <button type="button" onClick={() => setShowConf(x => !x)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showConf ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Checklist */}
        {password.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
            <Check ok={checks.length}    label="At least 8 characters" />
            <Check ok={checks.uppercase} label="One uppercase letter" />
            <Check ok={checks.number}    label="One number" />
            <Check ok={checks.match}     label="Passwords match" />
          </div>
        )}

        {/* Server error */}
        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !allValid}
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                     text-white font-semibold rounded-xl text-sm transition-colors
                     flex items-center justify-center gap-2 mt-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Reset password
        </button>
      </form>

      <div className="mt-5 text-center">
        <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
          Back to sign in
        </Link>
      </div>
    </div>
  )
}

// ── Page wrapper ──────────────────────────────────────────────────────────
export default function ResetPasswordPage() {
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
          <Suspense fallback={
            <div className="p-8 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          }>
            <ResetForm />
          </Suspense>
        </div>

      </div>
    </div>
  )
}