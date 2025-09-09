import mongoose, { Document, Schema } from 'mongoose'

export interface IMessageReaction {
  userId: mongoose.Types.ObjectId
  emoji: string
  createdAt: Date
}

export interface IReadStatus {
  userId: mongoose.Types.ObjectId
  readAt: Date
}

export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId
  senderId: mongoose.Types.ObjectId
  content: string
  type: 'text' | 'image' | 'file' | 'audio' | 'video'
  encrypted: boolean
  iv?: string // Initialization vector for E2E encryption
  encryptedKeys?: { [userId: string]: string } // RSA encrypted AES keys for each participant
  replyTo?: mongoose.Types.ObjectId
  reactions: IMessageReaction[]
  isEdited: boolean
  isDeleted: boolean
  readBy: IReadStatus[]
  createdAt: Date
  updatedAt: Date
}

const messageReactionSchema = new Schema<IMessageReaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    emoji: {
      type: String,
      required: true,
      maxlength: [10, 'Emoji must be less than 10 characters'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
)

const readStatusSchema = new Schema<IReadStatus>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
)

const messageSchema = new Schema<IMessage>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: [true, 'Chat ID is required'],
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      maxlength: [10000, 'Message must be less than 10000 characters'], // Increased for encrypted content
    },
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'audio', 'video'],
      default: 'text',
    },
    encrypted: {
      type: Boolean,
      default: true,
    },
    iv: {
      type: String,
      default: null, // Initialization vector for E2E encryption
    },
    encryptedKeys: {
      type: Map,
      of: String,
      default: new Map(), // RSA encrypted AES keys for each participant
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    reactions: [messageReactionSchema],
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    readBy: [readStatusSchema],
  },
  {
    timestamps: true,
  }
)

// Indexes for better query performance
messageSchema.index({ chatId: 1, createdAt: -1 })
messageSchema.index({ senderId: 1 })
messageSchema.index({ isDeleted: 1 })
messageSchema.index({ 'readBy.userId': 1 })

// Don't return deleted messages in normal queries
messageSchema.pre(/^find/, function (next) {
  // @ts-ignore
  this.find({ isDeleted: { $ne: true } })
  next()
})

// Method to add reaction
messageSchema.methods.addReaction = function (userId: string, emoji: string) {
  // Remove existing reaction from this user for this emoji
  this.reactions = this.reactions.filter(
    (reaction: IMessageReaction) => 
      !(reaction.userId.toString() === userId && reaction.emoji === emoji)
  )
  
  // Add new reaction
  this.reactions.push({ userId, emoji, createdAt: new Date() })
  return this.save()
}

// Method to remove reaction
messageSchema.methods.removeReaction = function (userId: string, emoji: string) {
  this.reactions = this.reactions.filter(
    (reaction: IMessageReaction) => 
      !(reaction.userId.toString() === userId && reaction.emoji === emoji)
  )
  return this.save()
}

// Method to mark as read
messageSchema.methods.markAsRead = function (userId: string) {
  // Check if already read by this user
  const alreadyRead = this.readBy.some(
    (read: IReadStatus) => read.userId.toString() === userId
  )
  
  if (!alreadyRead) {
    this.readBy.push({ userId, readAt: new Date() })
    return this.save()
  }
  
  return Promise.resolve(this)
}

export default mongoose.model<IMessage>('Message', messageSchema)