import { Request, Response, NextFunction } from 'express'
import User from '../models/User'
import { generateToken } from '../utils/jwt'
import { AppError } from '../utils/AppError'
import { AuthRequest } from '../middleware/auth'

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    })

    if (existingUser) {
      if (existingUser.email === email) {
        return next(new AppError('Email already registered', 400))
      }
      if (existingUser.username === username) {
        return next(new AppError('Username already taken', 400))
      }
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
    })

    // Generate token
    const token = generateToken(user._id.toString())

    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          isOnline: user.isOnline,
          lastSeen: user.lastSeen,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
      },
      message: 'User registered successfully',
    })
  } catch (error) {
    next(error)
  }
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body

    // Check if email and password exist
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400))
    }

    // Check if user exists and password is correct
    const user = await User.findOne({ email }).select('+password')

    if (!user) {
      return next(new AppError('Invalid email or password', 401))
    }

    const isPasswordValid = await user.comparePassword(password)
    
    if (!isPasswordValid) {
      return next(new AppError('Invalid email or password', 401))
    }

    // Update user online status
    user.isOnline = true
    user.lastSeen = new Date()
    await user.save()

    // Generate token
    const token = generateToken(user._id.toString())

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          isOnline: user.isOnline,
          lastSeen: user.lastSeen,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
      },
      message: 'Login successful',
    })
  } catch (error) {
    next(error)
  }
}

export const logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user) {
      // Update user offline status
      req.user.isOnline = false
      req.user.lastSeen = new Date()
      await req.user.save()
    }

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    })
  } catch (error) {
    next(error)
  }
}

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!._id)

    if (!user) {
      return next(new AppError('User not found', 404))
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { username, email, avatar } = req.body

    // Check if username or email is already taken by another user
    if (username || email) {
      const existingUser = await User.findOne({
        $and: [
          { _id: { $ne: req.user!._id } },
          {
            $or: [
              ...(username ? [{ username }] : []),
              ...(email ? [{ email }] : []),
            ],
          },
        ],
      })

      if (existingUser) {
        if (existingUser.username === username) {
          return next(new AppError('Username already taken', 400))
        }
        if (existingUser.email === email) {
          return next(new AppError('Email already registered', 400))
        }
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user!._id,
      {
        ...(username && { username }),
        ...(email && { email }),
        ...(avatar !== undefined && { avatar }),
      },
      {
        new: true,
        runValidators: true,
      }
    )

    res.status(200).json({
      success: true,
      data: {
        _id: updatedUser!._id,
        username: updatedUser!.username,
        email: updatedUser!.email,
        avatar: updatedUser!.avatar,
        isOnline: updatedUser!.isOnline,
        lastSeen: updatedUser!.lastSeen,
        createdAt: updatedUser!.createdAt,
        updatedAt: updatedUser!.updatedAt,
      },
      message: 'Profile updated successfully',
    })
  } catch (error) {
    next(error)
  }
}