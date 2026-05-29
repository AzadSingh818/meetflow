import mongoose, { Schema, Document, Model } from 'mongoose'
import crypto from 'crypto'

export interface IAttendee {
  email:     string
  name?:     string
  status:    'pending' | 'accepted' | 'declined'
  rsvpToken: string   // ← unique token per attendee for email RSVP links
}

export interface IMeeting extends Document {
  _id:         mongoose.Types.ObjectId
  title:       string
  description?: string
  organizer:   mongoose.Types.ObjectId
  startTime:   Date
  endTime:     Date
  location?:   string
  meetLink?:   string
  color:       string
  tags:        string[]
  attendees:   IAttendee[]
  reminders:   number[]
  remindersSent: number[]
  status:      'scheduled' | 'cancelled' | 'completed'
  recurrence?: {
    enabled:  boolean
    pattern?: 'daily' | 'weekly' | 'monthly'
    until?:   Date
  }
  createdAt:  Date
  updatedAt:  Date
}

const AttendeeSchema = new Schema<IAttendee>({
  email:     { type: String, required: true, lowercase: true, trim: true },
  name:      { type: String },
  status:    { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  rsvpToken: { type: String, default: () => crypto.randomBytes(32).toString('hex') },
}, { _id: false })

const MeetingSchema = new Schema<IMeeting>({
  title:         { type: String, required: true, maxlength: 120, trim: true },
  description:   { type: String, maxlength: 2000 },
  organizer:     { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  startTime:     { type: Date, required: true, index: true },
  endTime:       { type: Date, required: true },
  location:      { type: String, maxlength: 200 },
  meetLink:      { type: String },
  color:         { type: String, default: '#2563EB' },
  tags:          { type: [String], default: [] },
  attendees:     { type: [AttendeeSchema], default: [] },
  reminders:     { type: [Number], default: [15] },
  remindersSent: { type: [Number], default: [] },
  status:        { type: String, enum: ['scheduled', 'cancelled', 'completed'], default: 'scheduled', index: true },
  recurrence: {
    enabled: { type: Boolean, default: false },
    pattern: { type: String, enum: ['daily', 'weekly', 'monthly'] },
    until:   { type: Date },
  },
}, { timestamps: true })

MeetingSchema.index({ title: 'text', description: 'text', tags: 'text' })

const Meeting: Model<IMeeting> =
  mongoose.models.Meeting ?? mongoose.model<IMeeting>('Meeting', MeetingSchema)

export default Meeting