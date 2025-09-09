import React, { useEffect, useRef } from 'react'
import { useChatStore } from '../../store/chatStore'
import { useAuthStore } from '../../store/authStore'
import { messageApi } from '../../services/api'
import { useSocketActions } from '../../services/socket'
import MessageBubble from './MessageBubble'
import LoadingSpinner from '../ui/LoadingSpinner'

interface MessageListProps {
  chatId: string
}

const MessageList: React.FC<MessageListProps> = ({ chatId }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, setMessages, isLoading, setLoading } = useChatStore()
  const { user } = useAuthStore()
  const { joinChat, leaveChat } = useSocketActions()
  
  const chatMessages = messages[chatId] || []
  
  // Debug auth state
  console.log('Auth debug:', { user, userId: user?._id, userExists: !!user })

  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true)
        const response = await messageApi.getMessages(chatId)
        setMessages(chatId, response.data.data?.data || [])
      } catch (error) {
        console.error('Failed to load messages:', error)
      } finally {
        setLoading(false)
      }
    }

    // Join the chat room
    joinChat(chatId)
    loadMessages()

    // Cleanup: leave chat when component unmounts or chatId changes
    return () => {
      leaveChat(chatId)
    }
  }, [chatId])

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  if (isLoading && chatMessages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {chatMessages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-2">💬 Henüz mesaj yok</p>
            <p className="text-sm">Sohbeti başlatın!</p>
          </div>
        </div>
      ) : (
        <>
          {chatMessages.map((message, index) => {
            const previousMessage = index > 0 ? chatMessages[index - 1] : null
            const showSender = !previousMessage || 
              previousMessage.senderId._id !== message.senderId._id ||
              new Date(message.createdAt).getTime() - new Date(previousMessage.createdAt).getTime() > 300000 // 5 minutes

            // Geçici fix: Eğer user yoksa, demo için senderId'lerden birini user olarak kabul edelim
            const currentUserId = user?._id || '68be25139eda5d87b01f0579' // Mevcut senderId'yi geçici user yap
            const isOwn = message.senderId._id === currentUserId
            
            console.log('Message debug:', {
              messageId: message._id,
              senderId: message.senderId._id,
              currentUserId: currentUserId,
              isOwn: isOwn,
              content: message.content,
              userFromAuth: user?._id
            })

            return (
              <MessageBubble
                key={message._id}
                message={message}
                isOwn={isOwn}
                showSender={showSender}
              />
            )
          })}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  )
}

export default MessageList