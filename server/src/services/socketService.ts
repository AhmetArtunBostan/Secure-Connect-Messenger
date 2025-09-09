import { Server } from 'socket.io'
import { AuthenticatedSocket } from '../middleware/socketAuth'
import Message from '../models/Message'
import Chat from '../models/Chat'
import User from '../models/User'
import AIService from './aiService'

const connectedUsers = new Map<string, string>() // userId -> socketId

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.userId} connected`)

    // Store user connection
    if (socket.userId) {
      connectedUsers.set(socket.userId, socket.id)
      
      // Update user online status
      User.findByIdAndUpdate(socket.userId, {
        isOnline: true,
        lastSeen: new Date(),
      }).exec()

      // Notify other users that this user is online
      socket.broadcast.emit('userOnline', {
        userId: socket.userId,
        isOnline: true,
      })
    }

    // Join chat rooms
    socket.on('joinChat', async (chatId: string) => {
      try {
        // Verify user is participant of the chat
        const chat = await Chat.findById(chatId)
        if (chat && chat.participants.includes(socket.userId!)) {
          socket.join(chatId)
          console.log(`User ${socket.userId} joined chat ${chatId}`)
        }
      } catch (error) {
        console.error('Error joining chat:', error)
      }
    })

    // Leave chat rooms
    socket.on('leaveChat', (chatId: string) => {
      socket.leave(chatId)
      console.log(`User ${socket.userId} left chat ${chatId}`)
    })

    // Handle new messages
    socket.on('sendMessage', async (data) => {
      try {
        const { chatId, content, type = 'text', replyTo } = data

        // Verify user is participant of the chat
        const chat = await Chat.findById(chatId)
        if (!chat || !chat.participants.includes(socket.userId!)) {
          socket.emit('error', 'Access denied')
          return
        }

        // Create message
        const message = await Message.create({
          chatId,
          senderId: socket.userId,
          content,
          type,
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

        // Emit to all participants in the chat
        io.to(chatId).emit('message', populatedMessage)

        // AI Auto-response
        const shouldRespond = await AIService.shouldRespond(chat.participants, socket.userId!)
        if (shouldRespond && type === 'text') {
          // Get sender info for personalized response
          const sender = await User.findById(socket.userId!)
          
          // Generate AI response with delay to seem more natural
          setTimeout(async () => {
            try {
              const aiResponse = await AIService.generateResponse(content, sender?.username || 'User')
              
              // Find the AI user (the other participant)
              const aiUserId = chat.participants.find(id => id !== socket.userId!)
              
              if (aiUserId) {
                // Create AI response message
                const aiMessage = await Message.create({
                  chatId,
                  senderId: aiUserId,
                  content: aiResponse,
                  type: 'text',
                })

                // Update chat's last message
                chat.lastMessage = aiMessage._id
                chat.updatedAt = new Date()
                await chat.save()

                // Populate AI message
                const populatedAIMessage = await Message.findById(aiMessage._id)
                  .populate('senderId', 'username email avatar')

                // Emit AI response to all participants
                io.to(chatId).emit('message', populatedAIMessage)
              }
            } catch (error) {
              console.error('Error generating AI response:', error)
            }
          }, Math.random() * 2000 + 1000) // Random delay between 1-3 seconds
        }

      } catch (error) {
        console.error('Error sending message:', error)
        socket.emit('error', 'Failed to send message')
      }
    })

    // Handle message editing
    socket.on('editMessage', async (data) => {
      try {
        const { messageId, content } = data

        const message = await Message.findById(messageId)
        if (!message) {
          socket.emit('error', 'Message not found')
          return
        }

        // Check if user is the sender
        if (message.senderId.toString() !== socket.userId) {
          socket.emit('error', 'Access denied')
          return
        }

        // Check if message is not too old (15 minutes)
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
        if (message.createdAt < fifteenMinutesAgo) {
          socket.emit('error', 'Cannot edit messages older than 15 minutes')
          return
        }

        // Update message
        message.content = content
        message.isEdited = true
        await message.save()

        // Populate and emit updated message
        const updatedMessage = await Message.findById(messageId)
          .populate('senderId', 'username email avatar')
          .populate('replyTo')

        io.to(message.chatId.toString()).emit('messageUpdated', updatedMessage)

      } catch (error) {
        console.error('Error editing message:', error)
        socket.emit('error', 'Failed to edit message')
      }
    })

    // Handle message deletion
    socket.on('deleteMessage', async (messageId: string) => {
      try {
        const message = await Message.findById(messageId)
        if (!message) {
          socket.emit('error', 'Message not found')
          return
        }

        // Check if user is the sender or chat admin
        const chat = await Chat.findById(message.chatId)
        const isOwner = message.senderId.toString() === socket.userId
        const isAdmin = chat?.admins.includes(socket.userId!)

        if (!isOwner && !isAdmin) {
          socket.emit('error', 'Access denied')
          return
        }

        // Soft delete the message
        message.isDeleted = true
        message.content = 'This message was deleted'
        await message.save()

        // Emit message deletion
        io.to(message.chatId.toString()).emit('messageDeleted', messageId)

      } catch (error) {
        console.error('Error deleting message:', error)
        socket.emit('error', 'Failed to delete message')
      }
    })

    // Handle typing indicators
    socket.on('typing', async (data) => {
      try {
        const { chatId, isTyping } = data

        // Verify user is participant of the chat
        const chat = await Chat.findById(chatId)
        if (!chat || !chat.participants.includes(socket.userId!)) {
          return
        }

        // Emit typing status to other participants
        socket.to(chatId).emit('typing', {
          userId: socket.userId,
          chatId,
          isTyping,
        })

      } catch (error) {
        console.error('Error handling typing:', error)
      }
    })

    // Handle read receipts
    socket.on('markAsRead', async (data) => {
      try {
        const { chatId, messageId } = data

        // Verify user is participant of the chat
        const chat = await Chat.findById(chatId)
        if (!chat || !chat.participants.includes(socket.userId!)) {
          return
        }

        // Find and mark message as read
        const message = await Message.findById(messageId)
        if (message) {
          await message.markAsRead(socket.userId!)
        }

      } catch (error) {
        console.error('Error marking message as read:', error)
      }
    })

    // Handle reactions
    socket.on('addReaction', async (data) => {
      try {
        const { messageId, emoji } = data

        const message = await Message.findById(messageId)
        if (!message) {
          socket.emit('error', 'Message not found')
          return
        }

        // Verify user is participant of the chat
        const chat = await Chat.findById(message.chatId)
        if (!chat || !chat.participants.includes(socket.userId!)) {
          socket.emit('error', 'Access denied')
          return
        }

        // Add reaction
        await message.addReaction(socket.userId!, emoji)

        // Populate and emit updated message
        const updatedMessage = await Message.findById(messageId)
          .populate('senderId', 'username email avatar')
          .populate('replyTo')

        io.to(message.chatId.toString()).emit('messageUpdated', updatedMessage)

      } catch (error) {
        console.error('Error adding reaction:', error)
        socket.emit('error', 'Failed to add reaction')
      }
    })

    socket.on('removeReaction', async (data) => {
      try {
        const { messageId, emoji } = data

        const message = await Message.findById(messageId)
        if (!message) {
          socket.emit('error', 'Message not found')
          return
        }

        // Verify user is participant of the chat
        const chat = await Chat.findById(message.chatId)
        if (!chat || !chat.participants.includes(socket.userId!)) {
          socket.emit('error', 'Access denied')
          return
        }

        // Remove reaction
        await message.removeReaction(socket.userId!, emoji)

        // Populate and emit updated message
        const updatedMessage = await Message.findById(messageId)
          .populate('senderId', 'username email avatar')
          .populate('replyTo')

        io.to(message.chatId.toString()).emit('messageUpdated', updatedMessage)

      } catch (error) {
        console.error('Error removing reaction:', error)
        socket.emit('error', 'Failed to remove reaction')
      }
    })

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User ${socket.userId} disconnected`)

      if (socket.userId) {
        // Remove from connected users
        connectedUsers.delete(socket.userId)

        // Update user offline status
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date(),
        })

        // Notify other users that this user is offline
        socket.broadcast.emit('userOffline', {
          userId: socket.userId,
          isOnline: false,
          lastSeen: new Date(),
        })
      }
    })
  })
}