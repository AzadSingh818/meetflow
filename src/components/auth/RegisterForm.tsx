'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, UserPlus, Mail, Lock, User, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { registerSchema, type RegisterFormData } from '@/lib/validations'

export default function RegisterForm() {
  const router = useRouter()
  const [showPw, setShowPw]       = useState(false)
  const [showCp, setShowCp]       = useState(false)
  const [apiError, setApiError]   = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })

  const password = watch('password', '')

  // Password strength indicator
  const strength = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const strengthScore = strength.filter(Boolean).length
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strengthScore]
  const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'][strengthScore]

  const onSubmit = async (data: RegisterFormData) => {
    setApiError('')
    try {
      const res = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { setApiError(json.error); return }

      // Auto-login after registration
      await signIn('credentials', {
        email:    data.email,
        password: data.password,
        redirect: false,
      })
      router.push('/dashboard')
    } catch {
      setApiError('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Create your account</h1>
        <p className="text-sm text-gray-500">Start scheduling smarter with MeetFlow</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {apiError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
            {apiError}
          </div>
        )}

        {/* Full name */}
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium text-gray-700">Full name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input id="name" type="text" placeholder="Jane Smith" autoComplete="name"
              className="flex h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              {...register('name')}
            />
          </div>
          {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input id="email" type="email" placeholder="you@example.com" autoComplete="email"
              className="flex h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              {...register('email')}
            />
          </div>
          {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input id="password" type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters"
              className="flex h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-11 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              {...register('password')}
            />
            <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {/* Strength meter */}
          {password && (
            <div className="space-y-1.5">
              <div className="flex gap-1">
                {[0,1,2,3].map(i => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < strengthScore ? strengthColor : 'bg-gray-200'}`} />
                ))}
              </div>
              <p className="text-xs text-gray-500">Password strength: <span className="font-medium text-gray-700">{strengthLabel}</span></p>
            </div>
          )}
          {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input id="confirmPassword" type={showCp ? 'text' : 'password'} placeholder="Repeat your password"
              className="flex h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-11 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              {...register('confirmPassword')}
            />
            <button type="button" onClick={() => setShowCp(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showCp ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>}
        </div>

        {/* Requirements checklist */}
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 space-y-1.5">
          {[
            { ok: password.length >= 8,       label: 'At least 8 characters' },
            { ok: /[A-Z]/.test(password),     label: 'One uppercase letter' },
            { ok: /[0-9]/.test(password),     label: 'One number' },
          ].map(req => (
            <div key={req.label} className="flex items-center gap-2 text-xs">
              <CheckCircle2 className={`h-3.5 w-3.5 ${req.ok ? 'text-green-500' : 'text-gray-300'}`} />
              <span className={req.ok ? 'text-gray-700' : 'text-gray-400'}>{req.label}</span>
            </div>
          ))}
        </div>

        <Button type="submit" className="w-full h-11 text-base" isLoading={isSubmitting}>
          <UserPlus className="h-4 w-4" />
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  )
}
