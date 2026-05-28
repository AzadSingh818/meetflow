'use client'

import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { User, Globe, Save, Camera } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useQueryClient } from '@tanstack/react-query'

const TIMEZONES = [
  'UTC','America/New_York','America/Chicago','America/Denver','America/Los_Angeles',
  'Europe/London','Europe/Paris','Europe/Berlin','Asia/Kolkata','Asia/Singapore',
  'Asia/Tokyo','Asia/Shanghai','Australia/Sydney','Pacific/Auckland',
]

const schema = z.object({
  name:     z.string().min(2, 'At least 2 characters').max(100),
  timezone: z.string(),
})
type FD = z.infer<typeof schema>

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const addToast = useAppStore(s => s.addToast)
  const qc       = useQueryClient()

  const [saving,      setSaving]      = useState(false)
  const [profileName, setProfileName] = useState('')

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FD>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', timezone: 'UTC' },
  })

  useEffect(() => {
    if (!session?.user) return
    const load = async () => {
      try {
        const res  = await fetch('/api/users')
        if (!res.ok) throw new Error()
        const user = await res.json()
        reset({ name: user?.name ?? '', timezone: user?.timezone ?? 'UTC' })
        setProfileName(user?.name ?? session.user.name ?? '')
      } catch {
        reset({ name: session.user.name ?? '', timezone: 'UTC' })
        setProfileName(session.user.name ?? '')
      }
    }
    load()
  }, [session?.user?.id, reset])

  const onSubmit = async (data: FD) => {
    try {
      setSaving(true)
      const res    = await fetch('/api/users', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result?.error || 'Failed to update profile')
      setProfileName(result.name)
      await update({ ...session, user: { ...session?.user, name: result.name } })
      reset({ name: result.name, timezone: result.timezone ?? 'UTC' })
      qc.invalidateQueries({ queryKey: ['user'] })
      addToast({ type: 'success', title: 'Profile updated', message: 'Changes saved successfully' })
    } catch (e: unknown) {
      addToast({ type: 'error', title: 'Failed to save', message: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4 sm:space-y-6">

      {/* Page heading */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-gray-900">Profile settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account information</p>
      </div>

      {/* Avatar card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-4">

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-blue-100 flex items-center
                            justify-center text-xl sm:text-2xl font-bold text-blue-700
                            overflow-hidden ring-4 ring-blue-50">
              {session?.user?.image ? (
                <img src={session.user.image} alt="" className="h-full w-full object-cover" />
              ) : (
                getInitials(profileName || 'U')
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 h-7 w-7 bg-white border border-gray-200
                            rounded-full flex items-center justify-center shadow-sm cursor-pointer
                            hover:bg-gray-50 transition-colors">
              <Camera className="h-3.5 w-3.5 text-gray-500" />
            </div>
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">
              {profileName}
            </p>
            <p className="text-xs sm:text-sm text-gray-400 truncate">
              {session?.user?.email}
            </p>
            <span className="inline-block mt-1.5 text-xs bg-blue-50 text-blue-700
                             border border-blue-200 px-2 py-0.5 rounded-full font-medium capitalize">
              {session?.user?.role ?? 'user'}
            </span>
          </div>

        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 space-y-5">

        <h2 className="text-base font-semibold text-gray-900">Personal information</h2>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Full name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input {...register('name')} placeholder="Your full name"
              className="h-10 w-full pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Timezone</label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <select {...register('timezone')}
              className="h-10 w-full pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none">
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
          <p className="mt-1 text-xs text-gray-400">Meeting times are displayed in this timezone</p>
        </div>

        {/* Footer row */}
        <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row
                        items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-gray-400 order-2 sm:order-1">
            {isDirty ? 'You have unsaved changes' : 'All changes saved'}
          </p>
          <button type="submit" disabled={saving || !isDirty}
            className="order-1 sm:order-2 w-full sm:w-auto flex items-center justify-center
                       gap-2 h-10 px-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                       text-white rounded-lg text-sm font-semibold transition-colors">
            {saving
              ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              : <Save className="h-4 w-4" />}
            Save changes
          </button>
        </div>
      </form>

      {/* Account details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Account details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Email',      value: session?.user?.email },
            { label: 'Account ID', value: session?.user?.id?.slice(-8) },
            { label: 'Role',       value: session?.user?.role ?? 'user' },
            { label: 'Auth',       value: session?.user?.image?.includes('googleusercontent')
                                          ? 'Google OAuth' : 'Email / Password' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs text-gray-400 font-medium">{label}</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5 truncate">{value}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}