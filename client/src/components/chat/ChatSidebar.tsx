import React, { useState } from 'react'
import { Search, Plus, Settings, Moon, Sun, Palette, Trash2 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'
import { useChatStore } from '../../store/chatStore'
import Button from '../ui/Button'
import Input from '../ui/Input'
import ThemeSelector from '../ui/ThemeSelector'
import ContactModal from './ContactModal'
import SettingsModal from './SettingsModal'

const ChatSidebar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showContactModal, setShowContactModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showThemeSelector, setShowThemeSelector] = useState(false)
  const [chatToDelete, setChatToDelete] = useState<any>(null)
  const { user, logout, isLoading } = useAuthStore()
  const { theme, actualTheme, colorTheme, toggleTheme } = useThemeStore()
  const { chats, activeChat, setActiveChat, deleteChat } = useChatStore()

  // Debug user info
  console.log('ChatSidebar user debug:', { 
    user, 
    username: user?.username, 
    email: user?.email,
    isLoading 
  })

  // Don't render if user is not loaded yet
  if (isLoading || !user) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-900 items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true
    
    if (chat.type === 'group') {
      return chat.name?.toLowerCase().includes(searchQuery.toLowerCase())
    } else {
      // For private chats, search by participant names
      const otherParticipant = chat.participants.find(p => p._id !== user?._id)
      return otherParticipant?.username?.toLowerCase().includes(searchQuery.toLowerCase())
    }
  })

  const getChatName = (chat: any) => {
    if (chat.type === 'group') {
      return chat.name
    } else {
      const otherParticipant = chat.participants.find((p: any) => p._id !== user?._id)
      return otherParticipant?.username || 'Unknown User'
    }
  }

  const getChatAvatar = (chat: any) => {
    if (chat.avatar) return chat.avatar
    
    if (chat.type === 'group') {
      return null // Will show default group avatar
    } else {
      const otherParticipant = chat.participants.find((p: any) => p._id !== user?._id)
      return otherParticipant?.avatar
    }
  }

  const getLastMessagePreview = (chat: any) => {
    if (!chat.lastMessage) return 'No messages yet'
    
    const message = chat.lastMessage
    if (message.type === 'text') {
      return message.content.length > 50 
        ? message.content.substring(0, 50) + '...'
        : message.content
    } else {
      return `${message.type.charAt(0).toUpperCase() + message.type.slice(1)} message`
    }
  }

  const formatTime = (date: string) => {
    const messageDate = new Date(date)
    const now = new Date()
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 168) { // 7 days
      return messageDate.toLocaleDateString([], { weekday: 'short' })
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const handleDeleteChat = (chat: any, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent chat selection
    setChatToDelete(chat)
  }

  const confirmDeleteChat = () => {
    if (chatToDelete) {
      deleteChat(chatToDelete._id)
      // If deleting active chat, clear active chat
      if (activeChat?._id === chatToDelete._id) {
        setActiveChat(null)
      }
      setChatToDelete(null)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Chats
          </h1>
          <div className="flex items-center space-x-1">
            {/* Theme Selector Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowThemeSelector(!showThemeSelector)}
              className="p-2 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg transition-all duration-200"
            >
              <Palette size={18} className="text-primary-600 dark:text-primary-400" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowContactModal(true)}
              className="p-2"
            >
              <Plus size={18} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="p-2"
            >
              <Settings size={18} />
            </Button>
          </div>
        </div>

        {/* Search */}
        <Input
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search size={18} />}
        />
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No chats found' : 'No chats yet'}
          </div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat._id}
              onClick={() => setActiveChat(chat)}
              className={`chat-item group ${
                activeChat?._id === chat._id ? 'chat-item-active' : ''
              }`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
                  {getChatAvatar(chat) ? (
                    <img
                      src={getChatAvatar(chat)}
                      alt={getChatName(chat)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                      {getChatName(chat).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                
                {/* Online indicator for private chats */}
                {chat.type === 'private' && (
                  <div className="absolute -bottom-1 -right-1">
                    {(() => {
                      const otherParticipant = chat.participants.find((p: any) => p._id !== user?._id)
                      return otherParticipant?.isOnline ? (
                        <div className="status-online" />
                      ) : (
                        <div className="status-offline" />
                      )
                    })()}
                  </div>
                )}
              </div>

              {/* Chat Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {getChatName(chat)}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {chat.lastMessage && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(chat.lastMessage.createdAt)}
                      </span>
                    )}
                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDeleteChat(chat, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-all duration-200"
                      title="Delete conversation"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {getLastMessagePreview(chat)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* User Info */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-medium">
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate">
              {user?.username || 'Unknown User'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {user?.email || 'No email'}
            </p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {chatToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full animate-scale-in">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <Trash2 size={24} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Delete Conversation
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Are you sure you want to delete your conversation with{' '}
                <span className="font-semibold">{getChatName(chatToDelete)}</span>?
                All messages will be permanently removed.
              </p>
              
              <div className="flex space-x-3">
                <Button
                  variant="ghost"
                  onClick={() => setChatToDelete(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDeleteChat}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Theme Selector Modal */}
      {showThemeSelector && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="p-6">
              <ThemeSelector onClose={() => setShowThemeSelector(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ContactModal 
        isOpen={showContactModal} 
        onClose={() => setShowContactModal(false)} 
      />
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </div>
  )
}

export default ChatSidebar