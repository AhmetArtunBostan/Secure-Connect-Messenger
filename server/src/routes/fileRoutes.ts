import { Router } from 'express'
import { param, body } from 'express-validator'
import { validate } from '../middleware/validate'
import { protect } from '../middleware/auth'
import { upload } from '../middleware/upload'
import {
  uploadFile,
  deleteFile,
} from '../controllers/fileController'

const router = Router()

// Validation rules
const deleteFileValidation = [
  param('fileId')
    .isMongoId()
    .withMessage('File ID must be a valid MongoDB ObjectId'),
]

// Apply authentication to all routes
router.use(protect)

// Routes
router.post('/upload', upload.single('file'), uploadFile)
router.delete('/:fileId', deleteFileValidation, validate, deleteFile)

export default router