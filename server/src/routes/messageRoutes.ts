import { Router } from 'express'
import { body, param, query } from 'express-validator'
import { validate } from '../middleware/validate'
import { protect } from '../middleware/auth'
import {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  markAsRead,
  addReaction,
  removeReaction,
} from '../controllers/messageController'

const router = Router()

// Validation rules
const getMessagesValidation = [
  param('chatId')
    .isMongoId()
    .withMessage('Chat ID must be a valid MongoDB ObjectId'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
]

const sendMessageValidation = [
  body('chatId')
    .isMongoId()
    .withMessage('Chat ID must be a valid MongoDB ObjectId'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be between 1 and 2000 characters'),
  body('type')
    .optional()
    .isIn(['text', 'image', 'file', 'audio', 'video'])
    .withMessage('Message type must be one of: text, image, file, audio, video'),
  body('replyTo')
    .optional()
    .isMongoId()
    .withMessage('Reply to must be a valid MongoDB ObjectId'),
]

const editMessageValidation = [
  param('messageId')
    .isMongoId()
    .withMessage('Message ID must be a valid MongoDB ObjectId'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be between 1 and 2000 characters'),
]

const messageIdValidation = [
  param('messageId')
    .isMongoId()
    .withMessage('Message ID must be a valid MongoDB ObjectId'),
]

const markAsReadValidation = [
  param('messageId')
    .isMongoId()
    .withMessage('Message ID must be a valid MongoDB ObjectId'),
  body('chatId')
    .isMongoId()
    .withMessage('Chat ID must be a valid MongoDB ObjectId'),
]

const addReactionValidation = [
  param('messageId')
    .isMongoId()
    .withMessage('Message ID must be a valid MongoDB ObjectId'),
  body('emoji')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Emoji must be between 1 and 10 characters'),
]

const removeReactionValidation = [
  param('messageId')
    .isMongoId()
    .withMessage('Message ID must be a valid MongoDB ObjectId'),
  param('emoji')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Emoji must be between 1 and 10 characters'),
]

// Apply authentication to all routes
router.use(protect)

// Routes
router.get('/:chatId', getMessagesValidation, validate, getMessages)
router.post('/', sendMessageValidation, validate, sendMessage)
router.put('/:messageId', editMessageValidation, validate, editMessage)
router.delete('/:messageId', messageIdValidation, validate, deleteMessage)
router.post('/:messageId/read', markAsReadValidation, validate, markAsRead)
router.post('/:messageId/reactions', addReactionValidation, validate, addReaction)
router.delete('/:messageId/reactions/:emoji', removeReactionValidation, validate, removeReaction)

export default router