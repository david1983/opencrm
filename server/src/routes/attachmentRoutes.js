import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.js';
import {
  getAttachments,
  getAttachment,
  uploadAttachment,
  deleteAttachment,
  getUploadStatus,
} from '../controllers/attachmentController.js';

const router = express.Router();

// Configure multer for in-memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// All routes require authentication
router.use(protect);

// Attachment routes
router.get('/', getAttachments);
router.get('/upload-status/:id', getUploadStatus);
router.get('/:id', getAttachment);
router.post('/', upload.single('file'), uploadAttachment);
router.delete('/:id', deleteAttachment);

export default router;