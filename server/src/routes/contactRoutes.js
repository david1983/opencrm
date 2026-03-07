import express from 'express';
import {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
} from '../controllers/contactController.js';
import { protect } from '../middleware/auth.js';
import { contactRules, paginationRules } from '../middleware/validators.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(paginationRules, validate, getContacts)
  .post(contactRules, validate, createContact);

router.route('/:id')
  .get(getContact)
  .put(contactRules, validate, updateContact)
  .delete(deleteContact);

export default router;