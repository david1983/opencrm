import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.js';
import {
  getAttachments,
  getAttachment,
  uploadAttachment,
  deleteAttachment,
} from '../controllers/attachmentController.js';

const router = express.Router();

// Configure multer for in-memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// All routes require authentication
router.use(protect);

// Attachment routes
router.get('/', getAttachments);
router.get('/:id', getAttachment);
router.post('/', upload.single('file'), uploadAttachment);
router.delete('/:id', deleteAttachment);

export default router;