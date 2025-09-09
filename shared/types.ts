// Shared types between client and server

export interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  _id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'video';
  encrypted: boolean;
  replyTo?: string;
  reactions: MessageReaction[];
  isEdited: boolean;
  isDeleted: boolean;
  readBy: ReadStatus[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  createdAt: Date;
}

export interface ReadStatus {
  userId: string;
  readAt: Date;
}

export interface Chat {
  _id: string;
  type: 'private' | 'group';
  name?: string;
  description?: string;
  avatar?: string;
  participants: string[];
  admins: string[];
  lastMessage?: Message;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TypingStatus {
  userId: string;
  chatId: string;
  isTyping: boolean;
}

export interface OnlineStatus {
  userId: string;
  isOnline: boolean;
  lastSeen?: Date;
}

// Socket Events
export interface ServerToClientEvents {
  message: (message: Message) => void;
  messageUpdated: (message: Message) => void;
  messageDeleted: (messageId: string) => void;
  typing: (data: TypingStatus) => void;
  userOnline: (data: OnlineStatus) => void;
  userOffline: (data: OnlineStatus) => void;
  chatCreated: (chat: Chat) => void;
  chatUpdated: (chat: Chat) => void;
  error: (error: string) => void;
}

export interface ClientToServerEvents {
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  sendMessage: (data: {
    chatId: string;
    content: string;
    type: Message['type'];
    replyTo?: string;
  }) => void;
  editMessage: (data: { messageId: string; content: string }) => void;
  deleteMessage: (messageId: string) => void;
  typing: (data: { chatId: string; isTyping: boolean }) => void;
  markAsRead: (data: { chatId: string; messageId: string }) => void;
  addReaction: (data: { messageId: string; emoji: string }) => void;
  removeReaction: (data: { messageId: string; emoji: string }) => void;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// File Upload Types
export interface FileUpload {
  _id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedBy: string;
  createdAt: Date;
}

// Encryption Types
export interface EncryptedData {
  encryptedContent: string;
  iv: string;
}

// Error Types
export interface AppError {
  message: string;
  statusCode: number;
  code?: string;
}