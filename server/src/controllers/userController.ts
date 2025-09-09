import { Response, NextFunction } from 'express'
import User from '../models/User'
import { AppError } from '../utils/AppError'
import { AuthRequest } from '../middleware/auth'

export const getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!._id

    // Get all users except current user
    const users = await User.find({
      _id: { $ne: currentUserId },
    })
      .select('username email avatar isOnline lastSeen')
      .sort({ username: 1 })

    res.status(200).json({
      success: true,
      data: users,
    })
  } catch (error) {
    next(error)
  }
}

export const searchUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query
    const currentUserId = req.user!._id

    if (!q) {
      return next(new AppError('Search query is required', 400))
    }

    // Search users by username or email (excluding current user)
    const users = await User.find({
      _id: { $ne: currentUserId },
      $or: [
        { username: { $regex: q as string, $options: 'i' } },
        { email: { $regex: q as string, $options: 'i' } },
      ],
    })
      .select('username email avatar isOnline lastSeen')
      .limit(20)

    res.status(200).json({
      success: true,
      data: users,
    })
  } catch (error) {
    next(error)
  }
}

export const getUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params

    // Include publicKey for encryption purposes
    const user = await User.findById(userId)
      .select('username email avatar isOnline lastSeen createdAt +publicKey')

    if (!user) {
      return next(new AppError('User not found', 404))
    }

    res.status(200).json({
      success: true,
      data: user,
    })
  } catch (error) {
    next(error)
  }
}

export const updateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body
    const userId = req.user!._id

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isOnline: status === 'online',
        lastSeen: new Date(),
      },
      { new: true }
    ).select('username email avatar isOnline lastSeen')

    res.status(200).json({
      success: true,
      data: user,
      message: 'Status updated successfully',
    })
  } catch (error) {
    next(error)
  }
}