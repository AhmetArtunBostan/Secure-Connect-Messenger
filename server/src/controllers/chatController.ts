import { Response, NextFunction } from 'express'
import Chat from '../models/Chat'
import Message from '../models/Message'
import { AppError } from '../utils/AppError'
import { AuthRequest } from '../middleware/auth'

export const getChats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id

    const chats = await Chat.find({
      participants: userId,
    })
      .populate('participants', 'username email avatar isOnline lastSeen')
      .populate('lastMessage')
      .populate('createdBy', 'username email avatar')
      .sort({ updatedAt: -1 })

    res.status(200).json({
      success: true,
      data: chats,
    })
  } catch (error) {
    next(error)
  }
}

export const createChat = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type, participants, name, description } = req.body
    const userId = req.user!._id

    // Validate participants
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return next(new AppError('Participants are required', 400))
    }

    // For private chats, ensure exactly one other participant
    if (type === 'private') {
      if (participants.length !== 1) {
        return next(new AppError('Private chats must have exactly one other participant', 400))
      }

      // Check if private chat already exists
      const existingChat = await Chat.findOne({
        type: 'private',
        participants: { $all: [userId, participants[0]] },
      })

      if (existingChat) {
        return res.status(200).json({
          success: true,
          data: existingChat,
          message: 'Chat already exists',
        })
      }
    }

    // Create chat
    const chatData = {
      type,
      participants: [...participants, userId],
      createdBy: userId,
      ...(name && { name }),
      ...(description && { description }),
    }

    const chat = await Chat.create(chatData)

    // Populate the created chat
    const populatedChat = await Chat.findById(chat._id)
      .populate('participants', 'username email avatar isOnline lastSeen')
      .populate('createdBy', 'username email avatar')

    res.status(201).json({
      success: true,
      data: populatedChat,
      message: 'Chat created successfully',
    })
  } catch (error) {
    next(error)
  }
}

export const updateChat = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { chatId } = req.params
    const { name, description, avatar } = req.body
    const userId = req.user!._id

    // Find chat and check if user is admin (for group chats)
    const chat = await Chat.findById(chatId)

    if (!chat) {
      return next(new AppError('Chat not found', 404))
    }

    // Check if user is participant
    if (!chat.participants.includes(userId)) {
      return next(new AppError('Access denied', 403))
    }

    // For group chats, only admins can update
    if (chat.type === 'group' && !chat.admins.includes(userId)) {
      return next(new AppError('Only admins can update group chats', 403))
    }

    // Update chat
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      {
        ...(name && { name }),
        ...(description && { description }),
        ...(avatar !== undefined && { avatar }),
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('participants', 'username email avatar isOnline lastSeen')
      .populate('createdBy', 'username email avatar')

    res.status(200).json({
      success: true,
      data: updatedChat,
      message: 'Chat updated successfully',
    })
  } catch (error) {
    next(error)
  }
}

export const deleteChat = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { chatId } = req.params
    const userId = req.user!._id

    // Find chat
    const chat = await Chat.findById(chatId)

    if (!chat) {
      return next(new AppError('Chat not found', 404))
    }

    // Check if user is creator or admin
    if (chat.createdBy.toString() !== userId.toString() && !chat.admins.includes(userId)) {
      return next(new AppError('Access denied', 403))
    }

    // Delete all messages in the chat
    await Message.deleteMany({ chatId })

    // Delete the chat
    await Chat.findByIdAndDelete(chatId)

    res.status(200).json({
      success: true,
      message: 'Chat deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

export const addParticipant = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { chatId } = req.params
    const { userId: newParticipantId } = req.body
    const userId = req.user!._id

    // Find chat
    const chat = await Chat.findById(chatId)

    if (!chat) {
      return next(new AppError('Chat not found', 404))
    }

    // Only group chats can add participants
    if (chat.type !== 'group') {
      return next(new AppError('Can only add participants to group chats', 400))
    }

    // Check if user is admin
    if (!chat.admins.includes(userId)) {
      return next(new AppError('Only admins can add participants', 403))
    }

    // Check if participant is already in chat
    if (chat.participants.includes(newParticipantId)) {
      return next(new AppError('User is already a participant', 400))
    }

    // Add participant
    chat.participants.push(newParticipantId)
    await chat.save()

    // Populate and return updated chat
    const updatedChat = await Chat.findById(chatId)
      .populate('participants', 'username email avatar isOnline lastSeen')
      .populate('createdBy', 'username email avatar')

    res.status(200).json({
      success: true,
      data: updatedChat,
      message: 'Participant added successfully',
    })
  } catch (error) {
    next(error)
  }
}

export const removeParticipant = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { chatId, participantId } = req.params
    const userId = req.user!._id

    // Find chat
    const chat = await Chat.findById(chatId)

    if (!chat) {
      return next(new AppError('Chat not found', 404))
    }

    // Only group chats can remove participants
    if (chat.type !== 'group') {
      return next(new AppError('Can only remove participants from group chats', 400))
    }

    // Check if user is admin or removing themselves
    if (!chat.admins.includes(userId) && participantId !== userId.toString()) {
      return next(new AppError('Access denied', 403))
    }

    // Check if participant is in chat
    if (!chat.participants.includes(participantId)) {
      return next(new AppError('User is not a participant', 400))
    }

    // Remove participant
    chat.participants = chat.participants.filter(p => p.toString() !== participantId)
    
    // If removing an admin, remove from admins too
    chat.admins = chat.admins.filter(a => a.toString() !== participantId)

    await chat.save()

    // Populate and return updated chat
    const updatedChat = await Chat.findById(chatId)
      .populate('participants', 'username email avatar isOnline lastSeen')
      .populate('createdBy', 'username email avatar')

    res.status(200).json({
      success: true,
      data: updatedChat,
      message: 'Participant removed successfully',
    })
  } catch (error) {
    next(error)
  }
}