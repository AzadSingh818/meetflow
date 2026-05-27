import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IAttendee {
  user?:      mongoose.Types.ObjectId
  email:      string
  name?:      string
  status:     'pending' | 'accepted' | 'declined'
  rsvpToken?: string   // ← ADD THIS
}

export interface IRecurrence {
  enabled:  boolean
  pattern?: 'daily' | 'weekly' | 'monthly'
  until?:   Date
}

export interface IMeeting extends Document {
  _id: mongoose.Types.ObjectId
  title:       string
  description?: string
  organizer:   mongoose.Types.ObjectId
  attendees:   IAttendee[]
  startTime:   Date
  endTime:     Date
  timezone:    string
  location?:   string
  meetLink?:   string
  status:      'scheduled' | 'cancelled' | 'completed'
  recurrence:  IRecurrence
  tags:        string[]
  color:       string
  reminders:   number[]
  createdAt:   Date
  updatedAt:   Date
}

const AttendeeSchema = new Schema<IAttendee>({
  user:       { type: Schema.Types.ObjectId, ref: 'User' },
  email:      { type: String, required: true },
  name:       { type: String },
  status:     { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  rsvpToken:  { type: String },   // ← ADD THIS
}, { _id: false })

const MeetingSchema = new Schema<IMeeting>(
  {
    title:       { type: String, required: [true, 'Title is required'], trim: true, maxlength: 120 },
    description: { type: String, maxlength: 2000 },
    organizer:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    attendees:   [AttendeeSchema],
    startTime:   { type: Date, required: [true, 'Start time is required'] },
    endTime:     { type: Date, required: [true, 'End time is required'] },
    timezone:    { type: String, default: 'UTC' },
    location:    { type: String, maxlength: 200 },
    meetLink:    { type: String },
    status:      { type: String, enum: ['scheduled', 'cancelled', 'completed'], default: 'scheduled' },
    recurrence: {
      enabled: { type: Boolean, default: false },
      pattern: { type: String, enum: ['daily', 'weekly', 'monthly'] },
      until:   { type: Date },
    },
    tags:      [{ type: String, trim: true }],
    color:     { type: String, default: '#2563EB' },
    reminders: [{ type: Number }],
  },
  { timestamps: true }
)

// ── Indexes for query performance ──────────────────────────────────────────
MeetingSchema.index({ organizer: 1, startTime: 1 })
MeetingSchema.index({ 'attendees.email': 1 })
MeetingSchema.index({ status: 1 })

const Meeting: Model<IMeeting> =
  mongoose.models.Meeting ?? mongoose.model<IMeeting>('Meeting', MeetingSchema)

export default Meeting
