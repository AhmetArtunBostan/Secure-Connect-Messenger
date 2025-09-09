import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/AppError'

interface MongoError extends Error {
  code?: number
  keyValue?: Record<string, any>
  errors?: Record<string, any>
  path?: string
  value?: any
}

const handleCastErrorDB = (err: MongoError): AppError => {
  const message = `Invalid ${err.path}: ${err.value}`
  return new AppError(message, 400)
}

const handleDuplicateFieldsDB = (err: MongoError): AppError => {
  const field = Object.keys(err.keyValue!)[0]
  const value = err.keyValue![field]
  const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`
  return new AppError(message, 400)
}

const handleValidationErrorDB = (err: MongoError): AppError => {
  const errors = Object.values(err.errors!).map((el: any) => el.message)
  const message = `Invalid input data: ${errors.join('. ')}`
  return new AppError(message, 400)
}

const handleJWTError = (): AppError =>
  new AppError('Invalid token. Please log in again!', 401)

const handleJWTExpiredError = (): AppError =>
  new AppError('Your token has expired! Please log in again.', 401)

const sendErrorDev = (err: AppError, res: Response) => {
  res.status(err.statusCode).json({
    success: false,
    error: err.message,
    stack: err.stack,
    details: err,
  })
}

const sendErrorProd = (err: AppError, res: Response) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    })
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err)

    res.status(500).json({
      success: false,
      error: 'Something went wrong!',
    })
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err }
  error.message = err.message

  // Log error
  console.error(err)

  // Mongoose bad ObjectId
  if (err.name === 'CastError') error = handleCastErrorDB(error)

  // Mongoose duplicate key
  if (err.code === 11000) error = handleDuplicateFieldsDB(error)

  // Mongoose validation error
  if (err.name === 'ValidationError') error = handleValidationErrorDB(error)

  // JWT error
  if (err.name === 'JsonWebTokenError') error = handleJWTError()

  // JWT expired error
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError()

  // Set default values
  error.statusCode = error.statusCode || 500
  error.status = error.status || 'error'

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res)
  } else {
    sendErrorProd(error, res)
  }
}