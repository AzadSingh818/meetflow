import { z } from 'zod'

// ── Auth ───────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  name:            z.string().min(2, 'Name must be at least 2 characters').max(100),
  email:           z.string().email('Invalid email address'),
  password:        z.string().min(8, 'Password must be at least 8 characters')
                    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
                    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path:    ['confirmPassword'],
})

// ── Meeting ────────────────────────────────────────────────────────────────
export const createMeetingSchema = z.object({
  title:       z.string().min(1, 'Title is required').max(120),
  description: z.string().max(2000).optional(),
  startTime:   z.string().datetime(),
  endTime:     z.string().datetime(),
  location:    z.string().max(200).optional(),
  meetLink:    z.string().url('Invalid URL').optional().or(z.literal('')),
  color:       z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#2563EB'),
  tags:        z.array(z.string()).max(10).optional(),
  reminders:   z.array(z.number().min(0)).optional(),
  attendees: z.array(z.object({
    email: z.string().email(),
    name:  z.string().optional(),
  })).optional(),
  recurrence: z.object({
    enabled: z.boolean(),
    pattern: z.enum(['daily', 'weekly', 'monthly']).optional(),
    until:   z.string().datetime().optional(),
  }).optional(),
}).refine(
  data => new Date(data.endTime) > new Date(data.startTime),
  { message: 'End time must be after start time', path: ['endTime'] }
)

export type LoginFormData     = z.infer<typeof loginSchema>
export type RegisterFormData  = z.infer<typeof registerSchema>
export type CreateMeetingData = z.infer<typeof createMeetingSchema>
