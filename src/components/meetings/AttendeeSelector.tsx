'use client'

import { useState, useRef } from 'react'
import { X, Plus, Mail, User } from 'lucide-react'

export interface AttendeeInput { email: string; name?: string }

interface Props {
  value:          AttendeeInput[]
  onChangeAction: (attendees: AttendeeInput[]) => void
}

function isEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) }

export default function AttendeeSelector({ value, onChangeAction }: Props) {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const ref = useRef<HTMLInputElement>(null)

  const add = () => {
    const email = input.trim().toLowerCase()
    if (!email) return
    if (!isEmail(email))                    { setError('Enter a valid email'); return }
    if (value.some(a => a.email === email)) { setError('Already added');       return }
    onChangeAction([...value, { email }])
    setInput(''); setError('')
    ref.current?.focus()
  }

  const remove = (email: string) => onChangeAction(value.filter(a => a.email !== email))

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() }
    if (e.key === 'Backspace' && !input && value.length) remove(value.at(-1)!.email)
  }

  return (
    <div className="space-y-3">

      {/* Chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map(a => (
            <span key={a.email}
              className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 text-xs
                         font-medium px-2.5 py-1.5 rounded-full border border-blue-200 max-w-full">
              <User className="h-3 w-3 flex-shrink-0" />
              <span className="truncate max-w-[180px] sm:max-w-xs">{a.name ?? a.email}</span>
              <button type="button" onClick={() => remove(a.email)}
                className="text-blue-400 hover:text-blue-800 ml-0.5 transition-colors flex-shrink-0">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input row — stacks on very small screens */}
      <div className="flex flex-col xs:flex-row gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            ref={ref}
            type="email"
            value={input}
            onChange={e => { setInput(e.target.value); setError('') }}
            onKeyDown={onKey}
            placeholder="attendee@example.com"
            className="h-10 w-full pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          type="button"
          onClick={add}
          className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm
                     font-medium transition-colors flex items-center justify-center gap-1.5
                     w-full xs:w-auto flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-xs text-gray-400">Press Enter or comma to add · Backspace to remove last</p>
    </div>
  )
}