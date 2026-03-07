import express from 'express';
import {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  convertLead,
} from '../controllers/leadController.js';
import { protect } from '../middleware/auth.js';
import { leadRules, paginationRules } from '../middleware/validators.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(paginationRules, getLeads)
  .post(leadRules, validate, createLead);

router.route('/:id')
  .get(getLead)
  .put(leadRules, validate, updateLead)
  .delete(deleteLead);

router.post('/:id/convert', convertLead);

export default router;