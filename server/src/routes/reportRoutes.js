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

router.get('/pipeline', getPipelineReport);
router.get('/leads-by-source', getLeadsBySource);
router.get('/leads-by-status', getLeadsByStatus);
router.get('/activities', getActivitySummary);
router.get('/dashboard', getDashboard);

export default router;