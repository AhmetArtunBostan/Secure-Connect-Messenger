import React, { createContext, useContext, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { ServerToClientEvents, ClientToServerEvents } from '@shared/types'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'
import toast from 'react-hot-toast'

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>

interface SocketContextType {
  socket: SocketType | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
})

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

interface SocketProviderProps {
  children: React.ReactNode
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const socketRef = useRef<SocketType | null>(null)
  const [isConnected, setIsConnected] = React.useState(false)
  const { token, user } = useAuthStore()
  const {
    addMessage,
    updateMessage,
    removeMessage,
    addTypingUser,
    removeTypingUser,
    addOnlineUser,
    removeOnlineUser,
    addChat,
    updateChat,
  } = useChatStore()

  useEffect(() => {
    if (!token || !user) return

    // Initialize socket connection
    const socket: SocketType = io('/', {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to server')
      setIsConnected(true)
    })

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason)
      setIsConnected(false)
      
      if (reason === 'io server disconnect') {
        // Server disconnected the client, try to reconnect
        socket.connect()
      }
    })

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error)
      setIsConnected(false)
      
      if (error.message === 'Authentication error') {
        toast.error('Authentication failed. Please login again.')
        useAuthStore.getState().logout()
      }
    })

    // Message events
    socket.on('message', (message) => {
      addMessage(message)
      
      // Show notification if message is not from current user
      if (message.senderId !== user._id) {
        // You can add notification logic here
        console.log('New message received:', message)
      }
    })

    socket.on('messageUpdated', (message) => {
      updateMessage(message)
    })

    socket.on('messageDeleted', (messageId) => {
      // Find the message to get chatId
      const { messages } = useChatStore.getState()
      for (const [chatId, chatMessages] of Object.entries(messages)) {
        const message = chatMessages.find(m => m._id === messageId)
        if (message) {
          removeMessage(messageId, chatId)
          break
        }
      }
    })

    // Typing events
    socket.on('typing', ({ userId, chatId, isTyping }) => {
      if (userId !== user._id) {
        if (isTyping) {
          addTypingUser(chatId, userId)
        } else {
          removeTypingUser(chatId, userId)
        }
      }
    })

    // User presence events
    socket.on('userOnline', ({ userId }) => {
      addOnlineUser(userId)
    })

    socket.on('userOffline', ({ userId }) => {
      removeOnlineUser(userId)
    })

    // Chat events
    socket.on('chatCreated', (chat) => {
      addChat(chat)
      toast.success('New chat created')
    })

    socket.on('chatUpdated', (chat) => {
      updateChat(chat)
    })

    // Error events
    socket.on('error', (error) => {
      console.error('Socket error:', error)
      toast.error(error)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      setIsConnected(false)
    }
  }, [token, user])

  const value: SocketContextType = {
    socket: socketRef.current,
    isConnected,
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

// Custom hooks for socket actions
export const useSocketActions = () => {
  const { socket } = useSocket()

  const joinChat = (chatId: string) => {
    socket?.emit('joinChat', chatId)
  }

  const leaveChat = (chatId: string) => {
    socket?.emit('leaveChat', chatId)
  }

  const sendMessage = (data: {
    chatId: string
    content: string
    type: 'text' | 'image' | 'file' | 'audio' | 'video'
    replyTo?: string
  }) => {
    socket?.emit('sendMessage', data)
  }

  const editMessage = (messageId: string, content: string) => {
    socket?.emit('editMessage', { messageId, content })
  }

  const deleteMessage = (messageId: string) => {
    socket?.emit('deleteMessage', messageId)
  }

  const setTyping = (chatId: string, isTyping: boolean) => {
    socket?.emit('typing', { chatId, isTyping })
  }

  const markAsRead = (chatId: string, messageId: string) => {
    socket?.emit('markAsRead', { chatId, messageId })
  }

  const addReaction = (messageId: string, emoji: string) => {
    socket?.emit('addReaction', { messageId, emoji })
  }

  const removeReaction = (messageId: string, emoji: string) => {
    socket?.emit('removeReaction', { messageId, emoji })
  }

  return {
    joinChat,
    leaveChat,
    sendMessage,
    editMessage,
    deleteMessage,
    setTyping,
    markAsRead,
    addReaction,
    removeReaction,
  }
}