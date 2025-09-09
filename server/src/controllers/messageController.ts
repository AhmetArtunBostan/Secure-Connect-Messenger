import { Response, NextFunction } from 'express'
import Message from '../models/Message'
import Chat from '../models/Chat'
import { AppError } from '../utils/AppError'
import { AuthRequest } from '../middleware/auth'
import { encrypt, decrypt } from '../utils/encryption'

export const getMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { chatId } = req.params
    const { page = 1, limit = 50 } = req.query
    const userId = req.user!._id

    // Check if user is participant of the chat
    const chat = await Chat.findById(chatId)
    if (!chat) {
      return next(new AppError('Chat not found', 404))
    }

    if (!chat.participants.includes(userId)) {
      return next(new AppError('Access denied', 403))
    }

    // Calculate pagination
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    // Get messages
    const messages = await Message.find({ chatId })
      .populate('senderId', 'username email avatar')
      .populate('replyTo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)

    // Get total count for pagination
    const total = await Message.countDocuments({ chatId })

    // Messages are now end-to-end encrypted on client side
    // Server just passes through the encrypted data
    const processedMessages = messages.map(message => {
      // Convert encryptedKeys Map to object for JSON serialization
      if (message.encryptedKeys) {
        const messageObj = message.toObject()
        messageObj.encryptedKeys = Object.fromEntries(message.encryptedKeys)
        return messageObj
      }
      return message
    })

    res.status(200).json({
      success: true,
      data: {
        data: processedMessages.reverse(), // Reverse to show oldest first
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { chatId, content, type = 'text', replyTo, iv, encryptedKeys } = req.body
    const userId = req.user!._id

    // Check if user is participant of the chat
    const chat = await Chat.findById(chatId)
    if (!chat) {
      return next(new AppError('Chat not found', 404))
    }

    if (!chat.participants.includes(userId)) {
      return next(new AppError('Access denied', 403))
    }

    // Validate E2E encryption data
    if (!iv || !encryptedKeys) {
      return next(new AppError('Missing encryption data for end-to-end encryption', 400))
    }

    // Convert encryptedKeys object to Map for storage
    const encryptedKeysMap = new Map(Object.entries(encryptedKeys))

    // Create message with E2E encryption data
    const message = await Message.create({
      chatId,
      senderId: userId,
      content, // This is now encrypted content from client
      type,
      encrypted: true,
      iv,
      encryptedKeys: encryptedKeysMap,
      replyTo: replyTo || null,
    })

    // Update chat's last message
    chat.lastMessage = message._id
    chat.updatedAt = new Date()
    await chat.save()

    // Populate message
    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'username email avatar')
      .populate('replyTo')

    // Convert encryptedKeys Map to object for JSON response
    const responseMessage = populatedMessage?.toObject()
    if (responseMessage && responseMessage.encryptedKeys) {
      responseMessage.encryptedKeys = Object.fromEntries(populatedMessage.encryptedKeys)
    }

    res.status(201).json({
      success: true,
      data: responseMessage,
      message: 'Message sent successfully',
    })
  } catch (error) {
    next(error)
  }
}

export const editMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { messageId } = req.params
    const { content } = req.body
    const userId = req.user!._id

    // Find message
    const message = await Message.findById(messageId)
    if (!message) {
      return next(new AppError('Message not found', 404))
    }

    // Check if user is the sender
    if (message.senderId.toString() !== userId.toString()) {
      return next(new AppError('You can only edit your own messages', 403))
    }

    // Check if message is not too old (e.g., 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
    if (message.createdAt < fifteenMinutesAgo) {
      return next(new AppError('Cannot edit messages older than 15 minutes', 400))
    }

    // Update message
    message.content = content
    message.isEdited = true
    await message.save()

    // Populate and return updated message
    const updatedMessage = await Message.findById(messageId)
      .populate('senderId', 'username email avatar')
      .populate('replyTo')

    res.status(200).json({
      success: true,
      data: updatedMessage,
      message: 'Message updated successfully',
    })
  } catch (error) {
    next(error)
  }
}

export const deleteMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { messageId } = req.params
    const userId = req.user!._id

    // Find message
    const message = await Message.findById(messageId)
    if (!message) {
      return next(new AppError('Message not found', 404))
    }

    // Check if user is the sender or chat admin
    const chat = await Chat.findById(message.chatId)
    const isOwner = message.senderId.toString() === userId.toString()
    const isAdmin = chat?.admins.includes(userId)

    if (!isOwner && !isAdmin) {
      return next(new AppError('Access denied', 403))
    }

    // Soft delete the message
    message.isDeleted = true
    message.content = 'This message was deleted'
    await message.save()

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

export const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { messageId } = req.params
    const { chatId } = req.body
    const userId = req.user!._id

    // Check if user is participant of the chat
    const chat = await Chat.findById(chatId)
    if (!chat || !chat.participants.includes(userId)) {
      return next(new AppError('Access denied', 403))
    }

    // Find message
    const message = await Message.findById(messageId)
    if (!message) {
      return next(new AppError('Message not found', 404))
    }

    // Mark as read
    await message.markAsRead(userId.toString())

    res.status(200).json({
      success: true,
      message: 'Message marked as read',
    })
  } catch (error) {
    next(error)
  }
}

export const addReaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { messageId } = req.params
    const { emoji } = req.body
    const userId = req.user!._id

    // Find message
    const message = await Message.findById(messageId)
    if (!message) {
      return next(new AppError('Message not found', 404))
    }

    // Check if user is participant of the chat
    const chat = await Chat.findById(message.chatId)
    if (!chat || !chat.participants.includes(userId)) {
      return next(new AppError('Access denied', 403))
    }

    // Add reaction
    await message.addReaction(userId.toString(), emoji)

    // Populate and return updated message
    const updatedMessage = await Message.findById(messageId)
      .populate('senderId', 'username email avatar')
      .populate('replyTo')

    res.status(200).json({
      success: true,
      data: updatedMessage,
      message: 'Reaction added successfully',
    })
  } catch (error) {
    next(error)
  }
}

export const removeReaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { messageId, emoji } = req.params
    const userId = req.user!._id

    // Find message
    const message = await Message.findById(messageId)
    if (!message) {
      return next(new AppError('Message not found', 404))
    }

    // Check if user is participant of the chat
    const chat = await Chat.findById(message.chatId)
    if (!chat || !chat.participants.includes(userId)) {
      return next(new AppError('Access denied', 403))
    }

    // Remove reaction
    await message.removeReaction(userId.toString(), emoji)

    // Populate and return updated message
    const updatedMessage = await Message.findById(messageId)
      .populate('senderId', 'username email avatar')
      .populate('replyTo')

    res.status(200).json({
      success: true,
      data: updatedMessage,
      message: 'Reaction removed successfully',
    })
  } catch (error) {
    next(error)
  }
}