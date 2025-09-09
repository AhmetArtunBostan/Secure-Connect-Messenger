import { Router } from 'express'
import { body, param } from 'express-validator'
import { validate } from '../middleware/validate'
import { protect } from '../middleware/auth'
import {
  getChats,
  createChat,
  updateChat,
  deleteChat,
  addParticipant,
  removeParticipant,
} from '../controllers/chatController'

const router = Router()

// Validation rules
const createChatValidation = [
  body('type')
    .isIn(['private', 'group'])
    .withMessage('Chat type must be either private or group'),
  body('participants')
    .isArray({ min: 1 })
    .withMessage('Participants must be an array with at least one participant'),
  body('participants.*')
    .isMongoId()
    .withMessage('Each participant must be a valid user ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Chat name must be between 1 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters'),
]

const updateChatValidation = [
  param('chatId')
    .isMongoId()
    .withMessage('Chat ID must be a valid MongoDB ObjectId'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Chat name must be between 1 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL'),
]

const chatIdValidation = [
  param('chatId')
    .isMongoId()
    .withMessage('Chat ID must be a valid MongoDB ObjectId'),
]

const addParticipantValidation = [
  param('chatId')
    .isMongoId()
    .withMessage('Chat ID must be a valid MongoDB ObjectId'),
  body('userId')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId'),
]

const removeParticipantValidation = [
  param('chatId')
    .isMongoId()
    .withMessage('Chat ID must be a valid MongoDB ObjectId'),
  param('participantId')
    .isMongoId()
    .withMessage('Participant ID must be a valid MongoDB ObjectId'),
]

// Apply authentication to all routes
router.use(protect)

// Routes
router.get('/', getChats)
router.post('/', createChatValidation, validate, createChat)
router.put('/:chatId', updateChatValidation, validate, updateChat)
router.delete('/:chatId', chatIdValidation, validate, deleteChat)
router.post('/:chatId/participants', addParticipantValidation, validate, addParticipant)
router.delete('/:chatId/participants/:participantId', removeParticipantValidation, validate, removeParticipant)

export default router