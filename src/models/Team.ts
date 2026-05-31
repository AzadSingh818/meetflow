import mongoose, { Schema, Document, Model } from 'mongoose'

export type TeamRole = 'admin' | 'organizer' | 'member'

export interface ITeamMember {
  user:      mongoose.Types.ObjectId
  email:     string
  name?:     string
  role:      TeamRole
  joinedAt:  Date
}

export interface ITeam extends Document {
  _id:         mongoose.Types.ObjectId
  name:        string
  slug:        string
  description?: string
  owner:       mongoose.Types.ObjectId
  members:     ITeamMember[]
  createdAt:   Date
  updatedAt:   Date
}

const TeamMemberSchema = new Schema<ITeamMember>({
  user:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  email:    { type: String, required: true, lowercase: true, trim: true },
  name:     { type: String },
  role:     { type: String, enum: ['admin','organizer','member'], default: 'member' },
  joinedAt: { type: Date, default: Date.now },
}, { _id: false })

const TeamSchema = new Schema<ITeam>({
  name:        { type: String, required: true, maxlength: 80, trim: true },
  slug:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, maxlength: 500 },
  owner:       { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  members:     { type: [TeamMemberSchema], default: [] },
}, { timestamps: true })

// Auto-generate slug from name if not provided
TeamSchema.pre('validate', function () {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Math.random().toString(36).slice(2, 6)
  }
})

const Team: Model<ITeam> =
  mongoose.models.Team ?? mongoose.model<ITeam>('Team', TeamSchema)

export default Team