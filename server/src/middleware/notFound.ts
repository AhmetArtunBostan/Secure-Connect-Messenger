import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/AppError'

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const message = `Not found - ${req.originalUrl}`
  next(new AppError(message, 404))
}