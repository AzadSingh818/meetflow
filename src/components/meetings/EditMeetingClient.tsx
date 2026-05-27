'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, addMinutes } from 'date-fns'
import { toast } from 'sonner'
import { Calendar, Clock, MapPin, Link2, Tag, RefreshCw, ChevronLeft, Check, Loader2 } from 'lucide-react'

const COLORS = ['#2563EB','#7C3AED','#059669','#D97706','#DC2626','#0D9488','#DB2777','#6366F1']
const DURATIONS = [
  { label:'15 min', value:15 }, { label:'30 min', value:30 },
  { label:'45 min', value:45 }, { label:'1 hour',  value:60 },
  { label:'1.5 h',  value:90 }, { label:'2 hours', value:120 },
  { label:'Custom', value:0  },
]

const schema = z.object({
  title:       z.string().min(1, 'Title is required').max(120),
  description: z.string().max(2000).optional(),
  date:        z.string().min(1, 'Date is required'),
  startHour:   z.string().min(1, 'Start time required'),
  duration:    z.number().min(1),
  location:    z.string().max(200).optional(),
  meetLink:    z.string().url('Must be a valid URL').optional().or(z.literal('')),
  color:       z.string().default('#2563EB'),
  tags:        z.string().optional(),
  recurrenceEnabled: z.boolean().default(false),
  recurrencePattern: z.enum(['daily','weekly','monthly']).optional(),
  recurrenceUntil:   z.string().optional(),
})
type FD = z.infer<typeof schema>

function Lbl({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {children}{req && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}
function Err({ msg }: { msg?: string }) {
  return msg ? <p className="mt-1 text-xs text-red-600">{msg}</p> : null
}
function FInput(props: React.InputHTMLAttributes<HTMLInputElement> & { cls?: string }) {
  const { cls, ...rest } = props
  return (
    <input {...rest}
      className={`h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${cls ?? ''}`} />
  )
}

interface Props {
  meeting: {
    _id: string
    title: string
    description?: string
    startTime: string
    endTime: string
    location?: string
    meetLink?: string
    color?: string
    tags?: string[]
    recurrence?: { enabled: boolean; pattern?: string; until?: string }
  }
}

export default function EditMeetingClient({ meeting }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [customDur, setCustomDur]   = useState(60)

  // Derive defaults from existing meeting
  const startDate = new Date(meeting.startTime)
  const endDate   = new Date(meeting.endTime)
  const diffMins  = Math.round((endDate.getTime() - startDate.getTime()) / 60000)
  const knownDur  = DURATIONS.find(d => d.value === diffMins && d.value !== 0)
  const initDur   = knownDur ? diffMins : 0

  const { register, handleSubmit, control, watch, setValue, trigger, formState: { errors } } = useForm<FD>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      title:             meeting.title,
      description:       meeting.description ?? '',
      date:              format(startDate, 'yyyy-MM-dd'),
      startHour:         format(startDate, 'HH:mm'),
      duration:          initDur,
      location:          meeting.location ?? '',
      meetLink:          meeting.meetLink ?? '',
      color:             meeting.color ?? '#2563EB',
      tags:              (meeting.tags ?? []).join(', '),
      recurrenceEnabled: meeting.recurrence?.enabled ?? false,
      recurrencePattern: (meeting.recurrence?.pattern as FD['recurrencePattern']) ?? 'weekly',
      recurrenceUntil:   meeting.recurrence?.until
        ? format(new Date(meeting.recurrence.until), 'yyyy-MM-dd')
        : '',
    },
  })

  if (initDur === 0 && diffMins > 0) setCustomDur(diffMins)

  const wDur = watch('duration')
  const wRec = watch('recurrenceEnabled')
  const wCol = watch('color')

  const onSubmit = async (data: FD) => {
    setSubmitting(true)
    try {
      const start = new Date(`${data.date}T${data.startHour}:00`)
      const dur   = data.duration === 0 ? customDur : data.duration
      const end   = addMinutes(start, dur)
      const tags  = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : []

      const res = await fetch(`/api/meetings/${meeting._id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:       data.title,
          description: data.description,
          startTime:   start.toISOString(),
          endTime:     end.toISOString(),
          location:    data.location,
          meetLink:    data.meetLink || undefined,
          color:       data.color,
          tags,
          recurrence: {
            enabled: data.recurrenceEnabled,
            pattern: data.recurrencePattern,
            until:   data.recurrenceUntil ? new Date(data.recurrenceUntil).toISOString() : undefined,
          },
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Update failed')
      }

      toast.success('Meeting updated!')
      router.push(`/meetings/${meeting._id}`)
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

      {/* Title */}
      <div>
        <Lbl req>Meeting title</Lbl>
        <FInput placeholder="e.g. Weekly team sync" {...register('title')} />
        <Err msg={errors.title?.message} />
      </div>

      {/* Description */}
      <div>
        <Lbl>Description</Lbl>
        <textarea rows={3} placeholder="What will be discussed?"
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          {...register('description')} />
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Lbl req>Date</Lbl>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <FInput type="date" cls="pl-9" {...register('date')} />
          </div>
          <Err msg={errors.date?.message} />
        </div>
        <div>
          <Lbl req>Start time</Lbl>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <FInput type="time" cls="pl-9" {...register('startHour')} />
          </div>
          <Err msg={errors.startHour?.message} />
        </div>
      </div>

      {/* Duration */}
      <div>
        <Lbl req>Duration</Lbl>
        <div className="grid grid-cols-4 gap-2">
          {DURATIONS.map(d => (
            <button key={d.value} type="button"
              onClick={() => setValue('duration', d.value, { shouldValidate: false })}
              className={`h-9 rounded-lg text-sm font-medium border transition-all
                ${wDur === d.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}>
              {d.label}
            </button>
          ))}
        </div>
        {wDur === 0 && (
          <div className="flex items-center gap-2 mt-2">
            <FInput type="number" cls="w-24" min={15} max={480}
              value={customDur} onChange={e => setCustomDur(Number(e.target.value))} />
            <span className="text-sm text-gray-500">minutes</span>
          </div>
        )}
      </div>

      {/* Location */}
      <div>
        <Lbl>Location</Lbl>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <FInput cls="pl-9" placeholder="Conference Room A or Virtual" {...register('location')} />
        </div>
      </div>

      {/* Meet Link */}
      <div>
        <Lbl>Meeting link</Lbl>
        <div className="relative">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <FInput cls="pl-9" placeholder="https://meet.google.com/xxx" {...register('meetLink')} />
        </div>
        <Err msg={errors.meetLink?.message} />
      </div>

      {/* Tags */}
      <div>
        <Lbl>Tags</Lbl>
        <div className="relative">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <FInput cls="pl-9" placeholder="design, sprint, weekly" {...register('tags')} />
        </div>
      </div>

      {/* Color */}
      <div>
        <Lbl>Event colour</Lbl>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map(c => (
            <button key={c} type="button"
              onClick={() => setValue('color', c, { shouldValidate: false })}
              className="h-7 w-7 rounded-full transition-transform hover:scale-110 flex-shrink-0"
              style={{ backgroundColor: c, outline: wCol === c ? `3px solid ${c}` : 'none', outlineOffset: '2px' }} />
          ))}
        </div>
      </div>

      {/* Recurrence */}
      <div className="rounded-xl border border-gray-100 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">Repeat this meeting</span>
          </div>
          <Controller name="recurrenceEnabled" control={control}
            render={({ field }) => (
              <button type="button" role="switch" aria-checked={field.value}
                onClick={() => field.onChange(!field.value)}
                className={`relative h-5 w-9 rounded-full transition-colors ${field.value ? 'bg-blue-600' : 'bg-gray-200'}`}>
                <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white
                  transition-transform duration-150 ${field.value ? 'translate-x-4' : ''}`} />
              </button>
            )} />
        </div>
        {wRec && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Lbl>Repeat every</Lbl>
              <select {...register('recurrencePattern')}
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="daily">Day</option>
                <option value="weekly">Week</option>
                <option value="monthly">Month</option>
              </select>
            </div>
            <div>
              <Lbl>End date</Lbl>
              <FInput type="date" {...register('recurrenceUntil')} />
            </div>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={() => router.back()}
          className="flex items-center gap-2 h-10 px-4 border border-gray-200 text-gray-600
                     hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors">
          <ChevronLeft className="h-4 w-4" /> Cancel
        </button>
        <button type="submit" disabled={submitting}
          className="flex items-center gap-2 h-10 px-6 bg-blue-600 hover:bg-blue-700
                     disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-colors">
          {submitting
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            : <><Check className="h-4 w-4" /> Save changes</>}
        </button>
      </div>
    </form>
  )
}
