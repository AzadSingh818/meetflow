import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IMeetDocument extends Document {
  _id:         mongoose.Types.ObjectId
  owner:       mongoose.Types.ObjectId
  name:        string
  type:        'resume' | 'cover_letter' | 'report' | 'other'
  url:         string
  storagePath: string
  size:        number
  mimeType:    string
  meeting?:    mongoose.Types.ObjectId
  createdAt:   Date
  updatedAt:   Date
}

const MeetDocumentSchema = new Schema<IMeetDocument>(
  {
    owner:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name:        { type: String, required: true, trim: true },
    type:        { type: String, enum: ['resume', 'cover_letter', 'report', 'other'], default: 'other' },
    url:         { type: String, required: true },
    storagePath: { type: String },
    size:        { type: Number },
    mimeType:    { type: String },
    meeting:     { type: Schema.Types.ObjectId, ref: 'Meeting' },
  },
  { timestamps: true }
)

MeetDocumentSchema.index({ owner: 1, createdAt: -1 })

const MeetDocument: Model<IMeetDocument> =
  mongoose.models.MeetDocument ??
  mongoose.model<IMeetDocument>('MeetDocument', MeetDocumentSchema)

export default MeetDocument
