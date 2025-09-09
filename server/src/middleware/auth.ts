import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import User, { IUser } from '../models/User'
import { AppError } from '../utils/AppError'

export interface AuthRequest extends Request {
  user?: IUser
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    let token: string | undefined

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return next(new AppError('Access denied. No token provided.', 401))
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string }

    // Get user from token
    const user = await User.findById(decoded.id).select('+password')
    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401))
    }

    // Grant access to protected route
    req.user = user
    next()
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token.', 401))
    } else if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired.', 401))
    }
    
    next(new AppError('Authentication failed.', 401))
  }
}

export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // For now, we don't have roles, but this can be extended
    next()
  }
}