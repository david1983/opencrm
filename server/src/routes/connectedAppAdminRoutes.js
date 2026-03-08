import express from 'express';
import {
  getConnectedApps,
  getConnectedApp,
  createConnectedApp,
  updateConnectedApp,
  deleteConnectedApp,
  regenerateSecret,
  regenerateApiKey,
} from '../controllers/connectedAppController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

/**
 * @openapi
 * /admin/connected-apps:
 *   get:
 *     summary: List all connected apps
 *     tags: [Connected Apps]
 *     responses:
 *       200:
 *         description: List of connected apps
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConnectedAppListResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/', getConnectedApps);

/**
 * @openapi
 * /admin/connected-apps/{id}:
 *   get:
 *     summary: Get a connected app by ID
 *     tags: [Connected Apps]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Connected app details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConnectedAppResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', getConnectedApp);

/**
 * @openapi
 * /admin/connected-apps:
 *   post:
 *     summary: Create a new connected app
 *     tags: [Connected Apps]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConnectedAppInput'
 *     responses:
 *       201:
 *         description: Connected app created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConnectedAppResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/', createConnectedApp);

/**
 * @openapi
 * /admin/connected-apps/{id}:
 *   put:
 *     summary: Update a connected app
 *     tags: [Connected Apps]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConnectedAppInput'
 *     responses:
 *       200:
 *         description: Connected app updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConnectedAppResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id', updateConnectedApp);

/**
 * @openapi
 * /admin/connected-apps/{id}:
 *   delete:
 *     summary: Delete a connected app
 *     tags: [Connected Apps]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Connected app deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', deleteConnectedApp);

/**
 * @openapi
 * /admin/connected-apps/{id}/regenerate-secret:
 *   post:
 *     summary: Regenerate OAuth client secret
 *     tags: [Connected Apps]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Secret regenerated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clientSecret:
 *                   type: string
 *                   description: New OAuth client secret
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/regenerate-secret', regenerateSecret);

/**
 * @openapi
 * /admin/connected-apps/{id}/regenerate-key:
 *   post:
 *     summary: Regenerate API key
 *     tags: [Connected Apps]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: API key regenerated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 apiKey:
 *                   type: string
 *                   description: New API key
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/regenerate-key', regenerateApiKey);

export default router;