import jwt from 'jsonwebtoken'
import { Socket } from 'socket.io'
import User from '../models/User'

export interface AuthenticatedSocket extends Socket {
  userId?: string
  user?: any
}

export const socketAuth = async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token

    if (!token) {
      return next(new Error('Authentication error'))
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string }

    // Get user from token
    const user = await User.findById(decoded.id)
    if (!user) {
      return next(new Error('Authentication error'))
    }

    // Attach user to socket
    socket.userId = user._id.toString()
    socket.user = user

    next()
  } catch (error) {
    next(new Error('Authentication error'))
  }
}