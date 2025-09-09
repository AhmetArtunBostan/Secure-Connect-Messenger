import mongoose, { Document, Schema } from 'mongoose'

export interface IChat extends Document {
  type: 'private' | 'group'
  name?: string
  description?: string
  avatar?: string
  participants: mongoose.Types.ObjectId[]
  admins: mongoose.Types.ObjectId[]
  lastMessage?: mongoose.Types.ObjectId
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const chatSchema = new Schema<IChat>(
  {
    type: {
      type: String,
      enum: ['private', 'group'],
      required: [true, 'Chat type is required'],
    },
    name: {
      type: String,
      trim: true,
      maxlength: [50, 'Chat name must be less than 50 characters'],
      required: function (this: IChat) {
        return this.type === 'group'
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description must be less than 200 characters'],
    },
    avatar: {
      type: String,
      default: null,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    admins: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for better query performance
chatSchema.index({ participants: 1 })
chatSchema.index({ type: 1 })
chatSchema.index({ createdAt: -1 })
chatSchema.index({ updatedAt: -1 })

// Validate participants
chatSchema.pre('save', function (next) {
  // Private chats must have exactly 2 participants
  if (this.type === 'private' && this.participants.length !== 2) {
    return next(new Error('Private chats must have exactly 2 participants'))
  }

  // Group chats must have at least 2 participants
  if (this.type === 'group' && this.participants.length < 2) {
    return next(new Error('Group chats must have at least 2 participants'))
  }

  // Creator must be in participants
  if (!this.participants.includes(this.createdBy)) {
    this.participants.push(this.createdBy)
  }

  // Creator must be admin for group chats
  if (this.type === 'group' && !this.admins.includes(this.createdBy)) {
    this.admins.push(this.createdBy)
  }

  next()
})

// Static method to find chat between two users
chatSchema.statics.findPrivateChat = function (userId1: string, userId2: string) {
  return this.findOne({
    type: 'private',
    participants: { $all: [userId1, userId2] },
  })
}

export default mongoose.model<IChat>('Chat', chatSchema)