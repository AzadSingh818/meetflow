import mongoose, { Document, Model, Schema } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  email: string
  password?: string
  image?: string
  role: 'user' | 'admin'
  timezone: string
  emailVerified?: Date
  createdAt: Date
  updatedAt: Date
  comparePassword(candidatePassword: string): Promise<boolean>
}

const UserSchema = new Schema<IUser>(
  {
    name:          { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
    email:         { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    password:      { type: String, select: false },   // excluded from queries by default
    image:         { type: String },
    role:          { type: String, enum: ['user', 'admin'], default: 'user' },
    timezone:      { type: String, default: 'UTC' },
    emailVerified: { type: Date },
  },
  {
    timestamps: true,           // adds createdAt / updatedAt
    toJSON: {
      transform(_, ret) {
        delete ret.password     // never serialize password
        return ret
      },
    },
  }
)

// ── Hash password before save ──────────────────────────────────────────────
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

// ── Instance method: compare password ─────────────────────────────────────
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false
  return bcrypt.compare(candidatePassword, this.password)
}


const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema)

export default User
