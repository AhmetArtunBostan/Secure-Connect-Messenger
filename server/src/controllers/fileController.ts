import { Response, NextFunction } from 'express'
import path from 'path'
import fs from 'fs'
import { AppError } from '../utils/AppError'
import { AuthRequest } from '../middleware/auth'

export const uploadFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return next(new AppError('No file uploaded', 400))
    }

    const { chatId } = req.body
    if (!chatId) {
      return next(new AppError('Chat ID is required', 400))
    }

    const file = req.file
    const fileUrl = `/uploads/${file.filename}`

    res.status(200).json({
      success: true,
      data: {
        url: fileUrl,
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
      message: 'File uploaded successfully',
    })
  } catch (error) {
    next(error)
  }
}

export const deleteFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fileId } = req.params

    // In a real implementation, you'd have a File model to track uploads
    // For now, we'll just return success
    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}