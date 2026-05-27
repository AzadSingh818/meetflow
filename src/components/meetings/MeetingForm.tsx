'use client'

import { useState, forwardRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { format, addMinutes, parseISO } from 'date-fns'
import { Calendar, Clock, MapPin, Link2, Tag, RefreshCw,
         ChevronRight, ChevronLeft, Check } from 'lucide-react'
import AttendeeSelector, { type AttendeeInput } from './AttendeeSelector'
import { useCreateMeeting } from '@/hooks/useMeetings'
import { useAppStore } from '@/store/useAppStore'

const COLORS = ['#2563EB','#7C3AED','#059669','#D97706','#DC2626','#0D9488','#DB2777','#6366F1']

const DURATIONS = [
  { label:'15 min', value:15  }, { label:'30 min', value:30  },
  { label:'45 min', value:45  }, { label:'1 hour',  value:60  },
  { label:'1.5 h',  value:90  }, { label:'2 hours', value:120 },
  { label:'Custom', value:0   },
]

const REMINDERS = [
  { label:'5 min',  value:5    }, { label:'15 min', value:15   },
  { label:'30 min', value:30   }, { label:'1 hour', value:60   },
  { label:'1 day',  value:1440 },
]

const STEPS = [
  { id:1, label:'Basics'    },
  { id:2, label:'Details'   },
  { id:3, label:'Attendees' },
  { id:4, label:'Options'   },
]

const schema = z.object({
  title:             z.string().min(1, 'Title is required').max(120),
  description:       z.string().max(2000).optional(),
  duration:          z.number().min(1),
  location:          z.string().max(200).optional(),
  meetLink:          z.string().url('Must be a valid URL').optional().or(z.literal('')),
  color:             z.string().default('#2563EB'),
  tags:              z.string().optional(),
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

// ── KEY FIX: forwardRef so react-hook-form can pass its ref ──────────────
const FInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { cls?: string }
>(({ cls, ...rest }, ref) => (
  <input
    ref={ref}
    {...rest}
    className={`h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${cls ?? ''}`}
  />
))
FInput.displayName = 'FInput'

function todayString() { return format(new Date(), 'yyyy-MM-dd') }

export default function MeetingForm() {
  const router   = useRouter()
  const params   = useSearchParams()
  const addToast = useAppStore(s => s.addToast)
  const { mutate: create, isPending } = useCreateMeeting()

  const [step, setStep]           = useState(1)
  const [attendees, setAttendees] = useState<AttendeeInput[]>([])
  const [reminders, setReminders] = useState<number[]>([15])
  const [customDur, setCustomDur] = useState(60)

  // date and startHour in plain state — not in Zod schema
  const [date,      setDate]      = useState(
    params.get('start') ? format(parseISO(params.get('start')!), 'yyyy-MM-dd') : todayString()
  )
  const [startHour, setStartHour] = useState('10:00')
  const [dateErr,   setDateErr]   = useState('')
  const [timeErr,   setTimeErr]   = useState('')

  const {
    register, handleSubmit, control, watch, setValue, trigger,
    formState: { errors },
  } = useForm<FD>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      duration:          60,
      color:            '#2563EB',
      recurrenceEnabled: false,
    },
  })

  const wDur   = watch('duration')
  const wRec   = watch('recurrenceEnabled')
  const wCol   = watch('color')
  const wTitle = watch('title')

  const toggleReminder = (v: number) =>
    setReminders(r => r.includes(v) ? r.filter(x => x !== v) : [...r, v])

  const advanceStep = async () => {
    if (step === 1) {
      const titleOk = await trigger('title')
      let ok = titleOk
      if (!date)      { setDateErr('Date is required');       ok = false } else setDateErr('')
      if (!startHour) { setTimeErr('Start time is required'); ok = false } else setTimeErr('')
      if (!ok) return
    }
    if (step === 2) {
      const ok = await trigger('meetLink')
      if (!ok) return
    }
    setStep(s => Math.min(s + 1, 4))
  }

  const onSubmit = (data: FD) => {
    const start = new Date(`${date}T${startHour}:00`)
    const dur   = data.duration === 0 ? customDur : data.duration
    const end   = addMinutes(start, dur)
    const tags  = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : []

    create({
      title:       data.title,
      description: data.description,
      startTime:   start.toISOString(),
      endTime:     end.toISOString(),
      location:    data.location,
      meetLink:    data.meetLink || undefined,
      color:       data.color,
      tags,
      reminders,
      attendees,
      recurrence: {
        enabled: data.recurrenceEnabled,
        pattern: data.recurrencePattern,
        until:   data.recurrenceUntil ? new Date(data.recurrenceUntil).toISOString() : undefined,
      },
    } as Parameters<typeof create>[0], {
      onSuccess: (m: { _id: string }) => {
        addToast({ type: 'success', title: 'Meeting created!', message: 'Invites sent to attendees.' })
        router.push(`/meetings/${m._id}`)
      },
      onError: (e: Error) =>
        addToast({ type: 'error', title: 'Failed to create meeting', message: e.message }),
    })
  }

  return (
    <div className="max-w-2xl mx-auto pb-12">

      {/* Stepper */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <button type="button"
              onClick={() => step > s.id && setStep(s.id)}
              className={step > s.id ? 'cursor-pointer flex items-center gap-2' : 'cursor-default flex items-center gap-2'}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-all
                ${step === s.id ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                : step > s.id  ? 'bg-green-500 text-white'
                :                'bg-gray-100 text-gray-400'}`}>
                {step > s.id ? <Check className="h-4 w-4" /> : s.id}
              </div>
              <span className={`text-sm font-medium hidden sm:block
                ${step === s.id ? 'text-blue-700' : step > s.id ? 'text-green-700' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 transition-colors ${step > s.id ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

          {/* ── Step 1 : Basics ─────────────────────────────────── */}
          {step === 1 && <>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Basic information</h2>
              <p className="text-sm text-gray-500 mt-0.5">Give your meeting a clear title and time</p>
            </div>

            <div>
              <Lbl req>Meeting title</Lbl>
              <FInput placeholder="e.g. Weekly team sync" {...register('title')} />
              <Err msg={errors.title?.message} />
            </div>

            <div>
              <Lbl>Description</Lbl>
              <textarea placeholder="What will be discussed?" rows={3}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                {...register('description')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Lbl req>Date</Lbl>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input type="date" value={date}
                    onChange={e => { setDate(e.target.value); setDateErr('') }}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <Err msg={dateErr} />
              </div>
              <div>
                <Lbl req>Start time</Lbl>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input type="time" value={startHour}
                    onChange={e => { setStartHour(e.target.value); setTimeErr('') }}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <Err msg={timeErr} />
              </div>
            </div>

            <div>
              <Lbl req>Duration</Lbl>
              <div className="grid grid-cols-4 gap-2">
                {DURATIONS.map(d => (
                  <button key={d.value} type="button"
                    onClick={() => setValue('duration', d.value, { shouldValidate: false })}
                    className={`h-9 rounded-lg text-sm font-medium border transition-all
                      ${wDur === d.value ? 'bg-blue-600 text-white border-blue-600'
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
          </>}

          {/* ── Step 2 : Details ────────────────────────────────── */}
          {step === 2 && <>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Location &amp; link</h2>
              <p className="text-sm text-gray-500 mt-0.5">Where will people join?</p>
            </div>
            <div>
              <Lbl>Location</Lbl>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <FInput cls="pl-9" placeholder="Conference Room A or Virtual" {...register('location')} />
              </div>
            </div>
            <div>
              <Lbl>Meeting link</Lbl>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <FInput cls="pl-9" placeholder="https://meet.google.com/xxx" {...register('meetLink')} />
              </div>
              <Err msg={errors.meetLink?.message} />
              <p className="text-xs text-gray-400 mt-1">Attendees receive this link in their invite email</p>
            </div>
            <div>
              <Lbl>Tags</Lbl>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <FInput cls="pl-9" placeholder="design, sprint, weekly (comma separated)" {...register('tags')} />
              </div>
            </div>
          </>}

          {/* ── Step 3 : Attendees ──────────────────────────────── */}
          {step === 3 && <>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Invite attendees</h2>
              <p className="text-sm text-gray-500 mt-0.5">Each person will receive an email invitation</p>
            </div>
            <AttendeeSelector value={attendees} onChangeAction={setAttendees} />
            {attendees.length === 0 && (
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700">
                You can still create the meeting without attendees and add them later.
              </div>
            )}
          </>}

          {/* ── Step 4 : Options ────────────────────────────────── */}
          {step === 4 && <>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Reminders &amp; recurrence</h2>
              <p className="text-sm text-gray-500 mt-0.5">Keep everyone on track</p>
            </div>

            <div>
              <Lbl>Remind attendees</Lbl>
              <div className="flex flex-wrap gap-2">
                {REMINDERS.map(r => (
                  <button key={r.value} type="button" onClick={() => toggleReminder(r.value)}
                    className={`h-9 px-4 rounded-lg text-sm font-medium border transition-all
                      ${reminders.includes(r.value)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}>
                    {r.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Before the meeting starts</p>
            </div>

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
                <div className="grid grid-cols-2 gap-3 pt-1">
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

            {/* Summary */}
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Summary</p>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: wCol }} />
                <p className="text-sm font-semibold text-gray-900 truncate">{wTitle || '(untitled)'}</p>
              </div>
              {date && startHour && (
                <p className="text-xs text-gray-500">
                  {format(new Date(`${date}T${startHour}`), 'EEE, MMM d · h:mm a')}
                  {' · '}{wDur === 0 ? customDur : wDur} min
                </p>
              )}
              {attendees.length > 0 && (
                <p className="text-xs text-gray-500">
                  {attendees.length} attendee{attendees.length !== 1 ? 's' : ''} invited
                </p>
              )}
            </div>
          </>}
        </div>

        {/* Nav buttons */}
        <div className="flex items-center justify-between mt-6">
          <button type="button"
            onClick={() => step > 1 ? setStep(s => s - 1) : router.back()}
            className="flex items-center gap-2 h-10 px-4 border border-gray-200 text-gray-600
                       hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors">
            <ChevronLeft className="h-4 w-4" />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < 4
            ? <button type="button" onClick={advanceStep}
                className="flex items-center gap-2 h-10 px-6 bg-blue-600 hover:bg-blue-700
                           text-white rounded-lg text-sm font-semibold transition-colors">
                Continue <ChevronRight className="h-4 w-4" />
              </button>
            : <button type="submit" disabled={isPending}
                className="flex items-center gap-2 h-10 px-6 bg-blue-600 hover:bg-blue-700
                           disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-colors">
                {isPending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                Create meeting <Check className="h-4 w-4" />
              </button>
          }
        </div>
      </form>
    </div>
  )
}