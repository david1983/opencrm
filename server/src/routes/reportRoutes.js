import express from 'express';
import {
  getPipelineReport,
  getLeadsBySource,
  getLeadsByStatus,
  getActivitySummary,
  getDashboard,
} from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

/**
 * @openapi
 * /reports/dashboard:
 *   get:
 *     summary: Get dashboard summary
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: Dashboard summary data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/dashboard', getDashboard);

/**
 * @openapi
 * /reports/pipeline:
 *   get:
 *     summary: Get pipeline report
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: Pipeline report data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PipelineResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/pipeline', getPipelineReport);

/**
 * @openapi
 * /reports/leads-by-source:
 *   get:
 *     summary: Get leads by source report
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: Leads grouped by source
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeadReportResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/leads-by-source', getLeadsBySource);

/**
 * @openapi
 * /reports/leads-by-status:
 *   get:
 *     summary: Get leads by status report
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: Leads grouped by status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeadReportResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/leads-by-status', getLeadsByStatus);

/**
 * @openapi
 * /reports/activities:
 *   get:
 *     summary: Get activity summary report
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: Activity summary data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ActivityReportResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/activities', getActivitySummary);

export default router;