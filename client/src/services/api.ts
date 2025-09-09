import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { 
  ApiResponse, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse,
  User,
  Chat,
  Message,
  PaginatedResponse
} from '@shared/types'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear auth state
      useAuthStore.getState().logout()
      toast.error('Session expired. Please login again.')
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.')
    }
    
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: (data: LoginRequest): Promise<AxiosResponse<ApiResponse<AuthResponse>>> =>
    api.post('/auth/login', data),
    
  register: (data: RegisterRequest): Promise<AxiosResponse<ApiResponse<AuthResponse>>> =>
    api.post('/auth/register', data),
    
  logout: (): Promise<AxiosResponse<ApiResponse>> =>
    api.post('/auth/logout'),
    
  me: (): Promise<AxiosResponse<ApiResponse<User>>> =>
    api.get('/auth/me'),
    
  updateProfile: (data: Partial<User>): Promise<AxiosResponse<ApiResponse<User>>> =>
    api.put('/auth/profile', data),
}

// Chat API
export const chatApi = {
  getChats: (): Promise<AxiosResponse<ApiResponse<Chat[]>>> =>
    api.get('/chats'),
    
  createChat: (data: { 
    type: 'private' | 'group'
    participants: string[]
    name?: string 
  }): Promise<AxiosResponse<ApiResponse<Chat>>> =>
    api.post('/chats', data),
    
  updateChat: (chatId: string, data: Partial<Chat>): Promise<AxiosResponse<ApiResponse<Chat>>> =>
    api.put(`/chats/${chatId}`, data),
    
  deleteChat: (chatId: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/chats/${chatId}`),
    
  addParticipant: (chatId: string, userId: string): Promise<AxiosResponse<ApiResponse<Chat>>> =>
    api.post(`/chats/${chatId}/participants`, { userId }),
    
  removeParticipant: (chatId: string, userId: string): Promise<AxiosResponse<ApiResponse<Chat>>> =>
    api.delete(`/chats/${chatId}/participants/${userId}`),
}

// Message API
export const messageApi = {
  getMessages: (
    chatId: string, 
    page = 1, 
    limit = 50
  ): Promise<AxiosResponse<ApiResponse<PaginatedResponse<Message>>>> =>
    api.get(`/messages/${chatId}?page=${page}&limit=${limit}`),
    
  sendMessage: (data: {
    chatId: string
    content: string
    type: Message['type']
    replyTo?: string
  }): Promise<AxiosResponse<ApiResponse<Message>>> =>
    api.post('/messages', data),
    
  editMessage: (messageId: string, content: string): Promise<AxiosResponse<ApiResponse<Message>>> =>
    api.put(`/messages/${messageId}`, { content }),
    
  deleteMessage: (messageId: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/messages/${messageId}`),
    
  markAsRead: (chatId: string, messageId: string): Promise<AxiosResponse<ApiResponse>> =>
    api.post(`/messages/${messageId}/read`, { chatId }),
    
  addReaction: (messageId: string, emoji: string): Promise<AxiosResponse<ApiResponse<Message>>> =>
    api.post(`/messages/${messageId}/reactions`, { emoji }),
    
  removeReaction: (messageId: string, emoji: string): Promise<AxiosResponse<ApiResponse<Message>>> =>
    api.delete(`/messages/${messageId}/reactions/${emoji}`),
}

// User API
export const userApi = {
  getAllUsers: (): Promise<AxiosResponse<ApiResponse<User[]>>> =>
    api.get('/users'),
    
  searchUsers: (query: string): Promise<AxiosResponse<ApiResponse<User[]>>> =>
    api.get(`/users/search?q=${encodeURIComponent(query)}`),
    
  getUser: (userId: string): Promise<AxiosResponse<ApiResponse<User>>> =>
    api.get(`/users/${userId}`),
    
  updateStatus: (status: 'online' | 'offline'): Promise<AxiosResponse<ApiResponse>> =>
    api.put('/users/status', { status }),
}

// File API
export const fileApi = {
  uploadFile: (file: File, chatId: string): Promise<AxiosResponse<ApiResponse<{ url: string, filename: string }>>> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('chatId', chatId)
    
    return api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  
  deleteFile: (fileId: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/files/${fileId}`),
}

export default api