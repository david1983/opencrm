import express from 'express';
import { protect } from '../middleware/auth.js';
import { getEntityHistory, getOrganizationHistory } from '../controllers/auditController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get audit history for a specific entity
router.get('/:entityType/:entityId', getEntityHistory);

// Get recent audit history for organization
router.get('/recent', getOrganizationHistory);

export default router;