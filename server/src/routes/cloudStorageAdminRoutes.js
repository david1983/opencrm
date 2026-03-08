import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getCloudStorageSettings,
  configureGoogleDrive,
  configureDropbox,
  removeCloudStorage,
  testCloudStorage,
} from '../controllers/cloudStorageController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

/**
 * @openapi
 * /admin/cloud-storage:
 *   get:
 *     summary: Get cloud storage settings
 *     tags: [Cloud Storage]
 *     responses:
 *       200:
 *         description: Cloud storage settings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CloudStorageCredentialListResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/', getCloudStorageSettings);

/**
 * @openapi
 * /admin/cloud-storage/google:
 *   post:
 *     summary: Configure Google Drive storage
 *     tags: [Cloud Storage]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accessToken:
 *                 type: string
 *                 description: Google OAuth access token
 *               refreshToken:
 *                 type: string
 *                 description: Google OAuth refresh token
 *     responses:
 *       200:
 *         description: Google Drive configured successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CloudStorageCredentialResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/google', configureGoogleDrive);

/**
 * @openapi
 * /admin/cloud-storage/dropbox:
 *   post:
 *     summary: Configure Dropbox storage
 *     tags: [Cloud Storage]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accessToken:
 *                 type: string
 *                 description: Dropbox OAuth access token
 *     responses:
 *       200:
 *         description: Dropbox configured successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CloudStorageCredentialResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/dropbox', configureDropbox);

/**
 * @openapi
 * /admin/cloud-storage/{provider}:
 *   delete:
 *     summary: Remove cloud storage configuration
 *     tags: [Cloud Storage]
 *     parameters:
 *       - name: provider
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, dropbox]
 *         description: Cloud storage provider
 *     responses:
 *       200:
 *         description: Cloud storage removed successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:provider', removeCloudStorage);

/**
 * @openapi
 * /admin/cloud-storage/{provider}/test:
 *   get:
 *     summary: Test cloud storage connection
 *     tags: [Cloud Storage]
 *     parameters:
 *       - name: provider
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, dropbox]
 *         description: Cloud storage provider
 *     responses:
 *       200:
 *         description: Connection test result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Whether the connection test was successful
 *                 message:
 *                   type: string
 *                   description: Connection test message
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:provider/test', testCloudStorage);

export default router;