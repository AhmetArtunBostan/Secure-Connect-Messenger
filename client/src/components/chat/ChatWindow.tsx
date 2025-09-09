import React from 'react'
import { useChatStore } from '../../store/chatStore'
import { useAuthStore } from '../../store/authStore'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import MessageInput from './MessageInput'

const ChatWindow: React.FC = () => {
  const { activeChat } = useChatStore()
  const { user } = useAuthStore()

  if (!activeChat) {
    return null
  }

  const getChatName = () => {
    if (activeChat.type === 'group') {
      return activeChat.name
    } else {
      const otherParticipant = activeChat.participants.find(p => p._id !== user?._id)
      return otherParticipant?.username || 'Unknown User'
    }
  }

  const getChatAvatar = () => {
    if (activeChat.avatar) return activeChat.avatar
    
    if (activeChat.type === 'group') {
      return null
    } else {
      const otherParticipant = activeChat.participants.find(p => p._id !== user?._id)
      return otherParticipant?.avatar
    }
  }

  const getOnlineStatus = () => {
    if (activeChat.type === 'group') {
      const onlineCount = activeChat.participants.filter(p => p.isOnline).length
      return `${onlineCount} online`
    } else {
      const otherParticipant = activeChat.participants.find(p => p._id !== user?._id)
      if (otherParticipant?.isOnline) {
        return 'Online'
      } else if (otherParticipant?.lastSeen) {
        const lastSeen = new Date(otherParticipant.lastSeen)
        const now = new Date()
        const diffInMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60)
        
        if (diffInMinutes < 1) {
          return 'Just now'
        } else if (diffInMinutes < 60) {
          return `${Math.floor(diffInMinutes)} minutes ago`
        } else if (diffInMinutes < 1440) {
          return `${Math.floor(diffInMinutes / 60)} hours ago`
        } else {
          return lastSeen.toLocaleDateString()
        }
      }
      return 'Offline'
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <ChatHeader
        name={getChatName()}
        avatar={getChatAvatar()}
        status={getOnlineStatus()}
        isOnline={activeChat.type === 'private' ? 
          activeChat.participants.find(p => p._id !== user?._id)?.isOnline : 
          undefined
        }
        participantCount={activeChat.type === 'group' ? activeChat.participants.length : undefined}
      />

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList chatId={activeChat._id} />
      </div>

      {/* Message Input */}
      <MessageInput chatId={activeChat._id} />
    </div>
  )
}

export default ChatWindow