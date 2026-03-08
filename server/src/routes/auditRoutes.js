import express from 'express';
import { protect } from '../middleware/auth.js';
import { getEntityHistory, getOrganizationHistory } from '../controllers/auditController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @openapi
 * /audit/{entityType}/{entityId}:
 *   get:
 *     summary: Get audit history for a specific record
 *     tags: [Audit]
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *         description: The type of entity (e.g., lead, contact, account)
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the entity
 *     responses:
 *       200:
 *         description: Audit history for the entity
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuditLogResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:entityType/:entityId', getEntityHistory);

/**
 * @openapi
 * /audit/recent:
 *   get:
 *     summary: Get recent audit history for the organization
 *     tags: [Audit]
 *     responses:
 *       200:
 *         description: Recent audit history
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuditLogResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/recent', getOrganizationHistory);

export default router;