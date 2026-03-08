import express from 'express';
import {
  getActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
} from '../controllers/activityController.js';
import { protect } from '../middleware/auth.js';
import { activityRules, paginationRules } from '../middleware/validators.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

/**
 * @openapi
 * /activities:
 *   get:
 *     summary: List all activities
 *     tags: [Activities]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *     responses:
 *       200:
 *         description: List of activities
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ActivityListResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.route('/')
  .get(paginationRules, validate, getActivities)
  .post(activityRules, validate, createActivity);

/**
 * @openapi
 * /activities:
 *   post:
 *     summary: Create a new activity
 *     tags: [Activities]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActivityInput'
 *     responses:
 *       201:
 *         description: Activity created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Activity'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @openapi
 * /activities/{id}:
 *   get:
 *     summary: Get an activity by ID
 *     tags: [Activities]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Activity details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Activity'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.route('/:id')
  .get(getActivity)
  .put(activityRules, validate, updateActivity)
  .delete(deleteActivity);

/**
 * @openapi
 * /activities/{id}:
 *   put:
 *     summary: Update an activity
 *     tags: [Activities]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActivityInput'
 *     responses:
 *       200:
 *         description: Activity updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Activity'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @openapi
 * /activities/{id}:
 *   delete:
 *     summary: Delete an activity
 *     tags: [Activities]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Activity deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

export default router;