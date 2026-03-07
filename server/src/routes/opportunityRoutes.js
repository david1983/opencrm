import express from 'express';
import {
  getOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
} from '../controllers/opportunityController.js';
import { protect } from '../middleware/auth.js';
import { opportunityRules, paginationRules } from '../middleware/validators.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(paginationRules, validate, getOpportunities)
  .post(opportunityRules, validate, createOpportunity);

router.route('/:id')
  .get(getOpportunity)
  .put(opportunityRules, validate, updateOpportunity)
  .delete(deleteOpportunity);

export default router;