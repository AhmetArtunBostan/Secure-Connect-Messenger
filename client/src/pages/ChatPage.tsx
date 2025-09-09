import React, { useEffect } from 'react'
import { useChatStore } from '../store/chatStore'
import { useAuthStore } from '../store/authStore'
import { chatApi } from '../services/api'
import ChatSidebar from '../components/chat/ChatSidebar'
import ChatWindow from '../components/chat/ChatWindow'
import WelcomeScreen from '../components/chat/WelcomeScreen'

const ChatPage: React.FC = () => {
  const { activeChat, chats, setChats, setLoading, hasLoadedFromAPI } = useChatStore()
  const { user } = useAuthStore()

  useEffect(() => {
    const loadChats = async () => {
      try {
        setLoading(true)
        console.log('Loading chats from API...')
        const response = await chatApi.getChats()
        setChats(response.data.data || [])
      } catch (error) {
        console.error('Failed to load chats:', error)
      } finally {
        setLoading(false)
      }
    }

    // Only load from API if we haven't loaded before AND user exists
    if (user && !hasLoadedFromAPI) {
      console.log('First time loading, fetching chats from API')
      loadChats()
    } else if (user && hasLoadedFromAPI) {
      console.log('Using cached data, chats count:', chats.length)
    }
  }, [user, chats.length, setChats, setLoading])

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
        <ChatSidebar />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <ChatWindow />
        ) : (
          <WelcomeScreen />
        )}
      </div>
    </div>
  )
}

export default ChatPage