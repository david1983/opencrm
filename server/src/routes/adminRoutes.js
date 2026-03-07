import express from 'express';
import { getOrganization, updateOrganization } from '../controllers/organizationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getOrganization)
  .put(updateOrganization);

export default router;