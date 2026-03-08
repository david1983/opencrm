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

/**
 * @openapi
 * /attachments:
 *   get:
 *     summary: List all attachments
 *     tags: [Attachments]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *     responses:
 *       200:
 *         description: List of attachments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AttachmentListResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', getAttachments);

/**
 * @openapi
 * /attachments/upload-status/{id}:
 *   get:
 *     summary: Get upload status for an attachment
 *     tags: [Attachments]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Upload status details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [pending, completed, failed]
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/upload-status/:id', getUploadStatus);

/**
 * @openapi
 * /attachments/{id}:
 *   get:
 *     summary: Get an attachment by ID
 *     tags: [Attachments]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Attachment details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attachment'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', getAttachment);

/**
 * @openapi
 * /attachments:
 *   post:
 *     summary: Upload a new attachment
 *     tags: [Attachments]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload
 *               parentType:
 *                 type: string
 *                 description: Parent object type (Account, Contact, Opportunity, Lead)
 *               parentId:
 *                 type: string
 *                 description: ID of the parent object
 *     responses:
 *       201:
 *         description: Attachment uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attachment'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', upload.single('file'), uploadAttachment);

/**
 * @openapi
 * /attachments/{id}:
 *   delete:
 *     summary: Delete an attachment
 *     tags: [Attachments]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Attachment deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', deleteAttachment);

export default router;