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

router.route('/')
  .get(paginationRules, validate, getActivities)
  .post(activityRules, validate, createActivity);

router.route('/:id')
  .get(getActivity)
  .put(activityRules, validate, updateActivity)
  .delete(deleteActivity);

export default router;