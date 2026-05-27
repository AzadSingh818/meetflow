export interface Meeting {
  _id:         string
  title:       string
  description?: string
  organizer:   { _id: string; name: string; email: string; image?: string }
  attendees:   Attendee[]
  startTime:   string
  endTime:     string
  timezone:    string
  location?:   string
  meetLink?:   string
  status:      'scheduled' | 'cancelled' | 'completed'
  color:       string
  tags:        string[]
  reminders:   number[]
  recurrence:  { enabled: boolean; pattern?: string; until?: string }
  createdAt:   string
  updatedAt:   string
}

export interface Attendee {
  user?:  string
  email:  string
  name?:  string
  status: 'pending' | 'accepted' | 'declined'
}

export interface CalendarEvent {
  id:              string
  title:           string
  start:           string
  end:             string
  backgroundColor: string
  borderColor:     string
  extendedProps:   { meeting: Meeting }
}
