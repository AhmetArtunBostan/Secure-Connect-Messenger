import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Chat, Message, User } from '@shared/types'

interface ChatState {
  chats: Chat[]
  activeChat: Chat | null
  messages: Record<string, Message[]>
  typingUsers: Record<string, string[]> // chatId -> userIds
  onlineUsers: Set<string>
  isLoading: boolean
  hasLoadedFromAPI: boolean // Track if we've loaded from API before
}

interface ChatActions {
  setChats: (chats: Chat[]) => void
  addChat: (chat: Chat) => void
  updateChat: (chat: Chat) => void
  removeChat: (chatId: string) => void
  deleteChat: (chatId: string) => void
  setActiveChat: (chat: Chat | null) => void
  
  setMessages: (chatId: string, messages: Message[]) => void
  addMessage: (message: Message) => void
  updateMessage: (message: Message) => void
  removeMessage: (messageId: string, chatId: string) => void
  
  setTypingUsers: (chatId: string, userIds: string[]) => void
  addTypingUser: (chatId: string, userId: string) => void
  removeTypingUser: (chatId: string, userId: string) => void
  
  setOnlineUsers: (userIds: string[]) => void
  addOnlineUser: (userId: string) => void
  removeOnlineUser: (userId: string) => void
  
  setLoading: (loading: boolean) => void
  reset: () => void
}

type ChatStore = ChatState & ChatActions

const initialState: ChatState = {
  chats: [],
  activeChat: null,
  messages: {},
  typingUsers: {},
  onlineUsers: new Set(),
  isLoading: false,
  hasLoadedFromAPI: false,
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      ...initialState,

  // Chat actions
  setChats: (chats) => set({ chats, hasLoadedFromAPI: true }),
  
  addChat: (chat) => {
    const { chats } = get()
    set({ chats: [chat, ...chats] })
  },
  
  updateChat: (updatedChat) => {
    const { chats } = get()
    set({
      chats: chats.map(chat => 
        chat._id === updatedChat._id ? updatedChat : chat
      )
    })
  },
  
  removeChat: (chatId) => {
    const { chats, activeChat, messages } = get()
    const newMessages = { ...messages }
    delete newMessages[chatId]
    
    set({
      chats: chats.filter(chat => chat._id !== chatId),
      activeChat: activeChat?._id === chatId ? null : activeChat,
      messages: newMessages,
    })
  },

  deleteChat: (chatId) => {
    const { chats, activeChat, messages, typingUsers } = get()
    const newMessages = { ...messages }
    const newTypingUsers = { ...typingUsers }
    delete newMessages[chatId]
    delete newTypingUsers[chatId]
    
    set({
      chats: chats.filter(chat => chat._id !== chatId),
      activeChat: activeChat?._id === chatId ? null : activeChat,
      messages: newMessages,
      typingUsers: newTypingUsers,
    })

    console.log(`Chat ${chatId} deleted successfully`)
  },
  
  setActiveChat: (chat) => set({ activeChat: chat }),

  // Message actions
  setMessages: (chatId, messages) => {
    const { messages: currentMessages } = get()
    set({
      messages: {
        ...currentMessages,
        [chatId]: messages,
      }
    })
  },
  
  addMessage: (message) => {
    const { messages, chats } = get()
    const chatMessages = messages[message.chatId] || []
    
    // Update messages
    set({
      messages: {
        ...messages,
        [message.chatId]: [...chatMessages, message],
      }
    })
    
    // Update last message in chat
    const updatedChats = chats.map(chat => {
      if (chat._id === message.chatId) {
        return { ...chat, lastMessage: message }
      }
      return chat
    })
    
    set({ chats: updatedChats })
  },
  
  updateMessage: (updatedMessage) => {
    const { messages } = get()
    const chatMessages = messages[updatedMessage.chatId] || []
    
    set({
      messages: {
        ...messages,
        [updatedMessage.chatId]: chatMessages.map(msg =>
          msg._id === updatedMessage._id ? updatedMessage : msg
        ),
      }
    })
  },
  
  removeMessage: (messageId, chatId) => {
    const { messages } = get()
    const chatMessages = messages[chatId] || []
    
    set({
      messages: {
        ...messages,
        [chatId]: chatMessages.filter(msg => msg._id !== messageId),
      }
    })
  },

  // Typing actions
  setTypingUsers: (chatId, userIds) => {
    const { typingUsers } = get()
    set({
      typingUsers: {
        ...typingUsers,
        [chatId]: userIds,
      }
    })
  },
  
  addTypingUser: (chatId, userId) => {
    const { typingUsers } = get()
    const currentTyping = typingUsers[chatId] || []
    
    if (!currentTyping.includes(userId)) {
      set({
        typingUsers: {
          ...typingUsers,
          [chatId]: [...currentTyping, userId],
        }
      })
    }
  },
  
  removeTypingUser: (chatId, userId) => {
    const { typingUsers } = get()
    const currentTyping = typingUsers[chatId] || []
    
    set({
      typingUsers: {
        ...typingUsers,
        [chatId]: currentTyping.filter(id => id !== userId),
      }
    })
  },

  // Online status actions
  setOnlineUsers: (userIds) => set({ onlineUsers: new Set(userIds) }),
  
  addOnlineUser: (userId) => {
    const { onlineUsers } = get()
    const newOnlineUsers = new Set(onlineUsers)
    newOnlineUsers.add(userId)
    set({ onlineUsers: newOnlineUsers })
  },
  
  removeOnlineUser: (userId) => {
    const { onlineUsers } = get()
    const newOnlineUsers = new Set(onlineUsers)
    newOnlineUsers.delete(userId)
    set({ onlineUsers: newOnlineUsers })
  },

  // Utility actions
  setLoading: (loading) => set({ isLoading: loading }),
  
  reset: () => set(initialState),
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        chats: state.chats,
        hasLoadedFromAPI: state.hasLoadedFromAPI,
        // Don't persist activeChat, messages, typingUsers, onlineUsers
        // These should be fresh on each session
      }),
    }
  )
)