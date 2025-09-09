import { Router } from 'express'
import { query, param, body } from 'express-validator'
import { validate } from '../middleware/validate'
import { protect } from '../middleware/auth'
import {
  getAllUsers,
  searchUsers,
  getUser,
  updateStatus,
} from '../controllers/userController'

const router = Router()

// Validation rules
const searchUsersValidation = [
  query('q')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Search query must be between 1 and 50 characters'),
]

const getUserValidation = [
  param('userId')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId'),
]

const updateStatusValidation = [
  body('status')
    .isIn(['online', 'offline'])
    .withMessage('Status must be either online or offline'),
]

// Apply authentication to all routes
router.use(protect)

// Routes
router.get('/', getAllUsers)
router.get('/search', searchUsersValidation, validate, searchUsers)
router.get('/:userId', getUserValidation, validate, getUser)
router.put('/status', updateStatusValidation, validate, updateStatus)

export default router